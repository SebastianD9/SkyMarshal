document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // SEKCJA 1: FILTROWANIE TABELI
    // =========================================================================
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-button');
    const clearButton = document.querySelector('.clear-filters-btn');
    const serviceSelect = document.querySelector('.select-wrapper select');
    const tableRows = document.querySelectorAll('.listDrones table tr');

    let isResetState = true;

    // -------------------------------------------------------------------------
    // Pomocnicza: oblicz odległość liniową w metrach między dwoma [lat, lng]
    // -------------------------------------------------------------------------
    const liniowaDystans = (a, b) => {
        const latM  = (a[0] - b[0]) * 111320;
        const lngM  = (a[1] - b[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180);
        return Math.sqrt(latM * latM + lngM * lngM);
    };

    // Pozycje baz – muszą odpowiadać numerom dronów w tabeli (kolejność wierszy)
    const POZYCJE_DRONOW = [
        [50.5850, 22.0520], // Drone #00 – Baza Północ
        [50.5480, 22.0650], // Drone #01 – Baza Południe
        [50.5650, 22.0150], // Drone #02 – Baza Zachód
        [50.5708, 22.0567], // Drone #03
        [50.5720, 22.0610], // Drone #04
    ];

    const MAX_DYSTANS = 2500; // metry

    // -------------------------------------------------------------------------
    // Filtrowanie + sortowanie po kliknięciu Search
    // -------------------------------------------------------------------------
    const filtrujISort = () => {
        const celRaw = localStorage.getItem("celDrona");
        const cel    = celRaw ? JSON.parse(celRaw) : null;

        const tbody   = document.querySelector('.listDrones table');
        const rows    = Array.from(document.querySelectorAll('.listDrones table tr')).slice(1); // bez nagłówka

        rows.forEach((row, i) => {
            // 1. Aktywny status
            const statusEl = row.cells[2]?.querySelector('span');
            const aktywny  = statusEl && statusEl.classList.contains('status-active');

            if (!aktywny) {
                row.style.display = 'none';
                row.dataset.dystans = Infinity;
                return;
            }

            // 2. Jeśli cel wybrany – licz dystans i filtruj
            if (cel) {
                const pos     = POZYCJE_DRONOW[i] ?? [50.5708, 22.0567];
                const dystans = liniowaDystans(pos, cel);
                row.dataset.dystans = dystans;

                if (dystans > MAX_DYSTANS) {
                    row.style.display = 'none';
                } else {
                    row.style.display = '';
                }
            } else {
                // Brak celu – pokaż wszystkich aktywnych bez dystansu
                row.style.display = '';
                row.dataset.dystans = 0;
                const badge = row.querySelector('.dystans-badge');
                if (badge) badge.remove();
            }
        });

        // 3. Sortuj widoczne wiersze rosnąco po dystansie
        if (cel) {
            const widoczne   = rows.filter(r => r.style.display !== 'none');
            const niewidoczne = rows.filter(r => r.style.display === 'none');

            widoczne.sort((a, b) => parseFloat(a.dataset.dystans) - parseFloat(b.dataset.dystans));

            const table = document.querySelector('.listDrones table');
            widoczne.forEach(r  => table.appendChild(r));
            niewidoczne.forEach(r => table.appendChild(r));
        }

        isResetState = false;
    };

    if (searchButton) {
        searchButton.addEventListener('click', filtrujISort);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchButton.click();
        });
    }

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            serviceSelect.value = '';

            // Usuń odznaki dystansu i przywróć wszystkie wiersze
            document.querySelectorAll('.listDrones table tr').forEach((row, i) => {
                if (i === 0) return;
                row.style.display = '';
            });

            isResetState = true;
        });
    }

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

    // Ustaw dystans do celu na karcie distance-card przy załadowaniu strony
    const ustawDystansPoczatkowy = () => {
        const celRaw = localStorage.getItem("celDrona");
        if (!celRaw || !distanceValue || !distanceSubtext) return;

        const cel = JSON.parse(celRaw);
        // Pozycja drona #01 (index2.html)
        const pozDrona = [50.5480, 22.0650];
        const dystans  = liniowaDystans(pozDrona, cel);

        currentDistance = dystans / 1000; // km (używane wewnętrznie do symulacji)
        distanceValue.textContent = `${Math.round(dystans)} m`;

        const totalSec = Math.round(currentDistance * 1000 / (48 / 3.6)); // ~48 km/h przelot
        const etaMin   = Math.floor(totalSec / 60);
        const etaSec   = totalSec % 60;
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
                // currentDistance pozostaje ustawiony przez ustawDystansPoczatkowy

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
    let markerCelu  = null;

    const BAZY_DRONOW = {
        "Baza Północ (Centrum Logistyczne)": [50.5850, 22.0520],
        "Baza Południe (Strefa Przemysłowa)": [50.5480, 22.0650],
        "Baza Zachód (Jednostka Ratownicza)": [50.5650, 22.0150]
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
        if (zapisanyCel) {
            const coords = JSON.parse(zapisanyCel);
            markerCelu = L.circleMarker(coords, {
                radius: 9,
                color: '#ef4444',
                fillColor: '#b91c1c',
                fillOpacity: 0.9,
                weight: 2
            }).addTo(leafletMap).bindPopup("<b>Cel misji</b>").openPopup();

            leafletMap.setView(coords, 14);
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
});