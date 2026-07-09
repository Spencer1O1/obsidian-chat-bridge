(function initObsidianBridgeClipboard(global) {
  const bridge = global.ObsidianChatBridge = global.ObsidianChatBridge || {};
  const ui = bridge.uiInternals = bridge.uiInternals || {};

  ui.copyText = async text => {
    if (!text) return false;
    try { await navigator.clipboard.writeText(text); return true; }
    catch (err) { console.warn("Could not write clipboard:", err); return false; }
  };

  ui.openObsidian = uri => {
    chrome.runtime.sendMessage({ type: "OPEN_OBSIDIAN_URI", uri }, response => {
      if (!response?.ok) {
        console.warn("Obsidian Chat Bridge failed:", response && response.error);
        window.location.href = uri;
      }
    });
  };
})(window);
