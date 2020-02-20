const express = require("express");
const Job = require("../models/jobModel")
const ExpressError = require("../expressError");
const jsonschema = require("jsonschema");
const jobSchema = require("../schemas/jobSchema.json");
const jobUpdateSchema = require("../schemas/jobUpdateSchema.json");

const router = express.Router();
/*
  GET /jobs
  Return { jobs: [jobData, ...]}
    Where jobData represents {id: <job_id>, title: <jon_title> }
*/
router.get('/', async function (req, res, next) {
  try {
    let jobs;

    if (!req.query) {
      jobs = await Job.getAll();
    } else {
      jobs = await Job.getAllFiltered(req.query);
    }

    return res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

/*
  POST /jobs
  Expects jobData object
  Returns { job: jobData }
*/

router.post('/', async function (req, res, next) {
  const result = jsonschema.validate(req.body, jobSchema);

  if (!result.valid) {
    let listOfErrors = result.errors.map(error => error.stack);
    let error = new ExpressError(listOfErrors, 400);
    return next(error);
  }

  try {
    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
});

/*
  GET /jobs/:id
  Expects: nothing in body
  Returns: { job: jobData } OR throw 404 if no job with that id
*/

router.get('/:id', async function (req, res, next) {
  try {
    let id = +req.params.id;
    if(isNaN(id)) throw new ExpressError("Page not found. Job id must be an integer.", 404);

    const job = await Job.getOne(id);
    if (!job) {
      throw new ExpressError("Page not found. Job does not exist.", 404);
    }

    return res.json({ job });  
  } catch (err) {
    return next(err);
  }
});

/*
  PATCH /jobs/:id
  Expect: JSON object with keys to update
  Returns: { job: jobData } OR throw 404 if no comp with that id
*/

router.patch('/:id', async function (req, res, next) {
  try {
    let id = +req.params.id;
    if(isNaN(id)) throw new ExpressError("Page not found. Job id must be an integer.", 404);

    const result = jsonschema.validate(req.body, jobUpdateSchema);
  
    if (!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const job = await Job.update(id, req.body);

    if (!job) {
      throw new ExpressError("Page not found. Job does not exist.", 404);
    }
    
    return res.json({ job });  
  } catch (err) {
    return next(err);
  }
});

/*
  DELETE /jobs/:id
  Expect: no body, just "id" in params
  Return: { message: "Job called <job_title> deleted"}
*/

router.delete('/:id', async function (req, res, next) {
  try {
    let id = +req.params.id;
    if(isNaN(id)) throw new ExpressError("Page not found. Job id must be an integer.", 404);

    const job = await Job.delete(id);
    if (!job) {
      throw new ExpressError("Page not found. Job does not exist.", 404);
    }
    return res.json({ message: `Job called "${job.title}" deleted.` })
  } catch (err) {
    return next(err);
  }
});

module.exports = router;