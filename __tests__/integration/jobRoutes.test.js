const request = require("supertest");
const app = require("../../app");
const db = require("../../db.js");
const Job = require("../../models/jobModel");
const Company = require("../../models/companyModel");

process.env.NODE_ENV === "test";

describe("Job Routes Test", function () {

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
      salary: 100,
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

  describe('GET /', function () {
    test('gets list of all jobs', async function () {
      let response = await request(app).get('/jobs');

      expect(response.statusCode).toEqual(200);
      expect(response.body.jobs).toHaveLength(3);
    });

    test('gets list of filtered jobs', async function () {
      let response = await request(app).get('/jobs?search=aa&min_salary=40');

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(
        {
          jobs:
            [
              {
                title: "test_job_aaa",
                company_handle: testCompanyA.handle
              },
              {
                title: "test_job_baa",
                company_handle: testCompanyA.handle
              }
            ]
        });
    });
  });

  describe('POST /', function () {
    test('creates new job for valid data supplied', async function () {
      let response = await request(app).post('/jobs')
        .send({
          title: "test_job",
          salary: 100,
          equity: 0.2,
          company_handle: testCompanyA.handle
        });

      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "test_job",
          salary: 100,
          equity: 0.2,
          company_handle: testCompanyA.handle,
          date_posted: expect.any(String)
        }
      });

      let response2 = await request(app).get('/jobs');
      expect(response2.body.jobs).toHaveLength(4);
    });

    test('returns 400 error for invalid data supplied -- no primary key', async function () {
      let response = await request(app).post('/jobs')
        .send({
          salary: 9000,
          equity: 0.15,
          company_handle: testCompanyB.handle
        });

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        "status": 400,
        "message": [
          "instance requires property \"title\""
        ]
      });

      let response2 = await request(app).get('/jobs');
      expect(response2.body.jobs).toHaveLength(3);
    });
  });

  describe('GET /jobs/:id', function () {
    test('gets one valid job from id supplied', async function () {
      let response = await request(app).get(`/jobs/${testJobA.id}`);

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        job:
        {
          id: expect.any(Number),
          title: "test_job_aaa",
          salary: 100,
          equity: 1,
          company_handle: testCompanyA.handle,
          date_posted: expect.any(String),
          company: testCompanyA
          // company: { ...testCompanyA, jobs: [testJobA, testJobB]} //BRITTLE! should be another way. Plus still errors because expects date_posted to be date object, but this method produces string
        }
      });
    });

    test('returns 404 error for job id with wrong data type', async function () {
      let response = await request(app).get(`/jobs/invalid_id`);

      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        "status": 404,
        "message": "Page not found. Job id must be an integer."
      });
    });

    test('returns 404 error for invalid job id', async function () {
      let response = await request(app).get(`/jobs/0`);

      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        "status": 404,
        "message": "Page not found. Job does not exist."
      });
    });
  });

  describe('PATCH /jobs/:id', function () {
    test('updates valid job from id supplied', async function () {
      let response = await request(app).patch(`/jobs/${testJobA.id}`)
        .send({
          salary: 1300.00
        });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "test_job_aaa",
          salary: 1300.00,
          equity: 1,
          company_handle: testCompanyA.handle,
          date_posted: expect.any(String)
        }
      });

      let response2 = await request(app).get(`/jobs/${testJobA.id}`);

      expect(response2.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "test_job_aaa",
          salary: 1300.00,
          equity: 1,
          company_handle: testCompanyA.handle,
          date_posted: expect.any(String),
          company: { ...testCompanyA }

        }
      });
    });

    test('returns 404 error for job id with wrong data type', async function () {
      let response = await request(app).patch(`/jobs/invalid_id`);

      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        "status": 404,
        "message": "Page not found. Job id must be an integer."
      });
    });

    test('returns 404 error for invalid job id', async function () {
      let response = await request(app).patch(`/jobs/0`)
        .send({
          salary: 1300
        });

      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        "status": 404,
        "message": "Page not found. Job does not exist."
      });
    });

    test('returns 400 error for valid job with invalid update data', async function () {
      let response = await request(app).patch(`/jobs/${testJobA.id}`)
        .send({
          salary: "wrong data type"
        });

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        "status": 400,
        "message": [
          "instance.salary is not of a type(s) number"
        ]
      });
    });

    describe('DELETE /jobs/:id', function () {
      test('deletes job from id supplied', async function () {
        let response = await request(app).delete(`/jobs/${testJobA.id}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
          message: `Job called "${testJobA.title}" deleted.`
        });
      });

      test('returns 404 error for job id with wrong data type', async function () {
        let response = await request(app).delete(`/jobs/invalid_id`);

        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({
          "status": 404,
          "message": "Page not found. Job id must be an integer."
        });
      });

      test('returns 404 error for invalid job id', async function () {
        let response = await request(app).delete(`/jobs/0`);

        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({
          "status": 404,
          "message": "Page not found. Job does not exist."
        });
      });
    });
  });
});

afterAll(async function () {
  await db.end();
});