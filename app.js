// Constants
const ECOBICI_TOTAL_BIKES = 9300;
const STATION_STATUS_URL = 'https://gbfs.mex.lyftbikes.com/gbfs/en/station_status.json';
const STATION_INFO_URL = 'https://gbfs.mex.lyftbikes.com/gbfs/en/station_information.json';
const CSV_FILE_PATH = 'cicloestaciones_ecobici_20250216.csv';
const UPDATE_INTERVAL = 120000; // 2 minutes in milliseconds

// State variables
let stationData = {
    statusData: null,
    infoData: null,
    csvData: null,
    mergedData: null,
    lastUpdate: null,
};

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const lastUpdateEl = document.getElementById('last-update');
const totalReportedEl = document.getElementById('total-reported');
const totalAvailableEl = document.getElementById('total-available');
const reportedPercentageEl = document.getElementById('reported-percentage');
const activeTripsEl = document.getElementById('active-trips');
const alcaldiaTableEl = document.getElementById('alcaldia-table').querySelector('tbody');
const coloniaTableEl = document.getElementById('colonia-table').querySelector('tbody');
const activeStationsEl = document.getElementById('active-stations');

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);
refreshBtn.addEventListener('click', fetchAllData);

// App Initialization
function initializeApp() {
    fetchAllData();
    setInterval(fetchAllData, UPDATE_INTERVAL);
}

// Data Fetching Functions
async function fetchAllData() {
    try {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Actualizando...';

        // Fetch all data sources concurrently
        const [statusResponse, infoResponse] = await Promise.all([
            fetch(STATION_STATUS_URL),
            fetch(STATION_INFO_URL)
        ]);

        // Parse JSON responses
        stationData.statusData = await statusResponse.json();
        stationData.infoData = await infoResponse.json();

        // Only fetch CSV if we don't have it yet
        if (!stationData.csvData) {
            await fetchCSVData();
        }

        // Process and merge data
        mergeAllData();

        stationData.lastUpdate = new Date();

        // Update UI with new data
        updateUI();

        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Actualizar';
    } catch (error) {
        console.error('Error fetching data:', error);
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Reintentar';
        lastUpdateEl.textContent = 'Error al actualizar datos';
    }
}

async function fetchCSVData() {
    return new Promise((resolve, reject) => {
        Papa.parse(CSV_FILE_PATH, {
            download: true,
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            complete: function(results) {
                stationData.csvData = results.data;
                resolve();
            },
            error: function(error) {
                console.error('Error parsing CSV:', error);
                reject(error);
            }
        });
    });
}

// Data Processing Functions
function mergeAllData() {
    const mergedStations = [];

    // Process and merge station status data
    if (stationData.statusData && stationData.infoData && stationData.csvData) {
        const stationStatus = stationData.statusData.data.stations;
        const stationInfo = stationData.infoData.data.stations;

        // Create lookup maps for faster access
        const stationInfoMap = new Map();
        stationInfo.forEach(station => {
            stationInfoMap.set(station.station_id, station);
        });

        const csvMap = new Map();
        stationData.csvData.forEach(csvStation => {
            csvMap.set(csvStation.num_cicloe, csvStation);
        });

        // Merge the data
        stationStatus.forEach(status => {
            const info = stationInfoMap.get(status.station_id);

            if (info) {
                const shortName = info.short_name;
                const csvInfo = csvMap.get(shortName);

                mergedStations.push({
                    stationId: status.station_id,
                    shortName: shortName,
                    name: info.name,
                    bikesAvailable: status.num_bikes_available,
                    bikesDisabled: status.num_bikes_disabled,
                    docksAvailable: status.num_docks_available,
                    isRenting: status.is_renting,
                    isReturning: status.is_returning,
                    lat: info.lat,
                    lon: info.lon,
                    alcaldia: csvInfo ? csvInfo.alcaldia : 'Desconocida',
                    colonia: csvInfo ? csvInfo.colonia : 'Desconocida',
                    totalAnchored: status.num_bikes_available + status.num_bikes_disabled
                });
            }
        });
    }

    stationData.mergedData = mergedStations;
}

function calculateTotalStats() {
    if (!stationData.mergedData) return { totalReported: 0, totalAvailable: 0, totalAnchored: 0 };

    const totalReported = stationData.mergedData.reduce((sum, station) => sum + station.bikesDisabled, 0);
    const totalAvailable = stationData.mergedData.reduce((sum, station) => sum + station.bikesAvailable, 0);
    const totalAnchored = totalReported + totalAvailable;

    return { totalReported, totalAvailable, totalAnchored };
}

