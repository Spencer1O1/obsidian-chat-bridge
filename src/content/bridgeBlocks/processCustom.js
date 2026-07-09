(function initObsidianBridgeBlocksProcessCustom(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const blocks = bridge.bridgeBlocksInternals = bridge.bridgeBlocksInternals || {};
  const { BAR_CLASS, PROCESSED_ATTR } = bridge.constants;

  blocks.processCustomObsidianBlocks = function processCustomObsidianBlocks(root = document) {
    blocks.getTopLevelPres(root).forEach(node => {
      const custom = blocks.parseCustomObsidianBlock(node);
      if (!custom) return;
      const fp = blocks.fingerprint(["custom", custom.action, custom.vault, custom.filepath, custom.content]);
      if (blocks.hasExistingBarAnywhere(fp)) {
        node.setAttribute(PROCESSED_ATTR, "custom");
        return;
      }
      node.setAttribute(PROCESSED_ATTR, "custom");
      blocks.GLOBAL_FPS.add(fp);
      const bar = document.createElement("div");
      bar.className = BAR_CLASS;
      bar.dataset.obsidianFingerprint = fp;
      bar.appendChild(blocks.makeBridgeBlockButton(custom));
      const meta = document.createElement("span");
      meta.className = "obsidian-chatgpt-bridge-meta";
      meta.textContent = `${custom.vault}/${custom.filepath} · ${custom.action}`;
      bar.appendChild(meta);
      blocks.insertBarAfterCodeBlock(node, bar);
    });
  };
})(window);
