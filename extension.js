import GLib from "gi://GLib";
import St from "gi://St";
import Gio from "gi://Gio";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

export default class BibleVerseExtension extends Extension {
  enable() {
    // Create the button
    this._indicator = new PanelMenu.Button(0.0, "Bible Verse Indicator", true);

    // Add icon
    let icon = new St.Icon({
      icon_name: "document-edit-symbolic",
      style_class: "system-status-icon"
    });
    this._indicator.add_child(icon);

    // Create menu items
    this._verseItem = new PopupMenu.PopupMenuItem("Loading verse...");
    this._verseItem.sensitive = false;
    this._indicator.menu.addMenuItem(this._verseItem);

    this._referenceItem = new PopupMenu.PopupMenuItem("");
    this._referenceItem.sensitive = false;
    this._referenceItem.label.set_style("font-style: italic;");
    this._indicator.menu.addMenuItem(this._referenceItem);

    // Add button to the panel
    Main.panel.addToStatusArea("bible-verse-indicator", this._indicator);

    // Update verse when menu opens
    this._indicator.menu.connect("open-state-changed", (menu, isOpen) => {
      if (isOpen) this._updateVerse();
    });

    // Update initially
    this._updateVerse();

    // Set up periodic updates
    this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 300, () => {
      this._updateVerse();
      return GLib.SOURCE_CONTINUE;
    });
  }

  _updateVerse() {
    try {
      // Get verses from file
      const versesFile = Gio.File.new_for_path(
        GLib.build_filenamev([this.path, "verses.txt"])
      );

      if (!versesFile.query_exists(null)) {
        this._setVerseText("Verses file not found.", "");
        return;
      }

      const [success, contents] = versesFile.load_contents(null);
      if (!success) {
        this._setVerseText("Could not load verses.", "");
        return;
      }

      // Parse verses
      const versesText = new TextDecoder().decode(contents);
      const verses = versesText
        .split("\n")
        .filter((line) => line.trim() !== "");

      if (verses.length === 0) {
        this._setVerseText("No verses found in file.", "");
        return;
      }

      // Pick random verse
      const verse = verses[Math.floor(Math.random() * verses.length)];
      const parts = verse.split("|").map((part) => part.trim());

      if (parts.length >= 2) {
        this._setVerseText(parts[0], parts[1]);
      } else {
        this._setVerseText(verse, "");
      }
    } catch (e) {
      console.error(`Bible Verse Error: ${e}`);
      this._setVerseText("Error loading verse.", "");
    }
  }

  _setVerseText(text, reference) {
    if (this._verseItem) this._verseItem.label.text = text;
    if (this._referenceItem) this._referenceItem.label.text = reference;
  }

  disable() {
    if (this._timeout) {
      GLib.source_remove(this._timeout);
      this._timeout = null;
    }

    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }

    this._verseItem = null;
    this._referenceItem = null;
  }
}