function calculateByAlcaldia() {
    if (!stationData.mergedData) return [];

    const alcaldiaMap = new Map();

    stationData.mergedData.forEach(station => {
        const alcaldia = station.alcaldia;

        if (!alcaldiaMap.has(alcaldia)) {
            alcaldiaMap.set(alcaldia, {
                alcaldia,
                bikesAvailable: 0,
                bikesDisabled: 0
            });
        }

        const alcaldiaData = alcaldiaMap.get(alcaldia);
        alcaldiaData.bikesAvailable += station.bikesAvailable;
        alcaldiaData.bikesDisabled += station.bikesDisabled;
    });

    // Convert map to array and calculate percentages
    const alcaldiaArray = Array.from(alcaldiaMap.values()).map(item => {
        const total = item.bikesAvailable + item.bikesDisabled;
        const percentage = total > 0 ? (item.bikesDisabled / total * 100).toFixed(1) : 0;

        return {
            ...item,
            percentage: percentage,
            total: total
        };
    });

    // Sort by percentage of reported bikes (descending)
    return alcaldiaArray.sort((a, b) => b.percentage - a.percentage);
}

function calculateByColonia() {
    if (!stationData.mergedData) return [];

    const coloniaMap = new Map();

    stationData.mergedData.forEach(station => {
        const colonia = station.colonia;

        if (!coloniaMap.has(colonia)) {
            coloniaMap.set(colonia, {
                colonia,
                bikesAvailable: 0,
                bikesDisabled: 0
            });
        }

        const coloniaData = coloniaMap.get(colonia);
        coloniaData.bikesAvailable += station.bikesAvailable;
        coloniaData.bikesDisabled += station.bikesDisabled;
    });

    // Convert map to array and calculate percentages
    const coloniaArray = Array.from(coloniaMap.values()).map(item => {
        const total = item.bikesAvailable + item.bikesDisabled;
        const percentage = total > 0 ? (item.bikesDisabled / total * 100).toFixed(1) : 0;

        return {
            ...item,
            percentage: percentage,
            total: total
        };
    });

    // Sort by percentage of reported bikes (descending)
    return coloniaArray.sort((a, b) => b.percentage - a.percentage);
}

// UI Update Functions
function updateUI() {
    updateLastUpdateTime();
    updateStatCards();
    updateAlcaldiaTable();
    updateColoniaTable();
}

function updateLastUpdateTime() {
    if (stationData.lastUpdate) {
        const formattedTime = stationData.lastUpdate.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        lastUpdateEl.textContent = `Última actualización: ${formattedTime}`;
    }
}

function updateStatCards() {
    const { totalReported, totalAvailable, totalAnchored } = calculateTotalStats();
    const activeStations = stationData.mergedData ? stationData.mergedData.length : 0;

    // Update stat values
    totalReportedEl.textContent = totalReported;
    totalAvailableEl.textContent = totalAvailable;

    const reportedPercentage = totalAnchored > 0
        ? (totalReported / totalAnchored * 100).toFixed(1)
        : 0;
    reportedPercentageEl.textContent = `${reportedPercentage}%`;

    const activeTripEstimate = ECOBICI_TOTAL_BIKES - totalAnchored;
    activeTripsEl.textContent = activeTripEstimate > 0 ? activeTripEstimate : 0;

    activeStationsEl.textContent = `${activeStations} estaciones activas`;

}

function updateAlcaldiaTable() {
    const alcaldiaData = calculateByAlcaldia();

    if (alcaldiaData.length > 0) {
        // Build table HTML
        let tableHTML = '';

        alcaldiaData.forEach(item => {
            tableHTML += `
                <tr>
                    <td>${item.alcaldia}</td>
                    <td>${item.bikesAvailable}</td>
                    <td>${item.bikesDisabled}</td>
                    <td>${item.percentage}%</td>
                </tr>
            `;
        });

        alcaldiaTableEl.innerHTML = tableHTML;
    } else {
        alcaldiaTableEl.innerHTML = '<tr><td colspan="4" class="loading-data">Sin datos disponibles</td></tr>';
    }
}

function updateColoniaTable() {
    const coloniaData = calculateByColonia();

    if (coloniaData.length > 0) {
        // Build table HTML
        let tableHTML = '';

        // Take only top 20 colonias to avoid overwhelming the UI
        const topColonias = coloniaData.slice(0, 20);

        topColonias.forEach(item => {
            tableHTML += `
                <tr>
                    <td>${item.colonia}</td>
                    <td>${item.bikesAvailable}</td>
                    <td>${item.bikesDisabled}</td>
                    <td>${item.percentage}%</td>
                </tr>
            `;
        });

        coloniaTableEl.innerHTML = tableHTML;
    } else {
        coloniaTableEl.innerHTML = '<tr><td colspan="4" class="loading-data">Sin datos disponibles</td></tr>';
    }
}
