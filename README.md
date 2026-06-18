<div align="center">

# myJsonFormatter

**A minimal, full-screen JSON formatter — prettify, minify, find/replace and share, right in your browser. No server, no sign-up, no clutter.**

<!-- LANG-SELECTOR:START -->
**English** · [Português (BR)](README.pt-BR.md)
<!-- LANG-SELECTOR:END -->

[![Live demo](https://img.shields.io/badge/live%20demo-online-22c55e?style=flat-square)](https://geldopc.github.io/myJsonFormatter/)
[![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-black?style=flat-square)](#license)

### [→ Open the live app](https://geldopc.github.io/myJsonFormatter/)

![myJsonFormatter prettifying JSON in dark mode](docs/screenshot.png)

</div>

---

## Why

Most online JSON tools are buried in ads, ship your data to a server, or make you scroll past a wall of options. **myJsonFormatter** is the opposite: one full-screen editor, the few actions you actually use, and everything happens locally in your browser. Paste, prettify, share the link — done.

## Features

- ⚡ **Prettify & minify** in one click or one keystroke — with auto-sanitization of common mistakes (trailing commas, double-encoded strings) and a toast telling you what it fixed.
- 🎨 **Live syntax highlighting** powered by CodeMirror 6, with a **dark/light theme** (dark by default).
- 🔍 **Find & Replace** with **match case**, **whole word**, and **regex** — every match highlighted, with a live `current/total` counter.
- 🔗 **Share via URL** — the JSON is encoded into the link itself, so there is no server and nothing is stored.
- 📋 **Copy** to clipboard and 📂 **drag & drop** a `.json` file to load it instantly.
- ⌨️ **Keyboard-first** — prettify, find, select-all and undo without leaving the keyboard.
- 🙂 **Comic break** — a random developer comic from [developerslife.tech](https://developerslife.tech/en/) for when you need a laugh.
- 🪶 **100% client-side** — no backend, no tracking of your JSON; deployed for free on GitHub Pages.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Prettify | `Ctrl`/`⌘` + `Enter` |
| Find & Replace | `Ctrl`/`⌘` + `F` |
| Select all | `Ctrl`/`⌘` + `A` |
| Undo / Redo | `Ctrl`/`⌘` + `Z` / `Ctrl`/`⌘` + `Shift` + `Z` |
| Next / previous match (in Find) | `Enter` / `Shift` + `Enter` |
| Close panel | `Esc` |

## Tech stack

- **[React 19](https://react.dev)** + **[TypeScript](https://www.typescriptlang.org)**
- **[Vite 6](https://vite.dev)** build tooling
- **[Tailwind CSS v4](https://tailwindcss.com)** for the minimal black-and-white design
- **[CodeMirror 6](https://codemirror.net)** (`@uiw/react-codemirror`) for the editor and find/replace engine
- **[Radix UI](https://www.radix-ui.com)** + **[Phosphor Icons](https://phosphoricons.com)**, **[Sonner](https://sonner.emilkowal.ski)** toasts, **[Lottie](https://airbnb.io/lottie)** micro-animations
- **[Biome](https://biomejs.dev)** for linting and formatting

## Getting started

```bash
git clone https://github.com/geldopc/myJsonFormatter.git
cd myJsonFormatter
npm install
npm run dev
```

The dev server runs at `http://localhost:5300/myJsonFormatter/`.

### Build & preview

```bash
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally
```

### Lint & format

```bash
npm run check     # Biome lint + format (writes fixes)
```

## Deployment

Every push to `main` triggers a **GitHub Actions** workflow that builds the app and publishes it to **GitHub Pages** — see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The app is fully static, so no server is required.

## Credits

- Developer comics by **[developerslife.tech](https://developerslife.tech/en/)** — comics are owned by their respective authors.
- Fonts: **Oxanium** and **Space Grotesk** via Fontsource.

## License

Released under the **MIT License**.

## Author

Made by **Geldo Pina Costa** — [@geldopc](https://github.com/geldopc).
