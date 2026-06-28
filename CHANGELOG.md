# Changelog

## 0.1.3 - 2026-06-28

### Changed

- Added an in-settings update badge on the System tab when a newer version is available.

## 0.1.2 - 2026-06-28

### Fixed

- Fixed Docker bind-mount persistence by preparing the data directory permissions before starting the Node server.

## 0.1.1 - 2026-06-28

### Fixed

- Added a browser-compatible UUID fallback for non-secure HTTP contexts where `crypto.randomUUID()` is unavailable.

## 0.1.0 - 2026-06-28

Initial public release of Auren Dashboard.

### Added

- Self-hosted React/Vite dashboard with a small Node backend.
- Profile-based dashboard data, notes, todos, settings, layout, and shortcuts.
- Central JSON snapshot storage in `data/dashboard.json`.
- Shortcut library with category filtering, grid/list views, editing, and drag-and-drop ordering.
- Grid and free-canvas dashboard layouts.
- WeatherAPI.com proxy with a global API key and per-profile weather location.
- iCal and CalDAV calendar support with global or per-profile source scope.
- Docker image workflow, Compose files, health endpoint, and version/update checks.
