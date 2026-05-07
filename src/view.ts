import { ItemView, Menu, setIcon, TFile, WorkspaceLeaf } from "obsidian";
import type SimplePinnedFilesPlugin from "./main";

export const VIEW_TYPE_PINNED_FILES = "simple-pinned-files-view";

export class PinnedFilesView extends ItemView {
  plugin: SimplePinnedFilesPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: SimplePinnedFilesPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_PINNED_FILES;
  }

  getDisplayText(): string {
    return "Pinned Files";
  }

  getIcon(): string {
    return "pin";
  }

  async onOpen(): Promise<void> {
    this.plugin.viewInstances.add(this);
    this.render();
  }

  async onClose(): Promise<void> {
    this.plugin.viewInstances.delete(this);
    this.contentEl.empty();
  }

  render(): void {
    const container = this.contentEl;
    container.empty();
    container.addClass("simple-pinned-files-view");

    const heading = container.createDiv({ cls: "simple-pinned-files-heading" });
    heading.createEl("h3", { text: "Pinned Files" });

    const list = container.createDiv({ cls: "simple-pinned-files-list" });

    const paths = this.plugin.settings.pinnedPaths;
    if (paths.length === 0) {
      list.createDiv({
        cls: "simple-pinned-files-empty",
        text: "No pinned files yet. Right-click a file and choose “Pin file”, or use the “Pin/unpin current file” command.",
      });
      return;
    }

    const activePath = this.app.workspace.getActiveFile()?.path;

    for (const path of paths) {
      const abstract = this.app.vault.getAbstractFileByPath(path);
      const file = abstract instanceof TFile ? abstract : null;

      const row = list.createDiv({ cls: "simple-pinned-files-row" });
      row.dataset.path = path;
      if (path === activePath) row.addClass("is-active");
      if (!file) row.addClass("is-missing");

      const main = row.createDiv({ cls: "simple-pinned-files-row-main" });
      main.createDiv({
        cls: "simple-pinned-files-title",
        text: this.titleFromPath(path, file),
      });
      main.createDiv({
        cls: "simple-pinned-files-subtitle",
        text: this.subtitleFromPath(path),
      });

      const iconEl = row.createDiv({ cls: "simple-pinned-files-pin-icon" });
      setIcon(iconEl, "pin");

      row.addEventListener("click", async (evt) => {
        if (!file) return;
        await this.plugin.openPinned(path, evt);
      });

      row.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
        const menu = new Menu();
        menu.addItem((item) =>
          item
            .setTitle("Open")
            .setIcon("file")
            .onClick(async () => {
              if (!file) return;
              await this.plugin.openPinned(path);
            })
        );
        menu.addItem((item) =>
          item
            .setTitle("Unpin")
            .setIcon("pin-off")
            .onClick(async () => {
              await this.plugin.unpinPath(path);
            })
        );
        menu.showAtMouseEvent(evt);
      });
    }
  }

  updateActiveStates(): void {
    const activePath = this.app.workspace.getActiveFile()?.path;
    const rows = this.contentEl.querySelectorAll<HTMLElement>(
      ".simple-pinned-files-row"
    );
    rows.forEach((row) => {
      if (row.dataset.path === activePath) row.addClass("is-active");
      else row.removeClass("is-active");
    });
  }

  private titleFromPath(path: string, file: TFile | null): string {
    if (file) return file.basename || file.name;
    const last = path.split("/").pop() ?? path;
    const dot = last.lastIndexOf(".");
    return dot > 0 ? last.slice(0, dot) : last;
  }

  private subtitleFromPath(path: string): string {
    if (this.plugin.settings.showFullPath) return path;
    const idx = path.lastIndexOf("/");
    return idx > 0 ? path.slice(0, idx) : "/";
  }
}
