# vsc-labeled-bookmarks README

Bookmarks with customizable icons, mouse free operation, able to jump to named bookmark directly. Bookmarks are organized into groups where you work with the active group, but can switch to another group any time.

**Important note on using breakpoints:**  Line decorations seem to interfere with placing breakpoints for debugging. To work around this, you can toggle the decorations on and off using `ctrl+alt+b h`. All operations still work the same when the decorations are hidden.

## Features

### Bookmarks

You can set an unnamed bookmark on a line using `ctrl+alt+m`. If there already is a bookmark on the line, it is removed.

Labeled bookmarks can be set using `ctrl+alt+l`. A prompt appears where you can type the label for the bookmark.
There is a minimal text processing done on the entered text: if there is an "@" symbol in the text, the preceding part is interpreted as the label, and the succeeding part as the bookmark group name (for example: "bookmark label@group name"). The group is created if it does not yet exist. If it already exists, it is selected as the active group. If the input text only contains a group specifier, the group created and activated without creating a bookmark.

Delete bookmarks using `ctrl+alt+b d`, or by using the above toggle commands.

### Navigation

* Go to the next bookmark: `ctrl+alt+k`
* Go to the previous bookmark: `ctrl+alt+j`
* Navigate to a bookmark by selecting it from a list: `ctrl+alt+n` A quick pick list appears where the bookmarks are filtered as you type. All bookmarks are displayed in the list, including the unamed ones.
* Navigate to a bookmark of any group (same as `ctrl+alt+n` but not limited to the active group): `ctrl+alt+b n`

### Group Management

* You can create a group and switch to it implicitly by using the "@" symbol when creating a labeled bookmark with `ctrl+alt+l`. See the relevant section above for details.
* Alternatively, you can create a group using `ctrl+alt+b alt+g`
* Delete one or multiple groups using `ctrl+alt+b shift+g`
* Select the active group from a list of the available groups: `ctrl+alt+b g`

### Display Options

* Hide / unhide bookmark icons (might be necessary to set a breakpoint on a line that also has a bookmark): `ctrl+alt+b h`
* Hide / unhide the icons of inactive groups: `ctrl+alt+b i`

### Customizing Group Icons

Group icons come in two variants: vector icons and unicode character icons.

Vector icons provide a fixed set of shapes to chose from, and they should appear the same accross all devices. When a new group is created it uses the sape specified as the default shape in the configuration options. If your group has a single character name, and it matches `[a-zA-Z0-9!?+-=\/\$%#]`, then the uppercased character is displayed on the icon.

The other icon variant is the unicode character icon. Using the `labeledBookmarks.unicodeMarkers` configuration option you can define which unicode cahracters/symbol/emojis that you would like to use as the group icon. These can be applied using the shape selection command `ctrl+alt+b s`. If none is defined, a default set is used. (Emojis have theri own color and so the color setting on these remains ineffective.)

The icon color can be chosen from a list of colors using `ctrl+alt+b c` from a list that you can define in the `labeledBookmarks.colors` configuration option. If it is not defined a default color set is used.

## Extension Settings

* `labeledBookmarks.unicodeMarkers`: list of unicode characters to be made available in the shape selection list. It should be in the form of: `[["look": "👀"], ["bug","🐞"]]`
* `labeledBookmarks.colors`: list of colors to be made available when creating new bookmark groups or when setting the color of an existing one. It should be in the form of: `[["red": "ff0000"], ["green": "00ff00"]]`
* `labeledBookmarks.defaultShape`: set which vector icon should be used as the default for new groups

## Known Issues

Bookmark icons might interfere with placing breakponts. Use `ctrl+alt+b h` to hide/unhide the bookmark icons.
