import { fetchObsidianFile } from "./files";
import { getSettings } from "./settings";
import { listObsidianDirectory } from "./directories";
import { createObsidianProject } from "./projects";
import { writeObsidianFile } from "./writes";
import type { RuntimeMessage } from "../shared/types";

function openExtensionPopup(sendResponse: (response: unknown) => void) {
  if (!chrome.action?.openPopup) return sendResponse({ ok: false, error: "Popup opening is not supported in this browser." }), true;
  chrome.action.openPopup(() => sendResponse(chrome.runtime.lastError ? { ok: false, error: chrome.runtime.lastError.message } : { ok: true }));
  return true;
}

export function registerMessageHandlers() {
  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    if (!message) return;
    if (message.type === "GET_SETTINGS") return void getSettings().then(sendResponse), true;
    if (message.type === "OPEN_EXTENSION_POPUP") return openExtensionPopup(sendResponse);
    if (message.type === "FETCH_OBSIDIAN_FILE") return void fetchObsidianFile(message.filepath).then(sendResponse), true;
    if (message.type === "LIST_OBSIDIAN_DIRECTORY") return void listObsidianDirectory(message.dirpath).then(sendResponse), true;
    if (message.type === "CREATE_OBSIDIAN_PROJECT") return void createObsidianProject(message.projectRoot, message.projectName).then(sendResponse), true;
    if (message.type === "WRITE_OBSIDIAN_FILE") return void writeObsidianFile(message.filepath, message.action, message.content).then(sendResponse), true;
  });
}
