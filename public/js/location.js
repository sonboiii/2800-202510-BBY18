if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(success => {
    const lat = success.coords.latitude;
    const lon = success.coords.longitude;

    console.log(`User location: ${lat}, ${lon}`);

    // Send it to your server (optional) or use it for weather/stores directly
    fetch(`/weather?location=${lat},${lon}`)
      .then(res => res.json())
      .then(weather => {
        const locationEl = document.getElementById("location");
        if (locationEl) {
          locationEl.innerHTML = `<span>${weather.city}, ${weather.region}</span>`;
        }
      });
  }, error => {
    console.error("Geolocation error:", error);
    document.getElementById("location").innerHTML = `<span>Location unavailable</span>`;
  });
} else {
  console.error("Geolocation not supported");
  document.getElementById("location").innerHTML = `<span>Location unavailable</span>`;
}
