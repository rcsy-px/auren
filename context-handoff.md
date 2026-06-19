# Auren Dashboard - context handoff

## Projekt állapot

Self-hosted böngésző kezdőlap / home lab dashboard Vite + React + TypeScript + Tailwind stacken.

Az app már nem csak LocalStorage-ra támaszkodik: van egy kis Node backend, amely központi JSON fájlba menti a dashboard/profil állapotot, és API-t ad az időjárás integrációhoz.

Fő fájlok:
- `src/App.tsx`
- `src/store/dashboardStore.ts`
- `src/lib/dashboardSync.ts`
- `server.js`
- `src/components/ShortcutGrid.tsx`
- `src/components/FreeDashboard.tsx`
- `src/components/SettingsModal.tsx`
- `src/components/ProfileManager.tsx`
- `src/components/ClockWeather.tsx`
- `src/styles/globals.css`

## Futtatás

Dev módban két folyamat kell:

```bash
npm run dev:api
npm run dev -- --port 5173
```

Frontend:

```text
http://localhost:5173
```

Backend/API:

```text
http://localhost:8080
```

A Vite proxyzza az `/api` kéréseket a `8080`-as Node szerverre.

Production/local:

```bash
npm run build
npm start
```

Docker:

```bash
docker compose up --build
```

Dockerben a `./data:/app/data` volume tartja meg a mentéseket.

## Központi mentés

A dashboard snapshot központi fájlba megy:

```text
data/dashboard.json
```

API:
- `GET /api/dashboard`
- `PUT /api/dashboard`

Sync működés:
- frontend induláskor lekéri a backend snapshotot
- ha nincs backend mentés, feltölti az aktuális lokális Zustand állapotot
- módosítások után debounce-olva ment
- több kliensnél egyszerű `last write wins`
- LocalStorage továbbra is fallback/cache jelleggel megmaradt Zustand persistben

Fontos: a snapshotban `profiles` + `activeProfileId` van, nem csak aktív profile data.

## Profilok

Profilkezelés:
- több profil
- aktív profil választás
- létrehozás
- átnevezés
- törlés
- profilkép URL
- profilkép tallózás

Profilkép:
- `avatarUrl` mezőben tárolódik
- URL vagy data URL lehet
- tallózáskor a kép `src/lib/image.ts` helperrel max 256 px-re kicsinyül
- data URL-ként bekerül a központi dashboard JSON-ba, így másik gépen is megjelenik
- hibás kép esetén fallback: profilnév kezdőbetűje

Sidebar:
- felül Auren logó mark
- alul aktív profil avatar / kezdőbetű fallback

## Logó és favicon

Felhasználó által adott PNG assetek:
- `public/aurenlogo.png` - teljes logó felirattal
- `public/aurenlogo_withoutName.png` - logó felirat nélkül

Wrapper SVG-k:
- `public/auren-logo.svg`
- `public/auren-mark.svg`

Jelenlegi favicon:
- `public/favicon.png`
- 512 x 512
- transzparens háttér
- `aurenlogo_withoutName.png` arányosan középre illesztve

`index.html` favicon:

```html
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="apple-touch-icon" href="/favicon.png" />
```

## Időjárás

Időjárás csak WeatherAPI.com kulccsal jelenik meg.

Nincs Open-Meteo fallback. Ha nincs kulcs:
- backend `GET /api/weather?...` válasz: `204 No Content`
- frontend nem renderel időjárás blokkot

Kulcs megadása:
- Settings modalban, WeatherAPI kulcs mezővel
- vagy `WEATHERAPI_KEY` env változóként

Backend-only kulcs fájl:

```text
data/weather-key.json
```

API:
- `GET /api/weather/key`
- `PUT /api/weather/key`
- `GET /api/weather?location=Budapest`

Ha env változóból jön a kulcs:
- Settingsben badge: `Aktív env kulcs`
- mező disabled, nem írható felül

Ha Settingsből jön:
- badge: `Aktív kulcs`
- üresen mentve törli

