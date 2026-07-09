import { createEl, DIALOG_ID, closeDialog, mountDialogShell } from "./dom";
import { createObsidianProject, listObsidianDirectory } from "./runtime";
import { normalizeVaultPath, sortNames } from "./paths";
import type { BridgeSettings } from "../../shared/types";

export async function showStartDialog(settings: BridgeSettings, currentProject: string) {
  const projectRoot = normalizeVaultPath(settings.defaultProjectRoot || "Projects") || "Projects";
  const state = { project: currentProject || "", projects: [] as string[] };
  const { overlay, panel } = mountDialogShell(DIALOG_ID, true);
  const form = createEl("form"), status = createEl("div", { className: "obsidian-chat-bridge-modal-status" });
  const select = createEl("select", { className: "obsidian-chat-bridge-select", attrs: { "aria-label": "Default project" } });
  const createInput = createEl("input", { attrs: { type: "text", placeholder: "ProjectName", "aria-label": "New project name" } });
  const createButton = createEl("button", { text: "Create Project", className: "obsidian-chat-bridge-picker-button", attrs: { type: "button" } });
  const setStatus = (msg = "", tone = "") => { status.textContent = msg; tone ? status.setAttribute("data-tone", tone) : status.removeAttribute("data-tone"); };
  const render = (projects: string[]) => { state.projects = sortNames([...new Set(projects.filter(Boolean))]); select.innerHTML = ""; select.appendChild(createEl("option", { text: "No default project", attrs: { value: "" } })); state.projects.forEach(project => select.appendChild(createEl("option", { text: project, attrs: { value: project } }))); if (!state.projects.includes(state.project)) state.project = ""; select.value = state.project; };
  const loadProjectList = async () => { setStatus(`Loading projects from ${projectRoot}/...`); const result = await listObsidianDirectory(projectRoot); if (!result.ok) return render([]), setStatus(`No project root found at ${projectRoot}/. Create a new project or continue without a default project.`, "warn"); render(result.items.filter(item => item.isDirectory).map(item => item.name)); setStatus(state.projects.length ? "" : `No project folders found under ${projectRoot}/. Create a new project or continue without a default project.`); if (!state.project && state.projects.length === 1) state.project = select.value = state.projects[0]; };
  select.addEventListener("change", () => { state.project = select.value.trim(); setStatus(""); });
  createButton.addEventListener("click", async () => { const projectName = createInput.value.trim(); if (!projectName) return setStatus("Enter a project name first.", "warn"), createInput.focus(); setStatus(`Creating ${projectRoot}/${projectName}/...`); createButton.disabled = true; const result = await createObsidianProject(projectRoot, projectName); createButton.disabled = false; if (!result.ok) return setStatus(`Could not create project: ${result.error || "unknown error"}`, "warn"); createInput.value = ""; state.project = result.projectName; await loadProjectList(); select.value = result.projectName; setStatus(`Created ${result.projectPath}/ and selected it as the default project.`); });

  const createSection = createEl("section", { className: "obsidian-chat-bridge-file-section" });
  const row = createEl("div", { className: "obsidian-chat-bridge-inline-actions" }); row.append(createInput, createButton);
  createSection.append(createEl("div", { className: "obsidian-chat-bridge-file-heading", text: "Create New Project" }), createEl("p", { className: "obsidian-chat-bridge-modal-copy", text: `Creates ${projectRoot}/<Project Name>/Hub.md and selects it as the default project.` }), row);
  const actions = createEl("div", { className: "obsidian-chat-bridge-modal-actions" }); const cancel = createEl("button", { text: "Cancel", attrs: { type: "button" } }); const start = createEl("button", { text: "Start", attrs: { type: "submit" } }); start.className = "obsidian-chat-bridge-primary"; actions.append(cancel, start);
  form.append(createEl("label", { text: "Default project for this session", className: "obsidian-chat-bridge-field-label" }), select, createSection, status, actions);
  panel.append(createEl("h2", { text: "Start Obsidian Chat Bridge" }), createEl("p", { className: "obsidian-chat-bridge-modal-copy", text: "Click Start to continue immediately, or optionally set a default project for this session." }), form);
  cancel.addEventListener("click", () => closeDialog()); overlay.addEventListener("click", event => { if (event.target === overlay) closeDialog(); }); window.addEventListener("keydown", function onEscape(event) { if (event.key === "Escape") { window.removeEventListener("keydown", onEscape); closeDialog(); } }, { once: true });
  const dialog = new Promise<{ project: string; projectRoot: string }>(resolve => form.addEventListener("submit", event => { event.preventDefault(); closeDialog(); resolve({ project: state.project, projectRoot }); }));
  if (!String(settings.apiKey || "").trim()) setStatus("Set the Obsidian Local REST API key in the extension popup to enable project discovery.", "warn"); else await loadProjectList();
  select.focus();
  return dialog;
}
