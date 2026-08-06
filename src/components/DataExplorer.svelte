<script lang="ts">
  import { Download, ExternalLink, FileBracesCorner, Moon, Search, Sun } from "@lucide/svelte";
  import { onMount } from "svelte";

  type DataFile = { language: string; table: string; size: number };

  export let files: DataFile[] = [];
  export let base = "";

  const themes = { light: "cupcake", dark: "dracula" } as const;
  type Theme = keyof typeof themes;

  const languages = [...new Set(files.map(({ language }) => language))];
  const filesForLanguage = (language: string) => files.filter((file) => file.language === language);
  const fileSizeFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "unit",
    unit: "byte",
    unitDisplay: "narrow",
    maximumFractionDigits: 1,
  });

  let selectedLanguage = languages.includes("english") ? "english" : (languages[0] ?? "");
  let searchTerm = "";
  let selectedTable = filesForLanguage(selectedLanguage)[0]?.table ?? "";
  let jsonContent = "";
  let loadStatus = "Loading…";
  let theme: Theme = "light";
  let controller: AbortController | undefined;

  $: visibleFiles = filesForLanguage(selectedLanguage).filter(({ table }) =>
    table.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );
  $: dataUrl = selectedTable
    ? `${base}data/${encodeURIComponent(selectedLanguage)}/ZTable/${encodeURIComponent(selectedTable)}.json`
    : "";

  async function loadSelectedTable() {
    if (!selectedTable) return;

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
    searchTerm = "";
    selectedTable = filesForLanguage(selectedLanguage)[0]?.table ?? "";
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
        : (availableFiles[0]?.table ?? "");
  }

  onMount(() => {
    restoreTheme();
    restoreSelection();
    void loadSelectedTable();
  });
</script>

<main class="grid min-h-screen lg:h-screen lg:grid-cols-[22rem_minmax(0,1fr)]">
  <aside class="flex min-h-0 flex-col gap-4 border-base-300 border-r bg-base-100 p-5">
    <header class="flex items-start gap-2">
      <div class="mr-auto">
        <h1 class="text-2xl font-bold">BPSR Data</h1>
        <p class="mt-1 text-sm opacity-70">
          {files.length.toLocaleString("en-US")} JSON files
        </p>
      </div>
      <label class="swap swap-rotate btn btn-circle btn-sm btn-ghost">
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
        class="select w-full"
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
        class="input w-full"
        type="search"
        placeholder="ItemTable"
        autocomplete="off"
        bind:value={searchTerm}
      />
    </label>

    <p class="text-sm opacity-70" aria-live="polite">
      {visibleFiles.length.toLocaleString("en-US")} tables
    </p>
    <div
      class="h-64 w-full overflow-auto border border-base-300 lg:h-auto lg:flex-1"
      role="group"
      aria-label="Table"
    >
      {#each visibleFiles as option}
        <button
          type="button"
          class="block w-full px-4 py-2 text-left text-sm hover:bg-base-200"
          class:bg-base-200={selectedTable === option.table}
          aria-pressed={selectedTable === option.table}
          onclick={() => {
            selectedTable = option.table;
            void loadSelectedTable();
          }}
        >
          {option.table} — {fileSizeFormatter.format(option.size)}
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
          <a class="link-hover mt-1 block break-all font-mono text-xs opacity-70" href={dataUrl}>
            {dataUrl}
          </a>
        {/if}
      </div>
      {#if dataUrl}
        <a class="btn btn-sm" href={dataUrl}>
          <ExternalLink class="h-4 w-4" aria-hidden="true" />
          View raw
        </a>
        <a class="btn btn-sm btn-primary" href={dataUrl} download={`${selectedTable}.json`}>
          <Download class="h-4 w-4" aria-hidden="true" />
          Download
        </a>
      {/if}
    </header>
    <p class="min-h-5 text-sm opacity-70" aria-live="polite">
      {visibleFiles.length ? loadStatus : "No matching tables."}
    </p>
    <pre
      class="min-h-80 flex-1 overflow-auto rounded-box bg-neutral p-4 text-sm text-neutral-content"
      role="region"
      aria-label="JSON content"><code>{jsonContent}</code></pre>
  </section>
</main>
