import { getRequest } from "./request";
import type { DirectoryItem, DirectoryResult } from "../shared/types";

function normalizeDirectoryItems(data: unknown): DirectoryItem[] {
  const rawItems = Array.isArray(data) ? data : (data as { files?: unknown[]; items?: unknown[]; children?: unknown[] })?.files || (data as { items?: unknown[] })?.items || (data as { children?: unknown[] })?.children || [];
  return rawItems.map(item => {
    if (typeof item === "string") {
      const cleaned = item.replace(/\\/g, "/");
      return { name: cleaned.split("/").filter(Boolean).pop() || cleaned, path: cleaned.replace(/\/+$/, ""), isDirectory: /\/$/.test(item) };
    }
    const raw = item as Record<string, unknown>;
    const rawPath = String(raw.path || raw.filename || raw.name || "").replace(/\\/g, "/");
    const type = String(raw.type || raw.kind || "").toLowerCase();
    return { name: String(raw.name || rawPath.split("/").filter(Boolean).pop() || ""), path: rawPath.replace(/\/+$/, ""), isDirectory: raw.isDirectory === true || raw.folder === true || raw.directory === true || type === "directory" || type === "folder" };
  }).filter(item => item.name);
}

export async function listObsidianDirectory(dirpath: string): Promise<DirectoryResult> {
  const result = await getRequest(dirpath, "application/json, text/plain;q=0.1, */*;q=0.1", "directory");
  if (!result.ok) return result;
  try { return { ok: true, items: normalizeDirectoryItems(JSON.parse(result.content || "[]")), base: result.base, url: result.url }; }
  catch (err) { return { ok: false, error: `Could not parse directory listing: ${err instanceof Error ? err.message : String(err)}` }; }
}
