(function initObsidianBridgeConstants(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};

  bridge.constants = {
    OBSIDIAN_RE: /obsidian:\/\/[^\s<>)"'`]+/g,
    PROCESSED_ATTR: "data-obsidian-chatgpt-bridge",
    BAR_CLASS: "obsidian-chatgpt-bridge-bar",
    CUSTOM_PREFIX_RE: /^obsidian_(update|create|append|prepend|overwrite)@(.+)$/i,
    FLOATING_CONTAINER_ID: "obsidian-chatgpt-bridge-floating",
    START_BUTTON_ID: "obsidian-chatgpt-bridge-start-bridge",
    LOAD_BUTTON_ID: "obsidian-chatgpt-bridge-load-context",
    DIALOG_ID: "obsidian-chatgpt-bridge-dialog",
    DEFAULT_FILES: [
      "Hub.md",
      "Architecture.md",
      "Decisions.md",
      "Open Questions.md",
      "Tasks.md",
      "Bugs.md",
      "Research.md",
      "Implementation Log.md"
    ]
  };
})(window);
