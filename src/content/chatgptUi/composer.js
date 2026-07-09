(function initObsidianBridgeComposer(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const ui = bridge.chatgptUiInternals = bridge.chatgptUiInternals || {};

  ui.findComposer = () => (
    document.querySelector("#prompt-textarea[contenteditable='true']")
      || document.querySelector("[contenteditable='true'][data-virtualkeyboard]")
      || document.querySelector("main form textarea")
      || document.querySelector("textarea")
  );

  ui.setNativeValue = (el, value) => {
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const setter = Object.getOwnPropertyDescriptor(el.__proto__, "value")?.set;
      setter ? setter.call(el, value) : (el.value = value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    el.focus();
    try { document.execCommand("selectAll", false, null); document.execCommand("insertText", false, value); }
    catch { el.textContent = value; }
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    return true;
  };
})(window);
