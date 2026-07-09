import { writeObsidianFile } from "./request.js";
import { DEFAULT_PROJECT_ROOT } from "./settings.js";
import { normalizeVaultPath } from "./paths.js";

export async function createObsidianProject(projectRoot, projectName) {
  const normalizedRoot = normalizeVaultPath(projectRoot || DEFAULT_PROJECT_ROOT) || DEFAULT_PROJECT_ROOT;
  const cleanedName = String(projectName || "").trim().replace(/[\\/:*?"<>|]/g, "");
  if (!cleanedName) return { ok: false, error: "Project name is required." };

  const targetPath = `${normalizedRoot}/${cleanedName}/Hub.md`;
  const content = `---\ntype: project\nstatus: active\n---\n\n# ${cleanedName}\n`;
  const result = await writeObsidianFile(targetPath, content);
  if (!result.ok) return result;
  return { ok: true, projectName: cleanedName, projectPath: `${normalizedRoot}/${cleanedName}`, createdFile: targetPath };
}
