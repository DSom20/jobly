const db = require("../db");
const ExpressError = require("../expressError");
const partialUpdate = require("../helpers/partialUpdate");


class Company {
  
  /* 
    Retrieves all companies,
    Returns[{ handle: <comp_handle>, name: <comp_name> }, ...]
  */
  static async getAll() {
    const result = await db.query(`SELECT handle, name FROM companies`)
    return result.rows;
  }
  //REFACTOR 
  // accepts an object with search, min_employees, and/or max_employees keys
  static async getAllFiltered(filters) {
    const { search, min_employees, max_employees } = filters;
    if (min_employees > max_employees) {
      throw new ExpressError("Min_employees cannot be greater than max_employees", 400);
    }

    let whereClauses = [];
    let values = [];
    let idx = 1;

    for (let queryParam in filters) {
      if (queryParam === "search") {
        whereClauses.push(`name LIKE $${idx}`);
        values.push(`%${filters[queryParam]}%`);
      } else if (queryParam === "min_employees") {
        whereClauses.push(`num_employees > $${idx}`);
        values.push(filters[queryParam]);
      } else if (queryParam === "max_employees") {
        whereClauses.push(`num_employees < $${idx}`);
        values.push(filters[queryParam]);
      }
      idx++;
    }

    let whereString = whereClauses.join(' AND ');
    if (whereClauses.length > 0) {
      whereString = `WHERE ` + whereString; 
    }

    const result = await db.query(
      `SELECT handle, name
       FROM companies
       ${whereString}`,
       values);

    return result.rows;
  }

  static async create({handle, name, num_employees, description, logo_url}) {
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
    return result.rows[0];
  }

  /*
    Updates a single company with matching handle. Updates only the columns that are provided in compData object. 
  */
  static async update(handle, compData) {
    const { query, values } = partialUpdate("companies", compData, "handle", handle);
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