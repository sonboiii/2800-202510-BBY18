// Basic Server Set up
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fetch = require('node-fetch');      // v2.x
const { connectDB, uri: mongoUri } = require('./db');
const { ObjectId } = require('mongodb');

const app = express();
const PORT = 3000;

// View Engine and Static Files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('trust proxy', true);

// Middleware to restrict access to authenticated users
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Configure session handling with MongoDB store
app.use(session({
  secret: process.env.NODE_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    crypto: {
      secret: process.env.MONGODB_SESSION_SECRET
    }
  })
}));

// Set global template variables and handle flash messages
app.use((req, res, next) => {
  res.locals.user = req.session.user || undefined;
  res.locals.formError = req.session.formError;
  res.locals.formSuccess = req.session.formSuccess;
  delete req.session.formError;
  delete req.session.formSuccess;
  next();
});


// Misc Routers
const foodfactRouter = require('./routes/foodfact')();
app.use('/api/foodfact', foodfactRouter);


// Connect DB
connectDB().then(db => {
  const auth = require('./src/auth')(db);
  const pantryRouter = require('./routes/pantry')(db);
  const ingredientsRouter = require('./routes/ingredients')(db);
  const areasRouter = require('./routes/areas')(db);
  const availableRecipesRoutes = require('./routes/availableRecipes')(db);
  const favouritesRouter = require('./routes/favourites')(db);
  const profileRouter = require('./routes/profile')(db);
  const authRoutes = require('./routes/authRoutes')(db);


  // Mount routes
  app.use(auth.router);
  app.use('/profile', profileRouter);
  app.use('/pantry', pantryRouter);
  app.use('/ingredients', ingredientsRouter);
  app.use('/areas', areasRouter);
  app.use('/available-recipes', availableRecipesRoutes);
  app.use('/favourites', favouritesRouter);
  app.use(authRoutes);

  /* Routes Section */
  app.get('/', (req, res) => {
    if (req.session.user) {
      return res.redirect('/home');
    }
    res.render('index', { title: 'Welcome' });
  });

  app.get('/about', (req, res) => {
    res.render('about', { title: 'About' });
  });

  app.get('/home', requireLogin, (req, res) => {
    res.render('home', { user: req.session.user });
  });

  app.use(session({
    secret: process.env.NODE_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoUri,
      crypto: {
        secret: process.env.MONGODB_SESSION_SECRET
      }
    }),
    cookie: {
      maxAge: (60 * 60 * 1000) * 2,
    }
  }));

  app.get('/stores', async (req, res, next) => {
    try {
      // 1️⃣ Must have lat & lon from client (e.g. Leaflet.map.locate)
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);

      if (isNaN(lat) || isNaN(lon)) {
        // No coords? Just render the page; front-end will pick them up and re-fetch.
        return res.render('stores', {
          title: 'Nearby Stores',
          lat: null,
          lon: null,
          stores: []
        });
      }

      // Get grocery list from session
      const groceryList = req.session.groceryList || [];

      // Normalize names
      const names = groceryList.map(i => i.name.toLowerCase());

      // Load or query tags
      const ingredientTags = require('./data/ingredient-tags.json'); // or from Mongo
      const storeTags = new Set();

      names.forEach(name => {
        const tags = ingredientTags[name] || [];
        tags.forEach(tag => storeTags.add(tag));
      });

      // 2️⃣ POI lookup (Overpass) using the precise coords
      const tagsToQuery = Array.from(storeTags).join('|') || 'supermarket|grocery';

      const overpassQuery = `
      [out:json][timeout:10];
      node["shop"~"${tagsToQuery}"](around:25000,${lat},${lon});
      out center;
      `;
      const poiUrl = 'https://overpass-api.de/api/interpreter?data='
        + encodeURIComponent(overpassQuery);
      const poiResp = await fetch(poiUrl);
      const poiData = await poiResp.json();

      // 3️⃣ Normalize store data
      const stores = (poiData.elements || []).map(el => ({
        name: el.tags?.name || 'Unnamed store',
        lat: el.type === 'node' ? el.lat : el.center.lat,
        lon: el.type === 'node' ? el.lon : el.center.lon
      }));

      // 4️⃣ Render with real coords and found stores
      res.render('stores', { title: 'Nearby Stores', lat, lon, stores });

    } catch (err) {
      next(err);
    }
  });

  app.get('/weather', async (req, res) => {
    const locationQuery = req.query.location;

    if (!locationQuery) {
      return res.status(400).json({ error: 'Missing location parameter' });
    }

    try {
      const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${encodeURIComponent(locationQuery)}&aqi=no`;

      // Fetch current weather data from the Weather API
      const weatherResp = await fetch(weatherUrl);
      const weatherData = await weatherResp.json();

      if (weatherData.error) {
        return res.status(500).json({ error: weatherData.error.message });
      }

      // Respond with selected weather data in JSON format
      res.json({
        city: weatherData.location.name,
        region: weatherData.location.region,
        temp_c: weatherData.current.temp_c,
        condition: weatherData.current.condition.text,
        icon: weatherData.current.condition.icon
      });
    } catch (error) {
      console.error('Weather API request failed:', error);
      res.status(500).json({ error: 'Weather API request failed' });
    }
  });

  app.get('/globe', requireLogin, (req, res) => {
    res.render('globe');
  });

  // 404 handler
  app.use(function (req, res) {
    res.status(404);
    res.render('404', { title: 'Page Not Found' });
  });

  app.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));
}).catch(err => {
  console.error('Failed to start server:', err);
});
