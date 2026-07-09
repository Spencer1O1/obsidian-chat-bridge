export const DEFAULT_API_BASE = "https://127.0.0.1:27124";
export const DEFAULT_PROJECT_ROOT = "Projects";

function normalizeVaultPath(path) {
  return String(path || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

export async function getSettings() {
  const stored = await chrome.storage.local.get({
    apiKey: "",
    vaultName: "",
    defaultProjectRoot: DEFAULT_PROJECT_ROOT
  });
  return {
    apiBase: DEFAULT_API_BASE,
    apiKey: stored.apiKey || "",
    vaultName: String(stored.vaultName || "").trim(),
    defaultProjectRoot: normalizeVaultPath(stored.defaultProjectRoot || DEFAULT_PROJECT_ROOT) || DEFAULT_PROJECT_ROOT
  };
}
