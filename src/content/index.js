(function initObsidianBridgeContent(global) {
  const bridge = global.ObsidianChatGPTBridge = global.ObsidianChatGPTBridge || {};
  const {
    FLOATING_CONTAINER_ID,
    START_BUTTON_ID,
    LOAD_BUTTON_ID
  } = bridge.constants;

  function findControlsHost() {
    const composer = bridge.chatgptUi.findComposer();
    if (!composer) return null;
    const form = composer.closest("form");
    const sendButton = form?.querySelector("button[data-testid='send-button'], button[aria-label='Send prompt'], button[aria-label*='Send']");
    const actionRow = sendButton?.parentElement;
    if (actionRow?.parentElement) {
      return {
        parent: actionRow.parentElement,
        anchor: actionRow,
        inline: true
      };
    }
    if (form?.parentElement) {
      return {
        parent: form.parentElement,
        anchor: form,
        inline: false
      };
    }
    return null;
  }

  function ensureFloatingButtons() {
    const host = findControlsHost();
    if (!host) return;

    let container = document.getElementById(FLOATING_CONTAINER_ID);
    if (!container) {
      container = document.createElement("div");
      container.id = FLOATING_CONTAINER_ID;
    }
    container.toggleAttribute("data-inline-host", Boolean(host.inline));
    if (container.parentElement !== host.parent || container.nextElementSibling !== host.anchor) {
      host.parent.insertBefore(container, host.anchor);
    }

    const shouldShowStart = bridge.chatgptUi.isNewChatScreen();

    let loadButton = document.getElementById(LOAD_BUTTON_ID);
    if (!loadButton) {
      loadButton = document.createElement("button");
      loadButton.id = LOAD_BUTTON_ID;
      loadButton.type = "button";
      loadButton.textContent = "Load Obsidian Context";
      loadButton.title = "Load current Obsidian files through Local REST API and send them to ChatGPT as context.";
      loadButton.addEventListener("click", bridge.modal.loadObsidianContext);
      container.appendChild(loadButton);
    }

    let startButton = document.getElementById(START_BUTTON_ID);
    if (shouldShowStart) {
      if (!startButton) {
        startButton = document.createElement("button");
        startButton.id = START_BUTTON_ID;
        startButton.type = "button";
        startButton.textContent = "Start Obsidian Bridge";
        startButton.title = "Choose a project and send the bridge setup prompt to ChatGPT.";
        startButton.addEventListener("click", bridge.modal.startBridge);
      }
      if (startButton.parentElement !== container) container.appendChild(startButton);
    } else if (startButton) {
      startButton.remove();
    }
  }

  function scan(root = document) {
    ensureFloatingButtons();
    bridge.bridgeBlocks.processAnchors(root);
    bridge.bridgeBlocks.processCustomObsidianBlocks(root);
    bridge.bridgeBlocks.processCodeBlocks(root);
    bridge.bridgeBlocks.processPlainText(root);
    bridge.bridgeBlocks.removeDuplicateBars();
  }

  let scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      scan();
    });
  }

  scan();

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})(window);
