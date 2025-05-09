// Initialize Globe.gl
const globe = Globe()
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-day.jpg')  // Earth texture
    .bordersDataUrl('//unpkg.com/three-globe/example/countries-50m.geojson') // GeoJSON for countries
    .onGlobeClick((event) => handleGlobeClick(event))  // Event on clicking the globe

// Set the globe container
document.getElementById('globe').appendChild(globe);

// Handle the spin interaction and randomize landing location
function handleGlobeClick(event) {
    const lat = event.lat;
    const lon = event.lon;

    // Once clicked, land on a region and fetch recipes
    showRecipesForRegion(lat, lon);
}

// Function to show recipes based on region clicked
function showRecipesForRegion(lat, lon) {
    // Determine region or country based on lat/lon (you can use reverse geocoding here)
    const region = getRegionFromLatLon(lat, lon);

    // Fetch and display recipes for that region (this is a mock-up, replace with real data)
    fetchRecipesForRegion(region).then(recipes => {
        displayRecipes(recipes);
    });
}

// Mock function to get region based on lat/lon (you can replace this with an API for reverse geocoding)
function getRegionFromLatLon(lat, lon) {
    // For simplicity, returning a static region
    return 'Italy'; // Replace with real reverse geocoding API if needed
}

// Fetch recipes for the given region (replace this with a real API)
function fetchRecipesForRegion(region) {
    // Example API call to Spoonacular
    const apiKey = 'YOUR_SPOONACULAR_API_KEY';
    const endpoint = `https://api.spoonacular.com/recipes/complexSearch?cuisine=${region}&apiKey=${apiKey}`;

    return fetch(endpoint)
        .then(response => response.json())
        .then(data => data.results)
        .catch(error => {
            console.error('Error fetching recipes:', error);
            return []; // Return an empty array if there’s an error
        });
}

// Function to display recipes (mock-up)
function displayRecipes(recipes) {
    const recipeInfoDiv = document.getElementById('recipe-info');

    if (recipes.length > 0) {
        // Show the names of the recipes in the info panel
        const recipeNames = recipes.map(r => r.title).join(', ');
        recipeInfoDiv.innerHTML = `Recipes from this region: ${recipeNames}`;
    } else {
        recipeInfoDiv.innerHTML = 'No recipes found for this region.';
    }
}
