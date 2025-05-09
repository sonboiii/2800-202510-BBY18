  fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(data => {
      var city = data.city;
      var region = data.region_code;

      document.getElementById("location").innerText = `${city}, ${region}`;
    })
    .catch(error => {
      console.error("Error fetching location:", error);
    });