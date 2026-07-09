(function initObsidianBridgePrompts(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const { DEFAULT_FILES } = bridge.constants;

  function setupPrompt(projectName) {
    const safe = String(projectName || "").trim();
    return `Obsidian Bridge is active for project ${safe}.\n\nVault: SpencerLS\nProject folder: Projects/${safe}/\n\nWhen I ask to save, log, or update Obsidian, output only Obsidian bridge blocks.\n\nAn Obsidian bridge block is a code block whose first line is one of:\nobsidian_append@SpencerLS/Projects/${safe}/<Target File>.md\nobsidian_overwrite@SpencerLS/Projects/${safe}/<Target File>.md\nobsidian_update@SpencerLS/Projects/${safe}/<Target File>.md\nobsidian_prepend@SpencerLS/Projects/${safe}/<Target File>.md\nobsidian_create@SpencerLS/Projects/${safe}/<Target File>.md\n\nEverything after that first line is the Markdown content to write.\n\nCommon project files:\n${DEFAULT_FILES.join(", ")}.\n\nRules:\n- Obsidian is the source of truth.\n- Before major overwrites or full updates, rely on current Obsidian context, current file contents from me, or project sources only if I say they are current.\n- Use obsidian_append for routine logs.\n- Use obsidian_overwrite only for whole-file rebuilds.\n- Do not output raw obsidian:// URIs, Advanced URI links, clipboard instructions, or manual copy/paste instructions.\n- Do not explain the workflow unless I ask.`;
  }

  function contextPrompt(projectName) {
    const safe = String(projectName || "").trim();
    return `Current Obsidian context loaded from vault SpencerLS.\n\nProject: ${safe}\nFolder: Projects/${safe}/\n\nUse the following file contents as the current source of truth before suggesting updates. When updating Obsidian, output only Obsidian bridge blocks.`;
  }

  bridge.prompts = {
    setupPrompt,
    contextPrompt
  };
})(window);
