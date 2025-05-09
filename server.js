// Basic Server Set up
// Make sure you install required modules to test/run
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const auth = require('./src/auth');
const fetch   = require('node-fetch');      // v2.x


const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);


const mongoUri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}` +
  `@${process.env.MONGODB_HOST}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

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
app.use(auth.router);

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Haversine formula: distance (km) between two lat/lon pairs
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fetch nearby “stores” via Overpass API (example: supermarkets within 5 km)
async function findNearbyStores(lat, lon) {
  const radius = 5000; // meters
  const query = `
    [out:json];
    node["shop"="supermarket"](around:${radius},${lat},${lon});
    out;`;
  const url =
      'https://overpass-api.de/api/interpreter?data=' +
      encodeURIComponent(query);

  const res = await fetch(url);
  const json = await res.json();

  // Map each node → { name, distance } and sort by distance
  return (json.elements || [])
      .map((node) => ({
        name: node.tags.name || 'Unknown',
        distance: getDistanceKm(lat, lon, node.lat, node.lon),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // top 10
}

app.get('/home', requireLogin, (req, res) => {
  res.render('home', { user: req.session.user });
});


/* Routes Section */
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/signup', (req, res) => {
  res.render('signup');
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

app.get('/home', auth.requireLogin, (req, res) => {
  res.render('home', { user: req.session.user });
});


// server.js (or wherever you define /stores)
app.get('/stores', async (req, res, next) => {
  console.log('→ [stores] route hit with query:', req.query);

  try {
    let lat, lon;

    if (req.query.lat && req.query.lon) {
      lat = parseFloat(req.query.lat);
      lon = parseFloat(req.query.lon);
      console.log(`   using precise coords: ${lat}, ${lon}`);
    } else {
      console.log('   falling back to IP lookup');
      const rawIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress)
          .split(',')[0].trim();
      let geo = {};
      try {
        const resp = await fetch('https://ipapi.co/json/');
        geo = await resp.json();
        if (geo.error) throw new Error(geo.reason);
      } catch (err) {
        console.warn('✖ ipapi failed:', err.message);
      }

// If we didn’t actually get valid coords, skip the store lookup
      if (!geo.latitude || !geo.longitude) {
        console.warn('⚠️  No coords from IP lookup, rendering empty stores.');
        return res.render('stores', {
          stores: [],
          locationError: true
        });
      }

      const lat = parseFloat(geo.latitude);
      const lon = parseFloat(geo.longitude);

      // after the geo‐lookup guard above...
      const stores = await findNearbyStores(lat, lon);
      res.render('stores', {
        stores,
        locationError: false
      });


      console.log(`   IP lookup gave: ${lat}, ${lon}`);
    }

    console.log('   fetching nearby stores…');
    const stores = await findNearbyStores(lat, lon);
    console.log(`   got ${stores.length} stores`);

    if (req.accepts('json') || req.query.format === 'json') {
      return res.json(stores);
    }

    res.render('stores', { stores });
  }
  catch (err) {
    console.error('‼️ Error in /stores handler:', err);
    // send a simple 500 so you don’t stay blank
    return res.status(500).send('Internal server error, check console');
  }
});





/* END Route Section */


app.use(function (req, res) {
  res.status(404);
  res.render('404');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
