(function initObsidianBridgeExplorer(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const modal = bridge.modalInternals = bridge.modalInternals || {};
  const { createEl, closeExplorerDialog, mountDialogShell, EXPLORER_DIALOG_ID } = modal;
  const { normalizeVaultPath, parentDirectory, resolveListedPath, sortNames } = modal;

  modal.showFileExplorerDialog = async function showFileExplorerDialog(options) {
    const state = { dir: normalizeVaultPath(options.startDir), selectedPaths: options.selectedPaths };
    const { overlay, panel } = mountDialogShell(EXPLORER_DIALOG_ID, false);
    panel.classList.add("explorer-modal");
    const heading = createEl("h2", { text: options.title });
    const subtitle = createEl("p", { className: "obsidian-chatgpt-bridge-modal-copy", text: options.subtitle });
    const body = createEl("div", { className: "obsidian-chatgpt-bridge-explorer-body" });
    const toolbar = createEl("div", { className: "obsidian-chatgpt-bridge-browser-toolbar" });
    const back = createEl("button", { text: options.rootLabel, attrs: { type: "button" } });
    const path = createEl("div", { className: "obsidian-chatgpt-bridge-breadcrumb" });
    const status = createEl("div", { className: "obsidian-chatgpt-bridge-modal-status" });
    const listWrap = createEl("div", { className: "obsidian-chatgpt-bridge-explorer-list-wrap" });
    const list = createEl("div", { className: "obsidian-chatgpt-bridge-browser-list" });
    const selected = createEl("section", { className: "obsidian-chatgpt-bridge-file-section" });
    const selectedWrap = createEl("div", { className: "obsidian-chatgpt-bridge-selected-list" });
    const actions = createEl("div", { className: "obsidian-chatgpt-bridge-modal-actions" });
    const cancel = createEl("button", { text: "Cancel", attrs: { type: "button" } });
    const done = createEl("button", { text: options.doneLabel || "Done", attrs: { type: "button" } });
    done.className = "obsidian-chatgpt-bridge-primary";
    actions.append(cancel, done); toolbar.append(back, path); listWrap.appendChild(list);
    selected.append(createEl("div", { className: "obsidian-chatgpt-bridge-file-heading", text: "Selected Files" }), selectedWrap);
    body.append(toolbar, status, listWrap); if (options.showSelectionSummary) body.append(selected); body.append(actions);
    panel.append(heading, subtitle, body);

    const setStatus = (message, tone = "") => { status.textContent = message || ""; tone ? status.setAttribute("data-tone", tone) : status.removeAttribute("data-tone"); };
    const renderSelected = () => {
      if (!options.showSelectionSummary) return;
      selectedWrap.innerHTML = "";
      const paths = sortNames([...state.selectedPaths]);
      if (!paths.length) return selectedWrap.appendChild(createEl("div", { className: "obsidian-chatgpt-bridge-empty-state", text: "No files selected yet." }));
      paths.forEach(item => {
        const row = createEl("div", { className: "obsidian-chatgpt-bridge-selected-item" });
        const button = createEl("button", { text: "Remove", className: "obsidian-chatgpt-bridge-secondary-action", attrs: { type: "button" } });
        button.addEventListener("click", () => { state.selectedPaths.delete(item); renderSelected(); renderItems(state.lastItems || []); });
        row.append(createEl("div", { className: "obsidian-chatgpt-bridge-selected-path", text: item }), button);
        selectedWrap.appendChild(row);
      });
    };
    const renderItems = items => {
      state.lastItems = items; list.innerHTML = ""; path.textContent = state.dir ? `${state.dir}/` : "/"; back.textContent = state.dir ? "< Back" : options.rootLabel; back.disabled = !state.dir;
      if (!items.length) return list.appendChild(createEl("div", { className: "obsidian-chatgpt-bridge-empty-state", text: "This folder is empty." }));
      items.forEach(item => {
        if (item.isDirectory) {
          const open = createEl("button", { className: "obsidian-chatgpt-bridge-browser-entry", attrs: { type: "button" } });
          const detail = createEl("span", { className: "obsidian-chatgpt-bridge-browser-kind" });
          detail.append(createEl("span", { className: "obsidian-chatgpt-bridge-browser-kind", text: "Folder" }), document.createTextNode(" "), createEl("span", { className: "obsidian-chatgpt-bridge-browser-chevron", text: ">" }));
          open.addEventListener("click", () => browse(item.path));
          open.append(createEl("span", { className: "obsidian-chatgpt-bridge-browser-name", text: item.name }), detail);
          const row = createEl("div", { className: "obsidian-chatgpt-bridge-browser-row" }); row.appendChild(open); return list.appendChild(row);
        }
        if (!/\.md$/i.test(item.name)) return;
        const row = createEl("label", { className: "obsidian-chatgpt-bridge-browser-file" });
        const input = createEl("input", { attrs: { type: "checkbox", value: item.path } });
        input.className = "obsidian-chatgpt-bridge-checkbox-input"; input.checked = state.selectedPaths.has(item.path);
        input.addEventListener("change", () => { input.checked ? state.selectedPaths.add(item.path) : state.selectedPaths.delete(item.path); renderSelected(); });
        row.append(input, createEl("span", { text: item.name, className: "obsidian-chatgpt-bridge-checkbox-label" })); list.appendChild(row);
      });
      if (!list.children.length) list.appendChild(createEl("div", { className: "obsidian-chatgpt-bridge-empty-state", text: "No markdown files or folders were found here." }));
    };
    const browse = async dirpath => {
      const normalized = normalizeVaultPath(dirpath); setStatus(normalized ? `Loading ${normalized}/...` : "Loading vault root...");
      const result = await modal.listObsidianDirectory(normalized);
      if (!result.ok) return setStatus(`Could not open ${normalized || "vault root"}: ${result.error || "unknown error"}`, "warn");
      state.dir = normalized; setStatus("");
      renderItems(result.items.map(item => ({ ...item, path: resolveListedPath(normalized, item) })).sort((a, b) => a.isDirectory !== b.isDirectory ? (a.isDirectory ? -1 : 1) : a.name.localeCompare(b.name)));
    };

    overlay.addEventListener("click", event => { if (event.target === overlay) closeExplorerDialog(); });
    back.addEventListener("click", () => { if (state.dir) browse(parentDirectory(state.dir)); });
    const initial = sortNames([...state.selectedPaths]);
    const dialog = new Promise(resolve => {
      cancel.addEventListener("click", () => { closeExplorerDialog(); resolve(initial); });
      done.addEventListener("click", () => { closeExplorerDialog(); resolve(sortNames([...state.selectedPaths])); });
    });
    await browse(state.dir); renderSelected(); return dialog;
  };
})(window);
