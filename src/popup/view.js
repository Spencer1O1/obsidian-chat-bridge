export function getPopupElements(documentRef = document) {
  return {
    vaultName: documentRef.getElementById("vaultName"),
    defaultProjectRoot: documentRef.getElementById("defaultProjectRoot"),
    apiKey: documentRef.getElementById("apiKey"),
    save: documentRef.getElementById("save"),
    status: documentRef.getElementById("status")
  };
}

export function populatePopup(elements, values) {
  elements.vaultName.value = values.vaultName || "";
  elements.defaultProjectRoot.value = values.defaultProjectRoot || "Projects";
  elements.apiKey.value = values.apiKey || "";
}

export function showSavedStatus(elements) {
  elements.status.textContent = "Saved.";
  setTimeout(() => {
    elements.status.textContent = "";
  }, 1400);
}
