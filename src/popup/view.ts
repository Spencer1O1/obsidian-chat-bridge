type PopupElements = {
  vaultName: HTMLInputElement;
  defaultProjectRoot: HTMLInputElement;
  apiKey: HTMLInputElement;
  save: HTMLButtonElement;
  status: HTMLDivElement;
};

export function getPopupElements(documentRef: Document = document): PopupElements {
  return {
    vaultName: documentRef.getElementById("vaultName") as HTMLInputElement,
    defaultProjectRoot: documentRef.getElementById("defaultProjectRoot") as HTMLInputElement,
    apiKey: documentRef.getElementById("apiKey") as HTMLInputElement,
    save: documentRef.getElementById("save") as HTMLButtonElement,
    status: documentRef.getElementById("status") as HTMLDivElement
  };
}

export function populatePopup(elements: PopupElements, values: { vaultName?: string; defaultProjectRoot?: string; apiKey?: string }) {
  elements.vaultName.value = values.vaultName || "";
  elements.defaultProjectRoot.value = values.defaultProjectRoot || "Projects";
  elements.apiKey.value = values.apiKey || "";
}

export function showSavedStatus(elements: PopupElements) {
  elements.status.textContent = "Saved.";
  setTimeout(() => { elements.status.textContent = ""; }, 1400);
}
