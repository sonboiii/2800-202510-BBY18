require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const { ObjectId } = require('mongodb');

module.exports = function (db) {
  const router = express.Router();

  // Middleware to protect routes from unauthorized access
  function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
  }

  router.get('/signup', (req, res) => {
    res.render('signup');
  });

  router.post('/signup', async (req, res) => {
    console.log('Signup POST body:', req.body);

    // Validate incoming signup data
    const schema = Joi.object({
      name: Joi.string().max(255).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
      const users = db.collection('users');

      // Check if the email already exists
      const existingUser = await users.findOne({ email: value.email });
      if (existingUser) return res.status(400).send('Email already exists');

      // Hash the user's password
      const hashedPassword = await bcrypt.hash(value.password, 10);

      // Create the new user object
      const newUser = {
        name: value.name,
        email: value.email,
        password: hashedPassword
      };

      // Insert the new user into the database
      const result = await users.insertOne(newUser);

      // Start a session for the new user
      req.session.user = { 
        _id: result.insertedId, 
        name: newUser.name, 
        email: newUser.email 
      };

      // Redirect to home after signup
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

    // Validate login form data
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });

    let body = req.body;
    if (req.is('application/json')) {
      body = req.body;
    }

    const { error, value } = schema.validate(body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
      const users = db.collection('users');

      // Find the user by email
      const user = await users.findOne({ email: value.email });

      // Verify user and password match
      if (!user || !(await bcrypt.compare(value.password, user.password))) {
        return res.status(401).send('Invalid email/password combination');
      }

      // Store user session
      req.session.user = { 
        _id: user._id, 
        name: user.name, 
        email: user.email 
      };

      // Redirect to home
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

  router.post('/change-password', requireLogin, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate password change inputs
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    });
  
    const { error } = schema.validate(req.body);
    if (error) {
      req.session.formError = error.details[0].message;
      return res.redirect('/profile');
    }
  
    try {
      const users = db.collection('users');

      // Find current user in the database
      const user = await users.findOne({ _id: new ObjectId(req.session.user._id) });
      
      // Verify the current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        req.session.formError = 'Current password is incorrect';
        return res.redirect('/profile');
      }
      
      // Hash and update the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await users.updateOne({ _id: user._id }, { $set: { password: hashedNewPassword } });
  
      req.session.formSuccess = 'Password updated successfully';
      res.redirect('/profile');
    } catch (err) {
      console.error('Password change error:', err.stack || err);
      req.session.formError = 'Internal error while changing password';
      res.redirect('/profile');
    }
  });
  
  return {
    router,
    requireLogin
  };
};
