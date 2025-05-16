// Coordinates map for each cuisine area
const areaCoordinates = {
    "American": { lat: 38.0, lng: -97.0 },
    "British": { lat: 54.0, lng: -2.0 },
    "Canadian": { lat: 56.1304, lng: -106.3468 },
    "Chinese": { lat: 35.8617, lng: 104.1954 },
    "Croatian": { lat: 45.1, lng: 15.2 },
    "Dutch": { lat: 52.1326, lng: 5.2913 },
    "Egyptian": { lat: 26.8206, lng: 30.8025 },
    "Filipino": { lat: 13.41, lng: 122.56 },
    "French": { lat: 46.2276, lng: 2.2137 },
    "Greek": { lat: 39.0742, lng: 21.8243 },
    "Indian": { lat: 20.5937, lng: 78.9629 },
    "Irish": { lat: 53.1424, lng: -7.6921 },
    "Italian": { lat: 41.8719, lng: 12.5674 },
    "Jamaican": { lat: 18.1096, lng: -77.2975 },
    "Japanese": { lat: 36.2048, lng: 138.2529 },
    "Kenyan": { lat: -0.0236, lng: 37.9062 },
    "Malaysian": { lat: 4.2105, lng: 101.9758 },
    "Mexican": { lat: 23.6345, lng: -102.5528 },
    "Moroccan": { lat: 31.7917, lng: -7.0926 },
    "Polish": { lat: 51.9194, lng: 19.1451 },
    "Portuguese": { lat: 39.3999, lng: -8.2245 },
    "Russian": { lat: 61.5240, lng: 105.3188 },
    "Spanish": { lat: 40.4637, lng: -3.7492 },
    "Thai": { lat: 15.8700, lng: 100.9925 },
    "Tunisian": { lat: 33.8869, lng: 9.5375 },
    "Turkish": { lat: 38.9637, lng: 35.2433 },
    "Ukrainian": { lat: 48.3794, lng: 31.1656 },
    "Uruguayan": { lat: -32.5228, lng: -55.7658 },
    "Vietnamese": { lat: 14.0583, lng: 108.2772 }
};

const displayNameOverrides = {
    "American": "United States",
    "British": "United Kingdom",
    "Canadian": "Canada",
    "Chinese": "China",
    "Croatian": "Croatia",
    "Dutch": "Netherlands",
    "Egyptian": "Egypt",
    "Filipino": "Philippines",
    "French": "France",
    "Greek": "Greece",
    "Indian": "India",
    "Irish": "Ireland",
    "Italian": "Italy",
    "Jamaican": "Jamaica",
    "Japanese": "Japan",
    "Kenyan": "Kenya",
    "Malaysian": "Malaysia",
    "Mexican": "Mexico",
    "Moroccan": "Morocco",
    "Polish": "Poland",
    "Portuguese": "Portugal",
    "Russian": "Russia",
    "Spanish": "Spain",
    "Thai": "Thailand",
    "Tunisian": "Tunisia",
    "Turkish": "Turkey",
    "Ukrainian": "Ukraine",
    "Uruguayan": "Uruguay",
    "Vietnamese": "Vietnam"
};

// DOM elements
const spinBtn = document.getElementById('spinBtn');
const result = document.getElementById('result');
const regionName = document.getElementById('regionName');
const regionInfo = document.getElementById('regionInfo');

// Variables for spinning
let isSpinning = false;
let globe;
let spinDuration;
let startTime;
let animationFrame;
let selectedRegion = null;

// Initialize globe
initGlobe();

function initGlobe() {
    // Initialize globe
    globe = window.Globe()
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .width(window.innerWidth)
        .height(window.innerHeight)
        .backgroundColor('rgba(0,0,0,0)')
        .atmosphereColor('rgba(65,169,176,0.7)')
        .atmosphereAltitude(0.25)
        .pointOfView({ lat: 0, lng: 0, altitude: 2.5 }) // Set a fixed initial altitude (zoom level)
        (document.getElementById('globeViz'));

    // Add points for each region (initial placeholder data)
    globe.pointsData([])
        .pointColor(() => '#4CAF50') // Default color for all points
        .pointAltitude(0.01)
        .pointRadius(0.5)
        .pointsMerge(true);

    // Resize the globe on window resize
    window.addEventListener('resize', () => {
        globe.width(window.innerWidth).height(window.innerHeight);
        const minDimension = Math.min(window.innerWidth, window.innerHeight);
        const minAltitude = 1.5;
        const maxAltitude = 5.5;
        const responsiveAltitude = Math.min(
            maxAltitude,
            Math.max(minAltitude, 2200 / minDimension)
        );

        const currentView = globe.pointOfView();
        globe.pointOfView({ ...currentView, altitude: responsiveAltitude }, 1000);
    });
}

// Add event listener for spin button
spinBtn.addEventListener('click', spinGlobe);

