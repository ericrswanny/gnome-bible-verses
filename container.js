import GObject from "gi://GObject";
import St from "gi://St";
import Gio from "gi://Gio";
import Clutter from "gi://Clutter";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

export const BibleVerseContainer = GObject.registerClass(
  class BibleVerseContainer extends PanelMenu.Button {
    _init(menuAlignment, nameText, dontCreateMenu = false) {
      super._init(menuAlignment, nameText, dontCreateMenu);

      // Create a box layout for the container
      this.box = new St.BoxLayout();
      this.add_child(this.box);

      // Add a custom icon
      let icon = new St.Icon({
        gicon: Gio.icon_new_for_string(`${this.path}/icons/bible.svg`),
        style_class: "system-status-icon"
      });
      this.box.add_child(icon);

      // Add a label for the verse
      this.verseLabel = new St.Label({
        text: "Loading verse...",
        x_align: Clutter.ActorAlign.START
      });
      this.box.add_child(this.verseLabel);

      // Remove default styling
      this.remove_style_class_name("panel-button");
    }

    setVerse(verse) {
      this.verseLabel.text = verse;
    }

    destroy() {
      this.box.remove_all_children();
      this.box.destroy();
      super.destroy();
    }
  }
);
