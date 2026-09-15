# Minjae Son — academic website

AcademicPages/Jekyll source for [powerflow77.github.io](https://powerflow77.github.io).

## Edit the site

- `_config.yml`: name, sidebar, profile links, and site settings.
- `_data/navigation.yml`: Home, Research, Publications, Projects, Gallery, Resources.
- `_pages/`: page content, gallery, and resource directories.
- `_publications/`: one editable file per publication, J1–J8.
- `_portfolio/`: one editable file per project, P1–P7.
- `images/`: all original photographs and background artwork, hosted locally.
- `_sass/`, `_layouts/`, `_includes/`, `assets/`: the AcademicPages theme.

The English and Korean content, publication statuses, unfinished titles, project sponsors, and external URLs are preserved from the original Google Sites pages. Conferences and journals that were plain text on the source remain plain text. J4 displayed a link symbol without an actual URL; no publication URL has been invented for it.

## Local build

Install Ruby 3.3 and Bundler. On Windows, use RubyInstaller with its MSYS2 development tools.

```sh
bundle install
bundle exec jekyll build --strict_front_matter
python scripts/verify_site.py
bundle exec jekyll serve --host 127.0.0.1
```

Open `http://127.0.0.1:4000`. Use `python3` instead of `python` where appropriate.

The committed Gemfile.lock covers Linux and Windows. Jekyll 3.10 follows the GitHub Pages generation of the reference theme. No Node installation is needed for a normal build. If editing the theme's bundled JavaScript, run `npm ci` followed by `npm run build:js`; the separate `accessibility.js` file does not require bundling.

## GitHub Pages

The public repository is `powerflow77/powerflow77.github.io`. In **Settings → Pages**, select **GitHub Actions** as the build source. The workflow in `.github/workflows/pages.yml` builds and verifies pull requests, and deploys successful pushes to `main` and manual runs. No custom domain is configured.

## Migration record

See `migration/REPORT.md`, `migration/source-inventory.json`, and `migration/assets.json` for the page map, exact source records, original asset addresses, and checksums. The five plain section-background image files are retained in `images/` as source assets; the AcademicPages theme controls section styling. The other nine source images are displayed throughout the site. The original Google Sites site is unchanged.

## Licenses

The theme's MIT license is retained in `LICENSE`; dependency notices are in `licenses/` and `THIRD_PARTY_NOTICES.md`. The theme license does not relicense Minjae Son's content or photographs.
