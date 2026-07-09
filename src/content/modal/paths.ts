export function normalizeVaultPath(path: string) {
  return String(path || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

export function resolveListedPath(baseDir: string, item: { path?: string; name?: string }) {
  const normalizedBase = normalizeVaultPath(baseDir);
  const normalizedPath = normalizeVaultPath(item.path || "");
  const fallbackName = normalizeVaultPath(item.name || "");
  if (!normalizedPath) return normalizedBase && fallbackName ? `${normalizedBase}/${fallbackName}` : fallbackName;
  if (!normalizedBase) return normalizedPath;
  if (normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`)) return normalizedPath;
  if (!normalizedPath.includes("/")) return `${normalizedBase}/${normalizedPath}`;
  if (fallbackName && normalizedPath === fallbackName) return `${normalizedBase}/${fallbackName}`;
  return normalizedPath;
}

export function sortNames(values: string[]) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

export function parentDirectory(path: string) {
  const parts = normalizeVaultPath(path).split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}
