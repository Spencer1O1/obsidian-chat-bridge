(function initObsidianBridgeChatgptUi(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};

  async function copyText(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Could not write clipboard:", err);
      return false;
    }
  }

  function openObsidian(uri) {
    chrome.runtime.sendMessage({ type: "OPEN_OBSIDIAN_URI", uri }, response => {
      if (!response || !response.ok) {
        console.warn("Obsidian ChatGPT Bridge failed:", response && response.error);
        window.location.href = uri;
      }
    });
  }

  function findComposer() {
    return document.querySelector("#prompt-textarea[contenteditable='true']")
      || document.querySelector("[contenteditable='true'][data-virtualkeyboard]")
      || document.querySelector("main form textarea")
      || document.querySelector("textarea");
  }

  function setNativeValue(el, value) {
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const setter = Object.getOwnPropertyDescriptor(el.__proto__, "value")?.set;
      setter ? setter.call(el, value) : (el.value = value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }

    el.focus();
    try {
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, value);
    } catch {
      el.textContent = value;
    }
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    return true;
  }

  function findSendButton() {
    const candidates = [...document.querySelectorAll("button")].filter(btn => !btn.disabled);
    return candidates.find(btn => /send/i.test(btn.getAttribute("aria-label") || btn.textContent || ""))
      || document.querySelector("button[data-testid='send-button']")
      || document.querySelector("button[aria-label='Send prompt']");
  }

  function insertAndSend(prompt) {
    const composer = findComposer();
    if (!composer) return false;
    setNativeValue(composer, prompt);
    setTimeout(() => {
      const send = findSendButton();
      if (send && !send.disabled) send.click();
    }, 200);
    return true;
  }

  function hasConversationMessages() {
    const messageSelectors = [
      '[data-message-author-role="user"]',
      '[data-message-author-role="assistant"]',
      '[data-testid^="conversation-turn"]',
      'article[data-testid^="conversation-turn"]'
    ];
    return messageSelectors.some(selector => document.querySelector(selector));
  }

  function isNewChatScreen() {
    if (!findComposer()) return false;
    if (hasConversationMessages()) return false;
    if (/\/c\//.test(location.pathname)) return false;
    return true;
  }

  bridge.chatgptUi = {
    copyText,
    openObsidian,
    findComposer,
    insertAndSend,
    isNewChatScreen
  };
})(window);
