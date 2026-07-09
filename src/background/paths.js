export function encodePathBySegment(filepath) {
  return String(filepath || "").split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

export function normalizeBase(base) {
  return String(base || "").trim().replace(/\/+$/, "");
}

export function normalizeVaultPath(path) {
  return String(path || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function candidateVaultUrls(base, path, kind = "file") {
  const normalized = normalizeVaultPath(path);
  const encodedSegments = encodePathBySegment(normalized);
  const encodedWhole = encodeURIComponent(normalized);
  const baseUrls = [`${base}/vault/${encodedSegments}`, `${base}/vault/${encodedWhole}`];
  if (kind !== "directory") return baseUrls;
  return unique([...baseUrls, ...baseUrls.map(url => `${url}/`)]);
}
