export type BridgeSettings = {
  apiBase: string;
  apiKey: string;
  vaultName: string;
  defaultProjectRoot: string;
};

export type ObsidianResult = { ok: false; error: string } | { ok: true; base?: string; url?: string; content?: string };
export type DirectoryItem = { name: string; path: string; isDirectory: boolean };
export type DirectoryResult = { ok: false; error: string } | { ok: true; items: DirectoryItem[]; base?: string; url?: string };
export type ProjectResult = { ok: false; error: string } | { ok: true; projectName: string; projectPath: string; createdFile: string };
export type ActiveProjectContext = { projectName: string; projectRoot: string } | null;

export type RuntimeMessage =
  | { type: "GET_SETTINGS" }
  | { type: "OPEN_EXTENSION_POPUP" }
  | { type: "FETCH_OBSIDIAN_FILE"; filepath: string }
  | { type: "LIST_OBSIDIAN_DIRECTORY"; dirpath: string }
  | { type: "CREATE_OBSIDIAN_PROJECT"; projectRoot: string; projectName: string }
  | { type: "WRITE_OBSIDIAN_FILE"; filepath: string; action: string; content: string }
  | { type: "OPEN_OBSIDIAN_URI"; uri: string };
