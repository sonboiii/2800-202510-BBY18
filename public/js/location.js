// Fetch location directly from IP API
fetch('https://ipapi.co/json/')
  .then(res => res.json())
  .then(data => {
    console.log('Location data:', data);

    const city = data.city;
    const region = data.region;

    if (!city || !region) {
      throw new Error('Incomplete location data');
    }

    return fetch(`/weather?location=${encodeURIComponent(city + ',' + region)}`);
  })
  .then(res => res.json())
  .then(weather => {
    const weatherElement = document.getElementById("location");
    if (weatherElement) {
      weatherElement.innerHTML = `<span>${weather.city}, ${weather.region}</span>`;
    }
  })
  .catch(err => {
    console.error("Location fetch error:", err);
    const weatherElement = document.getElementById("location");
    if (weatherElement) {
      weatherElement.innerHTML = `<span>Location unavailable</span>`;
    }
  });
