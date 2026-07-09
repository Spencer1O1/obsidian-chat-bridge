import { fetchObsidianFile } from "./files";
import { putRequest } from "./request";
import type { ObsidianResult } from "../shared/types";

type MergeMode = "append" | "prepend" | "overwrite";

function resolveWriteMode(action: string, fileExists: boolean): MergeMode {
  const normalized = String(action || "").trim().toLowerCase();
  if (!fileExists) return "overwrite";
  if (normalized === "append" || normalized === "prepend") return normalized;
  return "overwrite";
}

function mergeContent(mode: MergeMode, existing: string, incoming: string) {
  if (mode === "overwrite") return incoming;
  if (!existing) return incoming;
  if (mode === "append") return `${existing.replace(/\s*$/, "")}\n\n${incoming}`;
  return `${incoming}\n\n${existing.replace(/^\s*/, "")}`;
}

export async function writeObsidianFile(filepath: string, action: string, content: string): Promise<ObsidianResult> {
  const normalized = String(action || "").trim().toLowerCase();
  if (normalized === "append" || normalized === "prepend") {
    const existing = await fetchObsidianFile(filepath);
    const mode = resolveWriteMode(normalized, existing.ok);
    const body = mergeContent(mode, existing.ok ? (existing.content ?? "") : "", content);
    return putRequest(filepath, body);
  }
  return putRequest(filepath, content);
}
