import { createEl, EXPLORER_DIALOG_ID, closeExplorerDialog, mountDialogShell } from "./dom";
import { fetchObsidianFile, listObsidianDirectory } from "./runtime";
import { normalizeVaultPath, parentDirectory, resolveListedPath, sortNames } from "./paths";

type ExplorerOptions = { title: string; subtitle: string; startDir: string; selectedPaths: Set<string>; rootLabel: string; doneLabel?: string; showSelectionSummary?: boolean };

export async function showFileExplorerDialog(options: ExplorerOptions) {
  const state = { dir: normalizeVaultPath(options.startDir), selectedPaths: options.selectedPaths, lastItems: [] as { name: string; path: string; isDirectory: boolean }[] };
  const { overlay, panel } = mountDialogShell(EXPLORER_DIALOG_ID, false);
  panel.classList.add("explorer-modal");
  const body = createEl("div", { className: "obsidian-chat-bridge-explorer-body" });
  const toolbar = createEl("div", { className: "obsidian-chat-bridge-browser-toolbar" });
  const back = createEl("button", { text: options.rootLabel, attrs: { type: "button" } });
  const path = createEl("div", { className: "obsidian-chat-bridge-breadcrumb" });
  const status = createEl("div", { className: "obsidian-chat-bridge-modal-status" });
  const listWrap = createEl("div", { className: "obsidian-chat-bridge-explorer-list-wrap" });
  const list = createEl("div", { className: "obsidian-chat-bridge-browser-list" });
  const selectedSection = createEl("section", { className: "obsidian-chat-bridge-file-section" });
  const selectedWrap = createEl("div", { className: "obsidian-chat-bridge-selected-list" });
  const actions = createEl("div", { className: "obsidian-chat-bridge-modal-actions" });
  const cancel = createEl("button", { text: "Cancel", attrs: { type: "button" } });
  const done = createEl("button", { text: options.doneLabel || "Done", attrs: { type: "button" } }); done.className = "obsidian-chat-bridge-primary";
  actions.append(cancel, done); toolbar.append(back, path); listWrap.appendChild(list);
  selectedSection.append(createEl("div", { className: "obsidian-chat-bridge-file-heading", text: "Selected Files" }), selectedWrap);
  body.append(toolbar, status, listWrap);
  if (options.showSelectionSummary) body.append(selectedSection);
  panel.append(createEl("h2", { text: options.title }), createEl("p", { className: "obsidian-chat-bridge-modal-copy", text: options.subtitle }), body, actions);

  const setStatus = (message = "", tone = "") => { status.textContent = message; tone ? status.setAttribute("data-tone", tone) : status.removeAttribute("data-tone"); };
  const renderSelected = () => { if (!options.showSelectionSummary) return; selectedWrap.innerHTML = ""; const paths = sortNames([...state.selectedPaths]); if (!paths.length) return selectedWrap.appendChild(createEl("div", { className: "obsidian-chat-bridge-empty-state", text: "No files selected yet." })); paths.forEach(item => { const row = createEl("div", { className: "obsidian-chat-bridge-selected-item" }); const remove = createEl("button", { text: "Remove", className: "obsidian-chat-bridge-secondary-action", attrs: { type: "button" } }); remove.addEventListener("click", () => { state.selectedPaths.delete(item); renderSelected(); renderItems(state.lastItems); }); row.append(createEl("div", { className: "obsidian-chat-bridge-selected-path", text: item }), remove); selectedWrap.appendChild(row); }); };
  const renderItems = (items: typeof state.lastItems) => { state.lastItems = items; list.innerHTML = ""; path.textContent = state.dir ? `${state.dir}/` : "/"; back.textContent = state.dir ? "< Back" : options.rootLabel; back.disabled = !state.dir; if (!items.length) return list.appendChild(createEl("div", { className: "obsidian-chat-bridge-empty-state", text: "This folder is empty." })); items.forEach(item => { if (item.isDirectory) { const button = createEl("button", { className: "obsidian-chat-bridge-browser-entry", attrs: { type: "button" } }); button.addEventListener("click", () => browse(item.path)); button.append(createEl("span", { className: "obsidian-chat-bridge-browser-name", text: item.name }), createEl("span", { className: "obsidian-chat-bridge-browser-kind", text: "Folder >" })); const row = createEl("div", { className: "obsidian-chat-bridge-browser-row" }); row.appendChild(button); return list.appendChild(row); } if (!/\.md$/i.test(item.name)) return; const row = createEl("label", { className: "obsidian-chat-bridge-browser-file" }); const input = createEl("input", { attrs: { type: "checkbox", value: item.path } }); input.className = "obsidian-chat-bridge-checkbox-input"; input.checked = state.selectedPaths.has(item.path); input.addEventListener("change", () => { input.checked ? state.selectedPaths.add(item.path) : state.selectedPaths.delete(item.path); renderSelected(); }); row.append(input, createEl("span", { text: item.name, className: "obsidian-chat-bridge-checkbox-label" })); list.appendChild(row); }); if (!list.children.length) list.appendChild(createEl("div", { className: "obsidian-chat-bridge-empty-state", text: "No markdown files or folders were found here." })); };
  const browse = async (dirpath: string) => { const normalized = normalizeVaultPath(dirpath); setStatus(normalized ? `Loading ${normalized}/...` : "Loading vault root..."); const result = await listObsidianDirectory(normalized); if (!result.ok) return setStatus(`Could not open ${normalized || "vault root"}: ${result.error || "unknown error"}`, "warn"); state.dir = normalized; setStatus(""); renderItems(result.items.map(item => ({ ...item, path: resolveListedPath(normalized, item) })).sort((a, b) => a.isDirectory !== b.isDirectory ? (a.isDirectory ? -1 : 1) : a.name.localeCompare(b.name))); };
  overlay.addEventListener("click", event => { if (event.target === overlay) closeExplorerDialog(); }); back.addEventListener("click", () => { if (state.dir) browse(parentDirectory(state.dir)); });
  const initial = sortNames([...state.selectedPaths]);
  const dialog = new Promise<string[]>(resolve => { cancel.addEventListener("click", () => { closeExplorerDialog(); resolve(initial); }); done.addEventListener("click", () => { closeExplorerDialog(); resolve(sortNames([...state.selectedPaths])); }); });
  await browse(state.dir); renderSelected(); return dialog;
}

export async function loadFiles(paths: string[]) {
  const sections: string[] = [];
  const missing: string[] = [];
  for (const filepath of paths) {
    const result = await fetchObsidianFile(filepath);
    if (result.ok) sections.push(`--- ${filepath} ---\n${result.content || ""}`.trim());
    else missing.push(`${filepath}: ${result.error || "not found"}`);
  }
  return { sections, missing };
}
