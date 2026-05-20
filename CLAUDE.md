# Simple Pinned Files — Claude Notes

## Project status

- v1.0.5 — stable. v1.0.0 was the initial stable release; v1.0.1 added sync-aware live reload; v1.0.2 hardened the sync/reload path, switched pinned-row events to delegation, and added defensive pinned-path normalization; v1.0.3 was a publication-readiness patch (plugin description compliance, README screenshot, package metadata alignment); v1.0.4 cleared the remaining Obsidian plugin checker warnings (replaced `builtin-modules` with Node's `node:module`, removed placeholder-like README content); v1.0.5 tightened the polling reload's `saveCount` re-check after `await loadData()` and added the `.github/workflows/release.yml` workflow that creates attested releases from semver tags. No user-visible behavior changes in 1.0.3, 1.0.4, or 1.0.5.
- The plugin is intentionally small and focused.
- Core behavior is working:
  - pinned files view
  - pin/unpin current file
  - native file menu Pin/Unpin
  - one-click open from pinned rows
  - rename/delete handling
  - Lucide-style pin icons
  - CSS-only native File Explorer pin indicators
  - Obsidian Sync live reload via polling `loadData()`

## Core architecture

- Plugin id: `simple-pinned-files`
- View type: `simple-pinned-files-view`
- Source of truth: plugin settings / `pinnedPaths`
- The plugin registers a standalone `ItemView` called Pinned Files.
- The plugin does not render a custom file tree.
- The plugin does not modify Obsidian's native File Explorer DOM nodes.
- Native File Explorer pin indicators are implemented through a managed `<style>` element targeting `data-path` selectors.
- `PinnedFilesView` instances register/unregister with the plugin so refreshes use live view instances instead of relying on `getLeavesOfType` and `instanceof` checks.

## Sync / external-change live reload

- Plugin data lives at `.obsidian/plugins/simple-pinned-files/data.json`. This is outside the vault file tree, so `vault.on("modify")` does not reliably fire for it on either desktop or mobile.
- The plugin polls `loadData()` every 5 seconds via `registerInterval(window.setInterval(...))` and calls `reloadSettingsFromDiskIfChanged()`.
- The poll compares the disk `pinnedPaths` against in-memory `pinnedPaths` (length + order-sensitive equality). If different, it replaces in-memory settings and calls `refreshView()` + `updateExplorerStyles()`.
- **Critical invariant: the reload path must never call `saveData()`.** Local pin/unpin is the only operation that writes `data.json`. The reload path is strictly read-only to avoid sync-write loops with Obsidian Sync.
- Three guards prevent races and unload glitches:
  - `saveCount` is a refcount around `saveData`. The reload bails while any save is in flight, so concurrent or overlapping saves cannot expose a stale-read window.
  - `reloading` blocks overlapping polls.
  - `unloaded` is set first thing in `onunload()` and re-checked after the `await this.loadData()` inside the poll, so an in-flight reload cannot re-create the explorer `<style>` after the plugin has been disabled.
- 5s is a deliberate trade-off: fast enough that synced pins appear within a few seconds, slow enough that polling cost is negligible (the file is tiny).
- Loaded `pinnedPaths` is run through `normalizePinnedPaths` on both `loadSettings` and `reloadSettingsFromDiskIfChanged`: non-arrays become `[]`, non-string entries are dropped, duplicates are removed while preserving first-occurrence order. Normalization is in-memory only — it never writes back.

## Important lessons / constraints

- Do not rebuild Obsidian's File Explorer.
- Do not manage sidebar layout in this plugin.
- Do not add search unless explicitly requested later.
- Do not add drag-and-drop reorder unless explicitly requested later.
- Do not integrate bookmarks/frontmatter unless explicitly requested later.
- Do not introduce Svelte/React.
- Keep the plugin boring, reliable, and native-feeling.

## Known bug history

Important bugs and fixes to remember:

- **Bug:** pinned file sometimes required a second click/action to appear or open.
- **Cause 1:** Obsidian `DeferredView` made `getLeavesOfType` + `instanceof` unreliable for refreshing the view.
- **Fix 1:** plugin tracks live `PinnedFilesView` instances in a `Set`.
- **Cause 2:** `active-leaf-change` was rebuilding the row DOM between `mousedown` and `mouseup`, causing the `click` event to miss the original row.
- **Fix 2:** `active-leaf-change` now only toggles active classes via `updateActiveStates`; full refresh is reserved for list changes like pin/unpin/rename/delete.
- **Fix 2b (1.0.2):** even with `active-leaf-change` narrowed, *any* refresh (polling reload, vault rename/delete, "Clear all") could still destroy a row between mousedown and mouseup. Click and contextmenu now use event delegation on `contentEl`, so the listener survives row rebuilds.

1.0.2 sync-hardening notes:

- The boolean `saving` flag was replaced with a `saveCount` refcount. The original boolean cleared on the first concurrent save's completion, opening a stale-read window for the polling reload.
- An `unloaded` flag prevents an in-flight reload from re-creating the explorer `<style>` after `onunload`.
- `normalizePinnedPaths` defensively handles non-array, non-string, and duplicate entries that could arrive via Obsidian Sync or hand-edited `data.json`.

## Design direction

- Calm, native Obsidian feel.
- Pinned rows match the native File Explorer's `nav-file-title` styling: transparent default, hover/active backgrounds via Obsidian's `--nav-item-*` variables. No card-style or accent-fill treatment.
- Use Obsidian CSS variables only; avoid hardcoded theme colors.
- Pin icons should match Obsidian/Lucide style, not emoji.

## Useful commands

- `npm run dev`
- `npm run build`
- `git status`
- `git add .`
- `git commit -m "<message>"`

## Release process

- Public repository: `mattmaiorana/simple-pinned-files`.
- Release tags must exactly match the `version` field in `manifest.json` and must **not** use a `v` prefix. Example: tag `1.0.5`, not `v1.0.5`.
- `.github/workflows/release.yml` triggers on semver tag pushes (`[0-9]+.[0-9]+.[0-9]+`). It checks out the repo, runs `npm ci` and `npm run build`, verifies that `manifest.json` / `main.js` / `styles.css` exist, verifies the pushed tag matches `manifest.json` version, generates GitHub artifact attestations via `actions/attest-build-provenance` for all three files, and creates the GitHub Release with those three files attached.
- The workflow needs three permissions: `contents: write`, `attestations: write`, `id-token: write`. They are declared in the workflow file; no manual secrets configuration is required.

### Future release steps

a. Update version files:
   - `manifest.json`
   - `package.json`
   - `package-lock.json` (run `npm install` after editing `package.json`)
   - `versions.json` (add a new entry with the same `minAppVersion` as the prior release unless intentionally raising it)
   - `README.md` status line if it references the prior version
   - `CLAUDE.md` status line if it references the prior version
   - `CHANGELOG.md` (add a new `[x.y.z] - YYYY-MM-DD` entry above the previous release)

b. Run:
   - `npm install` (if `package.json` or `package-lock.json` changed)
   - `npm run build`
   - `git status`

c. Commit and push `main`:
   ```
   git add -A
   git commit -m "Bump to 1.x.x"
   git push origin main
   ```

d. Create and push an annotated tag with **no `v` prefix**:
   ```
   git tag -a 1.x.x -m "1.x.x"
   git push origin 1.x.x
   ```

e. Check the workflow:
   ```
   gh run list --limit 5
   ```
   Prefer `gh run list --limit 5` first after pushing a tag. `gh run watch` can fail if invoked immediately after the tag push sequence (the run may not be enumerable yet), so list first, then watch a specific run id if needed.

f. Verify the release and attestations:
   - GitHub → Releases → confirm the new release exists with `manifest.json`, `main.js`, `styles.css` attached.
   - `gh attestation verify main.js --repo mattmaiorana/simple-pinned-files`
   - `gh attestation verify styles.css --repo mattmaiorana/simple-pinned-files`
   - `gh attestation verify manifest.json --repo mattmaiorana/simple-pinned-files`

### If something goes wrong

- Tag pushed but workflow failed at the "Verify manifest version matches pushed tag" step: fix `manifest.json`, then delete and re-push the tag:
  ```
  git tag -d 1.x.x
  git push origin :refs/tags/1.x.x
  git tag -a 1.x.x -m "1.x.x"
  git push origin 1.x.x
  ```
- Workflow built successfully but the release page is missing assets: re-run the failed job from the GitHub Actions UI; the build step is deterministic.

## Testing checklist

- Build succeeds.
- Plugin enables in a test vault.
- Pinned Files view opens.
- Right-click native File Explorer file → Pin file.
- Pinned row appears immediately.
- One click opens pinned file immediately.
- Right-click pinned row shows Unpin only.
- Rename pinned file updates path.
- Rename parent folder updates child pinned paths.
- Delete pinned file removes pin.
- Native File Explorer pin indicator appears/disappears.
- Disabling plugin removes native File Explorer pin indicators.
