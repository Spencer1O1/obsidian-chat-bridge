import { DEFAULT_FILES } from "../shared/constants";

type PromptOptions = { vaultName?: string; projectName?: string; projectRoot?: string; selectedPaths?: string[] };

function normalizeSettings(options: PromptOptions = {}) {
  const vaultName = String(options.vaultName || "Vault").trim() || "Vault";
  const projectName = String(options.projectName || "").trim();
  const projectRoot = String(options.projectRoot || "Projects").trim().replace(/^\/+|\/+$/g, "") || "Projects";
  return { vaultName, projectName, projectRoot, projectFolder: projectName ? `${projectRoot}/${projectName}` : projectRoot };
}

function formatFileList(label: string, paths: string[]) {
  return `${label}:\n- ${paths.length ? paths.join("\n- ") : "none"}`;
}

function isProjectPath(path: string, projectFolder: string) {
  const normalized = String(path || "").trim().replace(/\\/g, "/");
  return normalized === projectFolder || normalized.startsWith(`${projectFolder}/`);
}

export function setupPrompt(options: PromptOptions = {}) {
  const { vaultName, projectName, projectFolder } = normalizeSettings(options);
  const header = projectName
    ? `Obsidian Chat Bridge is active for project ${projectName}.`
    : "Obsidian Chat Bridge is active.";
  const folderLine = projectName
    ? `Default project folder: ${projectFolder}/`
    : "Default project folder: none for this session";
  const examples = projectName
    ? `${vaultName}/${projectFolder}/<Target File>.md`
    : `${vaultName}/<Vault Relative Path>.md`;
  const defaultRule = projectName
    ? `- Default to writing inside ${projectFolder}/ for project work.`
    : "- There is no default project folder for this session, so use explicit vault-relative target paths by default.";
  const wikilinkRule = projectName
    ? `- When using wikilinks inside Markdown written to ${projectFolder}/, use vault-relative paths with display aliases, e.g. [[${projectFolder}/Tasks|Tasks]], not bare leaf names like [[Tasks]].`
    : "- When using wikilinks inside note Markdown, prefer full vault-relative paths with display aliases when similarly named notes may exist elsewhere in the vault.";

  const blockExamples = [
    `obsidian_overwrite@${examples}`,
    `obsidian_create@${examples}`,
    `obsidian_append@${examples}`,
    `obsidian_prepend@${examples}`
  ].join("\n");

  const rules = [
    "- Obsidian is the source of truth.",
    defaultRule,
    "- If I clearly want another vault path, use that explicit vault-relative path in the bridge block instead.",
    "- Bridge blocks must always include the vault name and the full vault-relative target path.",
    wikilinkRule,
    "- Supported bridge block actions:",
    "  - obsidian_overwrite — replace the entire file body. Use for structured notes and any section edit.",
    "  - obsidian_create — write a new file at the target path. Prefer when the file does not exist yet, but any action upserts a missing file.",
    "  - obsidian_append — add content to the END of the file only.",
    "  - obsidian_prepend — add content to the START of the file only.",
    "- Before overwriting an existing file to make changes within it, use the current Obsidian context as the source of truth and preserve all existing content by default. Merge requested change into the appropriate location and verify that no unrelated content was lost.",
    "- Do not explain the workflow unless I ask."
  ].join("\n");

  return [
    header,
    "",
    `Vault: ${vaultName}`,
    folderLine,
    "",
    "When I ask to save, log, or update Obsidian, output only Obsidian bridge blocks.",
    "",
    "An Obsidian bridge block is a code block whose first line is one of:",
    blockExamples,
    "",
    "Everything after that first line is the Markdown content to write.",
    "",
    "You do not need to include a title in the note, since obsidian automatically displays a title based on the file name.",
    "",
    `Common project files: ${DEFAULT_FILES.join(", ")}.`,
    "",
    "Rules:",
    rules
  ].join("\n");
}

export function contextPrompt(options: PromptOptions = {}) {
  const { vaultName, projectName, projectFolder } = normalizeSettings(options);
  const selectedPaths = (options.selectedPaths || [])
    .map(path => String(path || "").trim())
    .filter(Boolean);

  const projectLine = projectName
    ? [`Project: ${projectName}`, `Default folder: ${projectFolder}/`].join("\n")
    : ["Project: none", "Default folder: none for this session"].join("\n");

  const selectionLine = projectName
    ? [
        formatFileList("Project files", selectedPaths.filter(path => isProjectPath(path, projectFolder))),
        formatFileList("Additional files", selectedPaths.filter(path => !isProjectPath(path, projectFolder)))
      ].join("\n")
    : formatFileList("Selected files", selectedPaths);

  const defaultRule = projectName
    ? "Default to the project folder for project work, but use another explicit vault-relative path if I clearly ask for it."
    : "There is no default project folder for this session, so use explicit vault-relative paths unless I clearly establish a working folder.";

  const instructions = [
    "Use the following file contents as the current source of truth before suggesting updates.",
    "When updating Obsidian, output only Obsidian bridge blocks.",
    "Append and prepend only add to the start or end of a file; they do not edit middle sections.",
    defaultRule
  ].join(" ");

  return [
    `Current Obsidian context loaded from vault ${vaultName}.`,
    "",
    projectLine,
    selectionLine,
    "",
    instructions
  ].join("\n");
}
