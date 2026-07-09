(function initObsidianBridgeModalPaths(global) {
  const bridge = global.ObsidianChatBridge = global.ObsidianChatBridge || {};
  const modal = bridge.modalInternals = bridge.modalInternals || {};

  function normalizeVaultPath(path) {
    return String(path || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  }

  function resolveListedPath(baseDir, item) {
    const normalizedBase = normalizeVaultPath(baseDir);
    const normalizedPath = normalizeVaultPath(item?.path || "");
    const fallbackName = normalizeVaultPath(item?.name || "");
    if (!normalizedPath) {
      return normalizedBase && fallbackName ? `${normalizedBase}/${fallbackName}` : fallbackName;
    }
    if (!normalizedBase) return normalizedPath;
    if (normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`)) return normalizedPath;
    if (!normalizedPath.includes("/")) return `${normalizedBase}/${normalizedPath}`;
    if (fallbackName && normalizedPath === fallbackName) return `${normalizedBase}/${fallbackName}`;
    return normalizedPath;
  }

  function parentDirectory(path) {
    const parts = normalizeVaultPath(path).split("/").filter(Boolean);
    parts.pop();
    return parts.join("/");
  }

  modal.normalizeVaultPath = normalizeVaultPath;
  modal.resolveListedPath = resolveListedPath;
  modal.parentDirectory = parentDirectory;
  modal.sortNames = values => [...values].sort((a, b) => a.localeCompare(b));
})(window);
