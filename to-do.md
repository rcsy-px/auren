# Projekt: Self-hosted böngésző kezdőlap / dashboard

Készíts egy modern, self-hosted webalkalmazást, ami böngésző új lapként használható, Heimdall-szerű gyorsindító dashboard, de letisztultabb, modernebb és jobban testreszabható.
Van egy mockup.png, hasolnlót szeretnék.
## Cél

Egy személyes/family/home lab dashboard, ahol a felhasználó gyorsan eléri a gyakran használt weboldalakat, self-hosted szolgáltatásokat, jegyzeteket, teendőket és naptár eseményeket.

A dizájn inspirációja:
- sötét, prémium, glassmorphism jellegű UI
- hegyes / absztrakt háttér
- bal oldali fix sidebar ikonokkal
- középen üdvözlő szöveg
- keresősáv
- rendezhető ikon grid
- alsó widget kártyák: naptár, teendők, jegyzet
- jobb felső sarokban óra, dátum, időjárás

## Tech stack

Használj modern, könnyen self-hostolható stack-et:

- Next.js vagy Vite + React
- TypeScript
- Tailwind CSS
- shadcn/ui vagy saját komponensek
- Framer Motion opcionálisan
- Zustand vagy más egyszerű state management
- LocalStorage első körben, később könnyen cserélhető backend API-ra
- Docker támogatás
- docker-compose.yml
- PWA támogatás opcionálisan

Első verzióban ne kelljen adatbázis. Minden adat tárolható LocalStorage-ban vagy JSON configban.

## Fő funkciók

### 1. Gyorsindító ikonok

Legyen egy ikonrács, ahol app shortcutok jelennek meg.

Minden shortcut mezői:

- id
- name
- url
- icon
- color
- category
- openInNewTab
- order

A felhasználó tudja:

- hozzáadni
- szerkeszteni
- törölni
- átrendezni drag & drop-pal
- kategóriába sorolni
- ikont választani
- URL-t megadni
- új lapon nyitást beállítani

Drag and drophoz használhatsz például `@dnd-kit` könyvtárat.

### 2. Testreszabhatóság

Legyen Settings panel/modal, ahol állítható:

- háttérkép vagy háttér gradient
- blur erőssége
- glass kártyák átlátszósága
- ikonméret
- rács oszlopszám
- üdvözlő szöveg
- kereső provider: Google, DuckDuckGo, Brave, Bing
- 12/24 órás időformátum
- időjárás helyszín
- sidebar menüpontok sorrendje
- widgetek láthatósága

A beállításokat LocalStorage-ba mentsd.

### 3. Keresősáv

Középen legyen nagy keresősáv.

Működés:

- ha URL-t ír be a felhasználó, nyissa meg URL-ként
- ha sima keresést ír be, küldje a kiválasztott keresőmotorba
- Enterre működjön
- jobb oldalon legyen egy nyíl ikon
- placeholder magyarul: „Keresés a Google-ben vagy írj be egy URL-t”

### 4. Widget kártyák

Alul legyen 3 glass kártya:

#### Naptár widget

Első körben mock adat:

- időpont
- cím

Később legyen könnyen cserélhető külső API-ra.

#### Teendők widget

A felhasználó tudjon:

- új teendőt hozzáadni
- kipipálni
- törölni
- átrendezni
- LocalStorage-ba menteni

#### Jegyzet widget

Egyszerű gyors jegyzet:

- szerkeszthető szöveg
- automatikus mentés
- placeholder: „Új jegyzet”

### 5. Sidebar

Bal oldalon fix, keskeny sidebar.

Tartalmazzon ikonokat:

- főoldal/dashboard
- könyvjelzők
- idő/naptár
- jegyzetek
- beállítások
- alsó részen téma váltó ikon

A sidebar legyen modern, minimalista, sötét, enyhén áttetsző.

### 6. Óra / dátum / időjárás

Jobb felső sarokban:

- aktuális idő
- dátum magyar formátumban
- mock időjárás adat első körben, például 18°C

Később legyen előkészítve Open-Meteo API integrációra, de első körben ne legyen kötelező.

### 7. UI elvárások

A felület legyen nagyon letisztult és modern.

Stílus:

- dark mode alapértelmezett
- glassmorphism cardok
- soft shadow
- subtle borders
- rounded corners
- nagy whitespace
- háttér elmosott, mélységgel
- hover animációk
- aktív állapotok
- responsive desktop/tablet/mobil

Fontos: ne legyen zsúfolt. Inkább prémium, fókuszált kezdőlap érzete legyen.

### 8. Komponens struktúra

Javasolt struktúra:

src/
  components/
    Sidebar.tsx
    SearchBar.tsx
    ShortcutGrid.tsx
    ShortcutCard.tsx
    WidgetCard.tsx
    CalendarWidget.tsx
    TodoWidget.tsx
    NotesWidget.tsx
    SettingsModal.tsx
    ClockWeather.tsx
  store/
    dashboardStore.ts
  types/
    dashboard.ts
  lib/
    storage.ts
    search.ts
  data/
    defaultShortcuts.ts
  styles/
    globals.css

### 9. Alapértelmezett shortcutok

Legyenek előre felvéve példák:

- Gmail
- Naptár
- Notion
- YouTube
- Drive
- GitHub
- LinkedIn
- Reddit
- Figma
- Spotify
- Hírek

Használhatsz Lucide ikonokat, Simple Icons-t vagy URL alapú favicon lekérést.

### 10. Fontos működési elvárások

- A shortcutok drag & drop után azonnal mentődjenek
- A beállítások mentődjenek automatikusan
- Az app fusson teljesen lokálisan/self-hosted módon
- Dockerrel indítható legyen
- Reszponzív legyen
- Ne legyen szükség külső auth-ra első verzióban
- A kód legyen tiszta, komponens alapú és könnyen bővíthető

### 11. Docker

Készíts:

- Dockerfile
- docker-compose.yml
- README.md

A README tartalmazza:

- telepítés
- futtatás docker-compose-zal
- hogyan lehet browser new tabként használni
- hogyan lehet shortcutokat testreszabni
- jövőbeli fejlesztési ötletek

### 12. Első MVP scope

Az első működő verzióban legyen kész:

- teljes UI
- shortcut grid
- shortcut hozzáadás/szerkesztés/törlés
- drag & drop rendezés
- keresősáv
- todo widget
- jegyzet widget
- settings modal
- LocalStorage mentés
- Docker futtatás

Naptár és időjárás lehet mock adat.

A cél egy működő, szép, self-hosted dashboard MVP, amit később backenddel, user auth-tal, Home Assistant integrációval és API-kal lehet bővíteni.