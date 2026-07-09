(function initObsidianBridgePrompts(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const { DEFAULT_FILES } = bridge.constants;

  function normalizeSettings(options = {}) {
    const vaultName = String(options.vaultName || "Vault").trim() || "Vault";
    const projectName = String(options.projectName || "").trim();
    const projectRoot = String(options.projectRoot || "Projects").trim().replace(/^\/+|\/+$/g, "") || "Projects";
    const projectFolder = projectName ? `${projectRoot}/${projectName}` : projectRoot;
    return {
      vaultName,
      projectName,
      projectRoot,
      projectFolder
    };
  }

  function setupPrompt(options = {}) {
    const { vaultName, projectName, projectFolder } = normalizeSettings(options);
    const projectHeader = projectName
      ? `Obsidian Bridge is active for project ${projectName}.\n\nVault: ${vaultName}\nDefault project folder: ${projectFolder}/`
      : `Obsidian Bridge is active.\n\nVault: ${vaultName}\nDefault project folder: none for this session`;
    const blockExamples = projectName
      ? [
          `obsidian_append@${vaultName}/${projectFolder}/<Target File>.md`,
          `obsidian_overwrite@${vaultName}/${projectFolder}/<Target File>.md`,
          `obsidian_update@${vaultName}/${projectFolder}/<Target File>.md`,
          `obsidian_prepend@${vaultName}/${projectFolder}/<Target File>.md`
        ]
      : [
          `obsidian_append@${vaultName}/<Vault Relative Path>.md`,
          `obsidian_overwrite@${vaultName}/<Vault Relative Path>.md`,
          `obsidian_update@${vaultName}/<Vault Relative Path>.md`,
          `obsidian_prepend@${vaultName}/<Vault Relative Path>.md`
        ];
    const defaultRule = projectName
      ? `- Default to writing inside ${projectFolder}/ for project work.`
      : "- There is no default project folder for this session, so use explicit vault-relative target paths by default.";

    return `${projectHeader}\n\nWhen I ask to save, log, or update Obsidian, output only Obsidian bridge blocks.\n\nAn Obsidian bridge block is a code block whose first line is one of:\n${blockExamples.join("\n")}\n\nEverything after that first line is the Markdown content to write.\n\nCommon project files:\n${DEFAULT_FILES.join(", ")}.\n\nRules:\n- Obsidian is the source of truth.\n${defaultRule}\n- If I clearly want another vault path, use that explicit vault-relative path in the bridge block instead.\n- Bridge blocks must always include the vault name and the full vault-relative target path.\n- All bridge blocks upsert: if the target file does not exist, the extension creates it; if it exists, the block action is applied normally.\n- Before major overwrites or full updates, rely on current Obsidian context, current file contents from me, or project sources only if I say they are current.\n- Use obsidian_append for routine logs.\n- Use obsidian_overwrite only for whole-file rebuilds.\n- Do not output raw obsidian:// URIs, Advanced URI links, clipboard instructions, or manual copy/paste instructions.\n- Do not explain the workflow unless I ask.`;
  }

  function isProjectPath(path, projectFolder) {
    const normalized = String(path || "").trim().replace(/\\/g, "/");
    return normalized === projectFolder || normalized.startsWith(`${projectFolder}/`);
  }

  function formatFileList(label, paths) {
    if (!paths.length) return `${label}:\n- none`;
    return `${label}:\n- ${paths.join("\n- ")}`;
  }

  function contextPrompt(options = {}) {
    const { vaultName, projectName, projectFolder } = normalizeSettings(options);
    const selectedPaths = Array.isArray(options.selectedPaths)
      ? options.selectedPaths.map(path => String(path || "").trim()).filter(Boolean)
      : [];
    const selectionLine = projectName
      ? [
          formatFileList("Project files", selectedPaths.filter(path => isProjectPath(path, projectFolder))),
          formatFileList("Additional files", selectedPaths.filter(path => !isProjectPath(path, projectFolder)))
        ].join("\n")
      : formatFileList("Selected files", selectedPaths);
    const projectLine = projectName
      ? `Project: ${projectName}\nDefault folder: ${projectFolder}/`
      : "Project: none\nDefault folder: none for this session";
    const defaultRule = projectName
      ? "Default to the project folder for project work, but use another explicit vault-relative path if I clearly ask for it."
      : "There is no default project folder for this session, so use explicit vault-relative paths unless I clearly establish a working folder.";
    return `Current Obsidian context loaded from vault ${vaultName}.\n\n${projectLine}\n${selectionLine}\n\nUse the following file contents as the current source of truth before suggesting updates. When updating Obsidian, output only Obsidian bridge blocks. ${defaultRule}`;
  }

  bridge.prompts = {
    setupPrompt,
    contextPrompt
  };
})(window);
