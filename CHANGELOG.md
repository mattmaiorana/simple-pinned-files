# Changelog

All notable changes to Simple Pinned Files will be documented in this file.

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
