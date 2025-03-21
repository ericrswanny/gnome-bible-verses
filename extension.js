import GLib from "gi://GLib";
import Gio from "gi://Gio";
import St from "gi://St";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class BibleVerseExtension {
  enable() {
    // Initialize theme settings
    this._themeSettings = new Gio.Settings({
      schema: "org.gnome.desktop.interface"
    });

    // Create the button for the panel
    this._button = new PanelMenu.Button(0.0, "Bible Verse Indicator");

    // Add your custom Bible icon to the button
    const iconPath = GLib.build_filenamev([
      GLib.get_home_dir(),
      ".local/share/gnome-shell/extensions/bible-verses@ericrswanny.github.io/icons/bible.svg"
    ]);
    const gicon = Gio.icon_new_for_string(iconPath);
    this.icon = new St.Icon({
      gicon: gicon,
      style_class: "system-status-icon"
    });
    this._button.add_child(this.icon);

    // Set the initial icon color based on the current theme
    this._updateIconColor();

    // Listen for theme changes
    this._themeChangeSignal = this._themeSettings.connect(
      "changed::gtk-theme",
      () => {
        this._updateIconColor();
      }
    );

    // Add a menu item to display the verse
    this._verseMenuItem = new PopupMenu.PopupMenuItem("Loading verse...");
    this._verseMenuItem.label.clutter_text.set_line_wrap(true); // Enable text wrapping
    this._button.menu.addMenuItem(this._verseMenuItem);

    // Add the button to the panel
    Main.panel.addToStatusArea("bible-verse-indicator", this._button);

    // Update the verse initially
    this._updateVerse();

    // Set up periodic updates (every 5 minutes)
    this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 300, () => {
      this._updateVerse();
      return GLib.SOURCE_CONTINUE;
    });
  }

  _updateIconColor() {
    // Get the current color scheme
    const colorScheme = this._themeSettings.get_enum("color-scheme");
    const isDarkMode = colorScheme === 1; // 0 = light mode, 1 = dark mode

    // Choose the appropriate SVG file
    const iconPath = GLib.build_filenamev([
      GLib.get_home_dir(),
      ".local/share/gnome-shell/extensions/bible-verses@ericrswanny.github.io/icons",
      isDarkMode ? "bible-dark.svg" : "bible-light.svg"
    ]);

    // Load the new icon
    const gicon = Gio.icon_new_for_string(iconPath);
    this.icon.set_gicon(gicon); // Set the new icon
    log(
      `Current color scheme: ${colorScheme}, Dark mode: ${isDarkMode}, Icon path: ${iconPath}`
    );
  }

  _updateVerse() {
    try {
      // Path to the verses file
      const versesFile = Gio.File.new_for_path(
        GLib.build_filenamev([
          GLib.get_home_dir(),
          ".local/share/gnome-shell/extensions/bible-verses@ericrswanny.github.io/verses.txt"
        ])
      );

      // Check if the file exists
      if (!versesFile.query_exists(null)) {
        this._verseMenuItem.label.text = "Verses file not found.";
        return;
      }

      // Read the contents of the file
      const [success, contents] = versesFile.load_contents(null);
      if (!success) {
        this._verseMenuItem.label.text = "Could not load verses.";
        return;
      }

      // Parse the verses
      const versesText = new TextDecoder().decode(contents);
      const verses = versesText
        .split("\n")
        .filter((line) => line.trim() !== ""); // Remove empty lines

      if (verses.length === 0) {
        this._verseMenuItem.label.text = "No verses found in file.";
        return;
      }

      // Pick a random verse
      const verse = verses[Math.floor(Math.random() * verses.length)];
      const parts = verse.split("|").map((part) => part.trim());

      // Update the menu item with the verse
      if (parts.length >= 2) {
        this._verseMenuItem.label.text = `${parts[0]} (${parts[1]})`;
      } else {
        this._verseMenuItem.label.text = verse;
      }
    } catch (e) {
      log(`Bible Verse Error: ${e}`);
      this._verseMenuItem.label.text = "Error loading verse.";
    }
  }

  disable() {
    // Remove periodic updates
    if (this._timeout) {
      GLib.source_remove(this._timeout);
      this._timeout = null;
    }

    // Disconnect the theme change signal
    if (this._themeChangeSignal) {
      this._themeSettings.disconnect(this._themeChangeSignal);
      this._themeChangeSignal = null;
    }

    // Destroy the button
    if (this._button) {
      this._button.destroy();
      this._button = null;
    }
  }
}
