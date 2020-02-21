const db = require("../db");
const ExpressError = require("../expressError");
const partialUpdate = require("../helpers/partialUpdate");
const Job = require("./jobModel");


class Company {

  /* 
    Retrieves all companies,
    Returns[{ handle: <comp_handle>, name: <comp_name> }, ...]
  */
  static async getAll() {
    const result = await db.query(`SELECT handle, name FROM companies`)
    return result.rows;
  }
 
  // accepts an object with search, min_employees, and/or max_employees keys
  static async getAllFiltered(data) {
    let baseQuery = `SELECT handle, name FROM companies`;
    let whereExpressions = [];
    let queryValues = [];

    if (+data.min_employees >= +data.max_employees) {
      throw new ExpressError(
        "Min employees must be less than max employees",
        400
      );
    }

    // For each possible search term, add to whereExpressions and
    // queryValues so we can generate the right SQL

    if (data.min_employees) {
      queryValues.push(+data.min_employees);
      whereExpressions.push(`num_employees >= $${queryValues.length}`);
    }

    if (data.max_employees) {
      queryValues.push(+data.max_employees);
      whereExpressions.push(`num_employees <= $${queryValues.length}`);
    }

    if (data.search) {
      queryValues.push(`%${data.search}%`);
      whereExpressions.push(`name ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      baseQuery += " WHERE ";
    }

    // Finalize query and return results

    let finalQuery =
      baseQuery + whereExpressions.join(" AND ") + " ORDER BY name";
    const companiesRes = await db.query(finalQuery, queryValues);
    return companiesRes.rows;
  }

  static async create({ handle, name, num_employees, description, logo_url }) {
    const result = await db.query(`INSERT INTO companies (
      handle,
      name,
      num_employees,
      description,
      logo_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING handle, name, num_employees, description, logo_url`,
      [handle, name, num_employees, description, logo_url]);

    return result.rows[0];
  }

  static async getOne(handle) {
    const result = await db.query(
      `SELECT handle, name, num_employees, description, logo_url
      FROM companies
      WHERE handle=$1`,
      [handle]
    );
    const companyData = result.rows[0];
    if (!companyData) {
      return null;
    }
    const jobs = await Job.getJobsFromCompany(handle);
    return {...companyData, ...jobs};
  }

  /*
    Updates a single company with matching handle. Updates only the columns that are provided in companyData object. 
  */
  static async update(handle, companyData) {
    const { query, values } = partialUpdate("companies", companyData, "handle", handle);
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /*
    Deletes a single company with matching handle from db. Returns object with
    that company's name.
  */
  static async delete(handle) {
    const result = await db.query(
      `DELETE FROM companies WHERE handle=$1 RETURNING name`,
      [handle]
    )
    return result.rows[0];
  }
}

module.exports = Company;