# Security

`Obsidian Chat Bridge` interacts with local note data, so security and data clarity matter.

## Scope

The extension currently:

- reads note contents from the local Obsidian Local REST API endpoint
- writes note updates through the local Obsidian Local REST API endpoint when the user clicks a bridge-block button
- stores the Local REST API key and extension settings in browser local storage

## Reporting a vulnerability

If you find a security issue, please avoid posting exploit details in a public issue before there is time to assess and fix it.

Until a dedicated security contact exists for this project, open an issue only if the report can be shared safely without exposing users or local vault data.

## Current security posture

- The extension is designed for `https://127.0.0.1:27124`
- Local HTTP fallback is intentionally not supported
- The Local REST API certificate may need to be trusted on the local machine
- Note writes are user-triggered through bridge blocks and Local REST API only
- Obsidian remains the source of truth; the extension does not sync vault data to a remote server

## User caution

- Treat AI-generated vault updates as reviewable output, not unquestioned truth
- Be careful when loading sensitive notes into any AI chat interface
- Confirm your browser extension settings and local Obsidian plugin settings before use
- Rotate your Local REST API key if it was ever committed to version control
