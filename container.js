import GObject from "gi://GObject";
import St from "gi://St";
import Gio from "gi://Gio";
import Clutter from "gi://Clutter";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

export const BibleVerseContainer = GObject.registerClass(
  class BibleVerseContainer extends PanelMenu.Button {
    _init(menuAlignment, nameText, dontCreateMenu = false) {
      // Initialize the parent class
      super._init(menuAlignment, nameText, dontCreateMenu);

      // Add a custom icon to the panel
      const iconPath = `${this.path}/icons/bible.svg`;
      const gicon = Gio.icon_new_for_string(iconPath);
      this.icon = new St.Icon({
        gicon: gicon,
        style_class: "system-status-icon"
      });
      this.add_child(this.icon);

      // Log to verify menu existence
      log(`BibleVerseContainer: Menu exists? ${!!this.menu}`);

      // Ensure the menu is properly initialized
      if (!this.menu) {
        this.menu = new PopupMenu.PopupMenu(this, 0.0, St.Side.TOP);
        Main.uiGroup.add_actor(this.menu.actor);
        this.menu.actor.hide();
      }

      // Create a container for the verse text
      this.verseContainer = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        y_expand: true
      });

      // Add a label for the verse
      this.verseLabel = new St.Label({
        text: "Loading verse...",
        x_align: Clutter.ActorAlign.START,
        style_class: "bible-verse-text"
      });
      this.verseContainer.add_child(this.verseLabel);

      // Add the container to the menu
      //this.menu.actor.add_child(this.verseContainer);

      const testItem = new PopupMenu.PopupMenuItem("Test Item");
      this.menu.actor.add_child(testItem);

      // Add a click event listener to the button
      this.connect("button-press-event", () => {
        log("BibleVerseContainer: Icon clicked!");
        if (this.menu.isOpen) {
          log("BibleVerseContainer: Closing menu");
          this.menu.close();
        } else {
          log("BibleVerseContainer: Opening menu");
          this.menu.open();
        }
      });
    }

    setVerse(verse) {
      // Update the text in the verse label
      this.verseLabel.text = verse;
    }

    destroy() {
      if (this.verseContainer) {
        this.verseContainer.destroy();
        this.verseContainer = null;
      }
      super.destroy();
    }
  }
);
