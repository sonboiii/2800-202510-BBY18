require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');

module.exports = function (db) {
  const router = express.Router();

  function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
  }

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

      const result = await users.insertOne(newUser);
      req.session.user = { _id: result.insertedId, name: newUser.name, email: newUser.email };

      req.session.save(() => res.redirect('/home'));
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).send('Error signing up');
    }
  });

  router.get('/login', (req, res) => {
    return res.render('login', { message: 'Invalid email/password combination' });
  });

  router.post('/login', async (req, res) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });

    let body = req.body;
    if (req.is('application/json')) {
      body = await new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(JSON.parse(data)));
      });
    }

    const { error, value } = schema.validate(body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
      const users = db.collection('users');
      const user = await users.findOne({ email: value.email });

      if (!user || !(await bcrypt.compare(value.password, user.password))) {
        return res.status(401).send('Invalid email/password combination');
      }

      req.session.user = { _id: user._id, name: user.name, email: user.email };

      req.session.save(() => res.redirect('/home'));
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).send('Error logging in');
    }
  });

  router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error('Logout error:', err);
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });

  return {
    router,
    requireLogin
  };
};
