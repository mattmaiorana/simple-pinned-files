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

export default class SimplePinnedFilesPlugin extends Plugin {
  settings: SimplePinnedFilesSettings = { ...DEFAULT_SETTINGS };

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
        this.refreshView();
      })
    );

    this.addSettingTab(new SimplePinnedFilesSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      this.updateExplorerStyles();
      if (this.settings.openViewOnStartup) {
        void this.activateView();
      }
    });
  }

  onunload(): void {
    removeExplorerStyles();
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) as
      | Partial<SimplePinnedFilesSettings>
      | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(data ?? {}) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
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
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PINNED_FILES);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof PinnedFilesView) view.render();
    }
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
