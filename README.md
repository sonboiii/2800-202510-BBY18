
<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

<!-- PROJECT LOGO -->
<br />
<div>
  <a href="https://github.com/sonboiii/2800-202510-BBY18">
    <img src="public/images/foodieWhite.png" alt="Logo" width="450" height="80">
  </a>

<h3 align="center">Foodie</h3>

  <p align="center">
    Foodie is a meal planning app designed to expand the cultural bounds of cuisine. 
    <br />
    <br />
    <br />
    <a href="https://foodie-0fu4.onrender.com">View Demo</a>
  </p>
</div>


<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://foodie-0fu4.onrender.com)

Foodie is a meal planning app designed to expand the cultural bounds of cuisine.   
Users can spin a globe to randomly discover authentic recipes from around the world, or select recipes from a region of their own choosing.   
Foodie then generates a categorized shopping list based on the selected recipe, recommends nearby specialty stores, and tracks pantry items to reduce food waste.  

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Team Members:
- Tsang	Aaron
- Kadam	Kavin
- Fung Samuel
- Mei Meiko
- Bui Son

### Built With


[![Bootstrap][Bootstrap.com]][Bootstrap-url] [![JavaScript][JavaScript.com]][JS-url] [![jQuery][JQuery.com]][JQuery-url]
[![Node.js][nodejs.org]][node-url] [![npm][npmjs.com]][npm-url] [![Yarn][yarnpkg.com]][yarn-url]
[![Express][expressjs.com]][express-url] [![MongoDB][mongodb.com]][mongo-url]
[![OpenAI][openai.com]][openai-url] [![Three.js][threejs.org]][three-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- PROJECT STRUCTURE -->
## Project Structure
```
├───public
│   ├───css
│   │   globe.css
│   │   styles.css
│   ├───images
│   │   breadLogo.png
│   │   favicon.ico
│   │   favourite.svg
│   │   food-fact.svg
│   │   foodieBlack.png
│   │   foodieCream.png
│   │   foodieWhite.png
│   │   foodie_index.png
│   │   globe.svg
│   │   ingredients.svg
│   │   pantry.svg
│   │   recipe.svg
│   │   stores.svg
│   └───js
│       addPantry.js
│       foodfact.js
│       globe.js
│       greetingTime.js
│       location.js
│       viewPantry.js
├───routes
│   areas.js
│   authRoutes.js
│   availableRecipes.js
│   favourites.js
│   foodfact.js
│   ingredients.js
│   pantry.js
│   profile.js
├───src
│   auth.js
└───views
    404.ejs
    about.ejs
    addPantry.ejs
    availableRecipes.ejs
    favourites.ejs
    globe.ejs
    home.ejs
    index.ejs
    ingredients.ejs
    login.ejs
    meal.ejs
    pantry.ejs
    profile.ejs
    recipeDetail.ejs
    seemore.ejs
    signup.ejs
    stores.ejs
    └───templates
        footer.ejs
        header.ejs
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- GETTING STARTED -->
## Getting Started

Clone the repo, install dependencies and create your `.env` file.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* npm
  ```sh
  npm install npm@latest -g
  ```
  or  
  
* yarn
  ```sh
  yarn install
   ```

### Installation

1. Get free API keys from:
   - [WeatherAPI](https://www.weatherapi.com/)
   - [OpenRouter](https://openrouter.ai/)
   - [OpenAI](https://platform.openai.com/)

2. Create a `.env` file in your project root and add your environment variables:
   ```env
   MONGODB_USER=your_mongodb_user
   MONGODB_PASSWORD=your_mongodb_password
   MONGODB_HOST=your_mongodb_host
   MONGODB_DATABASE=your_database_name
   NODE_SESSION_SECRET=your_session_secret
   WEATHER_API_KEY=your_weatherapi_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_API_KEY_TWO=your_secondary_openrouter_api_key
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_API_KEY_TWO=your_secondary_openai_api_key
   SITE_URL=localhost
   SITE_TITLE=Foodie
   ```

### Testing Plan

Check out our [Testing Plan](https://docs.google.com/spreadsheets/d/1QHzpamqOnVRuHDg5ZzmaTi3cihk4ygsat7a5Z__W_7Y/edit?gid=394496370#gid=394496370).
<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- Features -->
## Features

- **Pantry**  
  Manage your pantry items easily — add, update, or remove ingredients you have on hand.

- **Stores**  
  Find specialty grocery stores and supermarkets nearby based on your location.

- **Globe**  
  Explore global cuisines interactively by spinning a globe and discovering new recipes.

- **Pantry Recipes**  
  Get recipe suggestions based on what’s currently in your pantry.

- **Food Fact**  
  Discover fun and interesting food trivia powered by AI to enhance your cooking experience.

- **Ingredient Search**  
  Search recipes by entering specific ingredients you want to use.

- **Favourites**  
  Save and access your favorite recipes quickly for easy reference.

- **Profile Management**  
  Update your email and password, and view your grocery list to keep everything organized.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- TOP CONTRIBUTORS -->
### Top contributors:

<a href="https://github.com/sonboiii/2800-202510-BBY18/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=sonboiii/2800-202510-BBY18" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

### OpenAI API via OpenRouter.ai
- **Model:** `qwen/qwen3-8b:free` (conversational model)
- Use cases:
  - Generating appetizing recipe descriptions and summaries based on ingredients and instructions.
  - Creating short, enticing descriptions of various cuisine areas (e.g., Italian, Japanese).

### Anthropic Claude via OpenRouter.ai
- **Model:** `anthropic/claude-3-haiku` (conversational model)
- Use cases:
  - Fetching random, engaging food trivia as fun facts.

### Overpass API (OpenStreetMap data)
- Use cases:
  - Looking up nearby grocery stores based on user-provided latitude and longitude.
  - Searching for stores tagged as supermarkets or grocery shops within a 25 km radius.
  - Providing store data to the front-end for rendering store lists.

### WeatherAPI.com
- Use cases:
  - Fetching real-time weather information for user-specified locations.

### AI-Assisted Development
Parts of this project's codebase were generated using **ChatGPT** to enhance productivity and accelerate development.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JavaScript.com]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[JS-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com
[nodejs.org]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[node-url]: https://nodejs.org
[npmjs.com]: https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white
[npm-url]: https://www.npmjs.com
[yarnpkg.com]: https://img.shields.io/badge/Yarn-2C8EBB?style=for-the-badge&logo=yarn&logoColor=white
[yarn-url]: https://yarnpkg.com
[expressjs.com]: https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white
[express-url]: https://expressjs.com
[mongodb.com]: https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white
[mongo-url]: https://www.mongodb.com
[openai.com]: https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white
[openai-url]: https://openai.com
[threejs.org]: https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white
[three-url]: https://threejs.org
[contributors-shield]: https://img.shields.io/github/contributors/sonboiii/2800-202510-BBY18.svg?style=for-the-badge
[contributors-url]: https://github.com/sonboiii/2800-202510-BBY18/graphs/contributors
[product-screenshot]: public/images/foodie_index.png