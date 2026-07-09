(function initObsidianBridgeModalDom(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const modal = bridge.modalInternals = bridge.modalInternals || {};
  const { DIALOG_ID } = bridge.constants;
  const EXPLORER_DIALOG_ID = `${DIALOG_ID}-explorer`;

  function createEl(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.text) el.textContent = options.text;
    if (options.html) el.innerHTML = options.html;
    Object.entries(options.attrs || {}).forEach(([key, value]) => {
      if (value != null) el.setAttribute(key, value);
    });
    return el;
  }

  function closeDialog() {
    document.getElementById(DIALOG_ID)?.remove();
    document.getElementById(EXPLORER_DIALOG_ID)?.remove();
  }

  function buildModalStyle() {
    const link = createEl("link", {
      attrs: { rel: "stylesheet", href: chrome.runtime.getURL("styles.css") }
    });
    link.addEventListener("error", event => {
      console.warn("Obsidian ChatGPT Bridge could not load modal stylesheet.", event);
    });
    return link;
  }

  function mountDialogShell(dialogId, replaceAll = false) {
    if (replaceAll) closeDialog();
    else document.getElementById(dialogId)?.remove();
    const host = createEl("div", { attrs: { id: dialogId } });
    const shadowRoot = host.attachShadow({ mode: "open" });
    const overlay = createEl("div", {
      className: "obsidian-chatgpt-bridge-dialog",
      attrs: { role: "dialog", "aria-modal": "true" }
    });
    const panel = createEl("div", { className: "obsidian-chatgpt-bridge-modal" });
    overlay.appendChild(panel);
    shadowRoot.append(buildModalStyle(), overlay);
    document.body.appendChild(host);
    return { overlay, panel };
  }

  modal.DIALOG_ID = DIALOG_ID;
  modal.EXPLORER_DIALOG_ID = EXPLORER_DIALOG_ID;
  modal.createEl = createEl;
  modal.closeDialog = closeDialog;
  modal.closeExplorerDialog = () => document.getElementById(EXPLORER_DIALOG_ID)?.remove();
  modal.mountDialogShell = mountDialogShell;
})(window);
