
const apiKey = "6ccd085aba522b49de0aa416557bf9b6";

function getWeather() {
  const city = document.getElementById("cityInput").value;
  if (!city) {
    alert("Please enter a city name.");
    return;
  }
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
    .then((response) => response.json())
    .then((data) => {
      if (data.cod !== 200) {
        alert("City not found!");
        return;
      }

      const temp = data.main.temp;
      const humidity = data.main.humidity;
      const iconCode = data.weather[0].icon;
      const description = data.weather[0].description;
      const city = data.name;

      document.getElementById("city").innerText = city;
      document.getElementById("temp").innerText = temp;
      document.getElementById("humidity").innerText = humidity;

      document.getElementById("weatherDesc").innerText = description.charAt(0).toUpperCase() + description.slice(1);
      document.getElementById("weatherIcon").innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${description}" style="vertical-align:middle; width:40px; height:40px;">`;

      let crops = "";
      if (temp >= 20 && temp <= 30 && humidity > 60) {
        crops = "Rice, Maize, Sugarcane";
      } else if (temp >= 15 && temp < 25) {
        crops = "Wheat, Barley, Mustard";
      } else if (temp > 30) {
        crops = "Millets, Cotton, Sorghum";
      } else {
        crops = "No suitable crop data available";
      }

      document.getElementById("crops").innerText = crops;
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
    });
}

function getLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
        .then((response) => response.json())
        .then((data) => {
          const temp = data.main.temp;
          const humidity = data.main.humidity;
          const iconCode = data.weather[0].icon;
          const description = data.weather[0].description;
          const city = data.name;

          document.getElementById("city").innerText = city;
          document.getElementById("temp").innerText = temp;
          document.getElementById("humidity").innerText = humidity;

          document.getElementById("weatherDesc").innerText = description.charAt(0).toUpperCase() + description.slice(1);
          document.getElementById("weatherIcon").innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${description}" style="vertical-align:middle; width:40px; height:40px;">`;

          let crops = "";
          if (temp >= 20 && temp <= 30 && humidity > 60) {
            crops = "Rice, Maize, Sugarcane";
          } else if (temp >= 15 && temp < 25) {
            crops = "Wheat, Barley, Mustard";
          } else if (temp > 30) {
            crops = "Millets, Cotton, Sorghum";
          } else {
            crops = "No suitable crop data available";
          }

          document.getElementById("crops").innerText = crops;
        })
        .catch((error) => {
          console.error("Error fetching weather data:", error);
        });
    }, error => {
      alert("Could not get location. Please allow location access.");
    });
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}
