<script lang="ts">
  import { onMount } from "svelte";

  type DataFile = { language: string; table: string; size: number };

  export let files: DataFile[] = [];
  export let base = "";

  const languages = [...new Set(files.map(({ language }) => language))];
  const tablesFor = (language: string) =>
    files.filter((file) => file.language === language);
  const sizeFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "unit",
    unit: "byte",
    unitDisplay: "narrow",
    maximumFractionDigits: 1,
  });

  let language = languages.includes("english") ? "english" : (languages[0] ?? "");
  let search = "";
  let table = tablesFor(language)[0]?.table ?? "";
  let json = "";
  let status = "Loading…";
  let controller: AbortController | undefined;

  $: tables = tablesFor(language).filter(({ table }) =>
    table.toLowerCase().includes(search.trim().toLowerCase()),
  );
  $: url = table
    ? `${base}data/${encodeURIComponent(language)}/ZTable/${encodeURIComponent(table)}.json`
    : "";

  async function load() {
    if (!table) return;

    controller?.abort();
    controller = new AbortController();
    status = "Loading…";
    json = "";
    history.replaceState(
      null,
      "",
      `?${new URLSearchParams({ lang: language, table })}`,
    );

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      json = await response.text();
      status = "Loaded.";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      status = `Failed to load: ${error instanceof Error ? error.message : error}`;
    }
  }

  function changeLanguage() {
    search = "";
    table = tablesFor(language)[0]?.table ?? "";
    void load();
  }

  onMount(() => {
    const params = new URLSearchParams(location.search);
    const requestedLanguage = params.get("lang");
    if (requestedLanguage && languages.includes(requestedLanguage)) {
      language = requestedLanguage;
    }

    const requestedTable = params.get("table");
    const availableTables = tablesFor(language);
    table =
      requestedTable &&
      availableTables.some(({ table }) => table === requestedTable)
        ? requestedTable
        : (availableTables[0]?.table ?? "");
    void load();
  });
</script>

<main class="grid min-h-screen lg:grid-cols-[22rem_minmax(0,1fr)]">
  <aside
    class="flex min-h-0 flex-col gap-4 border-base-300 border-r bg-base-100 p-5"
  >
    <header>
      <h1 class="text-2xl font-bold">BPSR Data</h1>
      <p class="mt-1 text-sm opacity-70">
        {files.length.toLocaleString("en-US")} JSON files
      </p>
    </header>

    <label class="form-control">
      <span class="label-text mb-1">Language</span>
      <select
        class="select w-full"
        aria-label="Language"
        bind:value={language}
        onchange={changeLanguage}
      >
        {#each languages as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>

    <label class="form-control">
      <span class="label-text mb-1">Search tables</span>
      <input
        class="input w-full"
        type="search"
        placeholder="ItemTable"
        autocomplete="off"
        bind:value={search}
      />
    </label>

    <p class="text-sm opacity-70" aria-live="polite">
      {tables.length.toLocaleString("en-US")} tables
    </p>
    <select
      class="select min-h-64 w-full flex-1"
      size="20"
      aria-label="Table"
      bind:value={table}
      onchange={load}
    >
      {#each tables as option}
        <option value={option.table}>
          {option.table} — {sizeFormatter.format(option.size)}
        </option>
      {/each}
    </select>
  </aside>

  <section class="flex min-h-0 min-w-0 flex-col gap-3 p-5">
    <header class="flex flex-wrap items-center gap-2">
      <h2 class="mr-auto text-xl font-semibold">
        {table ? `${language} / ${table}` : "Select a JSON file"}
      </h2>
      {#if url}
        <a class="btn btn-sm" href={url}>View raw</a>
        <a class="btn btn-sm btn-primary" href={url} download={`${table}.json`}>
          Download
        </a>
      {/if}
    </header>
    <p class="text-sm opacity-70" aria-live="polite">
      {tables.length ? status : "No matching tables."}
    </p>
    <pre
      class="min-h-80 flex-1 overflow-auto rounded-box bg-neutral p-4 text-sm text-neutral-content"
      role="region"
      aria-label="JSON content"><code>{json}</code></pre>
  </section>
</main>
