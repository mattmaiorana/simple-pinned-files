import { App, PluginSettingTab, Setting } from "obsidian";
import type SimplePinnedFilesPlugin from "./main";

export interface SimplePinnedFilesSettings {
  pinnedPaths: string[];
  openViewOnStartup: boolean;
}

export const DEFAULT_SETTINGS: SimplePinnedFilesSettings = {
  pinnedPaths: [],
  openViewOnStartup: true,
};

export class SimplePinnedFilesSettingTab extends PluginSettingTab {
  plugin: SimplePinnedFilesPlugin;

  constructor(app: App, plugin: SimplePinnedFilesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Add Pinned Files to sidebar on startup")
      .setDesc(
        "Ensure the Pinned Files view is available in the left sidebar when Obsidian starts. The view will not steal focus from your active sidebar tab."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.openViewOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.openViewOnStartup = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Clear pinned files")
      .setDesc(
        "Remove all pinned files from this list. This does not delete the files themselves."
      )
      .addButton((button) =>
        button
          .setButtonText("Clear all")
          .setWarning()
          .onClick(async () => {
            this.plugin.settings.pinnedPaths = [];
            await this.plugin.saveSettings();
            this.plugin.refreshView();
            this.plugin.updateExplorerStyles();
          })
      );
  }
}
