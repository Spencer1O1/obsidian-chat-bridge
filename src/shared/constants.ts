export const OBSIDIAN_RE = /obsidian:\/\/[^\s<>)"'`]+/g;
export const PROCESSED_ATTR = "data-obsidian-chatgpt-bridge";
export const BAR_CLASS = "obsidian-chatgpt-bridge-bar";
export const CUSTOM_PREFIX_RE = /^obsidian_(update|create|append|prepend|overwrite)@(.+)$/i;
export const FLOATING_CONTAINER_ID = "obsidian-chatgpt-bridge-floating";
export const START_BUTTON_ID = "obsidian-chatgpt-bridge-start-bridge";
export const LOAD_BUTTON_ID = "obsidian-chatgpt-bridge-load-context";
export const DIALOG_ID = "obsidian-chatgpt-bridge-dialog";
export const DEFAULT_FILES = [
  "Hub.md",
  "Architecture.md",
  "Decisions.md",
  "Open Questions.md",
  "Tasks.md",
  "Bugs.md",
  "Research.md",
  "Implementation Log.md"
] as const;
