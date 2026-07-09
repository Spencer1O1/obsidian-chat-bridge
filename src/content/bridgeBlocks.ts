import { BAR_CLASS, CUSTOM_PREFIX_RE, PROCESSED_ATTR } from "../shared/constants";

const globalFingerprints = new Set<string>();
const fingerprint = (parts: unknown[]) => parts.map(part => String(part || "")).join("\u241F");
const getCodeText = (pre: Element) => {
  const clone = pre.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(`.${BAR_CLASS}, .obsidian-chat-bridge-button`).forEach(node => node.remove());
  return (clone.textContent || "").trim();
};
const getTopLevelPres = (root: ParentNode = document) => Array.from(root.querySelectorAll("pre")).filter(pre => !pre.parentElement?.closest("pre"));
const findMessageRoot = (el: Element) => el.closest("[data-message-author-role], article, main") || document.body;
const findCodeBlockContainer = (pre: Element) => {
  const root = findMessageRoot(pre);
  let container: Element = pre;
  let el: Element = pre;
  while (el.parentElement && el.parentElement !== root && el.parentElement !== document.body) {
    const parent = el.parentElement;
    const looksCard = parent.querySelectorAll("pre").length === 1
      && (parent.querySelector("button, [role='button']") || parent.scrollWidth > parent.clientWidth + 8 || /overflow|scroll|rounded|contain|code/i.test(String(parent.className || "")));
    if (!looksCard) break;
    container = el = parent;
  }
  return container;
};
const hasExistingBarAnywhere = (fp: string) => !!document.querySelector(`.${BAR_CLASS}[data-obsidian-fingerprint="${CSS.escape(fp)}"]`) || globalFingerprints.has(fp);
const removeDuplicateBars = () => {
  const seen = new Set<string>();
  Array.from(document.querySelectorAll<HTMLElement>(`.${BAR_CLASS}[data-obsidian-fingerprint]`)).forEach(bar => {
    const fp = bar.dataset.obsidianFingerprint;
    if (!fp) return;
    if (seen.has(fp)) bar.remove();
    else seen.add(fp);
  });
};
const parseTarget = (target: string) => {
  const slash = target.indexOf("/");
  return slash <= 0 || slash === target.length - 1 ? null : { vault: target.slice(0, slash).trim(), filepath: target.slice(slash + 1).trim() };
};
const writeObsidianFile = (filepath: string, action: string, content: string) => new Promise<{ ok: boolean; error?: string }>(resolve =>
  chrome.runtime.sendMessage({ type: "WRITE_OBSIDIAN_FILE", filepath, action, content }, response => resolve(response || { ok: false, error: "No response from extension." }))
);
const labelForAction = (action: string) => ({ append: "Append to Obsidian", prepend: "Prepend to Obsidian", overwrite: "Overwrite in Obsidian", create: "Create in Obsidian" }[action] || "Overwrite in Obsidian");
const parseCustomObsidianBlock = (pre: Element) => {
  const text = getCodeText(pre);
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  const first = (lines[0] || "").trim();
  const direct = first.match(CUSTOM_PREFIX_RE);
  if (direct) {
    const parsed = parseTarget(direct[2]);
    return parsed ? { action: direct[1].toLowerCase(), vault: parsed.vault, filepath: parsed.filepath, content: lines.slice(1).join("\n").trim() } : null;
  }
  const code = pre.querySelector("code");
  const rawValues = [
    code?.getAttribute("class") || "",
    code?.getAttribute("data-language") || "",
    code?.getAttribute("data-lang") || "",
    pre.getAttribute("data-language") || "",
    pre.getAttribute("data-lang") || "",
    ...(code ? Array.from(code.classList) : [])
  ];
  const marker = rawValues.map(value => String(value || "").replace(/^language-/, "").trim().match(CUSTOM_PREFIX_RE)).find(Boolean);
  if (!marker) return null;
  const parsed = parseTarget(marker[2]);
  return parsed ? { action: marker[1].toLowerCase(), vault: parsed.vault, filepath: parsed.filepath, content: text.trim() } : null;
};
const insertBarAfterCodeBlock = (pre: Element, bar: HTMLElement) => {
  const container = findCodeBlockContainer(pre);
  let next = container.nextElementSibling;
  while (next?.classList?.contains(BAR_CLASS)) {
    const remove = next;
    next = next.nextElementSibling;
    remove.remove();
  }
  container.insertAdjacentElement("afterend", bar);
};

export function processCustomObsidianBlocks(root: ParentNode = document) {
  getTopLevelPres(root).forEach(node => {
    const custom = parseCustomObsidianBlock(node);
    if (!custom) return;
    const fp = fingerprint(["custom", custom.action, custom.vault, custom.filepath, custom.content]);
    if (hasExistingBarAnywhere(fp)) return node.setAttribute(PROCESSED_ATTR, "custom");
    node.setAttribute(PROCESSED_ATTR, "custom");
    globalFingerprints.add(fp);
    const bar = document.createElement("div");
    bar.className = BAR_CLASS;
    bar.dataset.obsidianFingerprint = fp;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "obsidian-chat-bridge-button";
    button.textContent = labelForAction(custom.action);
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = "Saving...";
      const result = await writeObsidianFile(custom.filepath, custom.action, custom.content);
      button.disabled = false;
      button.textContent = result.ok ? "Saved" : (result.error || "Write failed");
      if (!result.ok) window.setTimeout(() => { button.textContent = originalLabel; }, 2500);
    });
    bar.append(
      button,
      Object.assign(document.createElement("span"), { className: "obsidian-chat-bridge-meta", textContent: `${custom.vault}/${custom.filepath} · ${custom.action}` })
    );
    insertBarAfterCodeBlock(node, bar);
  });
}

export { removeDuplicateBars };
