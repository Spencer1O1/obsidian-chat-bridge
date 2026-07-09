import { requestObsidian } from "./request.js";

function normalizeDirectoryItems(data) {
  const rawItems = Array.isArray(data) ? data : data?.files || data?.items || data?.children || [];
  return rawItems.map(item => {
    if (typeof item === "string") {
      const cleaned = item.replace(/\\/g, "/");
      return {
        name: cleaned.split("/").filter(Boolean).pop() || cleaned,
        path: cleaned.replace(/\/+$/, ""),
        isDirectory: /\/$/.test(item)
      };
    }
    const rawPath = String(item?.path || item?.filename || item?.name || "").replace(/\\/g, "/");
    const type = String(item?.type || item?.kind || "").toLowerCase();
    return {
      name: String(item?.name || rawPath.split("/").filter(Boolean).pop() || ""),
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
    return { ok: true, items: normalizeDirectoryItems(JSON.parse(result.content || "[]")), base: result.base, url: result.url };
  } catch (err) {
    return { ok: false, error: `Could not parse directory listing: ${err?.message || String(err)}` };
  }
}
