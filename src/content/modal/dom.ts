import { DIALOG_ID } from "../../shared/constants";

export { DIALOG_ID };
export const EXPLORER_DIALOG_ID = `${DIALOG_ID}-explorer`;

export function createEl<K extends keyof HTMLElementTagNameMap>(tag: K, options: { className?: string; text?: string; html?: string; attrs?: Record<string, string | null> } = {}) {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.text) el.textContent = options.text;
  if (options.html) el.innerHTML = options.html;
  Object.entries(options.attrs || {}).forEach(([key, value]) => { if (value != null) el.setAttribute(key, value); });
  return el;
}

export function closeDialog() {
  document.getElementById(DIALOG_ID)?.remove();
  document.getElementById(EXPLORER_DIALOG_ID)?.remove();
}

export function closeExplorerDialog() {
  document.getElementById(EXPLORER_DIALOG_ID)?.remove();
}

export function mountDialogShell(dialogId: string, replaceAll = false) {
  if (replaceAll) closeDialog();
  else document.getElementById(dialogId)?.remove();
  const host = createEl("div", { attrs: { id: dialogId } });
  const shadowRoot = host.attachShadow({ mode: "open" });
  const stylesheet = createEl("link", { attrs: { rel: "stylesheet", href: chrome.runtime.getURL("styles.css") } });
  stylesheet.addEventListener("error", event => console.warn("Obsidian Chat Bridge could not load modal stylesheet.", event));
  const overlay = createEl("div", { className: "obsidian-chat-bridge-dialog", attrs: { role: "dialog", "aria-modal": "true" } });
  const panel = createEl("div", { className: "obsidian-chat-bridge-modal" });
  overlay.appendChild(panel);
  shadowRoot.append(stylesheet, overlay);
  document.body.appendChild(host);
  return { overlay, panel };
}
