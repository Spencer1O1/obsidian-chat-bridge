import { requestObsidian } from "./request.js";

export async function fetchObsidianFile(filepath) {
  const result = await requestObsidian(filepath, {
    accept: "text/markdown, text/plain;q=0.9, application/json;q=0.5, */*;q=0.1",
    kind: "file"
  });
  if (!result.ok) return result;
  return { ok: true, content: result.content, base: result.base, url: result.url };
}
