const db = require("../../db.js");
const Company = require("../../models/companyModel");

process.env.NODE_ENV === "test";

describe("Test Company class", function () {

  beforeEach(async function () {
    await db.query("DELETE FROM companies");
  });

  test('can create new company', async function () {
    let company = await Company.create({
      handle: "test_company",
      name: "Test Company",
      num_employees: 100
    });

    expect(company).toEqual({
      handle: "test_company",
      name: "Test Company",
      num_employees: 100,
      description: null,
      logo_url: null
    });

    expect(await Company.getAll()).toHaveLength(1);

  });
});

afterAll(async function () {
  await db.end();
});