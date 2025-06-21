const apiKey = "6ccd085aba522b49de0aa416557bf9b6"; // OpenWeather API key

// Helper: Get current season based on latitude and month
function getSeason(lat, month) {
  const seasons = [
    { name: 'Winter', months: [5, 6, 7], southern: true },      // June-Aug
    { name: 'Spring', months: [8, 9, 10], southern: true },     // Sept-Nov
    { name: 'Summer', months: [11, 0, 1], southern: true },     // Dec-Feb
    { name: 'Autumn', months: [2, 3, 4], southern: true },      // Mar-May
    { name: 'Summer', months: [5, 6, 7], southern: false },     // June-Aug
    { name: 'Autumn', months: [8, 9, 10], southern: false },    // Sept-Nov
    { name: 'Winter', months: [11, 0, 1], southern: false },    // Dec-Feb
    { name: 'Spring', months: [2, 3, 4], southern: false },     // Mar-May
  ];
  const isSouth = lat < 0;
  for (const s of seasons) {
    if (s.southern === isSouth && s.months.includes(month)) return s.name;
  }
  return "Unknown";
}

// Helper: Get common weather for season
function getCommonWeather(season) {
  switch (season) {
    case "Winter": return "Cool & dry in most regions";
    case "Summer": return "Hot & humid or rainy";
    case "Spring": return "Warm, moderate rain";
    case "Autumn": return "Mild, variable";
    default: return "Varies";
  }
}

// Fetch global crop prices (replace with Malawi API if available)
async function fetchGlobalPrices() {
  return [
    { crop: "Wheat", price: 230, currency: "USD/ton", region: "Global", trend: "up" },
    { crop: "Maize", price: 180, currency: "USD/ton", region: "Global", trend: "neutral" },
    { crop: "Rice", price: 420, currency: "USD/ton", region: "Global", trend: "down" },
    { crop: "Soybeans", price: 500, currency: "USD/ton", region: "Global", trend: "up" }
  ];
}

// Fetch Malawi prices (if you have a real endpoint, replace here)
async function fetchMalawiPrices() {
  return [
    { crop: "Maize", price: 300, currency: "MWK/kg", region: "Malawi", trend: "up" },
    { crop: "Rice", price: 600, currency: "MWK/kg", region: "Malawi", trend: "neutral" },
    { crop: "Soya", price: 800, currency: "MWK/kg", region: "Malawi", trend: "down" },
    { crop: "Groundnuts", price: 1000, currency: "MWK/kg", region: "Malawi", trend: "up" }
  ];
}

// Render prices in the UI
function renderPrices(prices, containerId) {
  document.getElementById(containerId).innerHTML = prices.map(price =>
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

// On page load, load prices and season
window.addEventListener('DOMContentLoaded', async () => {
  // Geolocate for Malawi or user's country
  let lat = -13.2543; // Default to Malawi
  let useMalawi = true;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async position => {
      lat = position.coords.latitude;
      useMalawi = (Math.abs(lat - (-13.2543)) < 5); // If near Malawi
      showSeasonAndWeather(lat);
      if (useMalawi) {
        renderPrices(await fetchMalawiPrices(), "marketPrices");
      } else {
        renderPrices(await fetchGlobalPrices(), "marketPrices");
      }
    }, async () => {
      showSeasonAndWeather(lat);
      renderPrices(await fetchMalawiPrices(), "marketPrices");
    });
  } else {
    showSeasonAndWeather(lat);
    renderPrices(await fetchMalawiPrices(), "marketPrices");
  }
});

// Show season and global weather info
function showSeasonAndWeather(lat) {
  const now = new Date();
  const season = getSeason(lat, now.getMonth());
  const commonWeather = getCommonWeather(season);
  document.getElementById("marketTrends").innerHTML = `<b>Current Season:</b> ${season}<br><b>Typical Weather:</b> ${commonWeather}`;
}

// --- FIX: Add missing Weather tab logic ---

function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) {
    alert("Please enter a city name.");
    return;
  }
  document.getElementById('city').textContent = city;
  document.getElementById('temp').textContent = '-';
  document.getElementById('humidity').textContent = '-';
  document.getElementById('weatherDesc').textContent = 'Loading...';
  document.getElementById('weatherIcon').textContent = '';
  document.getElementById('crops').textContent = 'Fetching crop suggestions...';

  setTimeout(() => {
    document.getElementById('temp').textContent = '26';
    document.getElementById('humidity').textContent = '60';
    document.getElementById('weatherDesc').textContent = 'Sunny';
    document.getElementById('weatherIcon').textContent = '☀️';
    document.getElementById('crops').textContent = 'Maize, Groundnuts, Soybeans';
    document.getElementById('cropDetails').textContent = 'Best for maize and groundnuts in warm, sunny conditions.';
  }, 1200);
}

function getLocationWeather() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }
  document.getElementById('city').textContent = 'Detecting...';
  document.getElementById('temp').textContent = '-';
  document.getElementById('humidity').textContent = '-';
  document.getElementById('weatherDesc').textContent = 'Detecting location...';
  document.getElementById('weatherIcon').textContent = '';
  document.getElementById('crops').textContent = 'Fetching crop suggestions...';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      document.getElementById('city').textContent = `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`;
      document.getElementById('temp').textContent = '29';
      document.getElementById('humidity').textContent = '55';
      document.getElementById('weatherDesc').textContent = 'Partly Cloudy';
      document.getElementById('weatherIcon').textContent = '⛅';
      document.getElementById('crops').textContent = 'Rice, Cassava, Beans';
      document.getElementById('cropDetails').textContent = 'Ideal for rice and beans in current moisture conditions.';
    },
    (error) => {
      document.getElementById('city').textContent = 'Could not get location';
      document.getElementById('weatherDesc').textContent = 'Location error';
      document.getElementById('crops').textContent = 'Unable to suggest crops without location.';
      document.getElementById('cropDetails').textContent = '';
    }
  );
}

// ... (keep your weather, crop, and calendar logic from before)