async function fetchAreas() {
    try {
        const res = await fetch('/areas');
        const areaNames = await res.json();

        // Filter and map areas to include only valid areas with coordinates
        const dynamicRegions = areaNames
            .filter(area => areaCoordinates[area]) // Only include areas with known coordinates
            .map(area => ({
                name: area,
                info: `${area} cuisine`, // Customize this description
                lat: areaCoordinates[area].lat,
                lng: areaCoordinates[area].lng
            }));

        // Save regions for later use
        window.regions = dynamicRegions;

        // Feed data into the globe
        globe.pointsData(dynamicRegions)
            .pointColor(() => '#4CAF50') // Default green color for all markers
            .pointAltitude(0.01)
            .pointRadius(0.5)
            .pointsMerge(true);

    } catch (err) {
        console.error('Failed to fetch areas', err);
    }
}

// Fetch areas from the backend
fetchAreas();

function spinGlobe() {
    if (isSpinning) return;

    // Reset and hide result
    result.classList.remove('show');

    // Initialize spinning
    isSpinning = true;
    spinBtn.disabled = true;

    // Reset any previous highlighted points
    globe.pointsData(window.regions)
        .pointColor(() => '#4CAF50') // Default green color for all markers
        .pointAltitude(0.01)
        .pointRadius(0.5);

    // Spin duration of 3 seconds
    spinDuration = 3000;
    startTime = Date.now();

    // Start spinning animation with continuous motion
    startRandomSpinning();
}

function startRandomSpinning() {
    // Choose random region for final destination
    selectedRegion = window.regions[Math.floor(Math.random() * window.regions.length)];

    // Set initial velocity
    let velocity = {
        lat: (Math.random() - 0.5) * 2, // Random latitude velocity
        lng: (Math.random() * 5) + 3    // Random longitude velocity (always positive for consistent direction)
    };

    // Get starting position
    const startPosition = globe.pointOfView();
    let currentPosition = {
        lat: startPosition.lat,
        lng: startPosition.lng
    };

    const totalDuration = spinDuration;
    const startSpinTime = Date.now();
    let lastFrameTime = startSpinTime;

    // Start smooth animation
    function animateSpin() {
        const now = Date.now();
        const elapsed = now - startSpinTime;
        const deltaTime = (now - lastFrameTime) / 1000; // Convert to seconds
        lastFrameTime = now;

        const progress = Math.min(elapsed / totalDuration, 1);

        if (progress < 0.8) {
            // Main spinning phase
            currentPosition.lat += velocity.lat * deltaTime * 60;
            currentPosition.lng += velocity.lng * deltaTime * 60;

            currentPosition.lat = Math.max(-80, Math.min(80, currentPosition.lat));
            currentPosition.lng = (currentPosition.lng + 180) % 360 - 180;

            globe.pointOfView({
                lat: currentPosition.lat,
                lng: currentPosition.lng,
                altitude: startPosition.altitude
            });

            animationFrame = requestAnimationFrame(animateSpin);
        } else if (progress < 1) {
            // Transition to the selected region
            const transitionProgress = (progress - 0.8) / 0.2;
            const eased = easeOutCubic(transitionProgress);

            const targetLat = selectedRegion.lat;
            const targetLng = selectedRegion.lng;

            let lngDiff = targetLng - currentPosition.lng;
            if (Math.abs(lngDiff) > 180) {
                lngDiff = lngDiff > 0 ? lngDiff - 360 : lngDiff + 360;
            }

            const newLat = currentPosition.lat + (targetLat - currentPosition.lat) * eased;
            const newLng = currentPosition.lng + lngDiff * eased;

            globe.pointOfView({
                lat: newLat,
                lng: newLng,
                altitude: startPosition.altitude
            });

            animationFrame = requestAnimationFrame(animateSpin);
        } else {
            // Spinning complete
            finishSpin();
        }
    }

    // Start the animation
    animateSpin();
}

// Easing function for smooth deceleration
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function finishSpin() {
    // Show result container
    result.classList.add('show');

    // Show the region name immediately
    regionName.textContent = displayNameOverrides[selectedRegion.name] || selectedRegion.name;

    // Show loading text until description arrives
    regionInfo.textContent = "Loading description...";

    // Disable spin button until description is ready
    spinBtn.disabled = true;

    // Highlight selected region with bigger red pointer
    globe.pointsData(window.regions)
    .pointColor(point => point.name === selectedRegion.name ? '#ff6b6b' : '#4CAF50')
    .pointAltitude(point => point.name === selectedRegion.name ? 0.1 : 0.01)
    .pointRadius(point => point.name === selectedRegion.name ? 1.0 : 0.5);

    // Setup view recipe button click
    const viewRecipeBtn = document.getElementById('viewRecipeBtn');

    if (viewRecipeBtn) {
        viewRecipeBtn.onclick = () => {
        window.location.href = '/areas/' + encodeURIComponent(selectedRegion.name);
        };
    }

    // Fetch AI-generated description
    fetch(`/areas/${encodeURIComponent(selectedRegion.name)}/description`)
    .then(res => res.json())
    .then(data => {
        if (data.description) {
        regionInfo.textContent = data.description;
        } else {
        regionInfo.textContent = "No description available.";
        }
    })
    .catch(err => {
        console.error('Failed to load description:', err);
        regionInfo.textContent = "No description available.";
    })
    .finally(() => {
        // Re-enable spin button and reset isSpinning flag
        spinBtn.disabled = false;
        isSpinning = false;
    });
}
