# dayzero.run JS SDK

Browser SDK for reading and writing rows in a [dayzero.run](https://dayzero.run/) project table.

Create the table schema in the dashboard. This SDK only reads and writes rows. It cannot create, rename, or delete tables.

## Install

```bash
npm install github:dayzero-run/SDK
```

Or load the file from GitHub:

```html
<script src="https://cdn.jsdelivr.net/gh/dayzero-run/SDK@main/dayzero.js"></script>
```

## Usage

Create the table first in the dashboard at [https://dayzero.run/](https://dayzero.run/). Then call the SDK from your frontend.

### Local development

```html
<script src="./node_modules/@dayzero_run/sdk/dayzero.js"></script>
<script>
  Dayzero.init({
    apiBase: "http://localhost:8080",
    project: "my-app"
  });

  Dayzero.tables.from("waitlist").insert({
    email: "friend@example.com"
  });
</script>
```

`project` is the public subdomain name, not the internal project id.

### Live site on `*.dayzero.run`

```html
<script src="https://cdn.jsdelivr.net/gh/dayzero-run/SDK@main/dayzero.js"></script>
<script>
  Dayzero.init();

  Dayzero.tables.from("waitlist").list().then(function (rows) {
    console.log(rows);
  });
</script>
```

On a live `https://my-app.dayzero.run` page, the SDK infers the project from the hostname and talks to `https://api.dayzero.run`.

## Methods

```js
var waitlist = Dayzero.tables.from("waitlist");

waitlist.insert({ email: "friend@example.com" });
waitlist.list();
waitlist.update("row_123", { email: "new@example.com" });
waitlist.remove("row_123");
```

Each row returned by `list`, `insert`, and `update` looks like:

```json
{
  "id": "row_123",
  "tableName": "waitlist",
  "data": { "email": "friend@example.com" }
}
```

## Rules

- Never put a dayzero.run API token in frontend code.
- Do not invent a backend. This SDK talks to dayzero.run.
- The SDK cannot change table schema. Create and edit tables in the dashboard.
- Local pages must call a local API. Do not point a localhost page at `https://api.dayzero.run`.
