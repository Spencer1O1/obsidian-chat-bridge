(function initObsidianBridgeBlocksDom(global) {
  const bridge = global.ObsidianChatBridge = global.ObsidianChatBridge || {};
  const blocks = bridge.bridgeBlocksInternals = bridge.bridgeBlocksInternals || {};
  const { BAR_CLASS, OBSIDIAN_RE } = bridge.constants;
  blocks.GLOBAL_FPS = blocks.GLOBAL_FPS || new Set();

  function decodeHtmlEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }

  function getCodeText(pre) {
    const clone = pre.cloneNode(true);
    clone.querySelectorAll(`.${BAR_CLASS}, .obsidian-chat-bridge-inline-bar, .obsidian-chat-bridge-button`).forEach(node => node.remove());
    return (clone.textContent || "").trim();
  }

  function getTopLevelPres(root = document) {
    return [...root.querySelectorAll("pre")].filter(pre => !pre.parentElement?.closest("pre"));
  }

  function findMessageRoot(el) {
    return el.closest("[data-message-author-role], article, main") || document.body;
  }

  function findCodeBlockContainer(pre) {
    const root = findMessageRoot(pre);
    let container = pre, el = pre;
    while (el.parentElement && el.parentElement !== root && el.parentElement !== document.body) {
      const parent = el.parentElement;
      const looksCard = parent.querySelectorAll("pre").length === 1 && ((parent.querySelector && parent.querySelector("button, [role='button']")) || parent.scrollWidth > parent.clientWidth + 8 || /overflow|scroll|rounded|contain|code/i.test(String(parent.className || "")));
      if (!looksCard) break;
      container = el = parent;
    }
    return container;
  }

  function fingerprint(parts) { return parts.map(part => String(part || "")).join("\u241F"); }
  function hasExistingBarAnywhere(fp) { return !!document.querySelector(`.${BAR_CLASS}[data-obsidian-fingerprint="${CSS.escape(fp)}"]`) || blocks.GLOBAL_FPS.has(fp); }
  function removeDuplicateBars() {
    const seen = new Set();
    [...document.querySelectorAll(`.${BAR_CLASS}[data-obsidian-fingerprint]`)].forEach(bar => {
      const fp = bar.dataset.obsidianFingerprint; if (!fp) return; if (seen.has(fp)) bar.remove(); else seen.add(fp);
    });
  }
  function containsObsidianUri(el) { OBSIDIAN_RE.lastIndex = 0; return OBSIDIAN_RE.test(el.textContent || ""); }
  function resetRegex() { OBSIDIAN_RE.lastIndex = 0; }
  function cleanUri(raw) { let uri = decodeHtmlEntities(String(raw || "").trim()); while (/[.,;\]]$/.test(uri)) uri = uri.slice(0, -1); return uri; }
  function insertBarAfterCodeBlock(pre, bar) {
    const container = findCodeBlockContainer(pre);
    let next = container.nextElementSibling;
    while (next?.classList?.contains(BAR_CLASS)) { const remove = next; next = next.nextElementSibling; remove.remove(); }
    container.insertAdjacentElement("afterend", bar);
  }

  Object.assign(blocks, { cleanUri, containsObsidianUri, findCodeBlockContainer, findMessageRoot, fingerprint, getCodeText, getTopLevelPres, hasExistingBarAnywhere, insertBarAfterCodeBlock, removeDuplicateBars, resetRegex });
})(window);
