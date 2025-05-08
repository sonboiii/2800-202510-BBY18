// Basic Server Set up
// Make sure you install required modules to test/run
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

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

/* END Route Section */

app.use(function (req, res) {
    res.status(404);
    res.render('404');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
