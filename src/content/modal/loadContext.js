(function initObsidianBridgeLoadContext(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const modal = bridge.modalInternals = bridge.modalInternals || {};

  modal.loadSelectionIntoPrompt = async function loadSelectionIntoPrompt(settings, activeProjectContext) {
    const selectedPaths = await modal.showFileExplorerDialog({
      title: "Vault Files",
      subtitle: activeProjectContext?.projectName
        ? `Browse anywhere in vault ${settings.vaultName} and select notes to load. Current default project: ${activeProjectContext.projectName}.`
        : `Browse anywhere in vault ${settings.vaultName} and select notes to load.`,
      startDir: "",
      selectedPaths: new Set(),
      rootLabel: "Vault root",
      doneLabel: "Load",
      showSelectionSummary: true
    });
    if (!selectedPaths?.length) return;

    const sections = [];
    const missing = [];
    for (const filepath of selectedPaths) {
      const result = await modal.fetchObsidianFile(filepath);
      if (result.ok) sections.push(`--- ${filepath} ---\n${result.content || ""}`.trim());
      else missing.push(`${filepath}: ${result.error || "not found"}`);
    }

    let prompt = `${bridge.prompts.contextPrompt({
      vaultName: settings.vaultName,
      projectName: activeProjectContext?.projectName || "",
      projectRoot: activeProjectContext?.projectRoot || settings.defaultProjectRoot,
      selectedPaths
    })}\n\n`;
    if (sections.length) prompt += sections.join("\n\n") + "\n";
    if (missing.length) prompt += `\n--- Files not loaded ---\n${missing.map(item => `- ${item}`).join("\n")}\n`;

    if (!bridge.chatgptUi.insertAndSend(prompt)) {
      await bridge.chatgptUi.copyText(prompt);
      alert("Could not find the ChatGPT composer. Loaded context copied to clipboard.");
    }
  };
})(window);
