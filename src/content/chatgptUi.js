(function initObsidianBridgeChatgptUi(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const ui = bridge.chatgptUiInternals = bridge.chatgptUiInternals || {};

  bridge.chatgptUi = {
    copyText: ui.copyText,
    openObsidian: ui.openObsidian,
    findComposer: ui.findComposer,
    insertAndSend: ui.insertAndSend,
    isNewChatScreen: ui.isNewChatScreen
  };
})(window);
