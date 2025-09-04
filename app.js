// --- Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const countriesListEl = document.getElementById('countries-list');
    const lastUpdatedEl = document.getElementById('last-updated');

    // --- Map Initialization ---
    function initializeMap() {
        const container = document.getElementById('map-container');
        const width = container.clientWidth;
        const height = width / 2;
        const svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height);
        const projection = d3.geoMercator()
            .scale(width / 2 / Math.PI)
            .translate([width / 2, height / 1.5]);
        const path = d3.geoPath().projection(projection);
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(data => {
            const countries = topojson.feature(data, data.objects.countries);
            svg.selectAll("path")
                .data(countries.features)
                .enter().append("path")
                .attr("d", path)
                .attr("class", "country-path");
            function updateMidnightLine() {
                const now = new Date();
                const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
                const midnightLng = -utcHours * 15;
                const lineX = projection([midnightLng, 0])[0];
                let line = svg.select("#midnight-line");
                if (line.empty()) {
                    line = svg.append("line")
                        .attr("id", "midnight-line")
                        .attr("y1", 0)
                        .attr("y2", height);
                }
                line.attr("x1", lineX).attr("x2", lineX);
            }
            updateMidnightLine();
            setInterval(updateMidnightLine, 1000);
        });
    }

    function findCountriesInMidnightHour() {
        const now = new Date();
        const midnightLocations = new Set();
        const processedCountries = new Set();
        for (const location of countryTimezonesData) {
            const { country_name, time_zone, city } = location;
            if (processedCountries.has(country_name)) continue;
            try {
                const formatter = new Intl.DateTimeFormat('en-GB', {
                    timeZone: time_zone,
                    hour: 'numeric',
                    hourCycle: 'h23'
                });
                const hourInTimezone = formatter.format(now);
                if (parseInt(hourInTimezone, 10) === 0) {
                    midnightLocations.add(`${country_name} (${city})`);
                    processedCountries.add(country_name);
                }
            } catch (error) {}
        }
        const sortedLocations = Array.from(midnightLocations).sort();
        displayCountries(sortedLocations);
        updateTimestamp(now);
    }

    function displayCountries(locations) {
        countriesListEl.innerHTML = '';
        if (locations.length === 0) {
            countriesListEl.innerHTML = `
                <p class="text-gray-400 col-span-full text-center py-4">
                    Nenhum país encontrado.
                </p>
            `;
            return;
        }
        locations.forEach(location => {
            const locationEl = document.createElement('div');
            locationEl.className = 'country-item bg-gray-700 hover:bg-cyan-900/50 border border-gray-600 p-3 rounded-lg text-center shadow-md transition-colors duration-300 cursor-default';
            locationEl.textContent = location;
            countriesListEl.appendChild(locationEl);
        });
    }

    function updateTimestamp(date) {
        const options = {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZoneName: 'short'
        };
        lastUpdatedEl.textContent = `Atualizado em: ${date.toLocaleString('pt-BR', options)}`;
    }

    initializeMap();
    findCountriesInMidnightHour();
    setInterval(findCountriesInMidnightHour, 60000);
});
