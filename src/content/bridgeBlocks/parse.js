(function initObsidianBridgeBlocksParse(global) {
  const bridge = global.ObsidianChatBridge = global.ObsidianChatBridge || {};
  const blocks = bridge.bridgeBlocksInternals = bridge.bridgeBlocksInternals || {};
  const { CUSTOM_PREFIX_RE } = bridge.constants;

  function parseTarget(target) {
    const value = String(target || "").trim();
    const slash = value.indexOf("/");
    if (slash <= 0 || slash === value.length - 1) return null;
    return { vault: value.slice(0, slash).trim(), filepath: value.slice(slash + 1).trim() };
  }

  function encodeParam(value) { return encodeURIComponent(String(value || "")); }
  function buildAdvancedUri({ vault, filepath, mode }) {
    return `obsidian://adv-uri?vault=${encodeParam(vault)}&filepath=${encodeParam(filepath)}&clipboard=true&mode=${encodeParam(mode)}`;
  }

  function getLanguageMarker(pre) {
    const code = pre.querySelector("code");
    const candidates = [code?.getAttribute("class") || "", code?.getAttribute("data-language") || "", code?.getAttribute("data-lang") || "", pre.getAttribute("data-language") || "", pre.getAttribute("data-lang") || ""];
    for (const cls of code?.classList || []) candidates.push(cls);
    for (const raw of candidates) {
      const match = String(raw || "").replace(/^language-/, "").trim().match(CUSTOM_PREFIX_RE);
      if (match) return { action: match[1].toLowerCase(), target: match[2].trim() };
    }
    return null;
  }

  function parseCustomObsidianBlock(pre) {
    const text = blocks.getCodeText(pre);
    if (!text) return null;
    const lines = text.split(/\r?\n/);
    const match = (lines[0] || "").trim().match(CUSTOM_PREFIX_RE);
    if (match) {
      const parsed = parseTarget(match[2]); if (!parsed) return null;
      return { action: match[1].toLowerCase(), vault: parsed.vault, filepath: parsed.filepath, content: lines.slice(1).join("\n").trim() };
    }
    const marker = getLanguageMarker(pre);
    if (!marker) return null;
    const parsed = parseTarget(marker.target); if (!parsed) return null;
    return { action: marker.action, vault: parsed.vault, filepath: parsed.filepath, content: text.trim() };
  }

  Object.assign(blocks, { buildAdvancedUri, parseCustomObsidianBlock, parseTarget });
})(window);
