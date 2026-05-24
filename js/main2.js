document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. GLOBALNE ZMIENNE I INICJALIZACJA DOM
    // =========================================================================
    let leafletMap = null;

    let wybraneCoords = [50.5850, 22.0520]; 
    let debounceTimer;

    const mapModal = document.querySelector(".map-modal");
    const inlinePreviewBtn = document.querySelector(".inline-preview-btn");
    const locationInput = document.getElementById("location-input");
    const closeModalBtn = document.querySelector(".close-modal-btn");
    const listLoc = document.getElementById("autocomplete-list");

    function initLeafletMap() {
        if (leafletMap !== null) return; 

        if (document.getElementById("map")) {
            leafletMap = L.map('map').setView(wybraneCoords, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(leafletMap);
        }
    }

    // Pomocnicza funkcja zapisu lokalizacji (współrzędne + tekst)
    const saveLocationData = (coords, displayText) => {
        localStorage.setItem('celDrona', JSON.stringify(coords));
        localStorage.setItem('celDronaText', displayText);
        // Po zapisie odśwież listę dronów (jeśli funkcja istnieje)
        if (window.applyDroneFilters) window.applyDroneFilters();
    };

    // =========================================================================
    // 2. OBSŁUGA PRZYCISKU "PODGLĄD"
    // =========================================================================
    if (inlinePreviewBtn) {
        inlinePreviewBtn.addEventListener("click", (e) => {
            e.preventDefault(); 
            e.stopPropagation(); 
            
            if (!mapModal) {
                console.error("Błąd SkyMarshal: Nie znaleziono elementu .map-modal!");
                return;
            }

            mapModal.classList.add("active");
            initLeafletMap();

            const inputValue = locationInput ? locationInput.value.trim() : "";

            setTimeout(() => {
                if (leafletMap) {
                    leafletMap.invalidateSize(); 
                    leafletMap.setView(wybraneCoords, 14);

                    const bounds = L.latLngBounds([coordsDrona, wybraneCoords]);
                    leafletMap.fitBounds(bounds, { padding: [50, 50] });
                }
            }, 500); 
        });
    }

    // =========================================================================
    // 3. AUTOCOMPLETE
    // =========================================================================
    if (locationInput && listLoc) {
        
        locationInput.addEventListener("keyup", function(e) {
            if (["ArrowUp", "ArrowDown", "Enter", "Escape", "Tab"].includes(e.key)) return;

            const query = this.value.trim();

            if (query.length < 3) {
                listLoc.innerHTML = "";
                listLoc.classList.remove("active");
                return;
            }

            clearTimeout(debounceTimer);
            
            debounceTimer = setTimeout(() => {
                if (locationInput.value.trim().length < 3) return;

                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pl&limit=5`;

                fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept-Language': 'pl',
                        'User-Agent': 'SkyMarshal krystianzukowski02@gmail.com'
                }})
                .then(response => response.json())
                .then(data => {
                    listLoc.innerHTML = "";

                    if (!data || data.length === 0) {
                        listLoc.classList.remove("active");
                        return;
                    }

                    data.forEach(item => {
                        const div = document.createElement("div");
                        div.classList.add("autocomplete-item");
                        div.textContent = item.display_name.split(',').slice(0, 3).join(',');

                        div.addEventListener('click', (evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                            const selectedText = div.textContent;
                            locationInput.value = selectedText;
                            wybraneCoords = [parseFloat(item.lat), parseFloat(item.lon)];
                            saveLocationData(wybraneCoords, selectedText);   // ← zapis tekstu i współrzędnych
                            listLoc.innerHTML = '';
                            listLoc.classList.remove('active');
                        });

                        listLoc.appendChild(div);
                    });

                    listLoc.classList.add("active");
                })
                .catch(err => console.error("Błąd pobierania danych geolokalizacyjnych:", err));

            }, 350);
        });

        document.addEventListener("click", (e) => {
            if (e.target !== locationInput && e.target !== listLoc) {
                listLoc.classList.remove("active");
            }
        });
    }

    // =========================================================================
    // 4. PRZYCISK SEARCH
    // =========================================================================
    const searchBtn = document.querySelector(".search-button");

    if (searchBtn && locationInput) {
        searchBtn.addEventListener("click", async () => {
            const query = locationInput.value.trim();
            if (query.length < 3) return;

            if (listLoc) {
                listLoc.innerHTML = "";
                listLoc.classList.remove("active");
            }

            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pl&limit=1`;

            try {
                const response = await fetch(url, { headers: { 'Accept-Language': 'pl' } });
                const data = await response.json();

                if (data && data.length > 0) {
                    wybraneCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                    saveLocationData(wybraneCoords, query); // ← zapis i odświeżenie
                } else {
                    console.warn("Nie znaleziono lokalizacji:", query);
                }
            } catch (err) {
                console.error("Błąd wyszukiwania:", err);
            }
        });

        // Enter odpala Search (zastępuje stary keydown z sekcji 3)
        locationInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                searchBtn.click();
            }
        });
    }

    // =========================================================================
    // 5. ZAMYKANIE MODALU
    // =========================================================================
    if (closeModalBtn && mapModal) {
        closeModalBtn.addEventListener("click", () => mapModal.classList.remove("active"));
        mapModal.addEventListener("click", (e) => { if (e.target === mapModal) mapModal.classList.remove("active"); });
    }
    // --------------------------------------------------------------
    // PRzywracanie zapisanego tekstu lokalizacji
    // --------------------------------------------------------------
    const restoreLocationText = () => {
        const savedText = localStorage.getItem('celDronaText');
        const locationInput = document.getElementById('location-input');
        if (savedText && locationInput) {
            locationInput.value = savedText;
            // Opcjonalnie: wywołaj filtr dronów po przywróceniu tekstu
            if (window.applyDroneFilters) window.applyDroneFilters();
        }
    };
    restoreLocationText();

});

