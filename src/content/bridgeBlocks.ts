import { BAR_CLASS, CUSTOM_PREFIX_RE } from "../shared/constants";

const BRIDGE_MARKER_RE = /obsidian_(create|append|prepend|overwrite)@/i;

const fingerprint = (parts: unknown[]) => parts.map(part => String(part || "")).join("\u241F");

const normalizeLine = (line: string) => line.trim().replace(/^Markdown(?=obsidian_)/i, "");

const getMarkerLine = (pre: Element) => {
  const clone = pre.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(`.${BAR_CLASS}, .obsidian-chat-bridge-button`).forEach(node => node.remove());
  return normalizeLine(clone.querySelector(".text-token-text-primary")?.textContent ?? "");
};

/** ChatGPT nests <pre> inside <pre>; scan the innermost block that contains a bridge marker. */
const getBridgePres = (root: ParentNode = document) => {
  const candidates = Array.from(root.querySelectorAll("pre")).filter(pre => BRIDGE_MARKER_RE.test(getMarkerLine(pre)));
  return candidates.filter(pre => !candidates.some(other => other !== pre && pre.contains(other)));
};

const outerPre = (pre: Element) => {
  let outer: Element = pre;
  while (outer.parentElement?.closest("pre")) {
    outer = outer.parentElement.closest("pre")!;
  }
  return outer;
};

const parseTarget = (target: string) => {
  const slash = target.indexOf("/");
  return slash <= 0 || slash === target.length - 1 ? null : { vault: target.slice(0, slash).trim(), filepath: target.slice(slash + 1).trim() };
};

const getBlockContent = (pre: Element) => {
  const header = pre.querySelector(".text-token-text-primary") as HTMLElement | null;
  if (!header) return "";
  const full = (pre as HTMLElement).innerText.trim();
  const headerText = header.innerText.trim();
  return headerText && full.startsWith(headerText) ? full.slice(headerText.length).trim() : "";
};

const parseCustomObsidianBlock = (pre: Element) => {
  const match = getMarkerLine(pre).match(CUSTOM_PREFIX_RE);
  if (!match) return null;
  const parsed = parseTarget(match[2]);
  if (!parsed) return null;
  return {
    action: match[1].toLowerCase(),
    vault: parsed.vault,
    filepath: parsed.filepath,
    content: getBlockContent(pre)
  };
};

const writeObsidianFile = (filepath: string, action: string, content: string) => new Promise<{ ok: boolean; error?: string }>(resolve =>
  chrome.runtime.sendMessage({ type: "WRITE_OBSIDIAN_FILE", filepath, action, content }, response => resolve(response || { ok: false, error: "No response from extension." }))
);

const labelForAction = (action: string) => ({ append: "Append to Obsidian", prepend: "Prepend to Obsidian", overwrite: "Overwrite in Obsidian", create: "Create in Obsidian" }[action] || "Overwrite in Obsidian");

const ensureBar = (host: Element, markerPre: Element, fp: string, meta: { action: string; vault: string; filepath: string }) => {
  const next = host.nextElementSibling;
  if (next?.classList.contains(BAR_CLASS) && next instanceof HTMLElement && next.dataset.obsidianFingerprint === fp) return;

  let sibling = host.nextElementSibling;
  while (sibling?.classList.contains(BAR_CLASS)) {
    const remove = sibling;
    sibling = sibling.nextElementSibling;
    remove.remove();
  }

  const bar = document.createElement("div");
  bar.className = BAR_CLASS;
  bar.dataset.obsidianFingerprint = fp;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "obsidian-chat-bridge-button";
  button.textContent = labelForAction(meta.action);
  button.addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Saving...";
    const content = parseCustomObsidianBlock(markerPre)?.content ?? "";
    const result = await writeObsidianFile(meta.filepath, meta.action, content);
    button.disabled = false;
    button.textContent = result.ok ? "Saved" : (result.error || "Write failed");
    if (!result.ok) window.setTimeout(() => { button.textContent = originalLabel; }, 2500);
  });
  bar.append(
    button,
    Object.assign(document.createElement("span"), { className: "obsidian-chat-bridge-meta", textContent: `${meta.vault}/${meta.filepath} · ${meta.action}` })
  );
  host.insertAdjacentElement("afterend", bar);
};

export function processCustomObsidianBlocks(root: ParentNode = document) {
  getBridgePres(root).forEach(pre => {
    const custom = parseCustomObsidianBlock(pre);
    if (!custom) return;
    const fp = fingerprint(["custom", custom.action, custom.vault, custom.filepath]);
    ensureBar(outerPre(pre), pre, fp, custom);
  });
}

export function removeDuplicateBars() {
  const seen = new Set<string>();
  Array.from(document.querySelectorAll<HTMLElement>(`.${BAR_CLASS}[data-obsidian-fingerprint]`)).forEach(bar => {
    const fp = bar.dataset.obsidianFingerprint;
    if (!fp) return;
    if (seen.has(fp)) bar.remove();
    else seen.add(fp);
  });
}
