import { setupPrompt } from "../prompts";
import * as chatgptUi from "../chatgptUi";
import { ensureSetupReady } from "./setup";
import { getSettings } from "./runtime";
import { showStartDialog } from "./startDialog";
import { loadSelectionIntoPrompt } from "./loadContext";
import type { ActiveProjectContext } from "../../shared/types";

let activeProjectContext: ActiveProjectContext = null;

export async function startBridge() {
  const settings = await getSettings();
  if (!await ensureSetupReady(settings)) return;
  const selection = await showStartDialog(settings, activeProjectContext?.projectName || "");
  activeProjectContext = selection.project ? { projectName: selection.project, projectRoot: selection.projectRoot } : null;
  const prompt = setupPrompt({ vaultName: settings.vaultName, projectName: selection.project || "", projectRoot: selection.projectRoot });
  if (!chatgptUi.insertAndSend(prompt)) { await chatgptUi.copyText(prompt); alert("Could not find the ChatGPT composer. Setup prompt copied to clipboard."); }
}

export async function loadObsidianContext() {
  const settings = await getSettings();
  if (!await ensureSetupReady(settings)) return;
  await loadSelectionIntoPrompt(settings, activeProjectContext);
}
