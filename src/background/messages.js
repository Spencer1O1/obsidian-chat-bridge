import { fetchObsidianFile, getSettings, listObsidianDirectory } from "./api.js";

function openObsidianUri(message, sender, sendResponse) {
  const uri = String(message.uri || "").trim();

  if (!uri.startsWith("obsidian://")) {
    sendResponse({ ok: false, error: "Blocked non-Obsidian URI." });
    return true;
  }

  const tabId = sender.tab && sender.tab.id;
  if (!tabId) {
    sendResponse({ ok: false, error: "No active tab found." });
    return true;
  }

  chrome.tabs.update(tabId, { url: uri }, () => {
    const err = chrome.runtime.lastError;
    if (err) sendResponse({ ok: false, error: err.message });
    else sendResponse({ ok: true });
  });

  return true;
}

export function registerMessageHandlers() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message) return;

    if (message.type === "OPEN_OBSIDIAN_URI") {
      return openObsidianUri(message, sender, sendResponse);
    }

    if (message.type === "GET_SETTINGS") {
      getSettings().then(settings => sendResponse(settings));
      return true;
    }

    if (message.type === "FETCH_OBSIDIAN_FILE") {
      fetchObsidianFile(message.filepath).then(sendResponse);
      return true;
    }

    if (message.type === "LIST_OBSIDIAN_DIRECTORY") {
      listObsidianDirectory(message.dirpath).then(sendResponse);
      return true;
    }
  });
}
