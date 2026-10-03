/* =========================================================
   HEATHVALE.IN
   DIGITAL HEATWAVE RISK MAPPING
   LIVE ENVIRONMENTAL DASHBOARD
   ========================================================= */

"use strict";


/* =========================================================
   CITY DATABASE
   ========================================================= */

const cities = [

    {
        name: "Delhi",
        lat: 28.6139,
        lon: 77.2090
    },

    {
        name: "Mumbai",
        lat: 19.0760,
        lon: 72.8777
    },

    {
        name: "Kolkata",
        lat: 22.5726,
        lon: 88.3639
    },

    {
        name: "Chennai",
        lat: 13.0827,
        lon: 80.2707
    },

    {
        name: "Bengaluru",
        lat: 12.9716,
        lon: 77.5946
    },

    {
        name: "Hyderabad",
        lat: 17.3850,
        lon: 78.4867
    },

    {
        name: "Ahmedabad",
        lat: 23.0225,
        lon: 72.5714
    },

    {
        name: "Pune",
        lat: 18.5204,
        lon: 73.8567
    },

    {
        name: "Jaipur",
        lat: 26.9124,
        lon: 75.7873
    },

    {
        name: "Lucknow",
        lat: 26.8467,
        lon: 80.9462
    },

    {
        name: "Patna",
        lat: 25.5941,
        lon: 85.1376
    },

    {
        name: "Bhopal",
        lat: 23.2599,
        lon: 77.4126
    },

    {
        name: "Bhubaneswar",
        lat: 20.2961,
        lon: 85.8245
    },

    {
        name: "Chandigarh",
        lat: 30.7333,
        lon: 76.7794
    },

    {
        name: "Guwahati",
        lat: 26.1445,
        lon: 91.7362
    }

];


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let map = null;

let cityMarkers = {};

let cityData = [];

let selectedCity = "Delhi";

let isLoading = false;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const elements = {

    citySelect:
        document.getElementById("citySelect"),

    temperature:
        document.getElementById("temperature"),

    aqi:
        document.getElementById("aqi"),

    heatRisk:
        document.getElementById("heatRisk"),

    humidity:
        document.getElementById("humidity"),

    pm25:
        document.getElementById("pm25"),

    feelsLike:
        document.getElementById("feelsLike"),

    avgTemp:
        document.getElementById("avgTemp"),

    avgAQI:
        document.getElementById("avgAQI"),

    selectedCityName:
        document.getElementById("selectedCityName"),

    riskDescription:
        document.getElementById("riskDescription"),

    lastUpdated:
        document.getElementById("lastUpdated"),

    refreshBtn:
        document.getElementById("refreshBtn"),

    dashboardRefreshBtn:
        document.getElementById("dashboardRefreshBtn"),

    mapLoading:
        document.getElementById("mapLoading")

};


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


/* =========================================================
   INITIALIZE APP
   ========================================================= */

function initializeApp() {

    console.log(
        "🌡️ Heathvale.in starting..."
    );


    initializeMap();

    populateCityDropdown();

    setupEventListeners();

    loadAllCityData();

}


/* =========================================================
   INITIALIZE MAP
   ========================================================= */

function initializeMap() {

    const mapElement =
        document.getElementById("heatMap");


    if (!mapElement) {

        console.error(
            "Heat map container not found."
        );

        return;

    }


    if (
        typeof L === "undefined"
    ) {

        console.error(
            "Leaflet library not loaded."
        );

        showMapError(
            "Map library could not be loaded."
        );

        return;

    }


    try {

        map = L.map(
            "heatMap",
            {
                zoomControl: true
            }
        );


        /*
           India-wide view.
           This view also includes northern India
           and the Kashmir region.
        */

        map.setView(
            [23.5, 80.0],
            5
        );


        L.tileLayer(

            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

            {
                maxZoom: 18,

                attribution:
                    '&copy; OpenStreetMap contributors'

            }

        ).addTo(map);


        /*
           Small delay helps Leaflet correctly calculate
           dimensions when the map is inside a section.
        */

        setTimeout(
            function () {

                map.invalidateSize();

            },
            300
        );


    } catch (error) {

        console.error(
            "Map initialization error:",
            error
        );

        showMapError(
            "Unable to initialize map."
        );

    }

}


/* =========================================================
   POPULATE CITY DROPDOWN
   ========================================================= */

