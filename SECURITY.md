# Security

Auren is designed for trusted LAN, VPN, Tailscale, or reverse-proxy-auth deployments. It does not include built-in user authentication.

Do not expose Auren directly to the public internet without an authentication layer in front of it.

Runtime secrets are stored outside the repository in the mounted `data/` volume:

- `data/weather-key.json`
- `data/calendar-source.json`

If you discover a security issue, please do not open a public issue containing secrets or exploit details. Contact the maintainer privately, or open a minimal issue asking for a security contact.
