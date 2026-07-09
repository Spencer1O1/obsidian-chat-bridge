(function initObsidianBridgeModalSetup(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const modal = bridge.modalInternals = bridge.modalInternals || {};

  function getSetupRequirementsMessage(settings = {}) {
    const missingVaultName = !String(settings.vaultName || "").trim();
    const missingApiKey = !String(settings.apiKey || "").trim();
    if (!missingVaultName && !missingApiKey) return "";
    if (missingVaultName && missingApiKey) {
      return "You need to set your vault name and API key in the Bridge popup.";
    }
    if (missingVaultName) return "You need to set your vault name in the Bridge popup.";
    return "You need to set your API key in the Bridge popup.";
  }

  async function ensureSetupReady(settings) {
    const setupMessage = getSetupRequirementsMessage(settings);
    if (!setupMessage) return true;
    alert(setupMessage);
    await modal.openExtensionPopup();
    return false;
  }

  modal.getSetupRequirementsMessage = getSetupRequirementsMessage;
  modal.ensureSetupReady = ensureSetupReady;
})(window);
