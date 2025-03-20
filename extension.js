import GLib from "gi://GLib";
import St from "gi://St";
import Gio from "gi://Gio";
import Clutter from "gi://Clutter";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

export default class BibleVerseExtension extends Extension {
  enable() {
    // Create indicator button
    this._button = new PanelMenu.Button(0.0, "Bible Verse Indicator", true);

    // Add icon
    let iconPath = GLib.build_filenamev([this.path, "icons", "bible.svg"]);
    let gicon = Gio.icon_new_for_string(iconPath);
    let icon = new St.Icon({
      gicon: gicon,
      style_class: "system-status-icon"
    });
    this._button.add_child(icon);

    // Create our own custom menu items
    let layout = new St.BoxLayout({
      vertical: true,
      x_expand: true,
      y_expand: true
    });

    // Create verse and reference labels
    this._verseLabel = new St.Label({
      text: "Loading verse...",
      style_class: "verse-text",
      x_align: Clutter.ActorAlign.START,
      y_align: Clutter.ActorAlign.CENTER
    });

    this._referenceLabel = new St.Label({
      text: "",
      style_class: "verse-reference",
      style: "font-style: italic;",
      x_align: Clutter.ActorAlign.END,
      y_align: Clutter.ActorAlign.CENTER
    });

    // Add labels to layout
    layout.add_child(this._verseLabel);
    layout.add_child(this._referenceLabel);

    // Create a custom menu item with our layout
    let menuItem = new St.BoxLayout({
      style_class: "popup-menu-item",
      reactive: true,
      can_focus: true,
      track_hover: true,
      x_expand: true,
      y_expand: true,
      x_align: Clutter.ActorAlign.FILL
    });
    menuItem.add_child(layout);

    // For GNOME 47, we need to add directly to the popup menu's actor
    if (this._button.menu && this._button.menu.actor) {
      this._button.menu.actor.add_child(menuItem);
    } else if (this._button.menu && this._button.menu.box) {
      this._button.menu.box.add_child(menuItem);
    } else {
      console.error("Bible Verse: Cannot find menu element to add items to");
    }

    // Add button to the panel
    Main.panel.addToStatusArea("bible-verse-indicator", this._button);

    // Update verse when menu opens
    this._button.menu.connect("open-state-changed", (menu, isOpen) => {
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
    if (this._verseLabel) {
      this._verseLabel.text = text;
    }
    if (this._referenceLabel) {
      this._referenceLabel.text = reference;
    }
  }

  disable() {
    if (this._timeout) {
      GLib.source_remove(this._timeout);
      this._timeout = null;
    }

    if (this._button) {
      this._button.destroy();
      this._button = null;
    }

    this._verseLabel = null;
    this._referenceLabel = null;
  }
}
