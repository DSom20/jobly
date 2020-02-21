const express = require("express");
const ExpressError = require("../expressError");
const jsonschema = require("jsonschema");
const userSchema = require("../schemas/userSchema.json");
const userUpdateSchema = require("../schemas/userUpdateSchema.json");

const router = express.Router();

/*
  GET /users
  Return { users: [userData, ...]}
    Where userData represents {username, first_name, last_name, email }
*/

router.get("/", async function (req, res, next) {
  try {
    const users = await User.getAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/*
  POST /user
  Expects userData object
  Returns { user: userData }
*/

router.post('/', async function (req, res, next) {
  const result = jsonschema.validate(req.body, userSchema);
  
  if (!result.valid) {
    let listOfErrors = result.errors.map(error => error.stack);
    let error = new ExpressError(listOfErrors, 400);
    return next(error);
  }

  try {
    const user = await User.create(req.body);
    return res.status(201).json({ user });
  } catch(err) {
    next(err);
  }
});

/*
  GET /user/:username
  Expects: nothing in body
  Returns: { user: userData } OR throw 404 if no user with that username
*/

router.get('/:username', async function (req, res, next) {
  try {
    const user = await User.getOne(req.params.username);
    if (!user) {
      throw new ExpressError("Page not found. User does not exist.", 404);
    }
    return res.json({ user });  
  } catch (err) {
    return next(err);
  }
});

/*
  PATCH /user/:username
  Expect: JSON object with keys to update
  Returns: { user: userData } OR throw 404 if no user with that username
*/

router.patch('/:username', async function (req, res, next) {
  try {
    const result = jsonschema.validate(req.body, userUpdateSchema);
  
    if (!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const user = await User.update(req.params.username, req.body);

    if (!user) {
      throw new ExpressError("Page not found. User does not exist.", 404);
    }
    
    return res.json({ user });  
  } catch (err) {
    return next(err);
  }
})

/*
  DELETE /user/:username
  Expect: no body, just "username" in params
  Return: { message: "<username> deleted"}
*/

router.delete('/:username', async function (req, res, next) {
  try {
    const user = await User.delete(req.params.username);
    if (!user) {
      throw new ExpressError("Page not found. User does not exist.", 404);
    }
    return res.json({ message: `${user.username} deleted.` })
  } catch (err) {
    return next(err);
  }
})

module.exports = router;