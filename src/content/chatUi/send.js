(function initObsidianBridgeSend(global) {
  const bridge = global.ObsidianChatBridge = global.ObsidianChatBridge || {};
  const ui = bridge.uiInternals = bridge.uiInternals || {};

  ui.findSendButton = () => {
    const candidates = [...document.querySelectorAll("button")].filter(btn => !btn.disabled);
    return candidates.find(btn => /send/i.test(btn.getAttribute("aria-label") || btn.textContent || ""))
      || document.querySelector("button[data-testid='send-button']")
      || document.querySelector("button[aria-label='Send prompt']");
  };

  ui.insertAndSend = prompt => {
    const composer = ui.findComposer();
    if (!composer) return false;
    ui.setNativeValue(composer, prompt);
    setTimeout(() => {
      const send = ui.findSendButton();
      if (send && !send.disabled) send.click();
    }, 200);
    return true;
  };
})(window);
