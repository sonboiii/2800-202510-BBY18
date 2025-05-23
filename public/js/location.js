// Fetch user's location data from the server-side API
fetch('/api/location')
  .then(res => res.json())
  .then(data => {

    const city = data.city;
    const region = data.region_code;

    if (!city || !region) {
      throw new Error("City or region missing from location data");
    }

    return fetch(`/weather?location=${encodeURIComponent(city + ',' + region)}`);
  })
  .then(res => res.json())
  .then(weather => {

    const weatherElement = document.getElementById("location");
    if (weatherElement) {
      weatherElement.innerHTML = `
        <span>${weather.city}, ${weather.region}</span>
      `;
    }
  })
  .catch(error => {
    console.error("Error in location/weather fetching:", error);
  });
