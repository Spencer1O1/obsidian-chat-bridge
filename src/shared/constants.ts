export const OBSIDIAN_RE = /obsidian:\/\/[^\s<>)"'`]+/g;
export const PROCESSED_ATTR = "data-obsidian-chat-bridge";
export const BAR_CLASS = "obsidian-chat-bridge-bar";
export const CUSTOM_PREFIX_RE = /^obsidian_(create|append|prepend|overwrite)@(.+)$/i;
export const FLOATING_CONTAINER_ID = "obsidian-chat-bridge-floating";
export const START_BUTTON_ID = "obsidian-chat-bridge-start-bridge";
export const LOAD_BUTTON_ID = "obsidian-chat-bridge-load-context";
export const DIALOG_ID = "obsidian-chat-bridge-dialog";
export const DEFAULT_FILES = [
  "Hub.md",
  "Architecture.md",
  "Decisions.md",
  "Open Questions.md",
  "Tasks.md",
  "Bugs.md",
  "Research.md",
] as const;
