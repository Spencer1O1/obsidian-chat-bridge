export function normalizeBase(base: string) {
  return String(base || "").trim().replace(/\/+$/, "");
}

function normalizeVaultPath(path: string) {
  return String(path || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

function encodePathBySegment(filepath: string) {
  return String(filepath || "").split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

export function candidateVaultUrls(base: string, path: string, kind = "file") {
  const normalized = normalizeVaultPath(path);
  const baseUrls = [`${base}/vault/${encodePathBySegment(normalized)}`, `${base}/vault/${encodeURIComponent(normalized)}`];
  return kind === "directory" ? [...new Set([...baseUrls, ...baseUrls.map(url => `${url}/`)])] : baseUrls;
}

export function normalizeProjectRoot(path: string) {
  return normalizeVaultPath(path);
}
