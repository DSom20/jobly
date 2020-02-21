const express = require('express');
const User = require('../models/userModel');
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require('../expressError');

const router = express.Router();

/*
  POST /login
  Return { token: token}
*/
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    let isValidUser = await User.authenticate(username, password);

    if (!isValidUser) {
      throw new ExpressError(`Username/password is not valid`, 400);

    } else {
      let { is_admin } = await User.getOne(username);
      let payload = { username, is_admin };
      let token = jwt.sign(payload, SECRET_KEY);
      
      return res.json({ token });
    }
  }
  
  catch (err) {
    return next(err);
  }
});

