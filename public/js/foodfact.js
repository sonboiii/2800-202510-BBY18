document.addEventListener('DOMContentLoaded', () => {
    const factText = document.getElementById('food-fact-text');
    const refreshBtn = document.getElementById('refresh-food-fact');
    const foodFactIcon = document.getElementById('food-fact-icon');

    async function loadFoodFact() {
        if (factText) factText.textContent = "Loading...";

        try {
            const res = await fetch('/api/foodfact');
            const data = await res.json();

            if (data.fact) {
                factText.textContent = data.fact;
                if (foodFactIcon) foodFactIcon.style.display = 'none';
            } else {
                factText.textContent = "Could not fetch a food fact.";
            }
        } catch (err) {
            console.error("Food fact error:", err);
            factText.textContent = "An error occurred while fetching the food fact.";
        }
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadFoodFact);
    }
});
