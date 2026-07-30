# BPSR Data

A static browser and JSON endpoint for the files in `src/data`.

The site provides a searchable table explorer for browsers and serves the
same source files as JSON for tools such as `curl`. Everything is generated at
build time, so the deployed site does not require Node.js, a database, or an
application server.

## Features

- Browse tables by language
- Search table names and see their file sizes
- View, open, or download the selected JSON file
- Share a selection with `?lang=english&table=ItemTable`
- Switch between light and dark themes
- Request every JSON file through a stable static URL

## Local preview

Install dependencies:

```sh
pnpm install
```

Build the static site, then start the preview server:

```sh
pnpm build
pnpm preview
```

The preview is available at `http://localhost:4321`.

Do not use `pnpm dev` for this project. Vite tries to watch the large
`src/data` tree and can exit with `EMFILE: too many open files`. The preview
server does not watch source files, so run `pnpm build` again after making
changes.

Run the linter:

```sh
pnpm lint
```

## JSON URLs

Source files follow this layout:

```text
src/data/{language}/ZTable/{table}.json
```

They are served with the matching URL:

```text
/data/{language}/ZTable/{table}.json
```

For example:

```sh
curl -fL http://localhost:4321/data/english/ZTable/ItemTable.json
```

Unknown paths are handled by the static host as `404 Not Found`.
