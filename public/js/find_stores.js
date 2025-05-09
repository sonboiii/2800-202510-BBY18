 // ——————————————————————————
    // 1) Approximate fetch via IP-API
    fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(data => {
    const { city, region_code, latitude, longitude } = data;
    document.getElementById('location').innerText =
    `${city}, ${region_code}`;

    // Optionally, load an approximate list via JSON:
    fetch(`/stores?lat=${latitude}&lon=${longitude}&format=json`)
    .then(r => r.json())
    .then(stores => updateStoreList(stores));
})
    .catch(_ => {
    document.getElementById('location').innerText = 'Unavailable';
});

    // Helper to re-render the UL
    function updateStoreList(stores) {
    const ul = document.getElementById('store-list');
    ul.innerHTML = '';
    stores.forEach(s => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = `${s.name} — ${s.distance.toFixed(1)} km`;
    ul.appendChild(li);
});
}

    // ——————————————————————————
    // 2) Precise-location button
    document.getElementById('precise-btn').addEventListener('click', () => {
    if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser.');
}
    navigator.geolocation.getCurrentPosition(
    pos => {
    const { latitude, longitude } = pos.coords;
    // redirect to server with precise coords
    window.location.href =
    `/stores?lat=${latitude}&lon=${longitude}`;
},
    err => {
    console.error(err);
    alert('Could not retrieve your precise location.');
}
    );
});