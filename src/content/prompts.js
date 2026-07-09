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
    return `Obsidian Bridge is active for project ${projectName}.\n\nVault: ${vaultName}\nDefault project folder: ${projectFolder}/\n\nWhen I ask to save, log, or update Obsidian, output only Obsidian bridge blocks.\n\nAn Obsidian bridge block is a code block whose first line is one of:\nobsidian_append@${vaultName}/${projectFolder}/<Target File>.md\nobsidian_overwrite@${vaultName}/${projectFolder}/<Target File>.md\nobsidian_update@${vaultName}/${projectFolder}/<Target File>.md\nobsidian_prepend@${vaultName}/${projectFolder}/<Target File>.md\nobsidian_create@${vaultName}/${projectFolder}/<Target File>.md\n\nEverything after that first line is the Markdown content to write.\n\nCommon project files:\n${DEFAULT_FILES.join(", ")}.\n\nRules:\n- Obsidian is the source of truth.\n- Default to writing inside ${projectFolder}/ for project work.\n- If I clearly want another vault path, use that explicit vault-relative path in the bridge block instead.\n- Bridge blocks must always include the vault name and the full vault-relative target path.\n- Before major overwrites or full updates, rely on current Obsidian context, current file contents from me, or project sources only if I say they are current.\n- Use obsidian_append for routine logs.\n- Use obsidian_overwrite only for whole-file rebuilds.\n- Do not output raw obsidian:// URIs, Advanced URI links, clipboard instructions, or manual copy/paste instructions.\n- Do not explain the workflow unless I ask.`;
  }

  function contextPrompt(options = {}) {
    const { vaultName, projectName, projectFolder } = normalizeSettings(options);
    const selectedPaths = Array.isArray(options.selectedPaths)
      ? options.selectedPaths.map(path => String(path || "").trim()).filter(Boolean)
      : [];
    const selectionLine = selectedPaths.length
      ? `Loaded files:\n- ${selectedPaths.join("\n- ")}`
      : "Loaded files:\n- none";
    return `Current Obsidian context loaded from vault ${vaultName}.\n\nProject: ${projectName}\nDefault folder: ${projectFolder}/\n${selectionLine}\n\nUse the following file contents as the current source of truth before suggesting updates. When updating Obsidian, output only Obsidian bridge blocks. Default to the project folder for project work, but use another explicit vault-relative path if I clearly ask for it.`;
  }

  bridge.prompts = {
    setupPrompt,
    contextPrompt
  };
})(window);
