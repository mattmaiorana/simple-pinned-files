# Changelog

All notable changes to Simple Pinned Files will be documented in this file.

## [1.0.4] - 2026-05-20

### Changed

- Replaced the `builtin-modules` package in the build configuration with Node's built-in `builtinModules` from `node:module`.
- Removed placeholder-like README wording flagged by the Obsidian plugin checker.
- Reworded manual installation paths to avoid angle-bracket placeholders.

### Notes

- No plugin behavior changes.

## [1.0.3] - 2026-05-20

### Changed

- Updated the plugin description for Obsidian community plugin checker compliance.
- Added a README screenshot showing the plugin UI.
- Aligned package metadata with the public plugin description.

### Notes

- No plugin behavior changes.

## [1.0.2] - 2026-05-12

### Fixed

- Hardened sync/live-reload behavior by replacing the boolean save guard with a save refcount, preventing polling reloads from reading stale data during overlapping saves.
- Prevented in-flight reload polling from re-creating native File Explorer pin indicator styles after plugin unload.
- Switched pinned row click and context-menu handling to event delegation so mid-click refreshes cannot destroy row listeners and lose the click.
- Added defensive normalization for externally loaded pinned paths, dropping non-string entries and deduping while preserving order.
- Updated documentation to match current UI behavior: basename-only rows, full-path tooltip, Unpin-only context menu, and native file-row styling.

### Technical

- Added `normalizePinnedPaths()` for load/reload safety.
- Replaced `saving` boolean with `saveCount`.
- Added `unloaded` guard for reload cleanup safety.
- Moved pinned-row click/contextmenu logic to stable view-level listeners.

## [1.0.1] - 2026-05-11

### Fixed

- Added sync-aware live reload for pinned file settings.
- The plugin now periodically checks its own `data.json` for external changes, such as updates from Obsidian Sync.
- Synced pin/unpin changes from another device now update the Pinned Files view and native File Explorer pin indicators without requiring a plugin reload or Obsidian restart.
- The external reload path is read-only and does not call `saveData`, avoiding sync loops.

### Technical

- Added a lightweight 5-second polling mechanism using `loadData`.
- Added order-sensitive `pinnedPaths` comparison.
- Added `saving`/`reloading` guards to avoid races between local saves and external reload checks.
- Documented Obsidian Sync compatibility in `README.md` and `CLAUDE.md`.

## [1.0.0] - 2026-05-11

### Added

- Initial stable release.
- Standalone Pinned Files sidebar view.
- Pin/unpin current file command.
- Native File Explorer context menu item: Pin file / Unpin file.
- Compact native-style pinned file rows.
- One-click open from pinned rows.
- Right-click pinned row menu with Unpin.
- Rename/delete handling for pinned files and parent folders.
- CSS-only native File Explorer pin indicators.
- Lucide-style pin icons.
- Obsidian-native full-path tooltips.
- Safer startup behavior that can add the view to the sidebar without stealing focus.
