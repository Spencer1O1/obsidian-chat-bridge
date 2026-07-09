(function initObsidianBridgeModal(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const modal = bridge.modalInternals = bridge.modalInternals || {};
  const state = bridge.modalState = bridge.modalState || { activeProjectContext: null };

  async function startBridge() {
    const settings = await modal.getSettings();
    if (!await modal.ensureSetupReady(settings)) return;
    const selection = await modal.showStartDialog(settings, state.activeProjectContext?.projectName || "");
    if (!selection) return;
    state.activeProjectContext = selection.project ? selection : null;
    const prompt = bridge.prompts.setupPrompt({
      vaultName: settings.vaultName,
      projectName: selection.project || "",
      projectRoot: selection.projectRoot
    });
    if (!bridge.chatgptUi.insertAndSend(prompt)) {
      await bridge.chatgptUi.copyText(prompt);
      alert("Could not find the ChatGPT composer. Setup prompt copied to clipboard.");
    }
  }

  async function loadObsidianContext() {
    const settings = await modal.getSettings();
    if (!await modal.ensureSetupReady(settings)) return;
    await modal.loadSelectionIntoPrompt(settings, state.activeProjectContext);
  }

  bridge.modal = { startBridge, loadObsidianContext };
})(window);
