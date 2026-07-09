export function normalizeVaultPath(path: string) {
  return String(path || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

export function normalizeNotePath(filepath: string) {
  const normalized = normalizeVaultPath(filepath);
  if (!normalized) return normalized;

  const lastSlash = normalized.lastIndexOf("/");
  const dir = lastSlash >= 0 ? normalized.slice(0, lastSlash + 1) : "";
  const name = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
  if (!name || name.includes(".")) return normalized;

  return `${dir}${name}.md`;
}
