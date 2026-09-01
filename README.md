# Arijit Das Adhikary — personal website

Static multi-page site. No build step, no dependencies. Plain HTML + one CSS file.

## Deploying to GitHub Pages

Upload the **contents** of this folder to your repository — not the folder itself.
`index.html` must sit at the top level of the repo (or of whatever folder you point
GitHub Pages at), otherwise your URL gains an extra path segment.

Then: **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)` → Save.**

The first build takes a minute or two. After that, every push republishes automatically.

## Files — all of them are required

| File | Purpose |
|---|---|
| `index.html` | Home (hero + research summary) |
| `research.html` | Research |
| `publications.html` | Publications |
| `experience.html` | Experience |
| `education.html` | Education |
| `highlights.html` | Awards, fellowships, milestones |
| `404.html` | Shown for any bad URL; GitHub Pages picks this up automatically |
| `style.css` | Shared stylesheet for every page |
| `profile.jpg` | Hero photograph |
| `.nojekyll` | Tells GitHub Pages to serve files as-is, without Jekyll processing |

If `style.css` is missing, every page renders as unstyled text.
If `profile.jpg` is missing, only the home page photo breaks.

`.nojekyll` starts with a dot, so it is hidden in Finder (`Cmd+Shift+.` to show) and
in Windows Explorer (View → Hidden items). Upload it too.

## Editing later

- **Any visual change** — edit `style.css` once; it applies to all pages.
- **Adding or renaming a page** — the `<nav>` block is duplicated in every HTML
  file. You must edit all of them, or the navigation goes inconsistent. The
  current page's link carries `class="active"`.
- **The footer** is likewise duplicated in every file.

## Notes

- All internal links are relative, so the site works whether it is served from
  `username.github.io` or from `username.github.io/repo-name/`.
- Award and certificate `[View]` links point to OneDrive. Each share must be set
  to **"Anyone with the link"** — otherwise visitors hit a Microsoft sign-in wall
  and the link is effectively dead.
- Fade-in-on-scroll animations degrade gracefully: if JavaScript fails or is
  disabled, all content is shown immediately rather than staying invisible.
