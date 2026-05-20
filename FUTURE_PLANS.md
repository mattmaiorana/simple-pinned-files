# Future Plans

Possible future improvements for Simple Pinned Files. These are **not commitments for any specific version** — just notable ideas to consider later.

## Near-term polish

- Consider removing or reducing pin/unpin Notice messages if they feel too noisy during normal use.
- Consider making the native File Explorer pin indicator optional in settings.
- Consider adding a setting to choose where the Pinned Files view opens by default, or simply rely on Obsidian workspace behavior.
- Consider improving missing-file handling, such as showing a clearer "missing file" state with an Unpin action.
- Add a confirmation modal (or two-click "are you sure?" pattern) to the **Clear pinned files** settings button. Today it wipes the list on a single red-styled click and there is no in-plugin undo.

## Documentation / publication readiness

The initial README polish pass and the GitHub Actions release workflow are now in place. Remaining ideas:

- Add a short GIF or additional screenshots beyond the current single image — e.g. the native File Explorer pin indicators, the right-click Pin/Unpin flow, or the Pinned Files view with several pinned items.
- Once the plugin is accepted into the Obsidian community plugin directory, add an "Install from Obsidian Community Plugins" section to the README.
- Review the eventual community plugin listing wording (description, screenshots, release notes) when submitting.
- Consider a `CONTRIBUTING.md` if outside contributors start showing up. Keep it short — point at the existing dev commands and the release process documented in `CLAUDE.md`.

## Release automation refinements

`.github/workflows/release.yml` currently uses GitHub's auto-generated release notes. Potential refinements:

- Optionally extract release notes for the tagged version from `CHANGELOG.md` and pass them to `softprops/action-gh-release` via `body` or `body_path` instead of using `generate_release_notes: true`. This keeps the GitHub release body in sync with the changelog without manual editing. Requires a small extraction step (e.g. `awk`/`sed`) that captures everything between the current version's `##` header and the next `##` header.
- Consider adding a workflow-dispatch trigger so a release can also be cut manually for testing without pushing a tag (would create a draft release).
- Consider pinning `actions/checkout`, `actions/setup-node`, `actions/attest-build-provenance`, and `softprops/action-gh-release` to commit SHAs instead of major-version tags for stricter supply-chain hygiene. Trade-off: more maintenance to bump them deliberately.
- Add a `concurrency:` group to the workflow keyed on the tag name (e.g. `release-${{ github.ref_name }}`) so a re-pushed tag (after a manifest fix) cannot race with the original run's release-creation step.
- The next release's CHANGELOG entry should mention the addition of `.github/workflows/release.yml` and the GitHub artifact attestations on release assets. The workflow was added after 1.0.4 was published, so this belongs in the next entry rather than retroactively in 1.0.4.
- After the first workflow-built release, consider pruning the unreleased `0.1.0` entry from `versions.json` if you want `versions.json` to reflect only versions with actual GitHub releases.

## Reliability and edge cases

- Consider surfacing save failures via a Notice. Currently `void this.saveSettings()` in rename/delete handlers silently discards errors.
- Consider subscribing to `file-open` in addition to `active-leaf-change` so the active-row highlight updates even when a file is opened into the currently active leaf (e.g. Quick Switcher → "open in current pane").
- Consider light coalescing of rapid rename/delete vault events into a single `saveSettings` call.
- Consider making the 5-second polling interval a setting, clamped to a sensible range (e.g. 2s–60s).
- Consider pausing polling when the app is backgrounded on mobile, if Obsidian exposes a reliable signal.
- Consider re-emitting the explorer `<style>` only when `pinnedPaths` actually changed. Several refresh paths regenerate it unconditionally; the textContent assignment is cheap but unnecessary on no-op refreshes.

## Mobile UX

- The current right-click context menu on pinned rows uses the desktop `contextmenu` event. On mobile, long-press may not reliably dispatch `contextmenu` on custom views. The native file-menu Pin/Unpin path still works as an alternative.
- Consider a touch-friendly unpin affordance: a small "x" or pin-toggle button revealed on touch, or an explicit long-press handler that opens the same Obsidian `Menu`.
- Verify tooltip behavior on touch — `setTooltip` is likely a no-op on tap. Acceptable, but worth documenting if users ask.

## Pin management

- Add drag-and-drop reordering of pinned files.
- Add keyboard-accessible reorder controls as an alternative to drag-and-drop.
- Add a command to clear all pinned files, in addition to the settings button.
- Consider adding pinned groups/sections later, but avoid overcomplicating the plugin.

## Drag-and-drop pinning

Allow dragging a file from Obsidian's native File Explorer into the Pinned Files view to automatically pin that file.

Behavior:

- Drag a file row from the native File Explorer.
- Drop it anywhere in the Pinned Files view.
- Plugin extracts the file path.
- Plugin adds it to `pinnedPaths` if it is a `TFile` and not already pinned.
- View refreshes immediately.

Important implementation notes:

- Do not mutate or interfere with Obsidian's native File Explorer DOM.
- Do not implement custom file dragging in the native File Explorer.
- Only listen for drop events in our own Pinned Files view.
- Make sure this does not break normal click/right-click behavior.
- Carefully inspect Obsidian drag event data before implementing.
- This should be a focused enhancement, scoped tightly when it lands.

## Visual/UI ideas

- Continue matching Obsidian native file row styling as closely as practical.
- Consider making the pin icon even subtler or only visible on hover/active.
- Consider adding optional compact/dense mode only if needed.
- Consider adding a small count or empty-state hint, but avoid adding visual clutter.

## Accessibility

- Pinned rows are clickable `div`s without keyboard affordances. Consider:
  - `role="link"` (or `role="button"`) on each row
  - `tabindex="0"` so rows participate in keyboard tab order
  - Enter/Space key handler that mirrors the click handler (open file; Cmd/Ctrl+Enter opens in a new tab)
  - `aria-label={path}` so screen readers announce the full vault path
  - `aria-current="true"` on the active pinned row
- Verify focus rings are visible against Obsidian's native nav styling.

## Tooltip ideas

- Keep using Obsidian's `setTooltip` if it remains reliable.
- Consider making tooltip delay configurable only if there is a real need.
- Consider showing parent folder instead of full path in the tooltip if full path feels too long.

## Native File Explorer indicator ideas

- Keep the current CSS-only managed style approach.
- If Obsidian changes the native File Explorer selectors in the future, update the selector targeting.
- Consider adding a graceful warning or setting if native indicators cannot be applied.
- Avoid `MutationObserver` and DOM mutation unless absolutely necessary.

## Things to avoid unless intentionally revisiting architecture

- Do not rebuild Obsidian's File Explorer.
- Do not add sidebar layout/orchestration to this plugin.
- Do not add search to this plugin unless there is a clear reason.
- Do not use frontmatter/bookmarks as the source of truth without careful design.
- Do not introduce Svelte/React for this small plugin.
- Do not combine this plugin with the separate sidebar organization/styling project too early.

## Possible separate companion project

A separate sidebar organization/styling project may eventually handle:

- Labeled sidebar navigation inspired by Minimal Theme.
- Stacking native Search / Pinned Files / File Explorer views.
- Hiding or simplifying File Explorer toolbar buttons.
- Making the left sidebar feel calmer and more unified.

Keep that work separate from Simple Pinned Files unless there is a strong reason to merge later.
