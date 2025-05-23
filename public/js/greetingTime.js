function updateTimeAndMessage() {
  const now = new Date();
  const hour = now.getHours();

  // Format current time
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('current-time').textContent = timeString;

  // Greeting based on hour
  let greetingBase = "";
  if (hour >= 5 && hour < 12) {
    greetingBase = "Good morning";
  } else if (hour >= 12 && hour < 18) {
    greetingBase = "Good afternoon";
  } else {
    greetingBase = "Good evening";
  }

  const greetingElement = document.getElementById('greeting');
  const username = greetingElement?.dataset.username;

  if (greetingElement) {
    greetingElement.textContent = username
      ? `${greetingBase}, ${username}`
      : `${greetingBase}!`;
  }

  // Meal suggestion
  let mealMessage = "";
  if (hour >= 5 && hour < 11) {
    mealMessage = "Start your day right — breakfast is calling! 🌅";
  } else if (hour >= 11 && hour < 16) {
    mealMessage = "Lunchtime! Take a break and dig in 🍔";
  } else if (hour >= 16 && hour < 21) {
    mealMessage = "A perfect evening starts with a good meal 🌆"
      ;
  } else {
    mealMessage = "Late night snack, maybe? 🌙";
  }

  const mealElement = document.getElementById('meal-time-msg');
  if (mealElement) {
    mealElement.textContent = mealMessage;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  updateTimeAndMessage();
  setInterval(updateTimeAndMessage, 60000); // Update every minute
});
