(function initObsidianBridgeModal(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const { DIALOG_ID } = bridge.constants;

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

  function sortNames(values) {
    return [...values].sort((a, b) => a.localeCompare(b));
  }

  function closeDialog() {
    document.getElementById(DIALOG_ID)?.remove();
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
      .obsidian-chatgpt-bridge-modal { width: min(560px, calc(100vw - 32px)); max-height: min(80vh, 760px); overflow: auto; border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; padding: 20px; background: Canvas; color: CanvasText; box-shadow: 0 24px 72px rgba(0,0,0,0.35); }
      .obsidian-chatgpt-bridge-modal h2 { margin: 0 0 6px 0; font-size: 18px; }
      .obsidian-chatgpt-bridge-modal-copy { margin: 2px 0 10px 0; font-size: 13px; line-height: 1.4; opacity: 0.75; }
      .obsidian-chatgpt-bridge-field-label { display: block; margin-top: 12px; font-size: 13px; font-weight: 600; }
      .obsidian-chatgpt-bridge-modal input:not([type="checkbox"]), .obsidian-chatgpt-bridge-modal textarea, .obsidian-chatgpt-bridge-select { width: 100%; box-sizing: border-box; margin-top: 6px; border: 1px solid rgba(127,127,127,0.45); border-radius: 12px; padding: 10px 12px; font: inherit; background: color-mix(in srgb, Canvas 92%, CanvasText 8%); color: inherit; }
      .obsidian-chatgpt-bridge-select { cursor: pointer; appearance: auto; }
      .obsidian-chatgpt-bridge-file-section { margin-top: 18px; }
      .obsidian-chatgpt-bridge-file-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .obsidian-chatgpt-bridge-file-heading { margin-top: 2px; font-size: 13px; font-weight: 600; }
      .obsidian-chatgpt-bridge-secondary-action { border: 0; padding: 0; font: inherit; font-size: 12px; cursor: pointer; background: transparent; color: inherit; opacity: 0.75; }
      .obsidian-chatgpt-bridge-secondary-action:hover { opacity: 1; text-decoration: underline; }
      .obsidian-chatgpt-bridge-secondary-action:disabled { opacity: 0.35; cursor: default; text-decoration: none; }
      .obsidian-chatgpt-bridge-file-list { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
      .obsidian-chatgpt-bridge-checkbox { display: flex !important; align-items: center; gap: 10px; margin: 0; padding: 0; border: 0; border-radius: 0; cursor: pointer; background: transparent; transition: none; }
      .obsidian-chatgpt-bridge-checkbox-input { width: 16px !important; height: 16px !important; flex: 0 0 16px; margin: 0; cursor: pointer; appearance: auto; }
      .obsidian-chatgpt-bridge-checkbox-input:focus-visible { outline: 2px solid color-mix(in srgb, CanvasText 45%, Canvas 55%); outline-offset: 2px; }
      .obsidian-chatgpt-bridge-checkbox-label { font-size: 13px; font-weight: 600; }
      .obsidian-chatgpt-bridge-empty-state { font-size: 12px; opacity: 0.72; padding: 4px 0; }
      .obsidian-chatgpt-bridge-modal-status { min-height: 18px; margin-top: 8px; font-size: 12px; line-height: 1.4; opacity: 0.8; }
      .obsidian-chatgpt-bridge-modal-status[data-tone="warn"] { color: #d97706; opacity: 1; }
      .obsidian-chatgpt-bridge-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
      .obsidian-chatgpt-bridge-modal-actions button { border: 1px solid currentColor; border-radius: 999px; padding: 8px 14px; font: inherit; cursor: pointer; background: transparent; color: inherit; }
      .obsidian-chatgpt-bridge-modal-actions .obsidian-chatgpt-bridge-primary { background: color-mix(in srgb, CanvasText 12%, Canvas 88%); }
    `;
    return fallback;
  }

  async function showBridgeDialog({ mode }) {
    closeDialog();

    const host = createEl("div", { attrs: { id: DIALOG_ID } });
    const shadowRoot = host.attachShadow({ mode: "open" });
    const stylesheet = await buildModalStyle();
    const overlay = createEl("div", {
      className: "obsidian-chatgpt-bridge-dialog",
      attrs: { role: "dialog", "aria-modal": "true" }
    });
    const panel = createEl("div", { className: "obsidian-chatgpt-bridge-modal" });
    overlay.appendChild(panel);

    const heading = createEl("h2", {
      text: mode === "start" ? "Start Obsidian Bridge" : "Load Obsidian Context"
    });
    const subtitle = createEl("p", {
      className: "obsidian-chatgpt-bridge-modal-copy",
      text: mode === "start"
        ? "Choose the Obsidian project to prime ChatGPT for bridge blocks."
        : "Choose a project and which notes to load as current context."
    });

    const form = createEl("form");
    const projectLabel = createEl("label", { text: "Project" });
    projectLabel.className = "obsidian-chatgpt-bridge-field-label";
    const projectSelect = createEl("select", {
      className: "obsidian-chatgpt-bridge-select",
      attrs: {
        "aria-label": "Project"
      }
    });
    const status = createEl("div", { className: "obsidian-chatgpt-bridge-modal-status" });

    const fileSection = createEl("section", { className: "obsidian-chatgpt-bridge-file-section" });
    const fileHeader = createEl("div", { className: "obsidian-chatgpt-bridge-file-header" });
    const fileHeading = createEl("div", { className: "obsidian-chatgpt-bridge-file-heading", text: "Files" });
    const selectAllButton = createEl("button", {
      text: "Select all",
      className: "obsidian-chatgpt-bridge-secondary-action",
      attrs: { type: "button" }
    });
    const fileHint = createEl("p", {
      className: "obsidian-chatgpt-bridge-modal-copy",
      text: "Select any files you want to load."
    });
    const checkboxWrap = createEl("div", { className: "obsidian-chatgpt-bridge-file-list" });

    const actions = createEl("div", { className: "obsidian-chatgpt-bridge-modal-actions" });
    const cancel = createEl("button", { text: "Cancel", attrs: { type: "button" } });
    const submit = createEl("button", {
      text: mode === "start" ? "Start" : "Load",
      attrs: { type: "submit" }
    });
    submit.className = "obsidian-chatgpt-bridge-primary";

    actions.append(cancel, submit);

    projectLabel.appendChild(projectSelect);
    form.append(projectLabel, status);

    if (mode === "load") {
      fileHeader.append(fileHeading, selectAllButton);
      fileSection.append(fileHeader, fileHint, checkboxWrap);
      form.appendChild(fileSection);
    }

    form.appendChild(actions);
    panel.append(heading, subtitle, form);
    shadowRoot.append(stylesheet, overlay);
    document.body.appendChild(host);

    function setStatus(message, tone = "") {
      status.textContent = message || "";
      status.setAttribute("data-tone", tone);
    }

    function selectedFiles() {
      const checked = [...checkboxWrap.querySelectorAll("input[type='checkbox']:checked")].map(input => String(input.value || "").trim()).filter(Boolean);
      return sortNames(new Set(checked));
    }

    function syncSelectAllState() {
      const inputs = [...checkboxWrap.querySelectorAll("input[type='checkbox']")];
      const checked = inputs.filter(input => input.checked);
      if (!inputs.length) {
        selectAllButton.textContent = "Select all";
        selectAllButton.disabled = true;
        return;
      }
      selectAllButton.disabled = false;
      selectAllButton.textContent = checked.length === inputs.length ? "Clear all" : "Select all";
    }

    function renderFileCheckboxes(files) {
      checkboxWrap.innerHTML = "";
      const availableFiles = sortNames(new Set(files.map(file => String(file || "").trim()).filter(Boolean)));
      if (!availableFiles.length) {
        checkboxWrap.appendChild(createEl("div", {
          className: "obsidian-chatgpt-bridge-empty-state",
          text: "No markdown files were discovered for this project."
        }));
        syncSelectAllState();
        return;
      }

      for (const file of availableFiles) {
        const row = createEl("label", { className: "obsidian-chatgpt-bridge-checkbox" });
        const input = createEl("input", { attrs: { type: "checkbox", value: file } });
        const text = createEl("span", {
          text: file,
          className: "obsidian-chatgpt-bridge-checkbox-label"
        });
        input.className = "obsidian-chatgpt-bridge-checkbox-input";
        row.append(input, text);
        input.addEventListener("change", syncSelectAllState);
        checkboxWrap.appendChild(row);
      }
      syncSelectAllState();
    }

    function renderProjects(projects) {
      const availableProjects = sortNames(new Set(projects.filter(Boolean)));
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

    async function loadProjectList() {
      const settings = await getSettings();
      if (!settings.apiKey) {
        setStatus("Set the Obsidian Local REST API key in the extension popup to enable project and file discovery.", "warn");
        return;
      }

      setStatus("Loading projects...");
      const result = await listObsidianDirectory("Projects");
      if (!result.ok) {
        setStatus(`Could not list projects: ${result.error || "unknown error"}`, "warn");
        return;
      }

      const projects = result.items
        .filter(item => item.isDirectory)
        .map(item => item.name);
      renderProjects(projects);
      setStatus(projects.length ? "" : "No projects were returned from Obsidian.");
      if (projects.length === 1) {
        projectSelect.value = projects[0];
        if (mode === "load") loadProjectFiles(projects[0]);
      }
    }

    async function loadProjectFiles(project) {
      checkboxWrap.innerHTML = "";
      if (!project) return;

      const settings = await getSettings();
      if (!settings.apiKey) return;

      setStatus(`Loading files for ${project}...`);
      const result = await listObsidianDirectory(`Projects/${project}`);
      if (!result.ok) {
        renderFileCheckboxes([]);
        setStatus(`Could not list files for ${project}: ${result.error || "unknown error"}`, "warn");
        return;
      }

      const files = result.items
        .filter(item => !item.isDirectory && /\.md$/i.test(item.name))
        .map(item => item.name);
      renderFileCheckboxes(files);
      setStatus("");
    }

    cancel.addEventListener("click", () => closeDialog());
    selectAllButton.addEventListener("click", () => {
      const inputs = [...checkboxWrap.querySelectorAll("input[type='checkbox']")];
      const shouldCheck = inputs.some(input => !input.checked);
      for (const input of inputs) input.checked = shouldCheck;
      syncSelectAllState();
    });
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
      if (mode === "load") loadProjectFiles(projectSelect.value.trim());
    });

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
          resolve({ project });
          return;
        }

        const files = selectedFiles();
        if (!files.length) {
          setStatus("Choose at least one file to load.", "warn");
          return;
        }
        closeDialog();
        resolve({ project, files });
      });
    });

    await loadProjectList();
    projectSelect.focus();

    return dialogPromise;
  }

  async function startBridge() {
    const selection = await showBridgeDialog({ mode: "start" });
    if (!selection?.project) return;
    const prompt = bridge.prompts.setupPrompt(selection.project);
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

    const selection = await showBridgeDialog({ mode: "load" });
    if (!selection?.project || !selection?.files?.length) return;

    const sections = [];
    const missing = [];

    for (const file of selection.files) {
      const filepath = `Projects/${selection.project}/${file}`;
      const result = await fetchObsidianFile(filepath);
      if (result.ok) {
        sections.push(`--- ${filepath} ---\n${result.content || ""}`.trim());
      } else {
        missing.push(`${filepath}: ${result.error || "not found"}`);
      }
    }

    let prompt = `${bridge.prompts.contextPrompt(selection.project)}\n\n`;
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
