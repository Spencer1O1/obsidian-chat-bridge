(function initObsidianBridgeModal(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const { DIALOG_ID } = bridge.constants;
  const EXPLORER_DIALOG_ID = `${DIALOG_ID}-explorer`;
  let activeProjectContext = null;

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

  function openExtensionPopup() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: "OPEN_EXTENSION_POPUP" }, response => resolve(response || { ok: false, error: "No response" }));
    });
  }

  function createObsidianProject(projectRoot, projectName) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(
        { type: "CREATE_OBSIDIAN_PROJECT", projectRoot, projectName },
        response => resolve(response || { ok: false, error: "No response" })
      );
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

  function getSetupRequirementsMessage(settings = {}) {
    const missingVaultName = !String(settings.vaultName || "").trim();
    const missingApiKey = !String(settings.apiKey || "").trim();
    if (!missingVaultName && !missingApiKey) return "";
    if (missingVaultName && missingApiKey) {
      return "You need to set your vault name and API key in the Bridge popup.";
    }
    if (missingVaultName) {
      return "You need to set your vault name in the Bridge popup.";
    }
    return "You need to set your API key in the Bridge popup.";
  }

  async function ensureSetupReady(settings) {
    const setupMessage = getSetupRequirementsMessage(settings);
    if (!setupMessage) return true;
    alert(setupMessage);
    await openExtensionPopup();
    return false;
  }

  function buildModalStyle() {
    const link = createEl("link", {
      attrs: {
        rel: "stylesheet",
        href: chrome.runtime.getURL("styles.css")
      }
    });
    link.addEventListener("error", event => {
      console.warn("Obsidian ChatGPT Bridge could not load modal stylesheet.", event);
    });
    return link;
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
    const stylesheet = buildModalStyle();
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

  async function showFileExplorerDialog({ title, subtitle, startDir, selectedPaths, rootLabel, doneLabel = "Done", showSelectionSummary = false }) {
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
    const selectedSection = createEl("section", { className: "obsidian-chatgpt-bridge-file-section" });
    const selectedHeading = createEl("div", { className: "obsidian-chatgpt-bridge-file-heading", text: "Selected Files" });
    const selectedWrap = createEl("div", { className: "obsidian-chatgpt-bridge-selected-list" });
    const actions = createEl("div", { className: "obsidian-chatgpt-bridge-modal-actions" });
    const cancel = createEl("button", { text: "Cancel", attrs: { type: "button" } });
    const done = createEl("button", { text: doneLabel, attrs: { type: "button" } });
    done.className = "obsidian-chatgpt-bridge-primary";
    actions.append(cancel, done);
    toolbar.append(backButton, pathDisplay);
    listWrapShell.appendChild(listWrap);
    selectedSection.append(selectedHeading, selectedWrap);
    body.append(toolbar, status, listWrapShell);
    if (showSelectionSummary) body.append(selectedSection);
    body.append(actions);
    panel.append(heading, subtitleEl, body);

    function setStatus(message, tone = "") {
      status.textContent = message || "";
      if (tone) status.setAttribute("data-tone", tone);
      else status.removeAttribute("data-tone");
    }

    function renderSelectedPaths() {
      if (!showSelectionSummary) return;
      selectedWrap.innerHTML = "";
      const paths = sortNames([...state.selectedPaths]);
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
          renderItems(state.lastItems || []);
        });
        row.append(pathText, removeButton);
        selectedWrap.appendChild(row);
      }
    }

    function renderItems(items) {
      state.lastItems = items;
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
          renderSelectedPaths();
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
    renderSelectedPaths();
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
      project: activeProjectContext?.projectName || "",
      selectedPaths: new Set()
    };
    const { overlay, panel } = await mountDialogShell(DIALOG_ID, true);

    const heading = createEl("h2", {
      text: mode === "start" ? "Start Obsidian Bridge" : "Load Obsidian Context"
    });
    const subtitle = createEl("p", {
      className: "obsidian-chatgpt-bridge-modal-copy",
      text: mode === "start"
        ? `Click Start to continue immediately, or optionally set a default project for this session.`
        : activeProjectContext?.projectName
          ? `Choose notes to load into ChatGPT. Current default project: ${activeProjectContext.projectName}.`
          : "Choose notes to load into ChatGPT."
    });
    const form = createEl("form");
    const status = createEl("div", { className: "obsidian-chatgpt-bridge-modal-status" });
    const actions = createEl("div", { className: "obsidian-chatgpt-bridge-modal-actions" });
    const cancel = createEl("button", { text: "Cancel", attrs: { type: "button" } });
    const submit = createEl("button", {
      text: mode === "start" ? "Start" : "Load",
      attrs: { type: "submit" }
    });
    submit.className = "obsidian-chatgpt-bridge-primary";
    actions.append(cancel, submit);

    let primaryFocus = null;
    let selectedWrap = null;

    function setStatus(message, tone = "") {
      status.textContent = message || "";
      if (tone) status.setAttribute("data-tone", tone);
      else status.removeAttribute("data-tone");
    }

    function selectedPaths() {
      return sortNames([...state.selectedPaths]);
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

    if (mode === "start") {
      const projectLabel = createEl("label", { text: "Default project for this session" });
      projectLabel.className = "obsidian-chatgpt-bridge-field-label";
      const projectSelect = createEl("select", {
        className: "obsidian-chatgpt-bridge-select",
        attrs: { "aria-label": "Default project" }
      });
      projectLabel.appendChild(projectSelect);
      form.append(projectLabel);
      primaryFocus = projectSelect;

      const createSection = createEl("section", { className: "obsidian-chatgpt-bridge-file-section" });
      const createHeading = createEl("div", { className: "obsidian-chatgpt-bridge-file-heading", text: "Create New Project" });
      const createCopy = createEl("p", {
        className: "obsidian-chatgpt-bridge-modal-copy",
        text: `Creates ${normalizedSettings.defaultProjectRoot}/<Project Name>/Hub.md and selects it as the default project.`
      });
      const createRow = createEl("div", { className: "obsidian-chatgpt-bridge-inline-actions" });
      const createInput = createEl("input", {
        attrs: {
          type: "text",
          placeholder: "ProjectName",
          "aria-label": "New project name"
        }
      });
      const createButton = createEl("button", {
        text: "Create Project",
        className: "obsidian-chatgpt-bridge-picker-button",
        attrs: { type: "button" }
      });
      createRow.append(createInput, createButton);
      createSection.append(createHeading, createCopy, createRow);
      form.append(createSection);

      function renderProjects(projects) {
        const availableProjects = sortNames(new Set(projects.filter(Boolean)));
        state.projects = availableProjects;
        projectSelect.innerHTML = "";
        projectSelect.appendChild(createEl("option", {
          text: "No default project",
          attrs: { value: "" }
        }));
        for (const project of availableProjects) {
          projectSelect.appendChild(createEl("option", {
            text: project,
            attrs: { value: project }
          }));
        }
        if (state.project && availableProjects.includes(state.project)) {
          projectSelect.value = state.project;
        } else {
          state.project = "";
          projectSelect.value = "";
        }
      }

      async function loadProjectList() {
        setStatus(`Loading projects from ${normalizedSettings.defaultProjectRoot}/...`);
        const result = await listObsidianDirectory(normalizedSettings.defaultProjectRoot);
        if (!result.ok) {
          renderProjects([]);
          setStatus(`No project root found at ${normalizedSettings.defaultProjectRoot}/. Create a new project or continue without a default project.`, "warn");
          return;
        }
        const projects = result.items.filter(item => item.isDirectory).map(item => item.name);
        renderProjects(projects);
        setStatus(projects.length ? "" : `No project folders found under ${normalizedSettings.defaultProjectRoot}/. Create a new project or continue without a default project.`);
        if (!state.project && projects.length === 1) {
          state.project = projects[0];
          projectSelect.value = projects[0];
        }
      }

      projectSelect.addEventListener("change", () => {
        state.project = projectSelect.value.trim();
        setStatus("");
      });

      createButton.addEventListener("click", async () => {
        const projectName = String(createInput.value || "").trim();
        if (!projectName) {
          setStatus("Enter a project name first.", "warn");
          createInput.focus();
          return;
        }
        setStatus(`Creating ${normalizedSettings.defaultProjectRoot}/${projectName}/...`);
        createButton.disabled = true;
        const result = await createObsidianProject(normalizedSettings.defaultProjectRoot, projectName);
        createButton.disabled = false;
        if (!result.ok) {
          setStatus(`Could not create project: ${result.error || "unknown error"}`, "warn");
          return;
        }
        createInput.value = "";
        state.project = result.projectName;
        await loadProjectList();
        projectSelect.value = result.projectName;
        setStatus(`Created ${result.projectPath}/ and selected it as the default project.`);
      });

      form.append(status, actions);
      panel.append(heading, subtitle, form);

      const dialogPromise = new Promise(resolve => {
        form.addEventListener("submit", event => {
          event.preventDefault();
          closeDialog();
          resolve({
            project: state.project,
            projectRoot: normalizedSettings.defaultProjectRoot
          });
        });
      });

      if (!normalizedSettings.apiKey) {
        setStatus("Set the Obsidian Local REST API key in the extension popup to enable project discovery.", "warn");
        primaryFocus?.focus();
        return dialogPromise;
      }

      await loadProjectList();
      primaryFocus?.focus();
      return dialogPromise;
    }

    const pickerActions = createEl("div", { className: "obsidian-chatgpt-bridge-picker-actions" });
    const addFiles = createEl("button", { text: "Add Files", attrs: { type: "button" } });
    addFiles.className = "obsidian-chatgpt-bridge-picker-button";
    pickerActions.append(addFiles);

    const selectedSection = createEl("section", { className: "obsidian-chatgpt-bridge-file-section" });
    const selectedHeading = createEl("div", { className: "obsidian-chatgpt-bridge-file-heading", text: "Selected Files" });
    selectedWrap = createEl("div", { className: "obsidian-chatgpt-bridge-selected-list" });
    selectedSection.append(selectedHeading, selectedWrap, pickerActions);
    form.append(selectedSection, status, actions);
    panel.append(heading, subtitle, form);
    renderSelectedPaths();
    primaryFocus = addFiles;

    addFiles.addEventListener("click", async () => {
      const result = await showFileExplorerDialog({
        title: "Vault Files",
        subtitle: `Browse anywhere in vault ${normalizedSettings.vaultName} and select notes to load.`,
        startDir: "",
        selectedPaths: new Set(selectedPaths()),
        rootLabel: "Vault root"
      });
      state.selectedPaths = new Set(result);
      renderSelectedPaths();
      setStatus("");
    });

    const dialogPromise = new Promise(resolve => {
      form.addEventListener("submit", event => {
        event.preventDefault();
        const files = selectedPaths();
        if (!files.length) {
          setStatus("Choose at least one file to load.", "warn");
          return;
        }
        closeDialog();
        resolve({
          project: activeProjectContext?.projectName || "",
          projectRoot: activeProjectContext?.projectRoot || normalizedSettings.defaultProjectRoot,
          selectedPaths: files
        });
      });
    });

    primaryFocus?.focus();
    return dialogPromise;
  }

  async function startBridge() {
    const settings = await getSettings();
    if (!await ensureSetupReady(settings)) {
      return;
    }
    const selection = await showBridgeDialog({ mode: "start", settings });
    if (!selection) return;
    activeProjectContext = selection.project
      ? { projectName: selection.project, projectRoot: selection.projectRoot }
      : null;
    const prompt = bridge.prompts.setupPrompt({
      vaultName: settings.vaultName,
      projectName: selection.project || "",
      projectRoot: selection.projectRoot
    });
    if (!bridge.chatgptUi.insertAndSend(prompt)) {
      await bridge.chatgptUi.copyText(prompt);
      alert("Could not find the ChatGPT composer. Setup prompt copied to clipboard.");
    }
  }

  async function loadObsidianContext() {
    const settings = await getSettings();
    if (!await ensureSetupReady(settings)) {
      return;
    }

    const selectedPaths = await showFileExplorerDialog({
      title: "Vault Files",
      subtitle: activeProjectContext?.projectName
        ? `Browse anywhere in vault ${settings.vaultName} and select notes to load. Current default project: ${activeProjectContext.projectName}.`
        : `Browse anywhere in vault ${settings.vaultName} and select notes to load.`,
      startDir: "",
      selectedPaths: new Set(),
      rootLabel: "Vault root",
      doneLabel: "Load",
      showSelectionSummary: true
    });
    if (!selectedPaths?.length) return;

    const sections = [];
    const missing = [];
    for (const filepath of selectedPaths) {
      const result = await fetchObsidianFile(filepath);
      if (result.ok) sections.push(`--- ${filepath} ---\n${result.content || ""}`.trim());
      else missing.push(`${filepath}: ${result.error || "not found"}`);
    }

    let prompt = `${bridge.prompts.contextPrompt({
      vaultName: settings.vaultName,
      projectName: activeProjectContext?.projectName || "",
      projectRoot: activeProjectContext?.projectRoot || settings.defaultProjectRoot,
      selectedPaths
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
