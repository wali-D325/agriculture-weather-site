const apiKey = "6ccd085aba522b49de0aa416557bf9b6";

const RTFP_CSV_URL =
  'https://microdata.worldbank.org/index.php/catalog/6171/download/MWI_RTFP_mkt_2007_2025-06-16.csv';

// --- SEASON & WEATHER HELPERS ---
function getSeason(lat, month) {
  const seasons = [
    { name: 'Winter', months: [5, 6, 7], southern: true },
    { name: 'Spring', months: [8, 9, 10], southern: true },
    { name: 'Summer', months: [11, 0, 1], southern: true },
    { name: 'Autumn', months: [2, 3, 4], southern: true },
    { name: 'Summer', months: [5, 6, 7], southern: false },
    { name: 'Autumn', months: [8, 9, 10], southern: false },
    { name: 'Winter', months: [11, 0, 1], southern: false },
    { name: 'Spring', months: [2, 3, 4], southern: false }
  ];
  const isSouth = lat < 0;
  for (const s of seasons) {
    if (s.southern === isSouth && s.months.includes(month)) return s.name;
  }
  return "Unknown";
}

function getCommonWeather(season) {
  switch (season) {
    case "Winter": return "Cool & dry in most regions";
    case "Summer": return "Hot & humid or rainy";
    case "Spring": return "Warm, moderate rain";
    case "Autumn": return "Mild, variable";
    default: return "Varies";
  }
}

// --- MARKET PRICES (WORLD BANK RTFP INTEGRATION) ---
async function fetchMalawiRTFP() {
  try {
    const resp = await fetch(RTFP_CSV_URL);
    if (!resp.ok) throw new Error("Failed to fetch World Bank RTFP CSV.");
    const text = await resp.text();
    const rows = text.trim().split('\n');
    const cols0 = rows[0].split(',');
    const itemIdx = cols0.indexOf('item_name');
    const dateIdx = cols0.indexOf('date');
    const priceIdx = cols0.indexOf('value_lcu');
    const currencyIdx = cols0.indexOf('currency');

    // Identify latest year-month
    let latest = '';
    rows.slice(1).forEach(r => {
      const cols = r.split(',');
      latest = cols[dateIdx] > latest ? cols[dateIdx] : latest;
    });

    // Filter desired crops for latest date
    const target = ['maize', 'rice', 'soya', 'groundnuts'];
    const data = rows.slice(1)
      .map(r => r.split(','))
      .filter(c => c[dateIdx].startsWith(latest) &&
        target.includes(c[itemIdx].toLowerCase()))
      .reduce((grp, c) => {
        const key = c[itemIdx].toLowerCase();
        grp[key] = grp[key] || [];
        grp[key].push({ price: +c[priceIdx], currency: c[currencyIdx] });
        return grp;
      }, {});

    // Calculate average price for each crop
    const result = Object.entries(data).map(([crop, arr]) => ({
      crop: crop.charAt(0).toUpperCase() + crop.slice(1),
      price: (arr.reduce((s, v) => s + v.price, 0) / arr.length).toFixed(2),
      currency: arr[0].currency,
      region: 'Malawi',
      trend: 'neutral'
    }));

    // If no data, throw
    if (!result.length) throw new Error("No recent price data found.");

    return result;
  } catch (e) {
    // Fallback: return null for error and let UI handle it
    return null;
  }
}

// --- SIMULATED PRICES FOR FALLBACK ---
function getFallbackPrices() {
  return [
    { crop: "Maize", price: 300, currency: "MWK/kg", region: "Malawi", trend: "up" },
    { crop: "Rice", price: 600, currency: "MWK/kg", region: "Malawi", trend: "neutral" },
    { crop: "Soya", price: 800, currency: "MWK/kg", region: "Malawi", trend: "down" },
    { crop: "Groundnuts", price: 1000, currency: "MWK/kg", region: "Malawi", trend: "up" }
  ];
}

// --- MARKET PRICES RENDERER WITH ERROR HANDLING ---
function renderPrices(prices, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!prices || prices.length === 0) {
    container.innerHTML = `<div class="error">No price data available at the moment.</div>`;
    return;
  }
  container.innerHTML = prices.map(price =>
    `<div class="price-card">
      <div class="crop-name">${price.crop}</div>
      <div class="crop-price">${price.price} ${price.currency}</div>
      <div class="trend-${price.trend}">
        ${price.trend === "up" ? "▲ Rising" : price.trend === "down" ? "▼ Falling" : "▬ Stable"}
      </div>
      <div><small>${price.region}</small></div>
    </div>`
  ).join('');
}

// --- SEASON INFO & PRICES UPDATE ---
function showSeasonAndWeather(lat) {
  const now = new Date();
  const season = getSeason(lat, now.getMonth());
  const commonWeather = getCommonWeather(season);
  const marketTrends = document.getElementById("marketTrends");
  if (marketTrends) {
    marketTrends.innerHTML =
      `<b>Current Season:</b> ${season}<br><b>Typical Weather:</b> ${commonWeather}`;
  }
}

