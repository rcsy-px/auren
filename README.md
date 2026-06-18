# Auren Dashboard

Modern, self-hosted böngésző kezdőlap és home lab dashboard. Az első MVP React + TypeScript + Vite alapon fut, LocalStorage-ba ment, és Dockerrel is indítható.

## Funkciók

- glassmorphism dashboard hegyes háttérrel
- gyorsindító ikonrács hozzáadás/szerkesztés/törlés funkcióval
- drag & drop rendezés shortcutokhoz és teendőkhöz
- rácsos és szabad vásznas elrendezés
- keresősáv URL felismeréssel és választható keresőmotorral
- naptár mock adatokkal
- LocalStorage-os teendők és gyors jegyzet
- több helyi profil aktív munkamenet választással
- Simple Icons alapú brand ikonok a fontosabb weboldalakhoz
- beállítások: háttér, blur, kártya áttetszőség, ikonméret, rács, üdvözlés, kereső, óraformátum, widgetek

## Helyi futtatás

```bash
npm install
npm run dev
```

Az app alapértelmezés szerint a Vite által kiírt lokális címen nyílik meg, például `http://localhost:5173`.

## Docker

```bash
docker compose up --build
```

Ezután: `http://localhost:8080`

## Új lapként használat

Chrome/Edge alatt telepíthető egy new tab redirect bővítmény, amelynek cél URL-je legyen a lokális vagy Dockeres cím. Self-hosted használatnál érdemes fix portot vagy reverse proxy címet adni neki.

## Testreszabás

A shortcutokat a `Hozzáadás` kártyával lehet felvenni. Dupla kattintással szerkeszthető egy meglévő shortcut, törölhető, és állítható az ikon, szín, kategória és új lapon nyitás. A drag & drop sorrend azonnal mentődik LocalStorage-ba.

Brand ikonhoz a `Simple Icons slug` mezőbe írható például `github`, `youtube`, `notion`, `spotify`, `gmail`, `figma`, `reddit`, `googledrive` vagy `googlecalendar`. Ha nincs találat, a fallback ikon/rövidítés jelenik meg.

## Elrendezés

A beállításokban váltható a `Rácsos, automatikus` és a `Szabad vászon` mód. Rácsos módban a shortcutok és widgetek rendezhetők, a felület automatikusan alkalmazkodik a kijelzőhöz. Szabad vászon módban a hero, kereső, óra, shortcutok, widgetek és idézet a jobb felső mozgató fogantyúval húzhatók a teljes képernyőn. A mozgatás 24 x 18-as százalékos snap gridre ugrik, ezért rendezett marad és monitorváltásnál is arányosan skálázódik.

Az alapértelmezett shortcutok a [src/data/defaultShortcuts.ts](/D:/Apps/GitHub/auren/src/data/defaultShortcuts.ts) fájlban vannak.

## Profilok

A beállítások modalban kezelhetők a profilok: választható az aktív profil, létrehozható új, átnevezhető vagy törölhető a jelenlegi profil. Minden profil külön shortcut, todo, jegyzet és beállítás adatcsomagot kap. Az aktív profil azonosítója és a profiladatok LocalStorage-ban tárolódnak, így ugyanazon böngészőben nem keverednek a munkamenetek.

## Jövőbeli ötletek

- Open-Meteo időjárás integráció
- CalDAV/Google Calendar naptár integráció
- Home Assistant widgetek
- több felhasználós backend és auth
- import/export JSON konfiguráció
- PWA offline mód