Weather UI:
- jobb felső óra alatt
- csak sikeres weather válasznál látszik
- 1024px alatt kompakt mód: csak ikon + hőfok
- nincs háttér/keret/blur az időjárás blokk mögött

## Shortcutok és ikonok

Shortcut funkciók:
- hozzáadás
- szerkesztés
- törlés
- drag & drop rendezés
- hosszú nyomásra szerkesztő modal
- dupla kattintás továbbra is szerkeszt

URL normalizálás:
- `src/lib/url.ts`
- `youtube.com` -> `https://youtube.com`
- mentéskor és megnyitáskor is normalizál

Ikonlogika:
1. Simple Icons slug
2. domain `/favicon.ico`
3. fallback rövidítés / név első karakterei

Favicon cache:
- `src/lib/favicon.ts`
- LocalStorage-ban domainenként `success` / `failed`
- sikeres képet a böngésző HTTP cache-e kezeli
- hibás faviconnál nem próbálgatja újra minden rendernél

UX:
- favicon betöltéskor fallback ikon látszik, arra fade-el rá a favicon
- nincs üresből beugró ikon

Fontos javítás:
- a sortable shortcutoknál a dnd-kit inline transform korábban felülírta a CSS hover animációt
- javítva: sortable transform külső wrapperen, belső `button.shortcut-card` kapja a hover animációt
- így a meglévő shortcutok hoverje ugyanolyan finom, mint a Hozzáadás gombé

## Settings modal

Settings modal újratervezve:
- szélesebb, modernebb layout
- szekciók:
  - Profilok
  - Általános
  - Megjelenés
  - Elrendezés
  - Widgetek
- ikonozott szekciófejlécek
- jobb range slider sorok
- widget kapcsolók
- WeatherAPI kulcs státusz badge
- animált nyitás és zárás
- kisebb viewporton scrollozható / egyoszlopos

## Animációk

Dependency nélkül, CSS transform/opacity alapon:
- modal backdrop fade in/out
- modal panel soft pop in/out
- shortcut hover/press finomítva
- ikon hover mozgás
- favicon fade/scale
- free layout drag/resize handle finom megjelenés
- gomb hover/press
- `prefers-reduced-motion` támogatás

## Free layout jelenlegi állapot

Layout módok:
- `grid`
- `free`

Free mode:
- teljes képernyős canvas
- 24 x 24 százalékos snap grid
- mozgatható:
  - hero
  - search
  - clock/weather
  - shortcutok
  - widgetek
  - quote
- widgeteken resize handle
- reset gomb Settingsben: `Alapértelmezett visszaállítása`
- reset az aktív profil `layout.freeItems` objektumát üríti

Default pozíciókat korábban feljebb húztuk, hogy kisebb/eltérő monitoron ne kelljen görgetni.

## Nyitott / kényes pontok

- Free mode UX még finomítható:
  - widget resize vizuális ellenőrzés
  - default reset elrendezés további finomítása
  - search bar nem resizable, nem stretch-elhet
  - widgetek stretch-elnek a wrapper méretére
- WeatherAPI kulcs mentése backend-only JSON-ba megy, de nincs külön titkosítás. Otthoni trusted LAN-ra oké, publikus hostolásnál később újragondolandó.
- Profilképek data URL-ként mennek a dashboard JSON-ba. Kicsinyítve vannak, de sok/nagy profilkép esetén nőhet a JSON.

## Fontos technikai megjegyzések

React 19 / Zustand selector bug már volt:

Hibás minta:

```ts
useDashboardStore((state) => [...state.shortcuts].sort(...))
```

Ez infinite render loopot okozott:

```text
The result of getSnapshot should be cached
Maximum update depth exceeded
```

Javítás:
- store selector csak nyers state-et adjon vissza
- rendezés `useMemo`-ban történjen

Ne rakj selectorba új tömböt vagy objektumot.

## Utolsó ellenőrzések

Legutóbb futtatva:

```bash
npm run build
node --check server.js
```

Mindkettő sikeres volt.
