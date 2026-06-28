# Release Checklist

Use this when cutting a public Auren release.

1. Update `package.json` version.
2. Update `CHANGELOG.md`.
3. Run:

```bash
npm run build
node --check server.js
```

4. Confirm no secrets or runtime data are staged:

```bash
git status --short
git diff --cached --name-only
```

If runtime files were ever tracked before `.gitignore` was updated, untrack them without deleting local copies:

```bash
git rm --cached -r data dist node_modules
git rm --cached api.log api.err.log vite.log vite.err.log 2>/dev/null || true
```

5. Commit the release:

```bash
git add .
git commit -m "Prepare v0.1.0 release"
```

6. Tag and push:

```bash
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

The GitHub Actions workflow publishes Docker images to GHCR:

```text
ghcr.io/rcsy-px/auren:0.1.0
ghcr.io/rcsy-px/auren:0.1
```

The `main` branch also publishes `latest`.

Pushing a `v*.*.*` tag also creates a GitHub Release with generated release notes.
