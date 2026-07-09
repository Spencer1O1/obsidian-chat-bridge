export const DEFAULT_API_BASE = "https://127.0.0.1:27124";
export const DEFAULT_PROJECT_ROOT = "Projects";
const NETWORK_ERROR_HELP = "Network request failed. If Obsidian Local REST API uses a self-signed HTTPS certificate, the browser extension may not trust it yet.";

function encodePathBySegment(filepath) {
  return String(filepath || "")
    .split("/")
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join("/");
}

function normalizeBase(base) {
  return String(base || "").trim().replace(/\/+$/, "");
}

function normalizeVaultPath(path) {
  return String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function candidateVaultUrls(base, path, kind = "file") {
  const normalized = normalizeVaultPath(path);
  const encodedSegments = encodePathBySegment(normalized);
  const encodedWhole = encodeURIComponent(normalized);
  const baseUrls = [
    `${base}/vault/${encodedSegments}`,
    `${base}/vault/${encodedWhole}`
  ];

  if (kind !== "directory") return baseUrls;

  return unique([
    ...baseUrls,
    ...baseUrls.map(url => `${url}/`)
  ]);
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

async function requestObsidian(path, { accept = "text/markdown", kind = "file" } = {}) {
  const { apiBase, apiKey } = await getSettings();
  if (!apiKey) return { ok: false, error: "Missing Obsidian Local REST API key." };

  let lastError = "Unknown error";
  const base = normalizeBase(apiBase) || DEFAULT_API_BASE;

  for (const url of candidateVaultUrls(base, path, kind)) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: accept
        }
      });

      const text = await response.text();
      if (response.ok) {
        return {
          ok: true,
          base,
          url,
          content: text
        };
      }

      lastError = `${response.status} ${response.statusText}${text ? ` - ${text.slice(0, 160)}` : ""}`;
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      if (/Failed to fetch/i.test(message)) {
        lastError = `${message}. ${NETWORK_ERROR_HELP} URL: ${url}`;
      } else {
        lastError = message;
      }
    }
  }

  return { ok: false, error: lastError };
}

async function writeObsidianFile(filepath, content, { contentType = "text/markdown" } = {}) {
  const { apiBase, apiKey } = await getSettings();
  if (!apiKey) return { ok: false, error: "Missing Obsidian Local REST API key." };

  let lastError = "Unknown error";
  const base = normalizeBase(apiBase) || DEFAULT_API_BASE;

  for (const url of candidateVaultUrls(base, filepath, "file")) {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": contentType
        },
        body: String(content || "")
      });
      if (response.ok) return { ok: true, base, url };
      const text = await response.text();
      lastError = `${response.status} ${response.statusText}${text ? ` - ${text.slice(0, 160)}` : ""}`;
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      if (/Failed to fetch/i.test(message)) {
        lastError = `${message}. ${NETWORK_ERROR_HELP} URL: ${url}`;
      } else {
        lastError = message;
      }
    }
  }

  return { ok: false, error: lastError };
}

export async function fetchObsidianFile(filepath) {
  const result = await requestObsidian(filepath, {
    accept: "text/markdown, text/plain;q=0.9, application/json;q=0.5, */*;q=0.1",
    kind: "file"
  });

  if (!result.ok) return result;
  return { ok: true, content: result.content, base: result.base, url: result.url };
}

function normalizeDirectoryItems(data) {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.files)
      ? data.files
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.children)
          ? data.children
          : [];

  return rawItems.map(item => {
    if (typeof item === "string") {
      const cleaned = item.replace(/\\/g, "/");
      const name = cleaned.split("/").filter(Boolean).pop() || cleaned;
      return {
        name,
        path: cleaned.replace(/\/+$/, ""),
        isDirectory: /\/$/.test(item)
      };
    }

    const rawPath = String(item?.path || item?.filename || item?.name || "").replace(/\\/g, "/");
    const name = String(item?.name || rawPath.split("/").filter(Boolean).pop() || "");
    const type = String(item?.type || item?.kind || "").toLowerCase();
    return {
      name,
      path: rawPath.replace(/\/+$/, ""),
      isDirectory: item?.isDirectory === true || item?.folder === true || item?.directory === true || type === "directory" || type === "folder"
    };
  }).filter(item => item.name);
}

export async function listObsidianDirectory(dirpath) {
  const result = await requestObsidian(dirpath, {
    accept: "application/json, text/plain;q=0.1, */*;q=0.1",
    kind: "directory"
  });

  if (!result.ok) return result;

  try {
    const parsed = JSON.parse(result.content || "[]");
    return {
      ok: true,
      items: normalizeDirectoryItems(parsed),
      base: result.base,
      url: result.url
    };
  } catch (err) {
    return {
      ok: false,
      error: `Could not parse directory listing: ${err && err.message ? err.message : String(err)}`
    };
  }
}

export async function createObsidianProject(projectRoot, projectName) {
  const normalizedRoot = normalizeVaultPath(projectRoot || DEFAULT_PROJECT_ROOT) || DEFAULT_PROJECT_ROOT;
  const cleanedName = String(projectName || "").trim().replace(/[\\/:*?"<>|]/g, "");
  if (!cleanedName) {
    return { ok: false, error: "Project name is required." };
  }

  const targetPath = `${normalizedRoot}/${cleanedName}/Hub.md`;
  const content = `---\ntype: project\nstatus: active\n---\n\n# ${cleanedName}\n`;
  const result = await writeObsidianFile(targetPath, content);
  if (!result.ok) return result;

  return {
    ok: true,
    projectName: cleanedName,
    projectPath: `${normalizedRoot}/${cleanedName}`,
    createdFile: targetPath
  };
}
