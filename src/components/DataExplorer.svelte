<script lang="ts">
  import {
    Download,
    ExternalLink,
    FileBracesCorner,
    Moon,
    Search,
    Sun,
    TextWrap,
  } from "@lucide/svelte";
  import { onMount, tick } from "svelte";

  type DataFile = { language: string; table: string; size: number };

  export let files: DataFile[] = [];
  export let base = "";

  const themes = { light: "cupcake", dark: "dracula" } as const;
  type Theme = keyof typeof themes;

  const languages = [...new Set(files.map(({ language }) => language))];
  const filesForLanguage = (language: string) => files.filter((file) => file.language === language);
  const getFirstTable = (files: DataFile[]): string => files[0]?.table ?? "";
  const fileSizeFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "unit",
    unit: "byte",
    unitDisplay: "narrow",
    maximumFractionDigits: 1,
  });

  let selectedLanguage = languages.includes("english") ? "english" : (languages[0] ?? "");
  let searchTerm = "";
  let selectedTable = getFirstTable(filesForLanguage(selectedLanguage));
  let jsonContent = "";
  let loadStatus = "Loading…";
  let theme: Theme = "light";
  let wrapJson = false;
  let controller: AbortController | undefined;

  $: visibleFiles = filesForLanguage(selectedLanguage).filter(({ table }) =>
    table.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );
  $: selectedTableHidden =
    searchTerm.trim() !== "" && !visibleFiles.some(({ table }) => table === selectedTable);
  $: dataUrl = selectedTable
    ? `${base}data/${encodeURIComponent(selectedLanguage)}/ZTable/${encodeURIComponent(selectedTable)}.json`
    : "";

  async function loadSelectedTable() {
    if (!selectedTable) return;
    await tick();

    controller?.abort();
    controller = new AbortController();
    loadStatus = "Loading…";
    jsonContent = "";
    history.replaceState(
      null,
      "",
      `?${new URLSearchParams({
        lang: selectedLanguage,
        table: selectedTable,
      })}`,
    );

    try {
      const response = await fetch(dataUrl, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      jsonContent = await response.text();
      loadStatus = "";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      loadStatus = `Failed to load: ${error instanceof Error ? error.message : error}`;
    }
  }

  function changeLanguage() {
    const availableFiles = filesForLanguage(selectedLanguage);
    selectedTable = availableFiles.some(({ table }) => table === selectedTable)
      ? selectedTable
      : getFirstTable(availableFiles);
    void loadSelectedTable();
  }

  function toggleTheme() {
    theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = themes[theme];
    localStorage.setItem("theme", theme);
  }

  function restoreTheme() {
    const savedTheme = localStorage.getItem("theme");
    theme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.dataset.theme = themes[theme];
  }

  function restoreSelection() {
    const params = new URLSearchParams(location.search);
    const requestedLanguage = params.get("lang");
    if (requestedLanguage && languages.includes(requestedLanguage)) {
      selectedLanguage = requestedLanguage;
    }

    const requestedTable = params.get("table");
    const availableFiles = filesForLanguage(selectedLanguage);
    selectedTable =
      requestedTable && availableFiles.some(({ table }) => table === requestedTable)
        ? requestedTable
        : getFirstTable(availableFiles);
  }

  onMount(() => {
    restoreTheme();
    restoreSelection();
    void loadSelectedTable();
  });
</script>

<main class="grid min-h-screen lg:h-screen lg:grid-cols-[22rem_minmax(0,1fr)]">
  <aside class="flex min-h-0 min-w-0 flex-col gap-4 border-base-300 border-r bg-base-100 p-5">
    <header class="flex items-start gap-2">
      <div class="mr-auto">
        <h1 class="text-2xl font-bold">BPSR Data</h1>
        <p class="mt-1 text-sm opacity-70">
          {files.length.toLocaleString("en-US")} JSON files
        </p>
      </div>
      <label class="swap swap-rotate btn btn-circle btn-sm btn-ghost min-h-11 min-w-11">
        <input
          type="checkbox"
          class="theme-controller"
          value={themes.dark}
          checked={theme === "dark"}
          onchange={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        />
        <Sun class="swap-off h-6 w-6" aria-hidden="true" />
        <Moon class="swap-on h-6 w-6" aria-hidden="true" />
      </label>
    </header>

    <label class="form-control">
      <span class="label-text mb-1">Language</span>
      <select
        class="select min-h-11 w-full"
        aria-label="Language"
        bind:value={selectedLanguage}
        onchange={changeLanguage}
      >
        {#each languages as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>

    <label class="form-control">
      <span class="label-text mb-1 flex items-center gap-1.5">
        <Search class="h-4 w-4" aria-hidden="true" />
        Search tables
      </span>
      <input
        class="input min-h-11 w-full"
        type="search"
        placeholder="ItemTable"
        autocomplete="off"
        bind:value={searchTerm}
      />
    </label>

    <p class="text-sm opacity-70" aria-live="polite">
      {visibleFiles.length.toLocaleString("en-US")} tables
    </p>
    {#if selectedTableHidden}
      <p class="text-sm" role="status">
        Viewing {selectedTable}, hidden by search.
      </p>
    {/if}
    <div
      class="h-64 w-full overflow-auto border border-base-300 lg:h-auto lg:flex-1"
      role="group"
      aria-label="Table"
    >
      {#each visibleFiles as option}
        <button
          type="button"
          class="flex min-h-11 w-full items-start gap-3 px-4 py-2 text-left text-sm hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-base-content focus-visible:outline-offset-[-2px]"
          class:bg-base-200={selectedTable === option.table}
          class:font-semibold={selectedTable === option.table}
          aria-pressed={selectedTable === option.table}
          onclick={() => {
            selectedTable = option.table;
            void loadSelectedTable();
          }}
        >
          <span class="min-w-0 flex-1 break-all">{option.table}</span>
          <span class="shrink-0 tabular-nums opacity-70"
            >{fileSizeFormatter.format(option.size)}</span
          >
        </button>
      {/each}
    </div>
  </aside>

  <section class="flex min-h-0 min-w-0 flex-col gap-3 p-5">
    <header class="flex flex-wrap items-center gap-2">
      <div class="mr-auto min-w-0">
        <h2 class="flex items-center gap-2 text-xl font-semibold">
          <FileBracesCorner class="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            {selectedTable ? `${selectedLanguage} / ${selectedTable}` : "Select a JSON file"}
          </span>
        </h2>
        {#if dataUrl}
          <a
            class="link-hover mt-1 flex min-h-11 items-center break-all font-mono text-xs opacity-70"
            href={dataUrl}
          >
            {dataUrl}
          </a>
        {/if}
      </div>
      <p class="text-sm opacity-70" aria-live="polite">{loadStatus}</p>
      {#if dataUrl}
        <a class="btn btn-sm min-h-11" href={dataUrl}>
          <ExternalLink class="h-4 w-4" aria-hidden="true" />
          View raw
        </a>
        <a
          class="btn btn-sm btn-primary min-h-11"
          href={dataUrl}
          download={`${selectedTable}.json`}
        >
          <Download class="h-4 w-4" aria-hidden="true" />
          Download
        </a>
        <button
          type="button"
          class="btn btn-ghost btn-sm min-h-11"
          class:btn-active={wrapJson}
          aria-pressed={wrapJson}
          onclick={() => (wrapJson = !wrapJson)}
        >
          <TextWrap class="h-4 w-4" aria-hidden="true" />
          {wrapJson ? "Unwrap lines" : "Wrap lines"}
        </button>
      {/if}
    </header>
    <pre
      class="min-h-80 flex-1 overflow-auto rounded-box bg-neutral p-4 text-sm leading-6 text-neutral-content"
      data-wrap={wrapJson}
      role="region"
      aria-label="JSON content"><code>{jsonContent}</code></pre>
  </section>
</main>
