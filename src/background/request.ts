import { DEFAULT_API_BASE, getSettings } from "./settings";
import { candidateVaultUrls, normalizeBase } from "./paths";
import type { ObsidianResult } from "../shared/types";

const NETWORK_ERROR_HELP = "Network request failed. If Obsidian Local REST API uses a self-signed HTTPS certificate, the browser extension may not trust it yet.";

async function request(method: string, targetPath: string, options: { accept?: string; kind?: string; contentType?: string; body?: string } = {}): Promise<ObsidianResult> {
  const { apiBase, apiKey } = await getSettings();
  if (!apiKey) return { ok: false, error: "Missing Obsidian Local REST API key." };
  let lastError = "Unknown error";
  const base = normalizeBase(apiBase) || DEFAULT_API_BASE;

  for (const url of candidateVaultUrls(base, targetPath, options.kind || "file")) {
    try {
      const response = await fetch(url, { method, headers: { Authorization: `Bearer ${apiKey}`, ...(options.accept ? { Accept: options.accept } : {}), ...(options.contentType ? { "Content-Type": options.contentType } : {}) }, ...(options.body == null ? {} : { body: options.body }) });
      const content = await response.text();
      if (response.ok) return { ok: true, base, url, content };
      lastError = `${response.status} ${response.statusText}${content ? ` - ${content.slice(0, 160)}` : ""}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = /Failed to fetch/i.test(message) ? `${message}. ${NETWORK_ERROR_HELP} URL: ${url}` : message;
    }
  }
  return { ok: false, error: lastError };
}

export const getRequest = (targetPath: string, accept: string, kind = "file") => request("GET", targetPath, { accept, kind });
export const putRequest = (targetPath: string, body: string, contentType = "text/markdown") => request("PUT", targetPath, { body, contentType });
