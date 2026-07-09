(function initObsidianBridgeBlocksProcessUris(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const blocks = bridge.bridgeBlocksInternals = bridge.bridgeBlocksInternals || {};
  const { BAR_CLASS, OBSIDIAN_RE, PROCESSED_ATTR } = bridge.constants;

  function findPreviousCopyBlock(fromEl) {
    const pres = [...blocks.findMessageRoot(fromEl).querySelectorAll("pre")];
    const fromRect = fromEl.getBoundingClientRect();
    return pres.find(pre => pre !== fromEl && !pre.contains(fromEl) && pre.getBoundingClientRect().bottom <= fromRect.top + 4 && !blocks.containsObsidianUri(pre) && blocks.getCodeText(pre));
  }

  blocks.processAnchors = function processAnchors(root = document) {
    root.querySelectorAll('a[href^="obsidian://"]').forEach(anchor => {
      if (anchor.getAttribute(PROCESSED_ATTR)) return;
      anchor.setAttribute(PROCESSED_ATTR, "anchor");
      anchor.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); bridge.chatgptUi.openObsidian(anchor.href); }, true);
      anchor.classList.add("obsidian-chatgpt-bridge-link");
    });
  };

  blocks.processCodeBlocks = function processCodeBlocks(root = document) {
    blocks.getTopLevelPres(root).forEach(node => {
      if (node.getAttribute(PROCESSED_ATTR)) return;
      blocks.resetRegex();
      const unique = [...new Set([...(node.textContent || "").matchAll(OBSIDIAN_RE)].map(match => blocks.cleanUri(match[0]))).values()].filter(uri => uri.startsWith("obsidian://"));
      if (!unique.length) return;
      node.setAttribute(PROCESSED_ATTR, "code");
      const fp = blocks.fingerprint(["uri", unique.join("|")]); if (blocks.hasExistingBarAnywhere(fp)) return; blocks.GLOBAL_FPS.add(fp);
      const bar = document.createElement("div"); bar.className = BAR_CLASS; bar.dataset.obsidianFingerprint = fp;
      unique.slice(0, 5).forEach((uri, index) => bar.appendChild(blocks.makeButton(uri, unique.length === 1 ? "Open in Obsidian" : `Open URI ${index + 1}`, { copySourceEl: findPreviousCopyBlock(node) })));
      blocks.insertBarAfterCodeBlock(node, bar);
    });
  };

  blocks.processPlainText = function processPlainText(root = document) {
    root.querySelectorAll("p, li").forEach(el => {
      if (el.getAttribute(PROCESSED_ATTR) || el.closest("pre, code")) return;
      blocks.resetRegex();
      const unique = [...new Set([...(el.textContent || "").matchAll(OBSIDIAN_RE)].map(match => blocks.cleanUri(match[0]))).values()].filter(uri => uri.startsWith("obsidian://"));
      if (!unique.length) return;
      el.setAttribute(PROCESSED_ATTR, "plain");
      const bar = document.createElement("span"); bar.className = "obsidian-chatgpt-bridge-inline-bar";
      unique.slice(0, 3).forEach((uri, index) => bar.appendChild(blocks.makeButton(uri, unique.length === 1 ? "Open in Obsidian" : `Open URI ${index + 1}`)));
      el.append(document.createTextNode(" "), bar);
    });
  };
})(window);
