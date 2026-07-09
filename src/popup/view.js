export function getPopupElements(documentRef = document) {
  return {
    apiKey: documentRef.getElementById("apiKey"),
    save: documentRef.getElementById("save"),
    status: documentRef.getElementById("status")
  };
}

export function populatePopup(elements, values) {
  elements.apiKey.value = values.apiKey || "";
}

export function showSavedStatus(elements) {
  elements.status.textContent = "Saved.";
  setTimeout(() => {
    elements.status.textContent = "";
  }, 1400);
}
