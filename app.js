/** Express app for jobly. */

const express = require("express");
const cors = require("cors");
const ExpressError = require("./helpers/expressError");
const morgan = require("morgan");
const app = express();

const { authenticateJWT }  = require("../middleware/auth");

app.use(express.json());

// add logging system
app.use(morgan("tiny"));

// allow connections to all routes from any browser
app.use(cors());

// get auth token for all routes
app.use(authenticateJWT);

/** routes  */

const companyRoutes = require("./routes/companyRoutes");
const jobRoutes = require("./routes/jobRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/companies", companyRoutes);
app.use("/jobs", jobRoutes);
app.use("/users", userRoutes);

/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  
  if(process.env.NODE_ENV !== "test") {
    console.error(err.stack);
  }
  // console.error(err.stack);

  return res.json({
    status: err.status,
    message: err.message
  });
});

module.exports = app;
