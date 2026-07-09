import { getPopupElements, populatePopup, showSavedStatus } from "./view.js";

const DEFAULT_API_BASE = "https://127.0.0.1:27124";

const elements = getPopupElements();

chrome.storage.local.get({ apiKey: "" }, values => {
  populatePopup(elements, values);
});

elements.save.addEventListener("click", () => {
  chrome.storage.local.set({
    apiBase: DEFAULT_API_BASE,
    apiKey: elements.apiKey.value.trim()
  }, () => {
    showSavedStatus(elements);
  });
});
