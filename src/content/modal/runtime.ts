import type { BridgeSettings, DirectoryResult, ObsidianResult, ProjectResult, RuntimeMessage } from "../../shared/types";

function sendMessage<T>(message: RuntimeMessage): Promise<T> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, response => resolve(response));
  });
}

export const getSettings = () => sendMessage<BridgeSettings>({ type: "GET_SETTINGS" });
export const fetchObsidianFile = (filepath: string) => sendMessage<ObsidianResult>({ type: "FETCH_OBSIDIAN_FILE", filepath });
export const listObsidianDirectory = (dirpath: string) => sendMessage<DirectoryResult>({ type: "LIST_OBSIDIAN_DIRECTORY", dirpath });
export const openExtensionPopup = () => sendMessage<{ ok: boolean; error?: string }>({ type: "OPEN_EXTENSION_POPUP" });
export const createObsidianProject = (projectRoot: string, projectName: string) => sendMessage<ProjectResult>({ type: "CREATE_OBSIDIAN_PROJECT", projectRoot, projectName });
