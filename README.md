# dayzero.run JS SDK

Browser SDK for reading and writing rows in a [dayzero.run](https://dayzero.run/) project table.

Create table schema with the CLI (`d0 tables apply`) or in the dashboard. This SDK only reads and writes rows. It cannot create, rename, or delete tables.

## Install

```bash
npm install github:dayzero-run/SDK
```

Or load the file from GitHub:

```html
<script src="https://cdn.jsdelivr.net/gh/dayzero-run/SDK@main/dayzero.js"></script>
```

## Usage

1. Apply schema: `d0 tables apply`
2. Copy the public site key: `d0 site-key` (or the dashboard Site key card)
3. Call the SDK from your frontend

The site key is public. It identifies one project. Never put the account API token in frontend code.

### Local development

```html
<script src="./node_modules/@dayzero_run/sdk/dayzero.js"></script>
<script>
  Dayzero.init({
    apiBase: "http://localhost:8080",
    siteKey: "sk_..."
  });

  Dayzero.tables.from("waitlist").insert({
    email: "friend@example.com"
  });
</script>
```

### Live site on `*.dayzero.run`

```html
<script src="https://cdn.jsdelivr.net/gh/dayzero-run/SDK@main/dayzero.js"></script>
<script>
  Dayzero.init({
    siteKey: "sk_..."
  });

  Dayzero.tables.from("waitlist").list().then(function (rows) {
    console.log(rows);
  });
</script>
```

## Methods

```js
Dayzero.tables.list();

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
- The site key belongs in the frontend. Get it with `d0 site-key`. Rotate it in the dashboard if a site is abused.
- Do not invent a backend. This SDK talks to dayzero.run.
- The SDK cannot change table schema. Create and edit tables with `d0 tables apply` or the dashboard.
- Local pages must call a local API. Do not point a localhost page at `https://api.dayzero.run`.
