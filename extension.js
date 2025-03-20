import GLib from "gi://GLib";
import St from "gi://St";
import Gio from "gi://Gio";
import Clutter from "gi://Clutter";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

class BibleVerseIndicator extends PanelMenu.Button {
  constructor(extension) {
    // Use 0.0 instead of 0 as the alignment
    super(0.0, "Bible Verse Indicator", false);

    this._extension = extension;

    // Icon for the panel
    this.icon = new St.Icon({
      icon_name: "document-edit-symbolic", // Using a standard icon that should exist
      style_class: "system-status-icon"
    });

    // Add icon to the panel
    this.add_child(this.icon);

    // Create menu item for the verse
    this._menuItem = new PopupMenu.PopupMenuItem("Loading verse...");
    this._menuItem.sensitive = false; // Not clickable
    this.menu.addMenuItem(this._menuItem);

    // Reference item that shows the verse reference
    this._referenceItem = new PopupMenu.PopupMenuItem("");
    this._referenceItem.sensitive = false;
    this._referenceItem.label.set_style("font-style: italic;");
    this.menu.addMenuItem(this._referenceItem);

    // Update verse when menu opens
    this.menu.connect("open-state-changed", (menu, isOpen) => {
      if (isOpen) {
        this._updateVerse();
      }
    });

    // Initial verse load
    this._updateVerse();

    // Update verse every 5 minutes
    this._updateTimeout = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      300, // 5 minutes
      () => {
        this._updateVerse();
        return GLib.SOURCE_CONTINUE;
      }
    );
  }

  _updateVerse() {
    try {
      // Get verses from file
      const versesFile = Gio.File.new_for_path(
        GLib.build_filenamev([this._extension.path, "verses.txt"])
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
      console.error(`Bible Verse Error: ${e.message}`);
      this._setVerseText("Error loading verse.", "");
    }
  }

  _setVerseText(text, reference) {
    this._menuItem.label.text = text;
    this._referenceItem.label.text = reference;
  }

  destroy() {
    if (this._updateTimeout) {
      GLib.source_remove(this._updateTimeout);
      this._updateTimeout = null;
    }
    super.destroy();
  }
}

export default class BibleVerseExtension extends Extension {
  enable() {
    this._indicator = new BibleVerseIndicator(this);
    Main.panel.addToStatusArea("bible-verse-indicator", this._indicator);
  }

  disable() {
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
