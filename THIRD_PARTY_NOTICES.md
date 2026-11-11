# Third-party notices

Nagi's own code is MIT (see [LICENSE](LICENSE)). It bundles or adapts these:

| what | where | licence |
|---|---|---|
| **Koi pond**: "Koi Pond, Noon" by Mia-lab (Mia's AI Lab, [@MiaAI_lab](https://x.com/MiaAI_lab)), from [MiaAI-Lab/Claude-Fable-5.2-HTML-Files](https://github.com/MiaAI-Lab/Claude-Fable-5.2-HTML-Files) | adapted in `src/koi.js` → `theme/nagi.js` | **no licence given** in the source. Used with thanks; the original author retains all rights to the adapted portions, and the MIT licence does not apply to them |
| **Lucide** icons, © Lucide Icons and Contributors (some icons derived from Feather, © Cole Bemis, MIT) | `src/vendor/icons.css`, `icons.json` → `theme/nagi*.css` | ISC (+ MIT for the Feather-derived icons), full text: [`src/vendor/LICENSE-Lucide.txt`](src/vendor/LICENSE-Lucide.txt) |
| **Inter**, © 2016 The Inter Project Authors | `theme/fonts/inter.woff2` | SIL OFL 1.1, [`theme/fonts/LICENSE-Inter.txt`](theme/fonts/LICENSE-Inter.txt) |
| **Newsreader**, © 2020 The Newsreader Project Authors | `theme/fonts/newsreader*.woff2` | SIL OFL 1.1, [`theme/fonts/LICENSE-Newsreader.txt`](theme/fonts/LICENSE-Newsreader.txt) |
| **IBM Plex Mono**, © 2017 IBM Corp. (Reserved Font Name "Plex") | `theme/fonts/plexmono.woff2` | SIL OFL 1.1, [`theme/fonts/LICENSE-IBM-Plex.txt`](theme/fonts/LICENSE-IBM-Plex.txt) |

Not included, only linked / required at runtime:

- **[copyparty](https://github.com/9001/copyparty)** by ed (9001), MIT. Nagi is a theme for it. Install it separately (`pip install copyparty`).

Inspiration (no code used): **[Kanso](https://kanso.botiverse.build/)** by Botiverse, Inc. ([@botiverse](https://x.com/botiverse)), the zen-garden disk-space map.
