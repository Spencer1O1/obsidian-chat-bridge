import { getPopupElements, populatePopup, showSavedStatus } from "./view.js";

const DEFAULT_API_BASE = "https://127.0.0.1:27124";
const DEFAULT_PROJECT_ROOT = "Projects";

const elements = getPopupElements();

chrome.storage.local.get({ apiKey: "", vaultName: "", defaultProjectRoot: DEFAULT_PROJECT_ROOT }, values => {
  populatePopup(elements, values);
});

elements.save.addEventListener("click", () => {
  chrome.storage.local.set({
    apiBase: DEFAULT_API_BASE,
    apiKey: elements.apiKey.value.trim(),
    vaultName: elements.vaultName.value.trim(),
    defaultProjectRoot: elements.defaultProjectRoot.value.trim() || DEFAULT_PROJECT_ROOT
  }, () => {
    showSavedStatus(elements);
  });
});
