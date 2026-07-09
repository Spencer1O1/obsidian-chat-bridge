export function findComposer() {  return document.querySelector<HTMLElement>("#prompt-textarea[contenteditable='true']")
    || document.querySelector<HTMLElement>("[contenteditable='true'][data-virtualkeyboard]")
    || document.querySelector<HTMLTextAreaElement>("main form textarea")
    || document.querySelector<HTMLElement>("textarea");
}

function setNativeValue(el: HTMLElement, value: string) {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
    setter ? setter.call(el, value) : (el.value = value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  el.focus();
  try { document.execCommand("selectAll", false); document.execCommand("insertText", false, value); }
  catch { el.textContent = value; }
  el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  return true;
}

function findSendButton() {
  const candidates = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).filter(btn => !btn.disabled);
  return candidates.find(btn => /send/i.test(btn.getAttribute("aria-label") || btn.textContent || ""))
    || document.querySelector<HTMLButtonElement>("button[data-testid='send-button']")
    || document.querySelector<HTMLButtonElement>("button[aria-label='Send prompt']");
}

export function insertAndSend(prompt: string) {
  const composer = findComposer();
  if (!composer) return false;
  setNativeValue(composer, prompt);
  setTimeout(() => { const send = findSendButton(); if (send && !send.disabled) send.click(); }, 200);
  return true;
}

export function isNewConversationScreen() {
  if (!findComposer()) return false;
  if (['[data-message-author-role="user"]','[data-message-author-role="assistant"]','[data-testid^="conversation-turn"]','article[data-testid^="conversation-turn"]'].some(selector => document.querySelector(selector))) return false;
  return !/\/c\//.test(location.pathname);
}