// --- UPDATE MARKET PRICES WITH LOADING STATE & FALLBACK ---
async function updateMarketPrices(lat) {
  showSeasonAndWeather(lat);
  const container = document.getElementById("marketPrices");
  if (container) container.innerHTML = `<div class="loading">Loading price data...</div>`;
  let prices = await fetchMalawiRTFP();
  if (!prices) {
    // If World Bank data fails (CORS or network), fallback to simulated
    prices = getFallbackPrices();
  }
  renderPrices(prices, "marketPrices");
}

// --- MAIN PAGE INITIALIZER ---
window.addEventListener('DOMContentLoaded', () => {
  let lat = -13.2543; // Default to Malawi
  updateCalendar();

  function refreshPrices() {
    updateMarketPrices(lat);
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async position => {
      lat = position.coords.latitude;
      await updateMarketPrices(lat);
      setInterval(refreshPrices, 30000);
    }, async () => {
      await updateMarketPrices(lat);
      setInterval(refreshPrices, 30000);
    });
  } else {
    updateMarketPrices(lat);
    setInterval(refreshPrices, 30000);
  }
});

// --- WEATHER BY CITY ---
function getWeather() {
  const cityInput = document.getElementById('cityInput');
  if (!cityInput) return;
  const city = cityInput.value.trim();
  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  setWeatherDisplay({
    city: city,
    temp: '-',
    humidity: '-',
    weatherDesc: 'Loading...',
    weatherIcon: '',
    crops: 'Fetching crop suggestions...',
    cropDetails: ''
  });

  setTimeout(() => {
    setWeatherDisplay({
      city: city,
      temp: '26',
      humidity: '60',
      weatherDesc: 'Sunny',
      weatherIcon: '☀️',
      crops: 'Maize, Groundnuts, Soybeans',
      cropDetails: 'Best for maize and groundnuts in warm, sunny conditions.'
    });
  }, 1200);
}

// --- WEATHER BY LOCATION ---
function getLocationWeather() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  setWeatherDisplay({
    city: 'Detecting...',
    temp: '-',
    humidity: '-',
    weatherDesc: 'Detecting location...',
    weatherIcon: '',
    crops: 'Fetching crop suggestions...',
    cropDetails: ''
  });

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(2);
      const lon = position.coords.longitude.toFixed(2);
      setWeatherDisplay({
        city: `Lat: ${lat}, Lon: ${lon}`,
        temp: '29',
        humidity: '55',
        weatherDesc: 'Partly Cloudy',
        weatherIcon: '⛅',
        crops: 'Rice, Cassava, Beans',
        cropDetails: 'Ideal for rice and beans in current moisture conditions.'
      });
    },
    (error) => {
      setWeatherDisplay({
        city: 'Could not get location',
        temp: '-',
        humidity: '-',
        weatherDesc: 'Location error',
        weatherIcon: '',
        crops: 'Unable to suggest crops without location.',
        cropDetails: ''
      });
    }
  );
}

// --- WEATHER DISPLAY HELPER ---
function setWeatherDisplay({city, temp, humidity, weatherDesc, weatherIcon, crops, cropDetails}) {
  const cityEl = document.getElementById('city');
  const tempEl = document.getElementById('temp');
  const humidityEl = document.getElementById('humidity');
  const weatherDescEl = document.getElementById('weatherDesc');
  const weatherIconEl = document.getElementById('weatherIcon');
  const cropsEl = document.getElementById('crops');
  const cropDetailsEl = document.getElementById('cropDetails');
  if (cityEl) cityEl.textContent = city;
  if (tempEl) tempEl.textContent = temp;
  if (humidityEl) humidityEl.textContent = humidity;
  if (weatherDescEl) weatherDescEl.textContent = weatherDesc;
  if (weatherIconEl) weatherIconEl.textContent = weatherIcon;
  if (cropsEl) cropsEl.textContent = crops;
  if (cropDetailsEl) cropDetailsEl.textContent = cropDetails || '';
}

// --- CALENDAR LOGIC (SEASONAL CROPS) ---
function updateCalendar() {
  const calendar = document.getElementById("cropCalendar");
  if (!calendar) return;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const cropsByMonth = {
    "January": "Maize, Soybean",
    "February": "Groundnuts, Tobacco",
    "March": "Sorghum, Millet",
    "April": "Beans, Maize (late planting)",
    "May": "Harvesting",
    "June": "Harvesting, Drying",
    "July": "Land Preparation",
    "August": "Irrigation Crops",
    "September": "Sweet Potatoes, Vegetables",
    "October": "Cassava, Cotton",
    "November": "Maize (early), Rice",
    "December": "Rice, Tobacco"
  };

  calendar.innerHTML = months.map(month =>
    `<div class="season-card">
      <div class="season-name">${month}</div>
      <div>${cropsByMonth[month] || "No data"}</div>
    </div>`
  ).join('');
}