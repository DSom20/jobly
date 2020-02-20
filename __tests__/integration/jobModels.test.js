const db = require("../../db.js");
const Job = require("../../models/jobModel");
const Company = require("../../models/companyModel");

process.env.NODE_ENV === "test";

describe("Test Job class", function () {

  let testJobA;
  let testJobB;
  let testJobC;
  let testCompanyA;
  let testCompanyB;

  beforeEach(async function () {
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM jobs");

    testCompanyA = await Company.create({
      handle: "test_company_a",
      name: "Test Company AAA",
      num_employees: 100
    });

    testCompanyB = await Company.create({
      handle: "test_company_b",
      name: "Test Company BBB",
      num_employees: 100
    });

    testJobA = await Job.create({
      title: "test_job_aaa",
      salary: 100.01,
      equity: 1,
      company_handle: testCompanyA.handle
    });

    testJobB = await Job.create({
      title: "test_job_baa",
      salary: 50,
      equity: .5,
      company_handle: testCompanyA.handle
    });

    testJobC = await Job.create({
      title: "test_job_ccc",
      salary: 10,
      equity: 1,
      company_handle: testCompanyB.handle
    });
  });

  describe("Job.getAll()", function () {
    test('can get list of all jobs', async function () {
      let jobs = await Job.getAll();

      expect(jobs).toHaveLength(3);
    });
  });

  describe("Job.create()", function () {
    test('can create new job', async function () {
      const testJob = await Job.create({
        title: "test_job_a",
        salary: 100.01,
        equity: 1,
        company_handle: testCompanyA.handle
      });

      expect(testJob).toEqual({
        id: expect.any(Number),
        title: "test_job_a",
        salary: 100.01,
        equity: 1,
        company_handle: testCompanyA.handle,
        date_posted: expect.any(Date)
      });

      expect(await Job.getAll()).toHaveLength(4);
    });
  })

  describe("Job.getAllFiltered()", function () {
    test('can return filtered jobs with search query', async function () {
      let jobs = await Job.getAllFiltered({ search: "aaa" })

      expect(jobs).toEqual([{
        title: testJobA.title,
        company_handle: testJobA.company_handle
      }]);
    });

    test('can return filtered jobs with min salary', async function () {
      let jobs = await Job.getAllFiltered({ min_salary: 45 })

      expect(jobs).toEqual([{
        title: testJobA.title,
        company_handle: testJobA.company_handle
      },
      {
        title: testJobB.title,
        company_handle: testJobB.company_handle
      }]);
    });

    test('can return filtered jobs with min equity', async function () {
      let jobs = await Job.getAllFiltered({ min_equity: .9 })

      expect(jobs).toEqual([{
        title: testJobA.title,
        company_handle: testJobA.company_handle
      },
      {
        title: testJobC.title,
        company_handle: testJobC.company_handle
      }
    ]);
    });

    test('can return filtered jobs with search and min_salary', async function () {
      let jobs = await Job.getAllFiltered({ search: "aa", min_salary: 90 });
      
      expect(jobs).toEqual([{
        title: testJobA.title,
        company_handle: testJobA.company_handle
      }]);
    });
  });

  describe("Job.getOne()", function () {
    test('can get valid job', async function () {
      let job = await Job.getOne(testJobC.id);
      expect(job).toEqual(testJobC);
    });
  });

  describe("Job.getJobsFromCompany()", function() {
    test('can get list of jobs associated with a company', async function() {
      let result = await Job.getJobsFromCompany(testCompanyA.handle);
      expect(result.jobs).toHaveLength(2);
    });
  });

  describe("Job.update()", function () {
    test('can update a job', async function () {
      testJobC.salary = 2000;

      let job = await Job.update(testJobC.id, { salary: 2000 });
      expect(job).toEqual(testJobC);

      let getJob = await Job.getOne(testJobC.id);
      expect(getJob).toEqual(testJobC);
      expect(getJob.salary).toEqual(2000);
    });
  });

  describe("Job.delete()", function() {
    test('can delete a job', async function () {
      let job = await Job.delete(testJobC.id);
      expect(job).toEqual({ title: testJobC.title });

      let getJob = await Job.getOne(testJobC.id);
      expect(getJob).toEqual(undefined);
    });
  });
});

afterAll(async function () {
  await db.end();
});