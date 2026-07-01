# Auren Dashboard

Modern self-hosted browser start page and home lab dashboard.

Auren is a quiet, glassy, profile-aware dashboard for shortcuts, notes, todos, calendars, and lightweight personal/family workspace views. It is built for trusted home networks, homelabs, Tailscale/VPN setups, and reverse-proxy deployments.

![Auren logo](public/aurenlogo.png)

## Highlights

- React + TypeScript + Vite frontend
- small Node.js backend with JSON-file storage
- multi-profile dashboard state
- shortcut grid and library with categories
- drag-and-drop ordering for shortcuts, todos, and widgets
- grid layout and free-canvas layout
- quick search with URL detection and configurable provider
- multi-note workspace with simple Markdown preview
- todo widget and dashboard widgets
- WeatherAPI.com integration with global API key and per-profile location
- iCal and CalDAV calendar integration
- global or per-profile calendar source mode
- Docker-first deployment with GHCR image versioning
- `/api/health` and `/api/version` endpoints
- in-app update badge when a newer release is available

## Quick Start With Docker

Create a compose file:

```yaml
services:
  auren:
    image: ghcr.io/rcsy-px/auren:latest
    ports:
      - "8080:8080"
    environment:
      - WEATHERAPI_KEY=${WEATHERAPI_KEY:-}
      - AUREN_RELEASE_REPO=rcsy-px/auren
      - AUREN_UPDATE_CHECK=true
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

Run it:

```bash
docker compose up -d
```

Open:

```text
http://localhost:8080
```

The `./data` volume stores dashboard profiles and backend-only secrets.

## Updating

If you use `latest`:

```bash
docker compose pull
docker compose up -d
```

If you prefer pinned versions:

```yaml
image: ghcr.io/rcsy-px/auren:0.1.0
```

Then update the tag when you are ready.

Auren checks GitHub releases/tags through `/api/version`. When a newer version is available, a small green badge appears on the Settings icon. Disable outbound update checks with:

```env
AUREN_UPDATE_CHECK=false
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the backend and frontend in separate terminals:

```bash
npm run dev:api
npm run dev -- --port 5173
```

Open:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:8080`.

Build and run production locally:

```bash
npm run build
npm start
```

## Local Docker Build

For development or testing without a published image:

```bash
docker compose -f docker-compose.local.yml up --build
```

## Chromium New Tab Extension

A minimal Manifest V3 extension scaffold lives in `extension/chromium`. It replaces the Chromium new tab page with an extension page and renders the configured Auren dashboard inside a full-screen iframe.

For local testing:

1. Open `chrome://extensions` in Chrome, Vivaldi, Edge, or another Chromium-based browser.
2. Enable Developer mode.
3. Choose "Load unpacked".
4. Select `extension/chromium`.
5. Open a new tab or the extension options and enter the dashboard IP/URL.

The extension stores only the dashboard URL in `chrome.storage.sync`. If the protocol is omitted, it saves the address as `http://...`. Vivaldi uses its own Start Page handling, so the scaffold also includes a background fallback that opens the extension new tab wrapper for internal new tab URLs.`r`n`r`nCurrent wrapper limitations: iframe rendering must be allowed by the dashboard/proxy, there is no offline snapshot yet, and Vivaldi support is a tab guard rather than a real browser setting override.

## Configuration

Copy the example environment file if you are running from this repository:

```bash
cp .env.example .env
```

Useful variables:

```env
AUREN_IMAGE=ghcr.io/rcsy-px/auren
AUREN_VERSION=latest
AUREN_PORT=8080
WEATHERAPI_KEY=
AUREN_RELEASE_REPO=rcsy-px/auren
AUREN_UPDATE_CHECK=true
```

## Storage

Auren stores runtime data in the mounted `data/` directory:

```text
data/dashboard.json
data/weather-key.json
data/calendar-source.json
```

These files are intentionally ignored by Git.

The dashboard snapshot stores:

- profiles
- active profile ID
- shortcuts
- todos
- notes
- profile-specific settings
- layout data

Backend-only files store:

- WeatherAPI key
- iCal URL
- CalDAV URL, username, and password/app password

## Profiles

Each profile has its own dashboard data:

- shortcuts
- todos
- note
- visual settings
- layout mode and free-canvas positions
- weather location
- calendar widget settings

The WeatherAPI key is global. The calendar source can be global or profile-specific.

## Calendar

Auren supports:

- iCal feed URLs
- basic CalDAV connections
- Basic and Digest auth
- simple recurring events: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`
- global family calendar mode
- per-profile calendar source mode

Calendar secrets are never sent to the frontend. The frontend receives normalized events from `/api/calendar`.

## Security Notes

Auren currently has no built-in login system. Deploy it on a trusted LAN, over VPN/Tailscale, or behind reverse-proxy authentication.

Do not expose it directly to the public internet without an auth layer.

## Release Process

The repository includes a GHCR publish workflow at `.github/workflows/docker-publish.yml`.

Create a release by pushing a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Published images:

```text
ghcr.io/rcsy-px/auren:0.1.0
ghcr.io/rcsy-px/auren:0.1
```

Pushes to `main` publish `latest`.

See [RELEASE.md](RELEASE.md) for the full checklist.

## API Endpoints

```text
GET /api/health
GET /api/version
GET /api/dashboard
PUT /api/dashboard
GET /api/weather?location=Budapest
GET /api/weather/key
PUT /api/weather/key
GET /api/calendar?scope=global|profile&profileId=...
GET /api/calendar/source?scope=global|profile&profileId=...
PUT /api/calendar/source?scope=global|profile&profileId=...
```

## License

No license has been declared yet. Add one before accepting outside contributions.
