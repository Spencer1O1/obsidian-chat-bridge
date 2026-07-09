(function initObsidianBridgeModalRuntime(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const modal = bridge.modalInternals = bridge.modalInternals || {};

  function send(type, payload = {}) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type, ...payload }, response => {
        resolve(response || { ok: false, error: "No response" });
      });
    });
  }

  modal.getSettings = () => send("GET_SETTINGS");
  modal.fetchObsidianFile = filepath => send("FETCH_OBSIDIAN_FILE", { filepath });
  modal.listObsidianDirectory = dirpath => send("LIST_OBSIDIAN_DIRECTORY", { dirpath });
  modal.openExtensionPopup = () => send("OPEN_EXTENSION_POPUP");
  modal.createObsidianProject = (projectRoot, projectName) => (
    send("CREATE_OBSIDIAN_PROJECT", { projectRoot, projectName })
  );
})(window);
