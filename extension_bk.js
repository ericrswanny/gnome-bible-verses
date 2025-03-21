import GLib from "gi://GLib";
import Gio from "gi://Gio";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { BibleVerseContainer } from "./container.js";

export default class BibleVerseExtension extends Extension {
  enable() {
    // Create the custom container
    this._container = new BibleVerseContainer(
      0.0,
      "Bible Verse Indicator",
      this.path // Pass the extension path
    );

    // Add the container to the panel
    Main.panel.addToStatusArea("bible-verse-indicator", this._container);

    // Update the verse initially
    this._updateVerse();

    // Set up periodic updates (every 5 minutes)
    this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 300, () => {
      this._updateVerse();
      return GLib.SOURCE_CONTINUE;
    });
  }

  _updateVerse() {
    try {
      // Get verses from the file
      const versesFile = Gio.File.new_for_path(
        GLib.build_filenamev([this.path, "verses.txt"])
      );

      if (!versesFile.query_exists(null)) {
        this._container.setVerse("Verses file not found.");
        return;
      }

      const [success, contents] = versesFile.load_contents(null);
      if (!success) {
        this._container.setVerse("Could not load verses.");
        return;
      }

      // Parse the verses
      const versesText = new TextDecoder().decode(contents);
      const verses = versesText
        .split("\n")
        .filter((line) => line.trim() !== "");

      if (verses.length === 0) {
        this._container.setVerse("No verses found in file.");
        return;
      }

      // Pick a random verse
      const verse = verses[Math.floor(Math.random() * verses.length)];
      const parts = verse.split("|").map((part) => part.trim());

      if (parts.length >= 2) {
        this._container.setVerse(`${parts[0]} (${parts[1]})`);
      } else {
        this._container.setVerse(verse);
      }
    } catch (e) {
      console.error(`Bible Verse Error: ${e}`);
      this._container.setVerse("Error loading verse.");
    }
  }

  disable() {
    // Remove periodic updates
    if (this._timeout) {
      GLib.source_remove(this._timeout);
      this._timeout = null;
    }

    // Destroy the container
    if (this._container) {
      this._container.destroy();
      this._container = null;
    }
  }
}

