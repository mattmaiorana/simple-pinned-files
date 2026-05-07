# Simple Pinned Files — Claude Notes

## Project status

- This is a working MVP Obsidian plugin.
- The plugin is intentionally small and focused.
- Core behavior is working:
  - pinned files view
  - pin/unpin current file
  - native file menu Pin/Unpin
  - one-click open from pinned rows
  - rename/delete handling
  - Lucide-style pin icons
  - CSS-only native File Explorer pin indicators

## Core architecture

- Plugin id: `simple-pinned-files`
- View type: `simple-pinned-files-view`
- Source of truth: plugin settings / `pinnedPaths`
- The plugin registers a standalone `ItemView` called Pinned Files.
- The plugin does not render a custom file tree.
- The plugin does not modify Obsidian's native File Explorer DOM nodes.
- Native File Explorer pin indicators are implemented through a managed `<style>` element targeting `data-path` selectors.
- `PinnedFilesView` instances register/unregister with the plugin so refreshes use live view instances instead of relying on `getLeavesOfType` and `instanceof` checks.

## Important lessons / constraints

- Do not rebuild Obsidian's File Explorer.
- Do not manage sidebar layout in this plugin.
- Do not add search unless explicitly requested later.
- Do not add drag-and-drop reorder unless explicitly requested later.
- Do not integrate bookmarks/frontmatter unless explicitly requested later.
- Do not introduce Svelte/React.
- Keep the plugin boring, reliable, and native-feeling.

## Known bug history

Important bug and fix to remember:

- **Bug:** pinned file sometimes required a second click/action to appear or open.
- **Cause 1:** Obsidian `DeferredView` made `getLeavesOfType` + `instanceof` unreliable for refreshing the view.
- **Fix 1:** plugin tracks live `PinnedFilesView` instances in a `Set`.
- **Cause 2:** `active-leaf-change` was rebuilding the row DOM between `mousedown` and `mouseup`, causing the `click` event to miss the original row.
- **Fix 2:** `active-leaf-change` now only toggles active classes via `updateActiveStates`; full refresh is reserved for list changes like pin/unpin/rename/delete.

## Design direction

- Calm, native Obsidian feel.
- Pinned rows are gray cards by default.
- Hover and active states use Obsidian accent fill.
- Use Obsidian CSS variables.
- Pin icons should match Obsidian/Lucide style, not emoji.

## Useful commands

- `npm run dev`
- `npm run build`
- `git status`
- `git add .`
- `git commit -m "<message>"`

## Testing checklist

- Build succeeds.
- Plugin enables in a test vault.
- Pinned Files view opens.
- Right-click native File Explorer file → Pin file.
- Pinned row appears immediately.
- One click opens pinned file immediately.
- Right-click pinned row shows Open / Unpin.
- Rename pinned file updates path.
- Rename parent folder updates child pinned paths.
- Delete pinned file removes pin.
- Native File Explorer pin indicator appears/disappears.
- Disabling plugin removes native File Explorer pin indicators.
