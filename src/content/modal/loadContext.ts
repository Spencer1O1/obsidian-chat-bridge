import { contextPrompt } from "../prompts";
import type { ActiveProjectContext, BridgeSettings } from "../../shared/types";
import { showFileExplorerDialog, loadFiles } from "./explorer";
import * as chatgptUi from "../chatgptUi";

export async function loadSelectionIntoPrompt(settings: BridgeSettings, activeProjectContext: ActiveProjectContext) {
  const selectedPaths = await showFileExplorerDialog({
    title: "Vault Files",
    subtitle: activeProjectContext?.projectName ? `Browse anywhere in vault ${settings.vaultName} and select notes to load. Current default project: ${activeProjectContext.projectName}.` : `Browse anywhere in vault ${settings.vaultName} and select notes to load.`,
    startDir: "",
    selectedPaths: new Set(),
    rootLabel: "Vault root",
    doneLabel: "Load",
    showSelectionSummary: true
  });
  if (!selectedPaths.length) return;
  const { sections, missing } = await loadFiles(selectedPaths);
  let prompt = `${contextPrompt({ vaultName: settings.vaultName, projectName: activeProjectContext?.projectName || "", projectRoot: activeProjectContext?.projectRoot || settings.defaultProjectRoot, selectedPaths })}\n\n`;
  if (sections.length) prompt += sections.join("\n\n") + "\n";
  if (missing.length) prompt += `\n--- Files not loaded ---\n${missing.map(item => `- ${item}`).join("\n")}\n`;
  if (!chatgptUi.insertAndSend(prompt)) { await chatgptUi.copyText(prompt); alert("Could not find the ChatGPT composer. Loaded context copied to clipboard."); }
}
