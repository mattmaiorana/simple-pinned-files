import {
  Notice,
  Plugin,
  TAbstractFile,
  TFile,
  TFolder,
} from "obsidian";
import {
  DEFAULT_SETTINGS,
  SimplePinnedFilesSettings,
  SimplePinnedFilesSettingTab,
} from "./settings";
import { PinnedFilesView, VIEW_TYPE_PINNED_FILES } from "./view";
import { removeExplorerStyles, updateExplorerStyles } from "./explorer-style";

const SETTINGS_RELOAD_INTERVAL_MS = 5000;

function pathsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function normalizePinnedPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    if (seen.has(entry)) continue;
    seen.add(entry);
    result.push(entry);
  }
  return result;
}

export default class SimplePinnedFilesPlugin extends Plugin {
  settings: SimplePinnedFilesSettings = { ...DEFAULT_SETTINGS };
  viewInstances: Set<PinnedFilesView> = new Set();
  private saveCount = 0;
  private reloading = false;
  private unloaded = false;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(
      VIEW_TYPE_PINNED_FILES,
      (leaf) => new PinnedFilesView(leaf, this)
    );

    this.addRibbonIcon("pin", "Open Simple Pinned Files", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-pinned-files-view",
      name: "Open Simple Pinned Files",
      callback: () => {
        void this.activateView();
      },
    });

    this.addCommand({
      id: "toggle-pin-current-file",
      name: "Pin/unpin current file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (!checking) void this.togglePin(file);
        return true;
      },
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile)) return;
        const isPinned = this.isPinned(file.path);
        menu.addItem((item) => {
          item
            .setTitle(isPinned ? "Unpin file" : "Pin file")
            .setIcon(isPinned ? "pin-off" : "pin")
            .onClick(async () => {
              await this.togglePin(file);
            });
        });
      })
    );

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        this.handleRename(file, oldPath);
      })
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        this.handleDelete(file);
      })
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.updateActiveStates();
      })
    );

    this.addSettingTab(new SimplePinnedFilesSettingTab(this.app, this));

    this.registerInterval(
      window.setInterval(
        () => void this.reloadSettingsFromDiskIfChanged(),
        SETTINGS_RELOAD_INTERVAL_MS
      )
    );

    this.app.workspace.onLayoutReady(() => {
      this.updateExplorerStyles();
      if (this.settings.openViewOnStartup) {
        void this.ensurePinnedView();
      }
    });
  }

  onunload(): void {
    this.unloaded = true;
    removeExplorerStyles();
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) as
      | Partial<SimplePinnedFilesSettings>
      | null;
    const merged: SimplePinnedFilesSettings = {
      ...DEFAULT_SETTINGS,
      ...(data ?? {}),
    };
    merged.pinnedPaths = normalizePinnedPaths(merged.pinnedPaths);
    this.settings = merged;
  }

  async saveSettings(): Promise<void> {
    this.saveCount++;
    try {
      await this.saveData(this.settings);
    } finally {
      this.saveCount--;
    }
  }

  async reloadSettingsFromDiskIfChanged(): Promise<void> {
    if (this.unloaded || this.saveCount > 0 || this.reloading) return;
    this.reloading = true;
    try {
      const raw = (await this.loadData()) as
        | Partial<SimplePinnedFilesSettings>
        | null;
      if (this.unloaded || this.saveCount > 0) return;
      const next: SimplePinnedFilesSettings = {
        ...DEFAULT_SETTINGS,
        ...(raw ?? {}),
      };
      next.pinnedPaths = normalizePinnedPaths(next.pinnedPaths);
      const pinsChanged = !pathsEqual(
        next.pinnedPaths,
        this.settings.pinnedPaths
      );
      this.settings = next;
      if (pinsChanged) {
        this.refreshView();
        this.updateExplorerStyles();
      }
    } finally {
      this.reloading = false;
    }
  }

  isPinned(path: string): boolean {
    return this.settings.pinnedPaths.includes(path);
  }

  async pinPath(path: string): Promise<void> {
    if (this.isPinned(path)) return;
    this.settings.pinnedPaths = [...this.settings.pinnedPaths, path];
    await this.saveSettings();
    this.refreshView();
    this.updateExplorerStyles();
  }

  async unpinPath(path: string): Promise<void> {
    if (!this.isPinned(path)) return;
    this.settings.pinnedPaths = this.settings.pinnedPaths.filter(
      (p) => p !== path
    );
    await this.saveSettings();
    this.refreshView();
    this.updateExplorerStyles();
  }

  async togglePin(file: TFile): Promise<void> {
    if (this.isPinned(file.path)) {
      await this.unpinPath(file.path);
      new Notice(`Unpinned: ${file.basename}`);
    } else {
      await this.pinPath(file.path);
      new Notice(`Pinned: ${file.basename}`);
    }
  }

  async openPinned(path: string, evt?: MouseEvent): Promise<void> {
    const abstract = this.app.vault.getAbstractFileByPath(path);
    if (!(abstract instanceof TFile)) {
      new Notice(`Pinned file not found: ${path}`);
      return;
    }
    const newTab = !!(evt && (evt.metaKey || evt.ctrlKey));
    const leaf = this.app.workspace.getLeaf(newTab ? "tab" : false);
    await leaf.openFile(abstract);
  }

  refreshView(): void {
    for (const view of this.viewInstances) view.render();
  }

  updateActiveStates(): void {
    for (const view of this.viewInstances) view.updateActiveStates();
  }

  updateExplorerStyles(): void {
    updateExplorerStyles(this.settings.pinnedPaths);
  }

  private async activateView(): Promise<void> {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_PINNED_FILES);
    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = workspace.getLeftLeaf(false);
    if (!leaf) return;
    await leaf.setViewState({ type: VIEW_TYPE_PINNED_FILES, active: true });
    workspace.revealLeaf(leaf);
  }

  private async ensurePinnedView(): Promise<void> {
    const { workspace } = this.app;
    if (workspace.getLeavesOfType(VIEW_TYPE_PINNED_FILES).length > 0) return;
    const leaf = workspace.getLeftLeaf(false);
    if (!leaf) return;
    await leaf.setViewState({ type: VIEW_TYPE_PINNED_FILES, active: false });
  }

  private handleRename(file: TAbstractFile, oldPath: string): void {
    const paths = this.settings.pinnedPaths;
    let changed = false;
    const next: string[] = [];

    if (file instanceof TFolder) {
      const oldPrefix = oldPath.endsWith("/") ? oldPath : oldPath + "/";
      const newPrefix = file.path.endsWith("/") ? file.path : file.path + "/";
      for (const p of paths) {
        if (p === oldPath) {
          next.push(file.path);
          changed = true;
        } else if (p.startsWith(oldPrefix)) {
          next.push(newPrefix + p.slice(oldPrefix.length));
          changed = true;
        } else {
          next.push(p);
        }
      }
    } else {
      for (const p of paths) {
        if (p === oldPath) {
          next.push(file.path);
          changed = true;
        } else {
          next.push(p);
        }
      }
    }

    if (!changed) return;
    this.settings.pinnedPaths = next;
    void this.saveSettings();
    this.refreshView();
    this.updateExplorerStyles();
  }

  private handleDelete(file: TAbstractFile): void {
    const paths = this.settings.pinnedPaths;
    const isFolder = file instanceof TFolder;
    const prefix = file.path.endsWith("/") ? file.path : file.path + "/";

    const next = paths.filter((p) => {
      if (p === file.path) return false;
      if (isFolder && p.startsWith(prefix)) return false;
      return true;
    });

    if (next.length === paths.length) return;
    this.settings.pinnedPaths = next;
    void this.saveSettings();
    this.refreshView();
    this.updateExplorerStyles();
  }
}
