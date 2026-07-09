(function initObsidianBridgeScreen(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const ui = bridge.chatgptUiInternals = bridge.chatgptUiInternals || {};

  function hasConversationMessages() {
    return [
      '[data-message-author-role="user"]',
      '[data-message-author-role="assistant"]',
      '[data-testid^="conversation-turn"]',
      'article[data-testid^="conversation-turn"]'
    ].some(selector => document.querySelector(selector));
  }

  ui.isNewChatScreen = () => {
    if (!ui.findComposer()) return false;
    if (hasConversationMessages()) return false;
    if (/\/c\//.test(location.pathname)) return false;
    return true;
  };
})(window);
