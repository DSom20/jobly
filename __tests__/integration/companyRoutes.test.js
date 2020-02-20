const request = require("supertest");
const app = require("../../app");
const db = require("../../db.js");
const Company = require("../../models/companyModel");
const ExpressError = require("../../expressError");

process.env.NODE_ENV === "test";

describe("Company Routes Test", function () {

  let testCompanyA;
  let testCompanyB;
  let testCompanyC;

  beforeEach(async function () {
    await db.query("DELETE FROM companies");

    testCompanyA = await Company.create({
      handle: "test_company_a",
      name: "Test Company AAA",
      num_employees: 100
    });

    testCompanyB = await Company.create({
      handle: "test_company_b",
      name: "Test Company BAA",
      num_employees: 50
    });

    testCompanyC = await Company.create({
      handle: "test_company_c",
      name: "Test Company CCC",
      num_employees: 75
    });
  });

  describe('GET /', function () {
    test('gets list of all companies', async function () {
      let response = await request(app).get('/companies');

      expect(response.statusCode).toEqual(200);
      expect(response.body.companies).toHaveLength(3);
    });

    test('gets list of filtered companies', async function () {
      let response = await request(app).get('/companies?search=AA&min_employees=55');

      expect(response.statusCode).toEqual(200);
      expect(response.body.companies).toEqual(
        [{
          handle: "test_company_a",
          name: "Test Company AAA"
        }]
      );
    });
  });

  describe('POST /', function () {
    test('creates new company for valid data supplied', async function () {
      let response = await request(app).post('/companies')
        .send({
          handle: "test_company_x",
          name: "Test Company XXX",
          num_employees: 5000
        });

      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({
        company: {
          handle: "test_company_x",
          name: "Test Company XXX",
          num_employees: 5000,
          description: null,
          logo_url: null
        }
      });

      let response2 = await request(app).get('/companies');
      expect(response2.body.companies).toHaveLength(4);
    });

    test('returns 400 error for invalid data supplied', async function () {
      let response = await request(app).post('/companies')
        .send({
          name: "Test Company YYY",
          num_employees: 5000
        });

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        "status": 400,
        "message": [
          "instance requires property \"handle\""
        ]
      });

      let response2 = await request(app).get('/companies');
      expect(response2.body.companies).toHaveLength(3);
    });
  });

  describe('GET /companies/:handle', function () {
    test('gets one valid company from handle supplied', async function () {
      let response = await request(app).get(`/companies/${testCompanyA.handle}`);

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        company:
        {
          handle: "test_company_a",
          name: "Test Company AAA",
          num_employees: 100,
          description: null,
          logo_url: null,
          jobs: []
        }
      });
    });

    test('returns 404 error for invalid company handle', async function () {
      let response = await request(app).get(`/companies/fake_handle`);

      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        "status": 404,
        "message": "Page not found. Company does not exist."
      });
    });
  });

  describe('PATCH /companies/:handle', function () {
    test('updates valid company from handle supplied', async function () {
      let response = await request(app).patch(`/companies/${testCompanyA.handle}`)
        .send({
          num_employees: 900,
        });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        company: {
          handle: "test_company_a",
          name: "Test Company AAA",
          num_employees: 900,
          description: null,
          logo_url: null
        }
      });

      let response2 = await request(app).get(`/companies/${testCompanyA.handle}`);

      expect(response2.body).toEqual({
        company:
        {
          handle: "test_company_a",
          name: "Test Company AAA",
          num_employees: 900,
          description: null,
          logo_url: null,
          jobs: []
        }
      });
    });

    test('returns 404 error for invalid company handle', async function () {
      let response = await request(app).patch(`/companies/fake_handle`)
        .send({
          num_employees: 900
        });

      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        "status": 404,
        "message": "Page not found. Company does not exist."
      });
    });

    test('returns 400 error for invalid company with invalid update data', async function () {
      let response = await request(app).patch(`/companies/fake_handle`)
        .send({
          num_employees: "wrong data type"
        });

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        "status": 400,
        "message": [
          "instance.num_employees is not of a type(s) integer"
        ]
      });
    });

    describe('DELETE /companies/:handle', function () {
      test('deletes company from handle supplied', async function () {
        let response = await request(app).delete(`/companies/${testCompanyA.handle}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
          message: `Company called "${testCompanyA.name}" deleted.`
        });
      });

      test('returns 404 for invalid company', async function () {
        let response = await request(app).delete('/companies/fake_handle');

        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({
          "status": 404,
          "message": "Page not found. Company does not exist."
        });
      });
    });
  });
});

afterAll(async function () {
  await db.end();
});