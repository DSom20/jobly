const express = require("express");
const Company = require("../models/companyModel")
const ExpressError = require("../expressError");

const router = express.Router();

/*
  GET /companies
  Return { companies: [companyData, ...]}
    Where companyData represents {handle: <comp_handle>, name: <comp_name> }
*/

router.get("/", function(req,res,next) {
  try {
    let result;
    if(req.query) {
      result = Company.getAllFiltered(req.query);
    }
    result = Company.getAll();
  
    return res.json({ companies: result })
  } catch (err) {
    return next(err);
  }
})
