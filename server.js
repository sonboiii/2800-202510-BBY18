// Basic Server Set up
// Make sure you install required modules to test/run
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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('trust proxy', true);

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

app.use(session({
  secret: process.env.NODE_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri
  })
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || undefined;
  next();
});

// Connect DB
connectDB().then(db => {
  const auth = require('./src/auth')(db);
  const pantryRouter = require('./routes/pantry')(db);
  const ingredientsRouter = require('./routes/ingredients')(db);
  const availableRecipesRoutes = require('./routes/availableRecipes')(db);

  app.use(auth.router);
  app.use('/pantry', pantryRouter);
  app.use('/ingredients', ingredientsRouter);
  app.use('/available-recipes', availableRecipesRoutes);

  /* Routes Section */
  app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
  });

  app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
  });

  app.get('/about', (req, res) => {
    res.render('about', { title: 'About' });
  });

  app.get('/home', requireLogin, (req, res) => {
    res.render('home', { user: req.session.user });
  });

  app.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up' });
  });

  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log('Logout error:', err);
        return res.send('Error logging out');
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });


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

      // 2️⃣ POI lookup (Overpass) using the precise coords
      const overpassQuery = `
      [out:json][timeout:10];
      node["shop"~"supermarket|grocery"](around:1000,${lat},${lon});
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
      const weatherResp = await fetch(weatherUrl);
      const weatherData = await weatherResp.json();

      if (weatherData.error) {
        return res.status(500).json({ error: weatherData.error.message });
      }

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


  app.get('/profile', requireLogin, (req, res) => {
    res.render('profile', { user: req.session.user });
  });
  
  app.post('/profile', requireLogin, async (req, res) => {
    const { name, email } = req.body;
  
    try {
      const dbInstance = await connectDB();
      const users = dbInstance.collection('users');
      
      await users.updateOne(
        { _id: new ObjectId(req.session.user._id) },
        { $set: { name, email } }
      );
  
      // Update session with new info
      req.session.user.name = name;
      req.session.user.email = email;
  
      res.redirect('/profile');
    } catch (err) {
      console.error('Profile update failed:', err);
      res.status(500).send('Error updating profile');
    }
  });


  /* END Route Section */


  app.use(function (req, res) {
    res.status(404);
    res.render('404', { title: 'Page Not Found' });
  });

  app.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));
}).catch(err => {
  console.error('Failed to start server:', err);
});
