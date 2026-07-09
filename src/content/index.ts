import { FLOATING_CONTAINER_ID, LOAD_BUTTON_ID, START_BUTTON_ID } from "../shared/constants";
import { isNewConversationScreen, findComposer } from "./chatUi";
import { loadObsidianContext, startBridge } from "./modal/index";
import { processCustomObsidianBlocks, removeDuplicateBars } from "./bridgeBlocks";

function findControlsHost() {
  const composer = findComposer();
  if (!composer) return null;
  const form = composer.closest("form");
  if (!form?.parentElement) return null;
  return { parent: form.parentElement, anchor: form };
}

function ensureFloatingButtons() {
  const host = findControlsHost();
  if (!host) return;
  let container = document.getElementById(FLOATING_CONTAINER_ID) as HTMLDivElement | null;
  if (!container) { container = document.createElement("div"); container.id = FLOATING_CONTAINER_ID; }
  if (container.parentElement !== host.parent || container.nextElementSibling !== host.anchor) {
    host.parent.insertBefore(container, host.anchor);
  }

  const shouldShowStart = isNewConversationScreen();
  let startButton = document.getElementById(START_BUTTON_ID) as HTMLButtonElement | null;
  if (shouldShowStart) {
    document.getElementById(LOAD_BUTTON_ID)?.remove();
    if (!startButton) {
      startButton = document.createElement("button");
      startButton.id = START_BUTTON_ID;
      startButton.type = "button";
      startButton.textContent = "Start Obsidian Chat Bridge";
      startButton.title = "Send the bridge setup prompt to the current chat.";
      startButton.addEventListener("click", startBridge);
    }
    if (startButton.parentElement !== container) container.appendChild(startButton);
  } else {
    startButton?.remove();
  }

  let loadButton = document.getElementById(LOAD_BUTTON_ID) as HTMLButtonElement | null;
  if (!shouldShowStart) {
    if (!loadButton) {
      loadButton = document.createElement("button");
      loadButton.id = LOAD_BUTTON_ID;
      loadButton.type = "button";
      loadButton.textContent = "Load Obsidian Context";
      loadButton.title = "Load current Obsidian files through Local REST API and send them to the current chat as context.";
      loadButton.addEventListener("click", loadObsidianContext);
    }
    if (loadButton.parentElement !== container) container.appendChild(loadButton);
  } else {
    loadButton?.remove();
  }
}

function scan() {
  ensureFloatingButtons();
  processCustomObsidianBlocks(document);
  removeDuplicateBars();
}

let scanFrame = 0;
function scheduleScan() {
  if (scanFrame) return;
  scanFrame = requestAnimationFrame(() => {
    scanFrame = 0;
    scan();
  });
}

scan();
new MutationObserver(scheduleScan).observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true
});
