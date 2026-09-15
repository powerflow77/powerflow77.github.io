# Migration and verification record

Source captured on 2026-09-15: <https://sites.google.com/view/ssonn/%ED%99%88>.

## Page map

| Google Sites page | Destination |
| --- | --- |
| 홈 | `/` |
| About Me → Researcher | `/` |
| Research → Works | `/publications/`, `/projects/` |
| Research → Research Area | `/research/` |
| Misc. → Related Labs | `/resources/related-labs/` |
| Misc. → Conferences | `/resources/conferences/` |
| Misc. → Journals | `/resources/journals/` |

The five main navigation entries lead to the retained site content. Redirects on the new domain cover the retained former page paths. Google Sites URLs remain intact because the source site was never modified.

## Completeness

- 7 retained source pages.
- Full biography, education, advisors, undergraduate thesis, memberships, languages, and tools.
- 8 publication entries, including original unfinished titles and preparation/experimental/review statuses.
- 7 projects: 3 ongoing and 4 completed, preserving Korean titles and sponsor names.
- 4 research areas, their Korean descriptions, and every listed topic.
- 32 institutions and 43 researcher/lab links.
- 11 conference names and 24 journal names. The source provided no hyperlinks for these entries.
- All 49 outgoing content links from the source are preserved.
- 11 original local image files: 2 photos and 9 background images. Four images are displayed on the Home page; seven background images are retained as migration records and theme source assets.

No email address was provided on the source, so no email address was inferred. The GitHub profile link was supplied by the user. J4's source link symbol had no href and is not treated as a publication link.

## Theme provenance

Theme folders were reused from the supplied reference at commit `7227dba`. The reference owner's personal pages, photographs, documents, lab icons, and configuration were excluded. AcademicPages, Minimal Mistakes, and bundled dependency notices are retained.

## Local verification

- Real Ruby 3.3.12 / Jekyll 3.10.0 production build with strict front matter.
- 35 generated HTML pages, including collection detail pages and redirects.
- `python scripts/verify_site.py`: all local links, image and CSS/font references, original outgoing links, record counts, image SHA-256 checksums, and absence of the reference owner's content checked.
- Browser comparison at 1280px: identical 18px body font, font stack, sidebar width (192.953px), and outer article width (1020.688px) to the reference.
- Main sections and all three resource pages checked at 390px and 768px. Home and Research also checked at 320px. No horizontal overflow.
- Mobile navigation, profile dropdown, and light/dark theme switching checked.
- All retained page images loaded successfully; no browser console errors observed.

Deployment status and URLs are recorded in the final delivery after the remote deployment has been verified.
