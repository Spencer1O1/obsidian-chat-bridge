(function initObsidianBridgeBlocks(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const {
    OBSIDIAN_RE,
    PROCESSED_ATTR,
    BAR_CLASS,
    CUSTOM_PREFIX_RE
  } = bridge.constants;

  const GLOBAL_FPS = new Set();

  function decodeHtmlEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }

  function cleanUri(raw) {
    let uri = decodeHtmlEntities(String(raw || "").trim());
    while (/[.,;\]]$/.test(uri)) uri = uri.slice(0, -1);
    return uri;
  }

  function uriUsesClipboard(uri) {
    try {
      const url = new URL(uri);
      return url.searchParams.get("clipboard") === "true";
    } catch {
      return /[?&]clipboard=true(?:&|$)/.test(uri);
    }
  }

  function getCodeText(pre) {
    const clone = pre.cloneNode(true);
    clone.querySelectorAll(`.${BAR_CLASS}, .obsidian-chatgpt-bridge-inline-bar, .obsidian-chatgpt-bridge-button`).forEach(n => n.remove());
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
    let container = pre;
    let el = pre;

    while (el.parentElement && el.parentElement !== root && el.parentElement !== document.body) {
      const parent = el.parentElement;
      const preCount = parent.querySelectorAll ? parent.querySelectorAll("pre").length : 0;
      const className = String(parent.className || "");
      const hasCopyButton = !!(parent.querySelector && parent.querySelector("button, [role='button']"));
      const looksCodeCard = parent.scrollWidth > parent.clientWidth + 8 || /overflow|scroll|rounded|contain|code/i.test(className);

      if (preCount === 1 && (hasCopyButton || looksCodeCard)) {
        container = parent;
        el = parent;
        continue;
      }
      break;
    }
    return container;
  }

  function fingerprint(parts) {
    return parts.map(part => String(part || "")).join("\u241F");
  }

  function hasExistingBarAnywhere(fp) {
    const selector = `.${BAR_CLASS}[data-obsidian-fingerprint="${CSS.escape(fp)}"]`;
    return !!document.querySelector(selector) || GLOBAL_FPS.has(fp);
  }

  function removeDuplicateBars() {
    const seen = new Set();
    for (const bar of [...document.querySelectorAll(`.${BAR_CLASS}[data-obsidian-fingerprint]`)]) {
      const fp = bar.dataset.obsidianFingerprint;
      if (!fp) continue;
      if (seen.has(fp)) bar.remove();
      else seen.add(fp);
    }
  }

  function containsObsidianUri(el) {
    OBSIDIAN_RE.lastIndex = 0;
    return OBSIDIAN_RE.test(el.textContent || "");
  }

  function resetRegex() {
    OBSIDIAN_RE.lastIndex = 0;
  }

  function findPreviousCopyBlock(fromEl) {
    const root = findMessageRoot(fromEl);
    const pres = [...root.querySelectorAll("pre")];
    const fromRect = fromEl.getBoundingClientRect();

    let best = null;
    for (const pre of pres) {
      if (pre === fromEl || pre.contains(fromEl)) continue;
      const r = pre.getBoundingClientRect();
      if (r.bottom > fromRect.top + 4) continue;
      if (containsObsidianUri(pre)) continue;
      const text = getCodeText(pre);
      if (!text) continue;
      best = pre;
    }
    return best;
  }

  function flash(button, text) {
    const old = button.textContent;
    button.textContent = text;
    setTimeout(() => {
      button.textContent = old;
    }, 1400);
  }

  function makeBridgeBlockButton({ action, vault, filepath, content }) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "obsidian-chatgpt-bridge-button";
    button.textContent = labelForAction(action);
    button.title = `${vault}/${filepath}`;
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();

      const ok = await bridge.chatgptUi.copyText(content);
      if (!ok) {
        flash(button, "Clipboard blocked");
        return;
      }

      const fileResult = await fetchObsidianFile(filepath);
      const mode = resolveWriteMode(action, fileResult.ok);
      const uri = buildAdvancedUri({ vault, filepath, mode });
      bridge.chatgptUi.openObsidian(uri);
    });
    return button;
  }

  function makeButton(uri, label = "Open in Obsidian", options = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "obsidian-chatgpt-bridge-button";
    button.textContent = label;
    button.title = uri;
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();

      if (options.copyText != null) {
        const ok = await bridge.chatgptUi.copyText(options.copyText);
        if (!ok) {
          flash(button, "Clipboard blocked");
          return;
        }
      } else if (options.copySourceEl && uriUsesClipboard(uri)) {
        const ok = await bridge.chatgptUi.copyText(getCodeText(options.copySourceEl));
        if (!ok) {
          flash(button, "Clipboard blocked");
          return;
        }
      }

      bridge.chatgptUi.openObsidian(uri);
    });
    return button;
  }

  function fetchObsidianFile(filepath) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(
        { type: "FETCH_OBSIDIAN_FILE", filepath },
        response => resolve(response || { ok: false })
      );
    });
  }

  function resolveWriteMode(action, fileExists) {
    if (!fileExists) return "overwrite";
    switch (String(action || "").toLowerCase()) {
      case "append": return "append";
      case "prepend": return "prepend";
      case "overwrite":
      case "update":
      case "create":
      default: return "overwrite";
    }
  }

  function labelForAction(action) {
    switch (String(action || "").toLowerCase()) {
      case "append": return "Append to Obsidian";
      case "prepend": return "Prepend to Obsidian";
      case "overwrite": return "Overwrite in Obsidian";
      case "create": return "Create in Obsidian";
      case "update":
      default: return "Update Obsidian";
    }
  }

  function parseTarget(target) {
    const value = String(target || "").trim();
    const slash = value.indexOf("/");
    if (slash <= 0 || slash === value.length - 1) return null;
    return {
      vault: value.slice(0, slash).trim(),
      filepath: value.slice(slash + 1).trim()
    };
  }

  function encodeParam(value) {
    return encodeURIComponent(String(value || ""));
  }

  function buildAdvancedUri({ vault, filepath, mode }) {
    return `obsidian://adv-uri?vault=${encodeParam(vault)}&filepath=${encodeParam(filepath)}&clipboard=true&mode=${encodeParam(mode)}`;
  }

  function getLanguageMarker(pre) {
    const code = pre.querySelector("code");
    const candidates = [];
    if (code) {
      candidates.push(code.getAttribute("class") || "");
      candidates.push(code.getAttribute("data-language") || "");
      candidates.push(code.getAttribute("data-lang") || "");
      for (const cls of code.classList || []) candidates.push(cls);
    }
    candidates.push(pre.getAttribute("data-language") || "");
    candidates.push(pre.getAttribute("data-lang") || "");

    for (const raw of candidates) {
      if (!raw) continue;
      const normalized = String(raw).replace(/^language-/, "").trim();
      const match = normalized.match(CUSTOM_PREFIX_RE);
      if (match) return { action: match[1].toLowerCase(), target: match[2].trim() };
    }
    return null;
  }

  function parseCustomObsidianBlock(pre) {
    const text = getCodeText(pre);
    if (!text) return null;
    const lines = text.split(/\r?\n/);
    const first = (lines[0] || "").trim();
    const match = first.match(CUSTOM_PREFIX_RE);
    if (match) {
      const parsed = parseTarget(match[2]);
      if (!parsed) return null;
      return {
        action: match[1].toLowerCase(),
        vault: parsed.vault,
        filepath: parsed.filepath,
        content: lines.slice(1).join("\n").trim()
      };
    }

    const marker = getLanguageMarker(pre);
    if (marker) {
      const parsed = parseTarget(marker.target);
      if (!parsed) return null;
      return {
        action: marker.action,
        vault: parsed.vault,
        filepath: parsed.filepath,
        content: text.trim()
      };
    }
    return null;
  }

  function insertBarAfterCodeBlock(pre, bar) {
    const container = findCodeBlockContainer(pre);
    let next = container.nextElementSibling;
    while (next && next.classList && next.classList.contains(BAR_CLASS)) {
      const remove = next;
      next = next.nextElementSibling;
      remove.remove();
    }
    container.insertAdjacentElement("afterend", bar);
  }

  function processCustomObsidianBlocks(root = document) {
    const nodes = getTopLevelPres(root);
    for (const node of nodes) {
      const custom = parseCustomObsidianBlock(node);
      if (!custom) continue;

      const fp = fingerprint(["custom", custom.action, custom.vault, custom.filepath, custom.content]);
      if (hasExistingBarAnywhere(fp)) {
        node.setAttribute(PROCESSED_ATTR, "custom");
        continue;
      }

      node.setAttribute(PROCESSED_ATTR, "custom");
      GLOBAL_FPS.add(fp);

      const bar = document.createElement("div");
      bar.className = BAR_CLASS;
      bar.dataset.obsidianFingerprint = fp;
      bar.appendChild(makeBridgeBlockButton(custom));

      const meta = document.createElement("span");
      meta.className = "obsidian-chatgpt-bridge-meta";
      meta.textContent = `${custom.vault}/${custom.filepath} · ${custom.action}`;
      bar.appendChild(meta);

      insertBarAfterCodeBlock(node, bar);
    }
  }

  function processAnchors(root = document) {
    const anchors = root.querySelectorAll('a[href^="obsidian://"]');
    for (const a of anchors) {
      if (a.getAttribute(PROCESSED_ATTR)) continue;
      a.setAttribute(PROCESSED_ATTR, "anchor");
      a.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        bridge.chatgptUi.openObsidian(a.href);
      }, true);
      a.classList.add("obsidian-chatgpt-bridge-link");
    }
  }

  function processCodeBlocks(root = document) {
    const nodes = getTopLevelPres(root);
    for (const node of nodes) {
      if (node.getAttribute(PROCESSED_ATTR)) continue;
      resetRegex();
      const text = node.textContent || "";
      const matches = [...text.matchAll(OBSIDIAN_RE)].map(m => cleanUri(m[0]));
      if (!matches.length) continue;

      node.setAttribute(PROCESSED_ATTR, "code");
      const unique = [...new Set(matches)].filter(uri => uri.startsWith("obsidian://"));
      if (!unique.length) continue;

      const fp = fingerprint(["uri", unique.join("|")]);
      if (hasExistingBarAnywhere(fp)) continue;
      GLOBAL_FPS.add(fp);

      const bar = document.createElement("div");
      bar.className = BAR_CLASS;
      bar.dataset.obsidianFingerprint = fp;

      unique.slice(0, 5).forEach((uri, index) => {
        let copyBlock = null;
        let label = unique.length === 1 ? "Open in Obsidian" : `Open URI ${index + 1}`;
        if (uriUsesClipboard(uri)) {
          copyBlock = findPreviousCopyBlock(node);
          label = copyBlock ? "Copy note + open Obsidian" : "Open in Obsidian";
        }
        bar.appendChild(makeButton(uri, label, { copySourceEl: copyBlock }));
      });
      insertBarAfterCodeBlock(node, bar);
    }
  }

  function processPlainText(root = document) {
    const candidates = root.querySelectorAll("p, li");
    for (const el of candidates) {
      if (el.getAttribute(PROCESSED_ATTR)) continue;
      if (el.closest("pre, code")) continue;
      resetRegex();
      const text = el.textContent || "";
      const matches = [...text.matchAll(OBSIDIAN_RE)].map(m => cleanUri(m[0]));
      if (!matches.length) continue;
      el.setAttribute(PROCESSED_ATTR, "plain");
      const unique = [...new Set(matches)].filter(uri => uri.startsWith("obsidian://"));
      if (!unique.length) continue;
      const bar = document.createElement("span");
      bar.className = "obsidian-chatgpt-bridge-inline-bar";
      unique.slice(0, 3).forEach((uri, index) => {
        const label = unique.length === 1 ? "Open in Obsidian" : `Open URI ${index + 1}`;
        bar.appendChild(makeButton(uri, label));
      });
      el.appendChild(document.createTextNode(" "));
      el.appendChild(bar);
    }
  }

  bridge.bridgeBlocks = {
    processAnchors,
    processCustomObsidianBlocks,
    processCodeBlocks,
    processPlainText,
    removeDuplicateBars
  };
})(window);
