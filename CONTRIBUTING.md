# Contributing

Thanks for contributing to `Obsidian Chat Bridge`.

## Project goals

This project is trying to make AI chat sessions work better with Obsidian as the source of truth.

Good contributions usually improve one or more of these:

- reliability when reading current vault context
- clarity and safety of write-back behavior
- UI quality of the in-chat bridge controls
- maintainability of the TypeScript codebase
- portability toward future non-ChatGPT chat interfaces

## Before you change code

Please keep these constraints in mind:

- Obsidian is the source of truth
- The extension should prefer explicit, inspectable flows over hidden automation
- The runtime setup prompt in `src/content/prompts.ts` is canonical
- The extension is HTTPS-only for the Local REST API path
- Styling should remain centralized in `styles.css`

## Development setup

```bash
npm install
npm run typecheck
npm run build
```

Load `dist/` as an unpacked extension in your browser.

To exercise the full workflow locally, you will also need:

- Obsidian
- Obsidian Local REST API
- Obsidian Advanced URI
- a trusted local certificate for `https://127.0.0.1:27124` if your system does not already trust it

## Making changes

- Prefer focused, reviewable changes
- Keep TypeScript source under `src/` as the primary implementation
- Treat `dist/` as generated build output
- Keep user-facing copy public-ready and vault-agnostic
- Avoid reintroducing hardcoded personal vault names or project names
- Preserve current behavior unless a change intentionally updates the workflow

## Validation

Before opening a pull request, run:

```bash
npm run typecheck
npm run build
```

If your change affects the bridge flow, also manually verify the relevant behavior in the browser:

- popup settings save/load
- start prompt insertion
- vault file loading
- bridge block detection
- write-back into Obsidian

## Pull requests

A good pull request should explain:

- what problem it solves
- why the current behavior was insufficient
- how the change was validated
- any known follow-up work or limitations

## Areas that are especially helpful

- cross-browser behavior for Chromium-based browsers
- making the read/write flows more robust
- reducing friction in setup and certificate trust
- improving provider abstraction without breaking current ChatGPT support
- documentation and publishing readiness
