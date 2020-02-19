const express = require("express");
const Company = require("../models/companyModel")
const ExpressError = require("../expressError");
const jsonschema = require("jsonschema");
const companySchema = require("../schemas/companySchema.json");

const router = express.Router();

/*
  GET /companies
  Return { companies: [companyData, ...]}
    Where companyData represents {handle: <comp_handle>, name: <comp_name> }
*/

router.get("/", async function (req, res, next) {
  try {
    let result;

    if (req.query) {
      result = await Company.getAllFiltered(req.query);
    }
    result = await Company.getAll();

    return res.json({ companies: result })
  } catch (err) {
    return next(err);
  }
});

router.post('/', async function (res, req, next) {
  const result = jsonschema.validate(req.body, companySchema);
  
  if (!result.valid) {
    let listOfErrors = result.errors.map(error => error.stack);
    let error = new ExpressError(listOfErrors, 400);
    return next(error);
  }

  const company = await Company.create(req.body);
  return res.status(201).json({ company });
});
