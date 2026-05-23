document.addEventListener('DOMContentLoaded', () => {
// =========================================================================
// 1. GLOBALNE ZMIENNE I INICJALIZACJA DOM
// =========================================================================
let leafletMap = null;
let markerCelu = null;

let wybraneCoords = [50.5708, 22.0567]; 
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

                if (markerCelu) {
                    markerCelu.setLatLng(wybraneCoords);
                } else {
                    markerCelu = L.circleMarker(wybraneCoords, {
                        radius: 10,
                        color: '#1565c0', 
                        fillColor: '#2196f3',
                        fillOpacity: 0.8,
                        weight: 2
                    }).addTo(leafletMap);
                }
                
                markerCelu.bindPopup(`<b>Wyszukana pozycja:</b><br>${inputValue || "Centrum Operacyjne Stalowa Wola"}`).openPopup();
            }
        }, 200); 
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

            fetch(url, { headers: { 'Accept-Language': 'pl' } })
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

                    div.addEventListener("click", (evt) => {
                        evt.preventDefault();
                        evt.stopPropagation();
                        
                        locationInput.value = div.textContent;
                        wybraneCoords = [parseFloat(item.lat), parseFloat(item.lon)];
                        // ← Zapis po kliknięciu podpowiedzi
                        localStorage.setItem("celDrona", JSON.stringify(wybraneCoords));
                        
                        listLoc.innerHTML = "";
                        listLoc.classList.remove("active");
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
                // ← Zapis po kliknięciu Search
                localStorage.setItem("celDrona", JSON.stringify(wybraneCoords));
                console.log(`Zapisano lokalizację: ${wybraneCoords}`);
            } else {
                console.warn("Nie znaleziono lokalizacji:", query);
            }
        } catch (err) {
            console.error("Błąd wyszukiwania lokalizacji:", err);
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
    closeModalBtn.addEventListener("click", () => {
        mapModal.classList.remove("active");
    });
}
});