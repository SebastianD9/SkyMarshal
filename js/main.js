document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // SEKCJA 1: FILTROWANIE TABELI
    // =========================================================================
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-button');
    const clearButton = document.querySelector('.clear-filters-btn');
    const serviceSelect = document.querySelector('.select-wrapper select');
    const tableRows = () => Array.from(document.querySelectorAll('.listDrones table tr')).slice(1);

    // Zmienna pomocnicza informująca, czy właśnie czyścimy filtry
    let czyCzyszczone = false;

    // -------------------------------------------------------------------------
    // Pomocnicza: oblicz odległość liniową w metrach między dwoma [lat, lng]
    // -------------------------------------------------------------------------
    const liniowaDystans = (a, b) => {
        const latM  = (a[0] - b[0]) * 111320;
        const lngM  = (a[1] - b[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180);
        return Math.sqrt(latM * latM + lngM * lngM);
    };

    // Mapowanie ID drona na nazwę i współrzędne
    const DRONE_DATA_PODGLAD = {
        drone00: { name: 'Drone #00', coords: [50.593352, 22.037311] },
        drone01: { name: 'Drone #01', coords: [50.571415, 22.069184] },
        drone02: { name: 'Drone #02', coords: [50.547381, 22.051606] },
        drone03: { name: 'Drone #03', coords: [50.593352, 22.037311] },
        drone04: { name: 'Drone #04', coords: [50.571415, 22.069184] },
        drone05: { name: 'Drone #05', coords: [50.547381, 22.051606] },
        drone06: { name: 'Drone #06', coords: [50.593352, 22.037311] },
        drone07: { name: 'Drone #07', coords: [50.571415, 22.069184] },
        drone08: { name: 'Drone #08', coords: [50.547381, 22.051606] },
        drone09: { name: 'Drone #09', coords: [50.593352, 22.037311] },
        drone10: { name: 'Drone #10', coords: [50.571415, 22.069184] },
        drone11: { name: 'Drone #11', coords: [50.547381, 22.051606] },
        drone12: { name: 'Drone #12', coords: [50.593352, 22.037311] },
        drone13: { name: 'Drone #13', coords: [50.571415, 22.069184] },
        drone14: { name: 'Drone #14', coords: [50.547381, 22.051606] },
        drone15: { name: 'Drone #15', coords: [50.593352, 22.037311] },
        drone16: { name: 'Drone #16', coords: [50.571415, 22.069184] } 
    };

    const POZYCJE_DRONOW_BY_ID = {
        drone00: [50.593352, 22.037311],
        drone01: [50.571415, 22.069184],
        drone02: [50.547381, 22.051606],
        drone03: [50.593352, 22.037311],
        drone04: [50.571415, 22.069184],
        drone05: [50.547381, 22.051606],
        drone06: [50.593352, 22.037311],
        drone07: [50.571415, 22.069184],
        drone08: [50.547381, 22.051606],
        drone09: [50.593352, 22.037311],
        drone10: [50.571415, 22.069184],
        drone11: [50.547381, 22.051606],
        drone12: [50.593352, 22.037311],
        drone13: [50.571415, 22.069184],
        drone14: [50.547381, 22.051606],
        drone15: [50.593352, 22.037311],
        drone16: [50.571415, 22.069184]
    };

    const MAX_DYSTANS = 2500; // metry

    // -------------------------------------------------------------------------
    // Filtrowanie + sortowanie po kliknięciu Search
    // -------------------------------------------------------------------------
    const filtrujISort = () => {
        const celRaw  = localStorage.getItem("celDrona");
        const cel     = celRaw ? JSON.parse(celRaw) : null;
        const rows    = tableRows();
        const wybraneZdarzenie = serviceSelect ? serviceSelect.value : '';

        const mapowanieZdarzen = {
            'pozar': ['Straż', 'Inne'],
            'powodz': ['Kryzysowe', 'Straż'],
            'katastrofa': ['Kryzysowe', 'Straż', 'Policja', 'Inne'],
            'zaginiecie': ['Policja'],
            'zabezpieczenie': ['Policja'],
            'transport': ['Inne']
        };

        rows.forEach(row => {
            // ZAWSZE domyślnie pokazujemy wiersz na starcie pętli
            row.style.display = '';
            
            const aktywny = row.querySelector('.status-active') !== null;
            const droneId = row.getAttribute('data-id');
            const serviceData = row.getAttribute('data-service');

            // 1. Jeśli kliknięto "Wyczyść filtry", ignorujemy resztę blokad i pokazujemy wszystko
            if (czyCzyszczone) {
                row.dataset.dystans = 0;
                return;
            }

            // 2. Filtrowanie po wybranej służbie (z selecta)
            if (wybraneZdarzenie) {
                const wymaganaSluzba = mapowanieZdarzen[wybraneZdarzenie];
                if (!wymaganaSluzba.includes(serviceData)) {
                    row.style.display = 'none';
                    row.dataset.dystans = Infinity;
                    return;
                }
            }

            // 3. Nieaktywne (ładujące się) – ukryj w normalnym trybie wyszukiwania
            if (!aktywny) {
                row.style.display = 'none';
                row.dataset.dystans = Infinity;
                return;
            }

            // 4. Dla aktywnych – filtruj po odległości od celu
            if (cel) {
                const pos = POZYCJE_DRONOW_BY_ID[droneId];
                if (pos) {
                    const dystans = liniowaDystans(pos, cel);
                    row.dataset.dystans = dystans;
                    if (dystans > MAX_DYSTANS) {
                        row.style.display = 'none';
                    }
                } else {
                    row.dataset.dystans = Infinity;
                    row.style.display = 'none';
                }
            } else {
                row.dataset.dystans = 0;
            }
        });

        // Przebudowanie tabeli (sortowanie) – zapobiega "pogubieniu" wierszy w DOM
        const table = document.querySelector('.listDrones table');
        if (cel && !czyCzyszczone) {
            const widoczne = rows.filter(r => r.style.display !== 'none');
            const niewidoczne = rows.filter(r => r.style.display === 'none');
            
            widoczne.sort((a, b) => parseFloat(a.dataset.dystans) - parseFloat(b.dataset.dystans));
            
            widoczne.forEach(r => table.appendChild(r));
            niewidoczne.forEach(r => table.appendChild(r));
        } else {
            // Przywrócenie domyślnej kolejności według ID drona (drone00 -> drone16)
            rows.sort((a, b) => {
                return a.getAttribute('data-id').localeCompare(b.getAttribute('data-id'));
            });
            rows.forEach(r => table.appendChild(r));
        }
    };

    window.applyDroneFilters = filtrujISort;

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            czyCzyszczone = false;
            filtrujISort();
            saveListState();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchButton.click();
        });
    }

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (serviceSelect) serviceSelect.value = '';
            
            localStorage.removeItem('celDrona');
            localStorage.removeItem('celDronaText');
            localStorage.removeItem('listState');
            
            // Ustawiamy flagę, by funkcja pokazała również drony ładujące się
            czyCzyszczone = true;
            filtrujISort();
        });
    }

    const saveListState = () => {
        const locationValue = searchInput ? searchInput.value : '';
        const serviceValue = serviceSelect ? serviceSelect.value : '';
        localStorage.setItem('listState', JSON.stringify({
            location: locationValue,
            service: serviceValue
        }));
    };

    const restoreListState = () => {
        const state = localStorage.getItem('listState');
        if (state) {
            try {
                const { location, service } = JSON.parse(state);
                if (location && searchInput) searchInput.value = location;
                if (service && serviceSelect) serviceSelect.value = service;
            } catch(e) {}
        }
        const savedText = localStorage.getItem('celDronaText');
        if (savedText && searchInput) searchInput.value = savedText;
    };

    // Zapisz stan przed opuszczeniem strony
    document.querySelectorAll('.listDrones table a[data-drone-id]').forEach(link => {
        link.addEventListener('click', () => {
            const droneId = link.getAttribute('data-drone-id');
            localStorage.setItem('currentDroneId', droneId);
            saveListState();
        });
    });

    // =========================================================================
    // SEKCJA 2: DASHBOARD DRONA & SYMULACJA
    // =========================================================================
    const launchBtn    = document.querySelector(".launch-btn");
    const statusBadge  = document.querySelector(".status-badge");

    const batteryValue   = document.querySelector(".battery-card .value");
    const batteryProgress = document.querySelector(".battery-card .progress");
    const batterySubtext = document.querySelector(".battery-card .subtext");

    const distanceValue   = document.getElementById("distance-value");
    const distanceSubtext = document.getElementById("distance-subtext");

    const speedValue   = document.querySelector(".speed-card .value");
    const speedSubtext = document.querySelector(".speed-card .subtext");

    const altValue = document.querySelector(".alt-card .value");

    let simInterval  = null;
    let flightSeconds = 0;

    let currentBattery  = 100;
    let currentDistance = 1.4;
    let currentAlt   = 0;
    let currentSpeed = 0;

    let currentDroneId = localStorage.getItem('currentDroneId') || 'drone01';
    const dronePodglad = DRONE_DATA_PODGLAD[currentDroneId] || DRONE_DATA_PODGLAD['drone01'];

    const droneInfoHeader = document.querySelector('.drone-info h2');
    if (droneInfoHeader) {
        droneInfoHeader.textContent = `Podgląd: ${dronePodglad.name}`;
    }

    const ustawDystansPoczatkowy = () => {
        const celRaw = localStorage.getItem("celDrona");
        if (!celRaw || !distanceValue || !distanceSubtext) return;
        
        const cel = JSON.parse(celRaw);
        const pozDrona = dronePodglad.coords;
        const dystans = liniowaDystans(pozDrona, cel);
        currentDistance = dystans / 1000;
        distanceValue.textContent = `${Math.round(dystans)} m`;
        const totalSec = Math.round(currentDistance * 1000 / (48 / 3.6));
        const etaMin = Math.floor(totalSec / 60);
        const etaSec = totalSec % 60;
        distanceSubtext.textContent = `ETA: ${etaMin} min ${etaSec} sek`;
    };

    ustawDystansPoczatkowy();

    const getRandomArbitrary = (min, max) => Math.random() * (max - min) + min;

    const updateSimulation = () => {
        flightSeconds++;

        if (flightSeconds <= 10) {
            currentSpeed += getRandomArbitrary(4, 5.5);
            if (currentSpeed > 48) currentSpeed = 48;

            currentAlt += getRandomArbitrary(11, 13);
            if (currentAlt > 120) currentAlt = 120;
        } else {
            currentSpeed += getRandomArbitrary(-1.5, 1.5);
            if (currentSpeed < 43) currentSpeed = 43;
            if (currentSpeed > 52) currentSpeed = 52;

            currentAlt += getRandomArbitrary(-0.8, 0.8);
            if (currentAlt < 117) currentAlt = 117;
            if (currentAlt > 123) currentAlt = 123;
        }

        if (speedValue && speedSubtext) {
            speedValue.textContent = `${Math.round(currentSpeed)} km/h`;
            const currentWind = Math.round(getRandomArbitrary(10, 14));
            speedSubtext.textContent = `Wiatr: ${currentWind} km/h (Boczny)`;
        }

        if (altValue) {
            altValue.textContent = `${Math.round(currentAlt)} m`;
        }

        if (batteryValue && batteryProgress && batterySubtext) {
            if (currentBattery > 0) {
                const batteryDrain = flightSeconds <= 10
                    ? getRandomArbitrary(0.3, 0.5)
                    : getRandomArbitrary(0.1, 0.2);
                currentBattery -= batteryDrain;
                if (currentBattery < 0) currentBattery = 0;

                const batteryRound = Math.round(currentBattery);
                batteryValue.textContent = `${batteryRound}%`;
                batteryProgress.style.width = `${batteryRound}%`;

                const minutesLeft = Math.round((currentBattery * 18) / 60);
                batterySubtext.textContent = `Pozostało: ok. ${minutesLeft} min`;
            }
        }

        if (distanceValue && distanceSubtext) {
            if (currentDistance > 0 && currentSpeed > 10) {
                const distanceFactor = (currentSpeed / 50) * getRandomArbitrary(0.015, 0.025);
                currentDistance -= distanceFactor;
                if (currentDistance < 0) currentDistance = 0;

                distanceValue.textContent = `${Math.round(currentDistance * 1000)} m`;

                const totalSeconds = Math.round(currentDistance * 140);
                const etaMin = Math.floor(totalSeconds / 60);
                const etaSec = totalSeconds % 60;
                distanceSubtext.textContent = currentDistance > 0
                    ? `ETA: ${etaMin} min ${etaSec} sek`
                    : "Cel osiągnięty";
            }
        }
    };

    if (launchBtn && statusBadge) {
        launchBtn.addEventListener("click", () => {
            if (statusBadge.classList.contains("ready")) {
                statusBadge.classList.remove("ready");
                statusBadge.classList.add("active");
                statusBadge.textContent = "W locie";

                launchBtn.innerHTML = '<i class="fa-solid fa-circle-stop"></i> Zatrzymaj';
                launchBtn.style.backgroundColor = "#333";

                flightSeconds   = 0;
                currentBattery  = 78;
                currentAlt   = 0;
                currentSpeed = 0;

                simInterval = setInterval(updateSimulation, 1000);
            } else {
                statusBadge.classList.remove("active");
                statusBadge.classList.add("ready");
                statusBadge.textContent = "Gotowy do lotu";

                launchBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> Uruchom';
                launchBtn.style.backgroundColor = "";

                clearInterval(simInterval);
                ustawDystansPoczatkowy();

                if (batteryValue)   batteryValue.textContent   = "78%";
                if (batteryProgress) batteryProgress.style.width = "78%";
                if (batterySubtext) batterySubtext.textContent = "Pozostało: ok. 22 min";
                if (speedValue)     speedValue.textContent     = "0 km/h";
                if (speedSubtext)   speedSubtext.textContent   = "Wiatr: -- km/h";
                if (altValue)       altValue.textContent       = "0 m";
            }
        });
    }

    // =========================================================================
    // SEKCJA 3: MAPA LEAFLET W MODALU
    // =========================================================================
    const podgladBtn   = document.querySelector(".podglad");
    const mapModal     = document.getElementById("map-modal");
    const closeModalBtn = document.querySelector(".close-modal-btn");

    let leafletMap  = null;
    let markerCelu = null;
    let markerDronaReal = null;
    let liniaLotuReal = null;

    const BAZY_DRONOW = {
        "Baza Południe (Strefa Przemysłowa)": [50.547381, 22.051606],
        "Baza Centrum (Jednostka Ratownicza)": [50.571415, 22.069184],
        "Baza Północ (Centrum Logistyczne)": [50.593352, 22.037311]
    };

    const initLeafletMap = () => {
        if (leafletMap) return;

        leafletMap = L.map('map').setView([50.5708, 22.0567], 13);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        }).addTo(leafletMap);

        for (let nazwa in BAZY_DRONOW) {
            L.circleMarker(BAZY_DRONOW[nazwa], {
                radius: 8,
                color: '#38bdf8',
                fillColor: '#0ea5e9',
                fillOpacity: 0.9,
                weight: 2
            }).addTo(leafletMap).bindPopup(`<b>${nazwa}</b>`);
        }

        const zapisanyCel = localStorage.getItem("celDrona");
        const pozDrona = dronePodglad.coords; 
    
        if (zapisanyCel && pozDrona) {
            const coordsCelu = JSON.parse(zapisanyCel);

            // 1. Rysowanie markera celu
            markerCelu = L.circleMarker(coordsCelu, {
                radius: 9,
                color: '#b91c1c',
                fillColor: '#b91c1c',
                fillOpacity: 0.9,
                weight: 2
            }).addTo(leafletMap).bindPopup("<b>Cel misji</b>").openPopup();

            // 2. Rysowanie markera wybranego drona (pobranego z Twojej listy)
            markerDronaReal = L.circleMarker(pozDrona, {
                radius: 7,
                color: '#22c55e',
                fillColor: '#22c55e', // Zielony kolor aktywnego drona w locie/przygotowaniu
                fillOpacity: 1,
                weight: 3
            }).addTo(leafletMap).bindPopup(`<b>${dronePodglad.name} (Aktualna pozycja)</b>`);

            // 3. RYSOWANIE LINII POŁĄCZENIA POMIĘDZY WYBRANYM DRONEM A JEGO CELEM
            const punktyLinii = [pozDrona, coordsCelu];

            liniaLotuReal = L.polyline(punktyLinii, {
                color: '#000000',      // Pomarańczowy kolor linii misji
                weight: 5,             // Optymalna widoczność na mapie satelitarnej
                opacity: 0.85,         // Przezroczystość
                dashArray: '10, 10',   // Przerywana linia operacyjna
                lineJoin: 'round'
            }).addTo(leafletMap);

            // 4. Dopasowanie widoku mapy tak, aby operator widział jednocześnie drona i cel
            const bounds = L.latLngBounds([pozDrona, coordsCelu]);
            leafletMap.fitBounds(bounds, { padding: [50, 50] });

        } else if (zapisanyCel) {
            // Fallback, jeśli z jakiegoś powodu pozycja drona nie została zaczytana
            const coordsCelu = JSON.parse(zapisanyCel);
            leafletMap.setView(coordsCelu, 14);
        }
    };

    if (podgladBtn && mapModal) {
        podgladBtn.addEventListener("click", () => {
            mapModal.classList.add("active");
            initLeafletMap();
            setTimeout(() => {
                if (leafletMap) leafletMap.invalidateSize();
            }, 100);
        });
    }

    if (closeModalBtn && mapModal) {
        closeModalBtn.addEventListener("click", () => {
            mapModal.classList.remove("active");
        });

        mapModal.addEventListener("click", (e) => {
            if (e.target === mapModal) {
                mapModal.classList.remove("active");
            }
        });
    }

    // Inicjalizacja startowa (wywoływana raz na samym dole)
    restoreListState();
    if (localStorage.getItem('celDrona')) {
        czyCzyszczone = false;
    }
    filtrujISort();
});