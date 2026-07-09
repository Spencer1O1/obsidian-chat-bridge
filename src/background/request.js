import { DEFAULT_API_BASE, getSettings } from "./settings.js";
import { candidateVaultUrls, normalizeBase } from "./paths.js";

const NETWORK_ERROR_HELP = "Network request failed. If Obsidian Local REST API uses a self-signed HTTPS certificate, the browser extension may not trust it yet.";

async function send(method, path, { accept, kind = "file", contentType, body } = {}) {
  const { apiBase, apiKey } = await getSettings();
  if (!apiKey) return { ok: false, error: "Missing Obsidian Local REST API key." };
  let lastError = "Unknown error";
  const base = normalizeBase(apiBase) || DEFAULT_API_BASE;

  for (const url of candidateVaultUrls(base, path, kind)) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...(accept ? { Accept: accept } : {}),
          ...(contentType ? { "Content-Type": contentType } : {})
        },
        ...(body == null ? {} : { body })
      });
      const text = await response.text();
      if (response.ok) return { ok: true, base, url, content: text };
      lastError = `${response.status} ${response.statusText}${text ? ` - ${text.slice(0, 160)}` : ""}`;
    } catch (err) {
      const message = err?.message || String(err);
      lastError = /Failed to fetch/i.test(message) ? `${message}. ${NETWORK_ERROR_HELP} URL: ${url}` : message;
    }
  }
  return { ok: false, error: lastError };
}

export const requestObsidian = (path, options) => send("GET", path, options);
export const writeObsidianFile = (filepath, content, contentType = "text/markdown") => (
  send("PUT", filepath, { kind: "file", contentType, body: String(content || "") })
);
