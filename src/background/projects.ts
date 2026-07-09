import { putRequest } from "./request";
import { DEFAULT_PROJECT_ROOT } from "./settings";
import { normalizeProjectRoot } from "./paths";
import type { ProjectResult } from "../shared/types";

export async function createObsidianProject(projectRoot: string, projectName: string): Promise<ProjectResult> {
  const normalizedRoot = normalizeProjectRoot(projectRoot || DEFAULT_PROJECT_ROOT) || DEFAULT_PROJECT_ROOT;
  const cleanedName = String(projectName || "").trim().replace(/[\\/:*?"<>|]/g, "");
  if (!cleanedName) return { ok: false, error: "Project name is required." };
  const projectPath = `${normalizedRoot}/${cleanedName}`;
  const createdFile = `${projectPath}/Hub.md`;
  const result = await putRequest(createdFile, `---\ntype: project\nstatus: active\n---\n\n# ${cleanedName}\n`);
  return result.ok ? { ok: true, projectName: cleanedName, projectPath, createdFile } : result;
}
