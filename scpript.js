const apiKey = "6ccd085aba522b49de0aa416557bf9b6"; // Get it from https://openweathermap.org/api

function getWeather() {
  const city = document.getElementById("cityInput").value;
  if (!city) return alert("Please enter a city name");
  fetchWeather(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
}

function getLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      fetchWeather(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    }, () => {
      alert("Location access denied.");
    });
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

function fetchWeather(url) {
  fetch(url)
    .then(response => response.json())
    .then(data => {
      document.getElementById("city").innerText = data.name;
      document.getElementById("temp").innerText = data.main.temp;
      document.getElementById("humidity").innerText = data.main.humidity;
      document.getElementById("weatherDesc").innerText = data.weather[0].description;
      document.getElementById("weatherIcon").innerHTML = `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="icon">`;
      document.getElementById("crops").innerText = suggestCrops(data.main.temp);
    })
    .catch(() => alert("Could not fetch weather data."));
}

function suggestCrops(temp) {
  if (temp < 15) return "Wheat, Barley, Peas";
  else if (temp < 25) return "Corn, Soybeans, Cotton";
  else return "Rice, Sugarcane, Millets";
}
