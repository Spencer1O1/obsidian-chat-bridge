(function initObsidianBridgeBlocksButtons(global) {
  const bridge = global.ObsidianChatBridge = global.ObsidianChatBridge || {};
  const blocks = bridge.bridgeBlocksInternals = bridge.bridgeBlocksInternals || {};

  function flash(button, text) {
    const old = button.textContent;
    button.textContent = text;
    setTimeout(() => { button.textContent = old; }, 1400);
  }

  function uriUsesClipboard(uri) {
    try { return new URL(uri).searchParams.get("clipboard") === "true"; }
    catch { return /[?&]clipboard=true(?:&|$)/.test(uri); }
  }

  function fetchObsidianFile(filepath) {
    return new Promise(resolve => chrome.runtime.sendMessage({ type: "FETCH_OBSIDIAN_FILE", filepath }, response => resolve(response || { ok: false })));
  }

  function resolveWriteMode(action, fileExists) {
    if (!fileExists) return "overwrite";
    switch (String(action || "").toLowerCase()) {
      case "append": return "append";
      case "prepend": return "prepend";
      default: return "overwrite";
    }
  }

  function labelForAction(action) {
    switch (String(action || "").toLowerCase()) {
      case "append": return "Append to Obsidian";
      case "prepend": return "Prepend to Obsidian";
      case "overwrite": return "Overwrite in Obsidian";
      case "create": return "Create in Obsidian";
      default: return "Update Obsidian";
    }
  }

  function makeButton(uri, label = "Open in Obsidian", options = {}) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "obsidian-chat-bridge-button"; button.textContent = label; button.title = uri;
    button.addEventListener("click", async event => {
      event.preventDefault(); event.stopPropagation();
      const copyText = options.copyText != null ? options.copyText : options.copySourceEl && uriUsesClipboard(uri) ? blocks.getCodeText(options.copySourceEl) : null;
      if (copyText != null && !await bridge.chatUi.copyText(copyText)) return flash(button, "Clipboard blocked");
      bridge.chatUi.openObsidian(uri);
    });
    return button;
  }

  function makeBridgeBlockButton(custom) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "obsidian-chat-bridge-button"; button.textContent = labelForAction(custom.action); button.title = `${custom.vault}/${custom.filepath}`;
    button.addEventListener("click", async event => {
      event.preventDefault(); event.stopPropagation();
      if (!await bridge.chatUi.copyText(custom.content)) return flash(button, "Clipboard blocked");
      const result = await fetchObsidianFile(custom.filepath);
      bridge.chatUi.openObsidian(blocks.buildAdvancedUri({ vault: custom.vault, filepath: custom.filepath, mode: resolveWriteMode(custom.action, result.ok) }));
    });
    return button;
  }

  Object.assign(blocks, { makeBridgeBlockButton, makeButton });
})(window);
