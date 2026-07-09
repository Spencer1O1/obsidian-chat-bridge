(function initObsidianBridgeBlocks(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const blocks = bridge.bridgeBlocksInternals = bridge.bridgeBlocksInternals || {};

  bridge.bridgeBlocks = {
    processAnchors: blocks.processAnchors,
    processCustomObsidianBlocks: blocks.processCustomObsidianBlocks,
    processCodeBlocks: blocks.processCodeBlocks,
    processPlainText: blocks.processPlainText,
    removeDuplicateBars: blocks.removeDuplicateBars
  };
})(window);
