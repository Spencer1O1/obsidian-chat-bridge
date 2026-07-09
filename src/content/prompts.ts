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
  const header = projectName ? `Obsidian Bridge is active for project ${projectName}.` : "Obsidian Bridge is active.";
  const folderLine = projectName ? `Default project folder: ${projectFolder}/` : "Default project folder: none for this session";
  const examples = projectName ? `${vaultName}/${projectFolder}/<Target File>.md` : `${vaultName}/<Vault Relative Path>.md`;
  const defaultRule = projectName ? `- Default to writing inside ${projectFolder}/ for project work.` : "- There is no default project folder for this session, so use explicit vault-relative target paths by default.";
  return `${header}\n\nVault: ${vaultName}\n${folderLine}\n\nWhen I ask to save, log, or update Obsidian, output only Obsidian bridge blocks.\n\nAn Obsidian bridge block is a code block whose first line is one of:\nobsidian_append@${examples}\nobsidian_overwrite@${examples}\nobsidian_update@${examples}\nobsidian_prepend@${examples}\n\nEverything after that first line is the Markdown content to write.\n\nCommon project files:\n${DEFAULT_FILES.join(", ")}.\n\nRules:\n- Obsidian is the source of truth.\n${defaultRule}\n- If I clearly want another vault path, use that explicit vault-relative path in the bridge block instead.\n- Bridge blocks must always include the vault name and the full vault-relative target path.\n- All bridge blocks upsert: if the target file does not exist, the extension creates it; if it exists, the block action is applied normally.\n- Before major overwrites or full updates, rely on current Obsidian context, current file contents from me, or project sources only if I say they are current.\n- Use obsidian_append for routine logs.\n- Use obsidian_overwrite only for whole-file rebuilds.\n- Do not output raw obsidian:// URIs, Advanced URI links, clipboard instructions, or manual copy/paste instructions.\n- Do not explain the workflow unless I ask.`;
}

export function contextPrompt(options: PromptOptions = {}) {
  const { vaultName, projectName, projectFolder, projectRoot } = normalizeSettings(options);
  const selectedPaths = (options.selectedPaths || []).map(path => String(path || "").trim()).filter(Boolean);
  const selectionLine = projectName
    ? [formatFileList("Project files", selectedPaths.filter(path => isProjectPath(path, projectFolder))), formatFileList("Additional files", selectedPaths.filter(path => !isProjectPath(path, projectFolder)))].join("\n")
    : formatFileList("Selected files", selectedPaths);
  const projectLine = projectName ? `Project: ${projectName}\nDefault folder: ${projectFolder}/` : "Project: none\nDefault folder: none for this session";
  const defaultRule = projectName ? "Default to the project folder for project work, but use another explicit vault-relative path if I clearly ask for it." : "There is no default project folder for this session, so use explicit vault-relative paths unless I clearly establish a working folder.";
  return `Current Obsidian context loaded from vault ${vaultName}.\n\n${projectLine}\n${selectionLine}\n\nUse the following file contents as the current source of truth before suggesting updates. When updating Obsidian, output only Obsidian bridge blocks. ${defaultRule}`;
}
