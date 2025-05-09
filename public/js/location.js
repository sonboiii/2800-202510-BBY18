  fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(data => {
      var city = data.city;
      var region = data.region_code;

      fetch(`/weather?location=${encodeURIComponent(city + ',' + region)}`)
      .then(response => response.json())
      .then(weather => {
        const weatherElement = document.getElementById("weather");
        if (weatherElement) {
          weatherElement.innerHTML = `
            <img src="${weather.icon}" alt="weather" style="height: 24px;" />
            <span>${weather.city}, ${weather.region} — ${weather.temp_c}°C, ${weather.condition}</span>
          `;
        }
      })
      .catch(error => {
        console.error("Error fetching weather:", error);
      });
  })
  .catch(error => {
    console.error("Error fetching location:", error);
  });