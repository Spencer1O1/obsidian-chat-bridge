(function initObsidianBridgeScreen(global) {
  const bridge = global.ObsidianChatBridge = global.ObsidianChatBridge || {};
  const ui = bridge.uiInternals = bridge.uiInternals || {};

  function hasConversationMessages() {
    return [
      '[data-message-author-role="user"]',
      '[data-message-author-role="assistant"]',
      '[data-testid^="conversation-turn"]',
      'article[data-testid^="conversation-turn"]'
    ].some(selector => document.querySelector(selector));
  }

  ui.isNewConversationScreen = () => {
    if (!ui.findComposer()) return false;
    if (hasConversationMessages()) return false;
    if (/\/c\//.test(location.pathname)) return false;
    return true;
  };
})(window);
