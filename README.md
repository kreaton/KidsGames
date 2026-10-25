# Forside

Statisk forside med links til spillene (`clockmaster/`, `countthedice/`, `fridatal/`, `numbertowers/`,
`numbertrainer/`, `stavemester/`, `whoisbiggest/`). Ingen build.

## Deploy til FTP

**GitHub Actions:** `.github/workflows/deploy.yml` uploader `index.html` og `billeder/` til FTP ved
hvert push til `main` (eller manuelt fra fanen Actions). Den bruger repository secrets `FTP_HOST`,
`FTP_USERNAME`, `FTP_PASSWORD` og `FTP_FOLDER` (roden af sitet, uden `/` til sidst).
