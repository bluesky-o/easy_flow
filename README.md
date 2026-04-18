# Easy Flow

Easy Flow is a Vue + TypeScript browser extension for bookmark management.

It provides:
- A popup page: `popup.html`
- A custom new tab page: `dashboard.html`

## Prerequisites

- Node.js 18+ (Node.js 20 LTS recommended)
- npm (comes with Node.js)
- A Chromium browser (Chrome or Brave) and/or Firefox

## Install Dependencies

Run from the project root:

npm install

## Build the Extension

Create a production build:

npm run build

This generates the extension output in the `dist/` folder, including:
- `dist/manifest.json`
- `dist/popup.html`
- `dist/dashboard.html`

## Run in Browser (Recommended)

### Chrome / Brave (Load Unpacked)

1. Build the project:

	npm run build

2. Open extension management:
- Chrome: `chrome://extensions`
- Brave: `brave://extensions`

3. Enable Developer mode.
4. Click Load unpacked.
5. Select the `dist/` folder.
6. Test:
- Click the Easy Flow toolbar icon to open the popup.
- Open a new tab to load the dashboard page.

After code changes, rebuild with `npm run build` and click Reload on the extension card.

### Firefox (Temporary Add-on)

1. Build the project:

	npm run build

2. Open `about:debugging#/runtime/this-firefox`
3. Click Load Temporary Add-on.
4. Select `dist/manifest.json`.
5. Test popup and new tab behavior.

Note: temporary add-ons are removed when Firefox restarts.

## Local Development Preview (UI only)

If you want to quickly preview pages in a browser tab:

npm run dev

Then open the local URL shown in terminal (usually `http://localhost:5173`).

Important:
- This mode is useful for UI iteration.
- Browser-extension APIs (`chrome.*` / `browser.*`) may not behave the same as when loaded as an extension.

## Other Scripts

- `npm run preview` - preview the production build locally
- `npm run watch` - rebuild automatically on file changes

## Project Structure

- `dashboard.html` - new tab entry page
- `popup.html` - extension popup entry page
- `public/manifest.json` - extension manifest (copied into build)
- `src/pages/` - Vue pages
- `src/core/`, `src/services/`, `src/storage/` - app logic and data layer

## Quick Start

npm install
npm run build

Then load `dist/` as an unpacked extension in your browser.
