import { openExtensionPopup } from "./runtime";
import type { BridgeSettings } from "../../shared/types";

export function getSetupRequirementsMessage(settings: BridgeSettings) {
  const missingVaultName = !String(settings.vaultName || "").trim();
  const missingApiKey = !String(settings.apiKey || "").trim();
  if (!missingVaultName && !missingApiKey) return "";
  if (missingVaultName && missingApiKey) return "You need to set your vault name and API key in the Bridge popup.";
  if (missingVaultName) return "You need to set your vault name in the Bridge popup.";
  return "You need to set your API key in the Bridge popup.";
}

export async function ensureSetupReady(settings: BridgeSettings) {
  const setupMessage = getSetupRequirementsMessage(settings);
  if (!setupMessage) return true;
  alert(setupMessage);
  await openExtensionPopup();
  return false;
}
