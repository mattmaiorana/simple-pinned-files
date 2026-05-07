# Simple Pinned Files

A small Obsidian plugin that adds a standalone Pinned Files view for quickly accessing important files and notes.

## Features

- Custom Pinned Files sidebar view
- Pin/unpin current file command
- File Explorer context menu item: Pin file / Unpin file
- Pinned rows show file name and parent folder/full path
- One-click open from pinned list
- Right-click pinned row menu: Open / Unpin
- Handles rename/delete of pinned files and folders
- Optional native File Explorer pin indicators using CSS-only decoration

## Non-goals / intentional simplicity

- Does not replace or rebuild Obsidian's File Explorer
- Does not manage sidebar layout
- Does not implement search
- Does not use frontmatter or bookmarks as the source of truth
- Does not use Svelte/React

## Installation (manual testing)

1. Run `npm install`
2. Run `npm run build`
3. Copy `manifest.json`, `main.js`, and `styles.css` into:
   ```
   <vault>/.obsidian/plugins/simple-pinned-files/
   ```
4. Enable the plugin in Obsidian → Settings → Community plugins.

## Development

- `npm run dev` — watch-mode build
- `npm run build` — production build (type-checks then bundles)

## Basic usage

- Open command palette → **Open Simple Pinned Files**
- Right-click a file in the File Explorer → **Pin file**
- Right-click a pinned row in the Pinned Files view → **Open** or **Unpin**

## Status

MVP / early development.