function populateCityDropdown() {

    if (!elements.citySelect) {
        return;
    }


    elements.citySelect.innerHTML = "";


    cities.forEach(
        function (city) {

            const option =
                document.createElement("option");


            option.value =
                city.name;


            option.textContent =
                city.name;


            elements.citySelect.appendChild(
                option
            );

        }
    );


    elements.citySelect.value =
        selectedCity;

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {


    if (elements.citySelect) {

        elements.citySelect.addEventListener(
            "change",
            function () {

                selectedCity =
                    this.value;

                updateSelectedCity();

            }
        );

    }


    if (elements.refreshBtn) {

        elements.refreshBtn.addEventListener(
            "click",
            refreshData
        );

    }


    if (elements.dashboardRefreshBtn) {

        elements.dashboardRefreshBtn.addEventListener(
            "click",
            refreshData
        );

    }

}


/* =========================================================
   REFRESH DATA
   ========================================================= */

async function refreshData() {

    if (isLoading) {
        return;
    }


    setButtonsLoading(true);


    await loadAllCityData();


    setButtonsLoading(false);

}


/* =========================================================
   BUTTON LOADING
   ========================================================= */

function setButtonsLoading(
    loading
) {

    if (elements.refreshBtn) {

        elements.refreshBtn.disabled =
            loading;

        elements.refreshBtn.textContent =
            loading
                ? "⏳ Loading..."
                : "🔄 Refresh Live Data";

    }


    if (elements.dashboardRefreshBtn) {

        elements.dashboardRefreshBtn.disabled =
            loading;

        elements.dashboardRefreshBtn.textContent =
            loading
                ? "⏳ Loading..."
                : "🔄 Refresh Live Data";

    }

}


/* =========================================================
   LOAD ALL CITY DATA
   ========================================================= */

async function loadAllCityData() {

    if (isLoading) {
        return;
    }


    isLoading = true;


    showMapLoading(true);


    try {

        const requests =
            cities.map(
                function (city) {

                    return fetchCityData(
                        city
                    );

                }
            );


        const results =
            await Promise.allSettled(
                requests
            );


        const successfulData =
            results

                .filter(
                    function (result) {

                        return (
                            result.status ===
                            "fulfilled"
                        );

                    }
                )

                .map(
                    function (result) {

                        return result.value;

                    }
                );


        if (
            successfulData.length === 0
        ) {

            throw new Error(
                "No city data could be loaded."
            );

        }


        cityData =
            successfulData;


        updateMapMarkers();

        updateDashboard();

        updateSelectedCity();

        updateLastUpdated();

        showMapLoading(false);


        console.log(
            `Loaded ${cityData.length} cities successfully.`
        );


    } catch (error) {

        console.error(
            "Data loading error:",
            error
        );


        showError(
            "Live data could not be loaded. Please check your internet connection."
        );


        showMapLoading(false);

    } finally {

        isLoading = false;

    }

}


/* =========================================================
   FETCH CITY DATA
   ========================================================= */

async function fetchCityData(
    city
) {

    const weatherURL =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${city.lat}` +
        `&longitude=${city.lon}` +
        "&current=temperature_2m" +
        ",relative_humidity_2m" +
        ",apparent_temperature" +
        ",wind_speed_10m" +
        "&timezone=auto";


    const airQualityURL =
        "https://air-quality-api.open-meteo.com/v1/air-quality" +
        `?latitude=${city.lat}` +
        `&longitude=${city.lon}` +
        "&current=pm2_5" +
        ",pm10" +
        ",carbon_monoxide" +
        ",nitrogen_dioxide" +
        "&timezone=auto";


    const responses =
        await Promise.all([

            fetchWithTimeout(
                weatherURL,
                15000
            ),

            fetchWithTimeout(
                airQualityURL,
                15000
            )

        ]);


    if (
        !responses[0].ok
    ) {

        throw new Error(
            `Weather API error for ${city.name}`
        );

    }


    if (
        !responses[1].ok
    ) {

        throw new Error(
            `Air quality API error for ${city.name}`
        );

    }


    const weather =
        await responses[0].json();


    const air =
        await responses[1].json();


    const currentWeather =
        weather.current || {};


    const currentAir =
        air.current || {};


    const temperature =
        toNumber(
            currentWeather.temperature_2m
        );


    const humidity =
        toNumber(
            currentWeather.relative_humidity_2m
        );


    const feelsLike =
        toNumber(
            currentWeather.apparent_temperature
        );


    const windSpeed =
        toNumber(
            currentWeather.wind_speed_10m
        );


    const pm25 =
        toNumber(
            currentAir.pm2_5
        );


    const pm10 =
        toNumber(
            currentAir.pm10
        );


    const aqi =
        calculateAQI(pm25);


    const heatRisk =
        calculateHeatRisk(
            temperature,
            feelsLike
        );


    return {

        ...city,

        temperature,

        humidity,

        feelsLike,

        windSpeed,

        pm25,

        pm10,

        aqi,

        heatRisk

    };

}


/* =========================================================
   FETCH WITH TIMEOUT
   ========================================================= */

async function fetchWithTimeout(
    url,
    timeout
) {

    const controller =
        new AbortController();


    const timer =
        setTimeout(
            function () {

                controller.abort();

            },
            timeout
        );


    try {

        return await fetch(
            url,
            {
                signal:
                    controller.signal
            }
        );

    } finally {

        clearTimeout(timer);

    }

}


/* =========================================================
   AQI CALCULATION
   ========================================================= */

function calculateAQI(
    pm25
) {

    if (
        !Number.isFinite(pm25)
    ) {

        return null;

    }


    /*
       Educational PM2.5 AQI estimate.

       This is not official CPCB AQI.
    */

    const breakpoints = [

        {
            low: 0,
            high: 12.0,
            indexLow: 0,
            indexHigh: 50
        },

        {
            low: 12.1,
            high: 35.4,
            indexLow: 51,
            indexHigh: 100
        },

        {
            low: 35.5,
            high: 55.4,
            indexLow: 101,
            indexHigh: 150
        },

        {
            low: 55.5,
            high: 150.4,
            indexLow: 151,
            indexHigh: 200
        },

        {
            low: 150.5,
            high: 250.4,
            indexLow: 201,
            indexHigh: 300
        },

        {
            low: 250.5,
            high: 350.4,
            indexLow: 301,
            indexHigh: 400
        },

        {
            low: 350.5,
            high: 500.4,
            indexLow: 401,
            indexHigh: 500
        }

    ];


    let range = null;


    for (
        let i = 0;
        i < breakpoints.length;
        i++
    ) {

        const item =
            breakpoints[i];


        if (
            pm25 >= item.low &&
            pm25 <= item.high
        ) {

            range = item;

            break;

        }

    }


    if (!range) {

        if (
            pm25 > 500.4
        ) {

            return 500;

        }


        return 0;

    }


    const aqi =

        (
            (
                range.indexHigh -
                range.indexLow
            )
            /
            (
                range.high -
                range.low
            )
        )
        *
        (
            pm25 -
            range.low
        )
        +
        range.indexLow;


    return Math.round(aqi);

}


/* =========================================================
   HEAT RISK
   ========================================================= */

function calculateHeatRisk(
    temperature,
    feelsLike
) {

    if (
        !Number.isFinite(temperature)
    ) {

        return {

            level: "Unknown",

            className: "unknown",

            description:
                "Current temperature data is unavailable."

        };

    }


    if (
        temperature >= 40
    ) {

        return {

            level: "Extreme",

            className: "extreme",

            description:
                "Very high heat conditions. Avoid prolonged outdoor exposure and stay hydrated."

        };

    }


    if (
        temperature >= 35
    ) {

        return {

            level: "High",

            className: "high",

            description:
                "High heat conditions. Reduce unnecessary outdoor activity and stay hydrated."

        };

    }


    if (
        temperature >= 30
    ) {

        return {

            level: "Moderate",

            className: "moderate",

            description:
                "Moderate heat conditions. Stay hydrated and take breaks from direct sunlight."

        };

    }


    return {

        level: "Lower",

        className: "lower",

        description:
            "Lower heat risk based on the current temperature."

    };

}


/* =========================================================
   UPDATE MAP MARKERS
   ========================================================= */

function updateMapMarkers() {

    if (!map) {
        return;
    }


    cityData.forEach(
        function (city) {

            const color =
                getRiskColor(
                    city.heatRisk
                        ? city.heatRisk.className
                        : "unknown"
                );


            const icon =
                L.divIcon({

                    className:
                        "heat-marker",

                    html:
                        `
                        <div
                            style="
                                width:20px;
                                height:20px;
                                background:${color};
                                border:3px solid white;
                                border-radius:50%;
                                box-shadow:0 2px 9px rgba(0,0,0,0.35);
                            "
                        ></div>
                        `,

                    iconSize: [
                        20,
                        20
                    ],

                    iconAnchor: [
                        10,
                        10
                    ]

                });


            const popup =
                createPopup(city);


            if (
                cityMarkers[city.name]
            ) {

                cityMarkers[
                    city.name
                ].setIcon(icon);


                cityMarkers[
                    city.name
                ].setPopupContent(
                    popup
                );

            } else {

                const marker =
                    L.marker(
                        [
                            city.lat,
                            city.lon
                        ],
                        {
                            icon
                        }
                    ).addTo(map);


                marker.bindPopup(
                    popup
                );


                cityMarkers[
                    city.name
                ] = marker;

            }

        }
    );

}


/* =========================================================
   CREATE MAP POPUP
   ========================================================= */

function createPopup(
    city
) {

    const temperature =
        formatNumber(
            city.temperature,
            1
        );


    const pm25 =
        formatNumber(
            city.pm25,
            1
        );


    const aqi =
        city.aqi !== null
            ? city.aqi
            : "N/A";


    const risk =
        city.heatRisk
            ? city.heatRisk.level
            : "Unknown";


    const humidity =
        city.humidity !== null
            ? `${city.humidity.toFixed(0)}%`
            : "N/A";


    return `

        <div class="city-popup">

            <h3>
                ${escapeHTML(city.name)}
            </h3>

            <p>
                🌡️ Temperature:
                <strong>
                    ${temperature} °C
                </strong>
            </p>

            <p>
                💨 Estimated AQI:
                <strong>
                    ${aqi}
                </strong>
            </p>

            <p>
                🫁 PM2.5:
                <strong>
                    ${pm25} µg/m³
                </strong>
            </p>

            <p>
                💧 Humidity:
                <strong>
                    ${humidity}
                </strong>
            </p>

            <p>
                🔥 Heat Risk:
                <strong>
                    ${risk}
                </strong>
            </p>

        </div>

    `;

}


/* =========================================================
   RISK COLOR
   ========================================================= */

function getRiskColor(
    risk
) {

    switch (risk) {

        case "lower":
            return "#2e8b57";

        case "moderate":
            return "#ffa500";

        case "high":
            return "#ff4500";

        case "extreme":
            return "#8b0000";

        default:
            return "#777777";

    }

}


/* =========================================================
   UPDATE DASHBOARD
   ========================================================= */

function updateDashboard() {

    if (
        cityData.length === 0
    ) {
        return;
    }


    const temperatures =
        cityData

            .map(
                function (city) {
                    return city.temperature;
                }
            )

            .filter(
                function (value) {
                    return Number.isFinite(value);
                }
            );


    const aqis =
        cityData

            .map(
                function (city) {
                    return city.aqi;
                }
            )

            .filter(
                function (value) {
                    return Number.isFinite(value);
                }
            );


    if (
        temperatures.length > 0 &&
        elements.avgTemp
    ) {

        const average =
            temperatures.reduce(
                function (
                    total,
                    value
                ) {

                    return total + value;

                },
                0
            )
            /
            temperatures.length;


        elements.avgTemp.textContent =
            `${average.toFixed(1)} °C`;

    }


    if (
        aqis.length > 0 &&
        elements.avgAQI
    ) {

        const average =
            aqis.reduce(
                function (
                    total,
                    value
                ) {

                    return total + value;

                },
                0
            )
            /
            aqis.length;


        elements.avgAQI.textContent =
            Math.round(average);

    }

}


/* =========================================================
   UPDATE SELECTED CITY
   ========================================================= */

function updateSelectedCity() {

    const city =
        cityData.find(
            function (item) {

                return (
                    item.name ===
                    selectedCity
                );

            }
        );


    if (!city) {

        resetLiveCards();

        return;

    }


    /* Temperature */

    setText(
        elements.temperature,
        city.temperature !== null
            ? `${city.temperature.toFixed(1)} °C`
            : "N/A"
    );


    /* AQI */

    setText(
        elements.aqi,
        city.aqi !== null
            ? city.aqi
            : "N/A"
    );


    /* Heat Risk */

    setText(
        elements.heatRisk,
        city.heatRisk
            ? city.heatRisk.level
            : "Unknown"
    );


    /* Humidity */

    setText(
        elements.humidity,
        city.humidity !== null
            ? `${city.humidity.toFixed(0)} %`
            : "N/A"
    );


    /* PM2.5 */

    setText(
        elements.pm25,
        city.pm25 !== null
            ? `${city.pm25.toFixed(1)} µg/m³`
            : "N/A"
    );


    /* Feels Like */

    setText(
        elements.feelsLike,
        city.feelsLike !== null
            ? `${city.feelsLike.toFixed(1)} °C`
            : "N/A"
    );


    /* City Name */

    setText(
        elements.selectedCityName,
        city.name
    );


    /* Risk Description */

    setText(
        elements.riskDescription,
        city.heatRisk
            ? city.heatRisk.description
            : "Data unavailable."
    );


    /* Map */

    if (
        map &&
        cityMarkers[city.name]
    ) {

        map.setView(
            [
                city.lat,
                city.lon
            ],
            7,
            {
                animate: true
            }
        );


        cityMarkers[
            city.name
        ].openPopup();

    }

}


/* =========================================================
   RESET LIVE CARDS
   ========================================================= */

function resetLiveCards() {

    setText(
        elements.temperature,
        "--"
    );


    setText(
        elements.aqi,
        "--"
    );


    setText(
        elements.heatRisk,
        "--"
    );


    setText(
        elements.humidity,
        "--"
    );


    setText(
        elements.pm25,
        "--"
    );


    setText(
        elements.feelsLike,
        "--"
    );


    setText(
        elements.selectedCityName,
        "--"
    );


    setText(
        elements.riskDescription,
        "Waiting for live data..."
    );

}


/* =========================================================
   LAST UPDATED
   ========================================================= */

function updateLastUpdated() {

    if (
        !elements.lastUpdated
    ) {
        return;
    }


    const now =
        new Date();


    const time =
        now.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );


    elements.lastUpdated.textContent =
        `Live data updated at ${time}`;

}


/* =========================================================
   MAP LOADING
   ========================================================= */

function showMapLoading(
    show
) {

    if (
        !elements.mapLoading
    ) {
        return;
    }


    if (show) {

        elements.mapLoading.classList.remove(
            "hidden"
        );

    } else {

        elements.mapLoading.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   MAP ERROR
   ========================================================= */

function showMapError(
    message
) {

    if (
        !elements.mapLoading
    ) {
        return;
    }


    elements.mapLoading.innerHTML = `

        <div style="
            font-size:32px;
        ">
            ⚠️
        </div>

        <span>
            ${escapeHTML(message)}
        </span>

    `;

}


/* =========================================================
   GENERAL ERROR
   ========================================================= */

function showError(
    message
) {

    console.error(
        message
    );


    setText(
        elements.avgTemp,
        "--"
    );


    setText(
        elements.avgAQI,
        "--"
    );


    setText(
        elements.lastUpdated,
        message
    );


    /*
       Keep the interface usable even if one API
       temporarily fails.
    */

    resetLiveCards();

}


/* =========================================================
   SAFE TEXT
   ========================================================= */

function setText(
    element,
    value
) {

    if (
        element
    ) {

        element.textContent =
            value;

    }

}


/* =========================================================
   NUMBER CONVERSION
   ========================================================= */

function toNumber(
    value
) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : null;

}


/* =========================================================
   NUMBER FORMAT
   ========================================================= */

function formatNumber(
    value,
    decimals
) {

    if (
        !Number.isFinite(value)
    ) {

        return "N/A";

    }


    return value.toFixed(
        decimals
    );

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   AUTOMATIC REFRESH
   ========================================================= */

setInterval(
    function () {

        if (
            !isLoading
        ) {

            loadAllCityData();

        }

    },
    10 * 60 * 1000
);


/* =========================================================
   FINAL MESSAGE
   ========================================================= */

console.log(
    "🌡️ Heathvale.in loaded successfully."
);

console.log(
    "📍 Live city monitoring initialized."
);

console.log(
    "🗺️ Heat risk map initialized."
);

console.log(
    "👥 Team: Pranjal Kumar | Shriyas Deshmukh | Sai Tarun"
);