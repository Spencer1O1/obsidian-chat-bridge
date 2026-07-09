(function initObsidianBridgeChatUi(global) {
  const bridge = global.ObsidianChatBridge = global.ObsidianChatBridge || {};
  const ui = bridge.uiInternals = bridge.uiInternals || {};

  bridge.chatUi = {
    copyText: ui.copyText,
    openObsidian: ui.openObsidian,
    findComposer: ui.findComposer,
    insertAndSend: ui.insertAndSend,
    isNewConversationScreen: ui.isNewConversationScreen
  };
})(window);
