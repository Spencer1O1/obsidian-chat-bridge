# Obsidian Chat Bridge

`Obsidian Chat Bridge` is a browser extension that connects AI chat interfaces to an Obsidian vault.

Right now it supports ChatGPT. The long-term goal is broader support for chat interfaces that can benefit from reading current note context and writing structured updates back into Obsidian.

## Why this exists

AI chats are useful for planning, drafting, summarizing, and restructuring knowledge work, but the real source of truth often lives in Obsidian.

This project makes that workflow less manual by letting a chat session:

- load current note contents from an Obsidian vault as context
- generate structured write instructions back into Obsidian
- keep note updates tied to explicit vault-relative paths
- preserve Obsidian as the source of truth instead of treating the chat itself as the canonical record

In practice, that means you can work in ChatGPT while still grounding the conversation in your actual notes and pushing changes back into the vault in a controlled way.

## Current capabilities

- Adds `Start Obsidian Chat Bridge` and `Load Obsidian Context` controls inside ChatGPT
- Sends a canonical setup prompt that teaches the active chat how to emit bridge blocks
- Loads current markdown files from your vault through Obsidian Local REST API
- Supports optional default project scope plus vault-wide ad hoc file loading
- Detects structured `obsidian_*@...` bridge blocks in assistant output
- Writes note updates through Obsidian Local REST API
- Uses an upsert model: write blocks create missing files automatically

## How it works

The bridge has two main flows:

1. Read from Obsidian into the chat
   - You select vault files in the extension UI
   - The extension fetches their current contents from Obsidian Local REST API
   - Those contents are sent into the chat as trusted context

2. Write from the chat back into Obsidian
   - The chat responds with structured bridge blocks such as `obsidian_append@...` or `obsidian_overwrite@...`
   - The extension detects those blocks and adds action buttons
   - Clicking a button writes the content through Obsidian Local REST API

## Current limitations

- Only ChatGPT is supported today
- Requires the Obsidian Local REST API plugin for reads and writes
- Uses a local HTTPS endpoint at `https://127.0.0.1:27124`
- If your machine does not trust the Local REST API certificate yet, you must install it into the Root Certificate Authority store

## Installation

### 1. Clone and build

```bash
npm install
npm run build
```

The unpacked extension is emitted into `dist/`.

### 2. Load the extension

Load `dist/` as an unpacked extension in your Chromium-based browser.

### 3. Configure Obsidian

In Obsidian:

1. Install and enable `Local REST API`
2. Copy the Local REST API key

### 4. Trust the local certificate

If requests to `https://127.0.0.1:27124` fail due to certificate trust:

1. Open `https://127.0.0.1:27124/obsidian-local-rest-api.crt`
2. Download the certificate
3. Install it into the `Root Certificate Authority` store on your machine

### 5. Configure the extension popup

Set:

- `Vault name`
- `Default project root` such as `Projects`
- `Local REST API key`

## Development

### Commands

```bash
npm run typecheck
npm run build
npm run watch
```

### Structure

- `src/content/` injects bridge UI into the chat page and handles bridge blocks
- `src/background/` talks to Obsidian Local REST API and routes runtime messages
- `src/popup/` contains the extension popup UI
- `src/shared/` contains shared constants and types
- `scripts/build.mjs` bundles the TypeScript source and writes the unpacked extension to `dist/`

## Product direction

The name is intentionally provider-neutral.

Even though the extension currently targets ChatGPT, the larger idea is simple: let AI chat interfaces interact with Obsidian vaults in a way that is explicit, inspectable, and grounded in the vault as the system of record.

## Contributing

See `CONTRIBUTING.md`.

## Security

See `SECURITY.md`.

## Screenshots

<img width="1434" height="564" alt="image" src="https://github.com/user-attachments/assets/944e143a-53ce-4b8b-8817-e59343eb0cb1" />
<img width="1532" height="750" alt="image" src="https://github.com/user-attachments/assets/a3c04a18-a24e-42b7-8729-2b47fc78ff7b" />
<img width="1448" height="1198" alt="image" src="https://github.com/user-attachments/assets/417bd563-a58e-45bd-a194-d96047147478" />
<img width="1540" height="860" alt="image" src="https://github.com/user-attachments/assets/b03c84c3-bc7f-4f37-afaf-a87098253a37" />
<img width="1526" height="1200" alt="image" src="https://github.com/user-attachments/assets/d99431ed-d807-4bfd-ac6c-38ed13f3787e" />
<img width="1476" height="900" alt="image" src="https://github.com/user-attachments/assets/c72b06a7-36b2-42cd-89b0-da9b755c389c" />

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
