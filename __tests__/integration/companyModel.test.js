const db = require("../../db.js");
const Company = require("../../models/companyModel");
const ExpressError = require("../../expressError");

process.env.NODE_ENV === "test";

describe("Test Company class", function () {

  let testCompanyA;
  let testCompanyB;
  let testCompanyC;

  beforeEach(async function () {
    await db.query("DELETE FROM companies");

    testCompanyA = await Company.create({
      handle: "test_company_a",
      name: "Test Company ABC",
      num_employees: 100
    });

    testCompanyB = await Company.create({
      handle: "test_company_b",
      name: "Test Company XYZ",
      num_employees: 50
    });

    testCompanyC = await Company.create({
      handle: "test_company_c",
      name: "Test Company CCC",
      num_employees: 75
    });

  });

  describe("Company.getAll()", function () {
    test('can get list of all companies', async function () {
      let companies = await Company.getAll();

      expect(companies).toHaveLength(3);
    });
  });

  describe("Company.create()", function () {
    test('can create new company', async function () {
      let company = await Company.create({
        handle: "test_company1",
        name: "Test Company1",
        num_employees: 100
      });

      expect(company).toEqual({
        handle: "test_company1",
        name: "Test Company1",
        num_employees: 100,
        description: null,
        logo_url: null
      });

      expect(await Company.getAll()).toHaveLength(4);
    });
  })

  describe("Company.getAllFiltered()", function () {
    test('can return filtered companies with search query', async function () {
      let companies = await Company.getAllFiltered({ search: "ABC" })

      expect(companies).toEqual([{
        handle: testCompanyA.handle,
        name: testCompanyA.name
      }]);
    });

    test('can return filtered companies with min employees', async function () {
      let companies = await Company.getAllFiltered({ min_employees: 55 })

      expect(companies).toEqual([{
        handle: testCompanyA.handle,
        name: testCompanyA.name
      },
      {
        handle: testCompanyC.handle,
        name: testCompanyC.name
      }]);
    });

    test('can return filtered companies with max employees', async function () {
      let companies = await Company.getAllFiltered({ max_employees: 55 })

      expect(companies).toEqual([{
        handle: testCompanyB.handle,
        name: testCompanyB.name
      }]);
    });

    test('can return filtered companies with min and max employees', async function () {
      let companies = await Company.getAllFiltered({ min_employees: 55, max_employees: 90 })

      expect(companies).toEqual([{
        handle: testCompanyC.handle,
        name: testCompanyC.name
      }]);
    });

    test('returns error for min_employees greater than max_employees', async function () {
      try {
        await Company.getAllFiltered({ min_employees: 90, max_employees: 55 })
      } catch (err) {
        expect(err).toBeInstanceOf(ExpressError);
      }
    });
  });

  describe("Company.getOne()", function () {
    test('can get valid company', async function () {
      let company = await Company.getOne(testCompanyC.handle);
      expect(company).toEqual(testCompanyC);
    })
  });

  describe("Company.update()", function () {
    test('can update a company', async function () {
      testCompanyC.num_employees = 200;

      let company = await Company.update(testCompanyC.handle, { num_employees: 200 });
      expect(company).toEqual(testCompanyC);

      let getCompany = await Company.getOne(testCompanyC.handle);
      expect(getCompany).toEqual(testCompanyC);
      expect(getCompany.num_employees).toEqual(200);
    })
  })

  describe("Company.delete()", function() {
    test('can delete a company', async function () {
      let company = await Company.delete(testCompanyC.handle);
      expect(company).toEqual({ name: testCompanyC.name });

      let getCompany = await Company.getOne(testCompanyC.handle);
      expect(getCompany).toEqual(undefined);
    });
  });
});

afterAll(async function () {
  await db.end();
});