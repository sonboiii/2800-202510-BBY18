require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const { MongoClient } = require('mongodb');

const router = express.Router();

// Setup MongoDB connection
const mongoUri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}` +
  `@${process.env.MONGODB_HOST}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

const client = new MongoClient(mongoUri);
let db;

client.connect().then(() => {
  db = client.db(process.env.MONGODB_DATABASE);
  console.log('MongoDB connected in auth.js');
});

// Middleware to check login
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Routes
router.get('/signup', (req, res) => {
  res.render('signup');
});

router.post('/signup', async (req, res) => {
    console.log('Signup POST body:', req.body);
  const schema = Joi.object({
    name: Joi.string().max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    const users = db.collection('users');
    const existingUser = await users.findOne({ email: value.email });
    if (existingUser) return res.status(400).send('Email already exists');

    const hashedPassword = await bcrypt.hash(value.password, 10);
    const newUser = {
      name: value.name,
      email: value.email,
      password: hashedPassword
    };

    await users.insertOne(newUser);
    req.session.user = { name: newUser.name, email: newUser.email };
    res.redirect('/home');
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).send('Error signing up');
  }
});

router.get('/login', (req, res) => {
  res.render('login', { message: null });
});

router.post('/login', async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    const users = db.collection('users');
    const user = await users.findOne({ email: value.email });

    if (!user || !(await bcrypt.compare(value.password, user.password))) {
      return res.render('login', { message: 'Invalid email/password combination' });
    }

    req.session.user = { name: user.name, email: user.email };
    res.redirect('/home');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('login', { message: 'Error logging in' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = {
    router,
    requireLogin
};
  