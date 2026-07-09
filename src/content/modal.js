(function initObsidianBridgeModal(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const { DIALOG_ID } = bridge.constants;
  const EXPLORER_DIALOG_ID = `${DIALOG_ID}-explorer`;

  function getSettings() {
    return new Promise(resolve => chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, response => resolve(response || {})));
  }

  function fetchObsidianFile(filepath) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: "FETCH_OBSIDIAN_FILE", filepath }, response => resolve(response || { ok: false, error: "No response" }));
    });
  }

  function listObsidianDirectory(dirpath) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: "LIST_OBSIDIAN_DIRECTORY", dirpath }, response => resolve(response || { ok: false, error: "No response" }));
    });
  }

  function normalizeVaultPath(path) {
    return String(path || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
  }

  function resolveListedPath(baseDir, item) {
    const normalizedBase = normalizeVaultPath(baseDir);
    const normalizedPath = normalizeVaultPath(item?.path || "");
    const fallbackName = normalizeVaultPath(item?.name || "");
    if (!normalizedPath) {
      return normalizedBase && fallbackName ? `${normalizedBase}/${fallbackName}` : fallbackName;
    }
    if (!normalizedBase) return normalizedPath;
    if (normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`)) return normalizedPath;
    if (!normalizedPath.includes("/")) return `${normalizedBase}/${normalizedPath}`;
    if (fallbackName && normalizedPath === fallbackName) return `${normalizedBase}/${fallbackName}`;
    return normalizedPath;
  }

  function sortNames(values) {
    return [...values].sort((a, b) => a.localeCompare(b));
  }

  function parentDirectory(path) {
    const parts = normalizeVaultPath(path).split("/").filter(Boolean);
    parts.pop();
    return parts.join("/");
  }

  function closeDialog() {
    document.getElementById(DIALOG_ID)?.remove();
    document.getElementById(EXPLORER_DIALOG_ID)?.remove();
  }

  function closeExplorerDialog() {
    document.getElementById(EXPLORER_DIALOG_ID)?.remove();
  }

  function createEl(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.text) el.textContent = options.text;
    if (options.html) el.innerHTML = options.html;
    if (options.attrs) {
      Object.entries(options.attrs).forEach(([key, value]) => {
        if (value != null) el.setAttribute(key, value);
      });
    }
    return el;
  }

  async function buildModalStyle() {
    try {
      const response = await fetch(chrome.runtime.getURL("styles.css"));
      if (response.ok) {
        const css = await response.text();
        const style = createEl("style");
        style.textContent = css;
        return style;
      }
    } catch {}

    const fallback = createEl("style");
    fallback.textContent = `
      .obsidian-chatgpt-bridge-dialog { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); }
      .obsidian-chatgpt-bridge-modal { width: min(720px, calc(100vw - 32px)); max-height: min(85vh, 860px); overflow: auto; border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; padding: 20px; background: Canvas; color: CanvasText; box-shadow: 0 24px 72px rgba(0,0,0,0.35); }
      .obsidian-chatgpt-bridge-modal h2 { margin: 0 0 6px 0; font-size: 18px; }
      .obsidian-chatgpt-bridge-modal-copy { margin: 2px 0 10px 0; font-size: 13px; line-height: 1.4; opacity: 0.75; }
      .obsidian-chatgpt-bridge-field-label { display: block; margin-top: 12px; font-size: 13px; font-weight: 600; }
      .obsidian-chatgpt-bridge-modal input:not([type="checkbox"]), .obsidian-chatgpt-bridge-select { width: 100%; box-sizing: border-box; margin-top: 6px; border: 1px solid rgba(127,127,127,0.45); border-radius: 12px; padding: 10px 12px; font: inherit; background: color-mix(in srgb, Canvas 92%, CanvasText 8%); color: inherit; }
      .obsidian-chatgpt-bridge-select { cursor: pointer; appearance: none; padding-right: 42px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M3 5.25L7 9.25L11 5.25' stroke='%23ffffff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; background-size: 14px 14px; }
      .obsidian-chatgpt-bridge-file-section { margin-top: 18px; padding-top: 18px; border-top: 1px solid rgba(127,127,127,0.18); }
      .obsidian-chatgpt-bridge-file-heading { margin-top: 2px; font-size: 13px; font-weight: 600; }
      .obsidian-chatgpt-bridge-secondary-action { border: 0; padding: 0; font: inherit; font-size: 12px; cursor: pointer; background: transparent; color: inherit; opacity: 0.75; }
      .obsidian-chatgpt-bridge-secondary-action:hover { opacity: 1; text-decoration: underline; }
      .obsidian-chatgpt-bridge-empty-state { font-size: 12px; opacity: 0.72; padding: 4px 0; }
      .obsidian-chatgpt-bridge-modal-status { min-height: 18px; margin-top: 8px; font-size: 12px; line-height: 1.4; opacity: 0.8; }
      .obsidian-chatgpt-bridge-modal-status[data-tone="warn"] { color: #d97706; opacity: 1; }
      .obsidian-chatgpt-bridge-selected-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
      .obsidian-chatgpt-bridge-selected-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border: 1px solid rgba(127,127,127,0.24); border-radius: 12px; }
      .obsidian-chatgpt-bridge-selected-path { font-size: 12px; line-height: 1.35; word-break: break-word; }
      .obsidian-chatgpt-bridge-picker-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
      .obsidian-chatgpt-bridge-picker-button { border: 1px solid rgba(127,127,127,0.35); border-radius: 999px; padding: 8px 12px; font: inherit; cursor: pointer; background: transparent; color: inherit; }
      .obsidian-chatgpt-bridge-picker-button:disabled { opacity: 0.4; cursor: default; }
      .obsidian-chatgpt-bridge-browser-toolbar { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(127,127,127,0.18); }
      .obsidian-chatgpt-bridge-browser-toolbar button { border: 0; border-radius: 0; padding: 0; font: inherit; line-height: 1.2; cursor: pointer; background: transparent; color: inherit; opacity: 0.82; }
      .obsidian-chatgpt-bridge-browser-toolbar button:disabled { opacity: 0.38; cursor: default; }
      .obsidian-chatgpt-bridge-breadcrumb { font-size: 12px; line-height: 1.2; opacity: 0.8; word-break: break-word; }
      .obsidian-chatgpt-bridge-browser-list { display: flex; flex-direction: column; gap: 0; margin-top: 4px; border-top: 1px solid rgba(127,127,127,0.18); border-bottom: 1px solid rgba(127,127,127,0.18); }
      .obsidian-chatgpt-bridge-browser-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0; border-bottom: 1px solid rgba(127,127,127,0.12); }
      .obsidian-chatgpt-bridge-browser-row:last-child { border-bottom: 0; }
      .obsidian-chatgpt-bridge-browser-entry { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; border: 0; padding: 14px 0; font: inherit; background: transparent; color: inherit; cursor: pointer; text-align: left; }
      .obsidian-chatgpt-bridge-browser-name { font-size: 14px; font-weight: 600; }
      .obsidian-chatgpt-bridge-browser-kind { font-size: 12px; opacity: 0.7; }
      .obsidian-chatgpt-bridge-browser-chevron { font-size: 14px; opacity: 0.65; }
      .obsidian-chatgpt-bridge-browser-file { display: flex; align-items: center; gap: 10px; padding: 14px 0; border-bottom: 1px solid rgba(127,127,127,0.12); cursor: pointer; }
      .obsidian-chatgpt-bridge-browser-file:last-child { border-bottom: 0; }
      .obsidian-chatgpt-bridge-checkbox-input { width: 16px !important; height: 16px !important; flex: 0 0 16px; margin: 0; cursor: pointer; appearance: auto; }
      .obsidian-chatgpt-bridge-checkbox-label { font-size: 13px; font-weight: 600; }
      .obsidian-chatgpt-bridge-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
      .obsidian-chatgpt-bridge-modal-actions button { border: 1px solid currentColor; border-radius: 999px; padding: 8px 14px; font: inherit; cursor: pointer; background: transparent; color: inherit; }
      .obsidian-chatgpt-bridge-modal-actions .obsidian-chatgpt-bridge-primary { background: color-mix(in srgb, CanvasText 12%, Canvas 88%); }
    `;
    return fallback;
  }

  function createDialogHost(dialogId, replaceAll = false) {
    if (replaceAll) closeDialog();
    else document.getElementById(dialogId)?.remove();
    const host = createEl("div", { attrs: { id: dialogId } });
    const shadowRoot = host.attachShadow({ mode: "open" });
    return { host, shadowRoot };
  }

  async function mountDialogShell(dialogId, replaceAll = false) {
    const { host, shadowRoot } = createDialogHost(dialogId, replaceAll);
    const stylesheet = await buildModalStyle();
    const overlay = createEl("div", {
      className: "obsidian-chatgpt-bridge-dialog",
      attrs: { role: "dialog", "aria-modal": "true" }
    });
    const panel = createEl("div", { className: "obsidian-chatgpt-bridge-modal" });
    overlay.appendChild(panel);
    shadowRoot.append(stylesheet, overlay);
    document.body.appendChild(host);
    return { overlay, panel };
  }

  async function showFileExplorerDialog({ title, subtitle, startDir, selectedPaths, rootLabel }) {
    const state = {
      dir: normalizeVaultPath(startDir),
      selectedPaths
    };
    const { overlay, panel } = await mountDialogShell(EXPLORER_DIALOG_ID, false);
    panel.classList.add("explorer-modal");
    const heading = createEl("h2", { text: title });
    const subtitleEl = createEl("p", { className: "obsidian-chatgpt-bridge-modal-copy", text: subtitle });
    const body = createEl("div", { className: "obsidian-chatgpt-bridge-explorer-body" });
    const toolbar = createEl("div", { className: "obsidian-chatgpt-bridge-browser-toolbar" });
    const backButton = createEl("button", { text: rootLabel, attrs: { type: "button" } });
    const pathDisplay = createEl("div", { className: "obsidian-chatgpt-bridge-breadcrumb" });
    const status = createEl("div", { className: "obsidian-chatgpt-bridge-modal-status" });
    const listWrapShell = createEl("div", { className: "obsidian-chatgpt-bridge-explorer-list-wrap" });
    const listWrap = createEl("div", { className: "obsidian-chatgpt-bridge-browser-list" });
    const actions = createEl("div", { className: "obsidian-chatgpt-bridge-modal-actions" });
    const cancel = createEl("button", { text: "Cancel", attrs: { type: "button" } });
    const done = createEl("button", { text: "Done", attrs: { type: "button" } });
    done.className = "obsidian-chatgpt-bridge-primary";
    actions.append(cancel, done);
    toolbar.append(backButton, pathDisplay);
    listWrapShell.appendChild(listWrap);
    body.append(toolbar, status, listWrapShell);
    panel.append(heading, subtitleEl, body, actions);

    function setStatus(message, tone = "") {
      status.textContent = message || "";
      if (tone) status.setAttribute("data-tone", tone);
      else status.removeAttribute("data-tone");
    }

    function renderItems(items) {
      listWrap.innerHTML = "";
      pathDisplay.textContent = state.dir ? `${state.dir}/` : "/";
      backButton.textContent = state.dir ? "< Back" : rootLabel;
      backButton.disabled = !state.dir;
      if (!items.length) {
        listWrap.appendChild(createEl("div", {
          className: "obsidian-chatgpt-bridge-empty-state",
          text: "This folder is empty."
        }));
        return;
      }
      for (const item of items) {
        if (item.isDirectory) {
          const row = createEl("div", { className: "obsidian-chatgpt-bridge-browser-row" });
          const openButton = createEl("button", {
            className: "obsidian-chatgpt-bridge-browser-entry",
            attrs: { type: "button" }
          });
          const name = createEl("span", { className: "obsidian-chatgpt-bridge-browser-name", text: item.name });
          const meta = createEl("span", { className: "obsidian-chatgpt-bridge-browser-kind", text: "Folder" });
          const chevron = createEl("span", { className: "obsidian-chatgpt-bridge-browser-chevron", text: ">" });
          const detail = createEl("span", { className: "obsidian-chatgpt-bridge-browser-kind" });
          detail.append(meta, document.createTextNode(" "), chevron);
          openButton.addEventListener("click", () => browse(item.path));
          openButton.append(name, detail);
          row.appendChild(openButton);
          listWrap.appendChild(row);
          continue;
        }
        if (!/\.md$/i.test(item.name)) continue;
        const row = createEl("label", { className: "obsidian-chatgpt-bridge-browser-file" });
        const input = createEl("input", { attrs: { type: "checkbox", value: item.path } });
        const text = createEl("span", { text: item.name, className: "obsidian-chatgpt-bridge-checkbox-label" });
        input.className = "obsidian-chatgpt-bridge-checkbox-input";
        input.checked = state.selectedPaths.has(item.path);
        input.addEventListener("change", () => {
          if (input.checked) state.selectedPaths.add(item.path);
          else state.selectedPaths.delete(item.path);
        });
        row.append(input, text);
        listWrap.appendChild(row);
      }
      if (!listWrap.children.length) {
        listWrap.appendChild(createEl("div", {
          className: "obsidian-chatgpt-bridge-empty-state",
          text: "No markdown files or folders were found here."
        }));
      }
    }

    async function browse(dirpath) {
      const normalized = normalizeVaultPath(dirpath);
      setStatus(normalized ? `Loading ${normalized}/...` : "Loading vault root...");
      const result = await listObsidianDirectory(normalized);
      if (!result.ok) {
        setStatus(`Could not open ${normalized || "vault root"}: ${result.error || "unknown error"}`, "warn");
        return;
      }
      state.dir = normalized;
      const items = result.items
        .map(item => ({ ...item, path: resolveListedPath(normalized, item) }))
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      setStatus("");
      renderItems(items);
    }

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeExplorerDialog();
    });
    backButton.addEventListener("click", () => {
      if (!state.dir) return;
      browse(parentDirectory(state.dir));
    });

    const initialSelection = sortNames([...state.selectedPaths]);
    const dialogPromise = new Promise(resolve => {
      cancel.addEventListener("click", () => {
        closeExplorerDialog();
        resolve(initialSelection);
      });
      done.addEventListener("click", () => {
        closeExplorerDialog();
        resolve(sortNames([...state.selectedPaths]));
      });
    });

    await browse(state.dir);
    return dialogPromise;
  }

  async function showBridgeDialog({ mode, settings }) {
    const normalizedSettings = {
      apiKey: String(settings?.apiKey || "").trim(),
      vaultName: String(settings?.vaultName || "").trim() || "Vault",
      defaultProjectRoot: normalizeVaultPath(settings?.defaultProjectRoot || "Projects") || "Projects"
    };
    const state = {
      projects: [],
      project: "",
      selectedPaths: new Set()
    };
    const { overlay, panel } = await mountDialogShell(DIALOG_ID, true);

    const heading = createEl("h2", {
      text: mode === "start" ? "Start Obsidian Bridge" : "Load Obsidian Context"
    });
    const subtitle = createEl("p", {
      className: "obsidian-chatgpt-bridge-modal-copy",
      text: mode === "start"
        ? `Choose the default project under ${normalizedSettings.defaultProjectRoot}/ for bridge writes.`
        : "Choose a project, add notes, then load that context into ChatGPT."
    });
    const form = createEl("form");
    const projectLabel = createEl("label", { text: `Project (${normalizedSettings.defaultProjectRoot})` });
    projectLabel.className = "obsidian-chatgpt-bridge-field-label";
    const projectSelect = createEl("select", {
      className: "obsidian-chatgpt-bridge-select",
      attrs: { "aria-label": "Project" }
    });
    const status = createEl("div", { className: "obsidian-chatgpt-bridge-modal-status" });
    projectLabel.appendChild(projectSelect);
    form.append(projectLabel, status);

    const actions = createEl("div", { className: "obsidian-chatgpt-bridge-modal-actions" });
    const cancel = createEl("button", { text: "Cancel", attrs: { type: "button" } });
    const submit = createEl("button", {
      text: mode === "start" ? "Start" : "Load",
      attrs: { type: "submit" }
    });
    submit.className = "obsidian-chatgpt-bridge-primary";
    actions.append(cancel, submit);

    let selectedWrap = null;

    function setStatus(message, tone = "") {
      status.textContent = message || "";
      if (tone) status.setAttribute("data-tone", tone);
      else status.removeAttribute("data-tone");
    }

    function projectBasePath(project = state.project) {
      return project ? `${normalizedSettings.defaultProjectRoot}/${project}` : "";
    }

    function selectedPaths() {
      return sortNames([...state.selectedPaths]);
    }

    function renderProjects(projects) {
      const availableProjects = sortNames(new Set(projects.filter(Boolean)));
      state.projects = availableProjects;
      projectSelect.innerHTML = "";
      projectSelect.appendChild(createEl("option", {
        text: availableProjects.length ? "Select a project" : "No projects available",
        attrs: { value: "" }
      }));
      for (const project of availableProjects) {
        projectSelect.appendChild(createEl("option", {
          text: project,
          attrs: { value: project }
        }));
      }
    }

    function renderSelectedPaths() {
      if (!selectedWrap) return;
      selectedWrap.innerHTML = "";
      const paths = selectedPaths();
      if (!paths.length) {
        selectedWrap.appendChild(createEl("div", {
          className: "obsidian-chatgpt-bridge-empty-state",
          text: "No files selected yet."
        }));
        return;
      }
      for (const path of paths) {
        const row = createEl("div", { className: "obsidian-chatgpt-bridge-selected-item" });
        const pathText = createEl("div", {
          className: "obsidian-chatgpt-bridge-selected-path",
          text: path
        });
        const removeButton = createEl("button", {
          text: "Remove",
          className: "obsidian-chatgpt-bridge-secondary-action",
          attrs: { type: "button" }
        });
        removeButton.addEventListener("click", () => {
          state.selectedPaths.delete(path);
          renderSelectedPaths();
        });
        row.append(pathText, removeButton);
        selectedWrap.appendChild(row);
      }
    }

    async function loadProjectList() {
      setStatus(`Loading projects from ${normalizedSettings.defaultProjectRoot}/...`);
      const result = await listObsidianDirectory(normalizedSettings.defaultProjectRoot);
      if (!result.ok) {
        setStatus(`Could not list projects: ${result.error || "unknown error"}`, "warn");
        renderProjects([]);
        return;
      }
      const projects = result.items.filter(item => item.isDirectory).map(item => item.name);
      renderProjects(projects);
      setStatus(projects.length ? "" : `No project folders were returned from ${normalizedSettings.defaultProjectRoot}/.`);
      if (projects.length === 1) {
        state.project = projects[0];
        projectSelect.value = projects[0];
      }
    }

    cancel.addEventListener("click", () => closeDialog());
    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeDialog();
    });
    window.addEventListener("keydown", function handleEscape(event) {
      if (event.key === "Escape") {
        window.removeEventListener("keydown", handleEscape);
        closeDialog();
      }
    }, { once: true });

    projectSelect.addEventListener("change", () => {
      state.project = projectSelect.value.trim();
    });

    if (mode === "load") {
      const pickerActions = createEl("div", { className: "obsidian-chatgpt-bridge-picker-actions" });
      const addProjectFiles = createEl("button", { text: "Add Project Files", attrs: { type: "button" } });
      addProjectFiles.className = "obsidian-chatgpt-bridge-picker-button";
      const addVaultFiles = createEl("button", { text: "Add Vault Files", attrs: { type: "button" } });
      addVaultFiles.className = "obsidian-chatgpt-bridge-picker-button";
      pickerActions.append(addProjectFiles, addVaultFiles);

      const selectedSection = createEl("section", { className: "obsidian-chatgpt-bridge-file-section" });
      const selectedHeading = createEl("div", { className: "obsidian-chatgpt-bridge-file-heading", text: "Selected Files" });
      selectedWrap = createEl("div", { className: "obsidian-chatgpt-bridge-selected-list" });
      selectedSection.append(selectedHeading, selectedWrap, pickerActions);

      addProjectFiles.addEventListener("click", async () => {
        if (!state.project) {
          setStatus("Choose a project first.", "warn");
          return;
        }
        const projectRoot = projectBasePath();
        const projectSelected = new Set(selectedPaths().filter(path => path === projectRoot || path.startsWith(`${projectRoot}/`)));
        const result = await showFileExplorerDialog({
          title: "Project Files",
          subtitle: `Browse folders inside ${projectRoot}/ and select notes to load.`,
          startDir: projectRoot,
          selectedPaths: projectSelected,
          rootLabel: "Project root"
        });
        for (const path of [...state.selectedPaths]) {
          if (path === projectRoot || path.startsWith(`${projectRoot}/`)) state.selectedPaths.delete(path);
        }
        for (const path of result) state.selectedPaths.add(path);
        renderSelectedPaths();
      });

      addVaultFiles.addEventListener("click", async () => {
        const result = await showFileExplorerDialog({
          title: "Vault Files",
          subtitle: `Browse anywhere in vault ${normalizedSettings.vaultName} and select notes to load.`,
          startDir: "",
          selectedPaths: new Set(selectedPaths()),
          rootLabel: "Vault root"
        });
        state.selectedPaths = new Set(result);
        renderSelectedPaths();
      });

      form.append(selectedSection);
      renderSelectedPaths();
    }

    form.appendChild(actions);
    panel.append(heading, subtitle, form);

    const dialogPromise = new Promise(resolve => {
      form.addEventListener("submit", event => {
        event.preventDefault();
        const project = projectSelect.value.trim();
        if (!project) {
          setStatus("Choose a project first.", "warn");
          return;
        }
        if (mode === "start") {
          closeDialog();
          resolve({ project, projectRoot: normalizedSettings.defaultProjectRoot });
          return;
        }
        const files = selectedPaths();
        if (!files.length) {
          setStatus("Choose at least one file to load.", "warn");
          return;
        }
        closeDialog();
        resolve({
          project,
          projectRoot: normalizedSettings.defaultProjectRoot,
          selectedPaths: files
        });
      });
    });

    if (!normalizedSettings.apiKey) {
      setStatus("Set the Obsidian Local REST API key in the extension popup to enable project and file discovery.", "warn");
      projectSelect.focus();
      return dialogPromise;
    }

    await loadProjectList();
    projectSelect.focus();
    return dialogPromise;
  }

  async function startBridge() {
    const settings = await getSettings();
    if (!settings.apiKey) {
      alert("Set your Obsidian Local REST API key in the extension popup first. Install/enable the Obsidian Local REST API plugin, then paste its API key into the Obsidian ChatGPT Bridge popup.");
      return;
    }
    const selection = await showBridgeDialog({ mode: "start", settings });
    if (!selection?.project) return;
    const prompt = bridge.prompts.setupPrompt({
      vaultName: settings.vaultName,
      projectName: selection.project,
      projectRoot: selection.projectRoot
    });
    if (!bridge.chatgptUi.insertAndSend(prompt)) {
      await bridge.chatgptUi.copyText(prompt);
      alert("Could not find the ChatGPT composer. Setup prompt copied to clipboard.");
    }
  }

  async function loadObsidianContext() {
    const settings = await getSettings();
    if (!settings.apiKey) {
      alert("Set your Obsidian Local REST API key in the extension popup first. Install/enable the Obsidian Local REST API plugin, then paste its API key into the Obsidian ChatGPT Bridge popup.");
      return;
    }

    const selection = await showBridgeDialog({ mode: "load", settings });
    if (!selection?.project || !selection?.selectedPaths?.length) return;

    const sections = [];
    const missing = [];
    for (const filepath of selection.selectedPaths) {
      const result = await fetchObsidianFile(filepath);
      if (result.ok) sections.push(`--- ${filepath} ---\n${result.content || ""}`.trim());
      else missing.push(`${filepath}: ${result.error || "not found"}`);
    }

    let prompt = `${bridge.prompts.contextPrompt({
      vaultName: settings.vaultName,
      projectName: selection.project,
      projectRoot: selection.projectRoot,
      selectedPaths: selection.selectedPaths
    })}\n\n`;
    if (sections.length) prompt += sections.join("\n\n") + "\n";
    if (missing.length) prompt += `\n--- Files not loaded ---\n${missing.map(x => `- ${x}`).join("\n")}\n`;

    if (!bridge.chatgptUi.insertAndSend(prompt)) {
      await bridge.chatgptUi.copyText(prompt);
      alert("Could not find the ChatGPT composer. Loaded context copied to clipboard.");
    }
  }

  bridge.modal = {
    startBridge,
    loadObsidianContext
  };
})(window);
