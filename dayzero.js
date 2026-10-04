(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Dayzero = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  var DEFAULT_API_BASE = "https://api.dayzero.run";
  var PRODUCTION_SITE_SUFFIX = ".dayzero.run";

  var settings = {
    apiBase: DEFAULT_API_BASE,
    project: ""
  };

  // Remove a trailing slash so later paths can be joined cleanly.
  function trimTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  // Read the current browser hostname when one exists.
  function currentHostname() {
    if (typeof window === "undefined" || !window.location) {
      return "";
    }
    return String(window.location.hostname || "").toLowerCase();
  }

  // Infer the project name from a live *.dayzero.run hostname.
  function projectNameFromHostname(hostname) {
    var host = String(hostname || "").toLowerCase();
    if (!host || host === "dayzero.run" || host === "www.dayzero.run" || host === "api.dayzero.run" || host === "app.dayzero.run") {
      return "";
    }
    if (host.slice(-PRODUCTION_SITE_SUFFIX.length) !== PRODUCTION_SITE_SUFFIX) {
      return "";
    }
    var projectName = host.slice(0, -PRODUCTION_SITE_SUFFIX.length);
    if (!projectName || projectName.indexOf(".") !== -1) {
      return "";
    }
    return projectName;
  }

  // Report whether this page is running on localhost.
  function isLocalHostname(hostname) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  }

  // Choose the API base for the current page when the caller does not set one.
  function defaultApiBaseForHostname(hostname) {
    if (isLocalHostname(hostname)) {
      return "http://localhost:8080";
    }
    return DEFAULT_API_BASE;
  }

  // Resolve the project name from init() or the live hostname.
  function resolveProjectName() {
    if (settings.project) {
      return settings.project;
    }
    return projectNameFromHostname(currentHostname());
  }

  // Turn an API error body into a readable Error.
  function createApiError(statusCode, payload) {
    var message = "Dayzero request failed";
    if (payload && payload.error) {
      message = payload.error;
    } else if (payload && payload.message) {
      message = payload.message;
    } else {
      message = "Dayzero request failed with status " + statusCode;
    }
    var error = new Error(message);
    error.status = statusCode;
    error.payload = payload;
    return error;
  }

  // Parse a JSON response while keeping empty bodies safe.
  function parseJsonBody(text) {
    if (!text) {
      return {};
    }
    try {
      return JSON.parse(text);
    } catch (parseError) {
      return { error: text };
    }
  }

  // Send one request to the Dayzero table API.
  function requestJson(method, path, bodyObject, queryObject) {
    var apiBase = trimTrailingSlash(settings.apiBase || DEFAULT_API_BASE);
    var projectName = resolveProjectName();
    var queryParts = [];
    var queryKey;

    if (queryObject) {
      for (queryKey in queryObject) {
        if (Object.prototype.hasOwnProperty.call(queryObject, queryKey) && queryObject[queryKey]) {
          queryParts.push(encodeURIComponent(queryKey) + "=" + encodeURIComponent(queryObject[queryKey]));
        }
      }
    }
    if ((method === "GET" || method === "DELETE") && projectName) {
      queryParts.push("project=" + encodeURIComponent(projectName));
    }

    var url = apiBase + path;
    if (queryParts.length > 0) {
      url += "?" + queryParts.join("&");
    }

    var headers = {
      Accept: "application/json"
    };
    if (projectName) {
      headers["X-Dayzero-Project"] = projectName;
    }

    var fetchOptions = {
      method: method,
      headers: headers
    };

    if (bodyObject) {
      headers["Content-Type"] = "application/json";
      var requestBody = {};
      var bodyKey;
      for (bodyKey in bodyObject) {
        if (Object.prototype.hasOwnProperty.call(bodyObject, bodyKey)) {
          requestBody[bodyKey] = bodyObject[bodyKey];
        }
      }
      if (projectName) {
        requestBody.project = projectName;
      }
      fetchOptions.body = JSON.stringify(requestBody);
    }

    return fetch(url, fetchOptions).then(function (response) {
      return response.text().then(function (text) {
        var payload = parseJsonBody(text);
        if (!response.ok) {
          throw createApiError(response.status, payload);
        }
        return payload;
      });
    });
  }

  // Validate a table name before calling the API.
  function requireTableName(tableName) {
    var cleanedName = String(tableName || "").trim().toLowerCase();
    if (!cleanedName) {
      throw new Error("A table name is required");
    }
    return cleanedName;
  }

  // Create a helper for one named table.
  function createTableClient(tableName) {
    var resolvedTableName = requireTableName(tableName);
    var encodedTableName = encodeURIComponent(resolvedTableName);

    return {
      // List every row in this table.
      list: function () {
        return requestJson("GET", "/v1/site/tables/" + encodedTableName + "/rows").then(function (payload) {
          return payload.rows || [];
        });
      },

      // Insert one row. Pass the field values only, not an API token.
      insert: function (rowData) {
        return requestJson("POST", "/v1/site/tables/" + encodedTableName + "/rows", {
          data: rowData || {}
        }).then(function (payload) {
          return payload.row;
        });
      },

      // Replace the field values on one existing row.
      update: function (rowId, rowData) {
        var resolvedRowId = String(rowId || "").trim();
        if (!resolvedRowId) {
          return Promise.reject(new Error("A row id is required"));
        }
        return requestJson(
          "PATCH",
          "/v1/site/tables/" + encodedTableName + "/rows/" + encodeURIComponent(resolvedRowId),
          { data: rowData || {} }
        ).then(function (payload) {
          return payload.row;
        });
      },

      // Delete one row by id.
      remove: function (rowId) {
        var resolvedRowId = String(rowId || "").trim();
        if (!resolvedRowId) {
          return Promise.reject(new Error("A row id is required"));
        }
        return requestJson(
          "DELETE",
          "/v1/site/tables/" + encodedTableName + "/rows/" + encodeURIComponent(resolvedRowId)
        );
      }
    };
  }

  var Dayzero = {
    // Configure the SDK once before reading or writing tables.
    init: function (options) {
      var nextOptions = options || {};
      var hostname = currentHostname();
      var apiBase = nextOptions.apiBase;
      var projectName = nextOptions.project;

      if (!apiBase) {
        apiBase = defaultApiBaseForHostname(hostname);
      }
      if (!projectName) {
        projectName = projectNameFromHostname(hostname);
      }

      settings.apiBase = trimTrailingSlash(apiBase);
      settings.project = String(projectName || "").trim().toLowerCase();
      return Dayzero;
    },

    // Read the current SDK settings. Useful for debugging local vs live calls.
    settings: function () {
      return {
        apiBase: settings.apiBase,
        project: resolveProjectName()
      };
    },

    tables: {
      // Return a client for one project table created in the dashboard.
      from: function (tableName) {
        return createTableClient(tableName);
      }
    }
  };

  return Dayzero;
});
