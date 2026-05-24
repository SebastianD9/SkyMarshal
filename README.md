[README.md](https://github.com/user-attachments/files/28190144/README.md)
# 🛸 SkyMarshal — Operation Centre

**SkyMarshal** to webowa aplikacja do zarządzania i monitorowania floty dronów wykorzystywanych przez służby ratunkowe i porządkowe. System umożliwia operatorom śledzenie stanu dronów w czasie rzeczywistym, filtrowanie według rodzaju zdarzenia oraz podgląd lokalizacji na interaktywnej mapie.

---

## 📋 Funkcje

- **Lista dronów** — przegląd całej floty wraz ze statusem (aktywny / ładuje się), przypisaną służbą i stacją bazową
- **Filtrowanie zdarzeń** — możliwość filtrowania dronów według rodzaju akcji: pożar, powódź, katastrofa, zaginięcie, zabezpieczanie strefy, transport medyczny
- **Wyszukiwarka lokalizacji** — pole z autouzupełnianiem do wyszukiwania miejsc
- **Interaktywna mapa** — podgląd lokalizacji drona na mapie opartej na bibliotece [Leaflet](https://leafletjs.com/)
- **Widok szczegółowy** — dedykowana strona (`index2.html`) z pełnym podglądem wybranego drona

## 🛡️ Obsługiwane służby

- Policja
- Straż Pożarna (PSP / OSP)
- Zarządzanie Kryzysowe
- Inne jednostki

---

## 🗂️ Struktura projektu

```
SkyMarshal/
├── index.html       # Główny panel — lista dronów i wyszukiwarka
├── index2.html      # Widok szczegółowy drona
├── css/             # Arkusze stylów (skompilowane z Sass)
├── sass/            # Źródłowe pliki Sass
└── js/              # Logika aplikacji (JavaScript)
```

---

## 🚀 Uruchomienie

Projekt nie wymaga żadnych zależności backendowych. Wystarczy otworzyć `index.html` w przeglądarce lub uruchomić lokalny serwer HTTP, np.:

```bash
npx serve .
```

---

## 🛠️ Technologie

- **HTML5 / CSS3**
- **Sass** — preprocesor CSS
- **JavaScript** (Vanilla JS)
- **Leaflet.js** — interaktywne mapy
- **Font Awesome** — ikony

---

## 📌 Status projektu

Projekt w aktywnym rozwoju. Planowane funkcje:
- [ ] Śledzenie trasy drona w czasie rzeczywistym
- [ ] Powiadomienia o zmianie statusu
- [ ] Panel statystyk i raportowania

---

> *SkyMarshal — kontroluj przestrzeń, reaguj szybciej.*
