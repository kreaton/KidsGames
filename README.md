# KidsGames

![Static HTML](https://img.shields.io/badge/site-static%20HTML-lightgrey)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

![Børnenes Spil: forsiden til otte små spil](images/banner.png)

**Forsiden til elleve små spil.**

Statisk forside med links til spillene (`axolotltables/`, `clockmaster/`, `clockmastereasy/`, `countthedice/`, `fridatal/`, `huskemester/`, `kombimester/`, `numbertowers/`,
`numbertrainer/`, `stavemester/`, `whoisbiggest/`). Ingen build. Spillene ligger som undermapper af
KidsGames og deployes af deres egne repos.

**GitHub Pages:** <https://kreaton.github.io/KidsGames/> med spillene i `/KidsGames/<spil>/`

## Deploy

**GitHub Actions:** `.github/workflows/deploy.yml` kører ved hvert push til `main` (eller manuelt
fra fanen Actions) og lægger `index.html` og `billeder/` i roden af branchen `gh-pages`, som
GitHub Pages serverer.

Hvert spil bygger sig selv og lægger sig i sin egen mappe i `gh-pages` (via deploy-nøglen
`PAGES_DEPLOY_KEY`). Opsætningen af deploy-nøglen laves én gang med
`_ToolsAndScripts/scripts/Setup-KidsGamesDeploy.ps1`.

## License & Authorship

This project is distributed under the terms of the [MIT License](LICENSE).

**AI authorship note:** Most of the source code in this repository was generated with AI coding agents (Claude Code), under my direction and review. Purely AI-generated material may not be eligible for copyright protection in some jurisdictions. To the extent any part of this project is protected by copyright, it is licensed under the MIT License, and the license's warranty and liability disclaimers apply to the project as a whole.
