import GObject from "gi://GObject";
import St from "gi://St";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

export default class TestExtension {
  enable() {
    this._button = new PanelMenu.Button(0.0, "Test Button");

    // Add an icon
    const icon = new St.Icon({
      icon_name: "face-smile-symbolic",
      style_class: "system-status-icon"
    });
    this._button.add_child(icon);

    // Add a test item to the menu
    const testItem = new PopupMenu.PopupMenuItem("Test Item");
    this._button.menu.addMenuItem(testItem);

    // Add the button to the panel
    Main.panel.addToStatusArea("test-button", this._button);
  }

  disable() {
    if (this._button) {
      this._button.destroy();
      this._button = null;
    }
  }
}
