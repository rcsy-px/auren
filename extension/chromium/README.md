# Auren New Tab Chromium Extension

Minimal Manifest V3 extension for Chromium-based browsers. It replaces the browser new tab page with an extension page and renders the configured Auren dashboard inside a full-screen iframe.

## Local install

1. Open `chrome://extensions` or the equivalent page in your Chromium-based browser.
2. Enable Developer mode.
3. Choose "Load unpacked".
4. Select this folder: `extension/chromium`.
5. Open the extension options or a new tab, then enter the dashboard IP/URL.

Examples:

```text
192.168.1.50:8080
http://192.168.1.50:8080
https://dashboard.example.com
```

If the protocol is omitted, the extension saves it as `http://...`.

## Notes

- Settings are stored in `chrome.storage.sync`.
- No dashboard token or secret is stored here, only the dashboard URL.
- The new tab page stays on the extension URL and embeds Auren in an iframe.
- The manifest allows `frame-src http: https:` and host permissions for HTTP/HTTPS dashboards.
- This is a first scaffold for Chrome Web Store compatible Chromium browsers.

## Troubleshooting

If the new tab page does not change after updating these files, open the browser extension page and press Reload on the unpacked Auren extension. Manifest changes are not picked up until the extension is reloaded.

Vivaldi has its own Start Page handling, so this scaffold includes two mechanisms:

- `chrome_url_overrides.newtab` for normal Chromium new tab replacement.
- `background.js` as a fallback guard that opens the extension `newtab.html` when internal new tab URLs such as `chrome://newtab/`, `vivaldi://startpage/`, delayed blank tabs, or Vivaldi internal Speed Dial extension URLs appear.

If the extension page opens but the dashboard area stays blank, the dashboard server or reverse proxy may be blocking iframe rendering with `X-Frame-Options` or CSP `frame-ancestors` headers. The local Auren server does not currently set those blocking headers.
The extension cannot rewrite Vivaldi's own browser settings directly. Instead, it watches newly created tabs and replaces detected internal new tab / Speed Dial pages with the extension wrapper page.
## Current limitations

- The dashboard must allow iframe rendering. Reverse proxies must not send blocking `X-Frame-Options` or CSP `frame-ancestors` headers.
- The address bar stays on the extension `newtab.html` URL because Auren is embedded instead of directly navigated to.
- There is no offline snapshot yet. If the Auren server is unavailable, the iframe cannot render the dashboard.
- Vivaldi support relies on a fallback tab guard, not a real browser settings override.
- The extension currently requests broad HTTP/HTTPS host permissions so user-provided dashboard URLs can be framed.
- The floating Settings button is the only in-page control for changing the saved dashboard URL from the wrapper.