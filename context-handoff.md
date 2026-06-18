# Auren Dashboard - context handoff

## Projekt állapot

Self-hosted böngésző kezdőlap / dashboard MVP készül Vite + React + TypeScript + Tailwind stacken.

Fő fájlok:
- `src/App.tsx`
- `src/store/dashboardStore.ts`
- `src/components/ShortcutGrid.tsx`
- `src/components/FreeDashboard.tsx`
- `src/components/SettingsModal.tsx`
- `src/styles/globals.css`
- `src/data/defaultShortcuts.ts`

Dev szerver korábban futott itt:

```bash
npm run dev -- --port 5173
```

Build ellenőrzés:

```bash
npm run build
```

Legutóbbi build sikeres volt.

## Elkészült funkciók

- dark glassmorphism dashboard UI
- generált háttér: `public/dashboard-bg.png`
- sidebar
- óra / dátum / mock időjárás
- keresősáv URL felismeréssel és provider választással
- shortcut grid hozzáadás / szerkesztés / törlés funkcióval
- drag & drop shortcut rendezés grid módban
- widgetek: naptár, teendők, jegyzet
- teendők hozzáadás / törlés / kipipálás / rendezés
- LocalStorage mentés Zustand persisttel
- profilkezelés:
  - több profil
  - aktív profil
  - profil létrehozás / átnevezés / törlés
  - profilonként külön shortcut/todo/note/settings/layout adat
- Simple Icons brand ikonok több shortcutnál
- Dockerfile, docker-compose, README

## Free layout jelenlegi állapot

Van két layout mód:
- `grid`
- `free`

Beállításokban váltható.

Free mode:
- teljes képernyős canvas
- 24 x 24 százalékos snap grid
- mozgatható elemek:
  - hero
  - search
  - clock/weather
  - shortcutok
  - widgetek
  - quote
- widgeteken resize handle van
- shortcutok compact wrapperben vannak, hogy a grabber ne egy túl széles láthatatlan cellán legyen
- reset gomb van Settingsben: `Alapértelmezett visszaállítása`
- reset az aktív profil `layout.freeItems` objektumát üríti

Fontos legutóbbi javítás:
- korábban kétféle snap volt:
  - default pozíciók 24 x 24 gridből
  - ikon húzás pixel alapú trackből
- ezt egységesítettük, most az ikon drag is a 24 x 24 gridre snapel

## Nyitott / kényes pontok

Free mode UX még nem végleges. A felhasználó szerint voltak furcsaságok:
- ikonok snap viselkedése több iteráción ment át
- widget resize működik, de érdemes vizuálisan újra ellenőrizni
- reset default most grid-szerűbb, de még lehet finomítani
- search bar nem resizable, és nem stretch-elhet
- widgetek stretch-elnek a wrapper méretére

Ha folytatjuk, első lépésként érdemes:
1. `npm run dev -- --port 5173`
2. böngészőben free mode reset
3. kézzel tesztelni:
   - ikon mozgatás
   - ikon visszahúzás default snap pontra
   - widget mozgatás
   - widget resize
   - search bar magasság
   - reset működés

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

## Utolsó ismert build

```bash
npm run build
```

Sikeres volt.

