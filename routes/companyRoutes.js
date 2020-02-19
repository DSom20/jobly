const express = require("express");
const Company = require("../models/companyModel")
const ExpressError = require("../expressError");
const jsonschema = require("jsonschema");
const companySchema = require("../schemas/companySchema.json");
const companyUpdateSchema = require("../schemas/companyUpdateSchema.json");

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
    } else {
      result = await Company.getAll();
    };

    return res.json({ companies: result });
  } catch (err) {
    return next(err);
  }
});

/*
  POST /companies
  Expects companyData object
  Returns { company: companyData }
*/

router.post('/', async function (req, res, next) {
  const result = jsonschema.validate(req.body, companySchema);
  
  if (!result.valid) {
    let listOfErrors = result.errors.map(error => error.stack);
    let error = new ExpressError(listOfErrors, 400);
    return next(error);
  }

  const company = await Company.create(req.body);
  return res.status(201).json({ company });
});

/*
  GET /company/:handler
  Expects: nothing in body
  Returns: { company: companyData } OR throw 404 if no comp with that handle
*/

router.get('/:handle', async function (req, res, next) {
  try {
    const company = await Company.getOne(req.params.handle);
    if (!company) {
      throw new ExpressError("Page not found. Company does not exist.", 404);
    }
    return res.json({ company });  
  } catch (err) {
    return next(err);
  }
});

/*
  PATCH /companies/:handle
  Expect: JSON object with keys to update
  Returns: { company: companyData } OR throw 404 if no comp with that handle
*/

router.patch('/:handle', async function (req, res, next) {
  try {
    const result = jsonschema.validate(req.body, companyUpdateSchema);
  
    if (!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const company = await Company.update(req.params.handle, req.body);

    if (!company) {
      throw new ExpressError("Page not found. Company does not exist.", 404);
    }
    
    return res.json({ company });  
  } catch (err) {
    return next(err);
  }
})

/*
  DELETE /companies/:handle
  Expect: no body, just "handle" in params
  Return: { message: "Company called <company_name> deleted"}
*/

router.delete('/:handle', async function (req, res, next) {
  try {
    const company = await Company.delete(req.params.handle);
    if (!company) {
      throw new ExpressError("Page not found. Company does not exist.", 404);
    }
    return res.json({ message: `Company called "${company.name}" deleted.` })
  } catch (err) {
    return next(err);
  }
})

module.exports = router;