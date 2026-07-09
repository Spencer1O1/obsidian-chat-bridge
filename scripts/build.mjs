import { mkdir, cp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build, context } from "esbuild";

const root = process.cwd();
const dist = path.join(root, "dist");
const watch = process.argv.includes("--watch");

const entryPoints = {
  content: path.join(root, "src/content/index.ts"),
  background: path.join(root, "src/background/index.ts"),
  popup: path.join(root, "src/popup/index.ts")
};

const manifest = {
  manifest_version: 3,
  name: "Obsidian Chat Bridge",
  version: "1.6.0",
  description: "Adds bridge controls to chat UIs, starts bridge setup prompts, and loads Obsidian context through Local REST API.",
  permissions: ["storage"],
  host_permissions: ["https://chatgpt.com/*", "https://chat.openai.com/*", "https://127.0.0.1:27124/*"],
  background: { service_worker: "background.js", type: "module" },
  content_scripts: [{
    matches: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
    js: ["content.js"],
    css: ["styles.css"],
    run_at: "document_idle"
  }],
  web_accessible_resources: [{ resources: ["styles.css", "res/logo.png"], matches: ["https://chatgpt.com/*", "https://chat.openai.com/*"] }],
  icons: { 16: "res/logo.png", 32: "res/logo.png", 48: "res/logo.png", 128: "res/logo.png" },
  action: {
    default_title: "Obsidian Chat Bridge",
    default_icon: { 16: "res/logo.png", 32: "res/logo.png", 48: "res/logo.png", 128: "res/logo.png" },
    default_popup: "popup.html"
  }
};

async function copyAssets() {
  await mkdir(path.join(dist, "res"), { recursive: true });
  await cp(path.join(root, "styles.css"), path.join(dist, "styles.css"));
  await cp(path.join(root, "src/popup/popup.css"), path.join(dist, "popup.css"));
  await cp(path.join(root, "res/logo.png"), path.join(dist, "res/logo.png"));
  const popupHtml = await readFile(path.join(root, "src/popup/popup.html"), "utf8");
  await writeFile(path.join(dist, "popup.html"), popupHtml.replace('src="index.js"', 'src="popup.js"'));
  await writeFile(path.join(dist, "manifest.json"), JSON.stringify(manifest, null, 2));
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await copyAssets();

const options = {
  entryPoints,
  outdir: dist,
  bundle: true,
  format: "esm",
  target: "es2022",
  sourcemap: true,
  logLevel: "info"
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("Watching TypeScript extension build...");
} else {
  await build(options);
}
