(function initObsidianBridgeConstants(global) {
  const bridge = global.ObsidianChatBridge = global.ObsidianChatBridge || {};

  bridge.constants = {
    OBSIDIAN_RE: /obsidian:\/\/[^\s<>)"'`]+/g,
    PROCESSED_ATTR: "data-obsidian-chat-bridge",
    BAR_CLASS: "obsidian-chat-bridge-bar",
    CUSTOM_PREFIX_RE: /^obsidian_(update|create|append|prepend|overwrite)@(.+)$/i,
    FLOATING_CONTAINER_ID: "obsidian-chat-bridge-floating",
    START_BUTTON_ID: "obsidian-chat-bridge-start-bridge",
    LOAD_BUTTON_ID: "obsidian-chat-bridge-load-context",
    DIALOG_ID: "obsidian-chat-bridge-dialog",
    DEFAULT_FILES: [
      "Hub.md",
      "Architecture.md",
      "Decisions.md",
      "Open Questions.md",
      "Tasks.md",
      "Bugs.md",
      "Research.md",
    ]
  };
})(window);
