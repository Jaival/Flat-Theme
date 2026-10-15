# Flat

Dark VS Code themes for flat color lovers: teal backgrounds with warm syntax colors, in four moods.

## Variants

| Theme | Background | What it's like |
| --- | --- | --- |
| **Flat Deep** | `#0b1919` | Dark, grayer teal that cuts glare. The main theme. |
| **Flat Muted** | `#042a2b` | The original teal with desaturated syntax colors, so nothing glows. |
| **Flat Pastel** | `#153839` | A lighter teal with soft pastel syntax colors. |
| **Flat Mist** | `#273131` | Slate with a hint of teal and dusty, warm colors. The calmest. |

All syntax colors, line numbers, and file names meet a 4.5:1 contrast ratio against their background. Bracket pairs, inlay hints, sticky scroll, inline suggestions, Copilot chat, the Source Control graph, and the terminal are themed to match.

## Install

1. Open the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Search for **Flat** by JaivalSaija and click **Install**.
3. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`), run **Preferences: Color Theme**, and pick one of the Flat variants.

Or from the command line:

```sh
code --install-extension JaivalSaija.flat
```

If you used Flat before 2.0, you're switched to Flat Deep automatically.

## Changing colors

The theme files in `themes/` are generated. Don't edit them directly.

- `src/palette.json` holds the named base colors (background, accent, keyword, string, and so on).
- `src/template.json` is the full theme, with `{name}` references into the palette.
- `scripts/build.mjs` defines each variant as a color transform of the base, and lifts any text color that falls below 4.5:1 contrast.

After editing, rebuild all variants (Node 18 or newer, no dependencies):

```sh
npm run build
```

## Feedback

Found a color that's hard to read in your language? [Open an issue](https://github.com/Jaival/Flat-Theme/issues) with a screenshot, the file type, and which variant you use.

## License

[MIT](LICENSE)
