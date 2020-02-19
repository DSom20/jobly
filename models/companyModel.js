const db = require("../db");
const ExpressError = require("../expressError");

class Company {
  
  /* 
    Retrieves all companies,
    Returns[{ handle: <comp_handle>, name: <comp_name> }, ...]
  */
  static async getAll() {
    const result = await db.query(`SELECT handle, name FROM companies`)
    return result.rows;
  }

  static async getAllFiltered(filters) {
    if (filters.min_employees && filters.max_employees && filters.min_employees > filters.max_employees) {
      throw new ExpressError("Min_employees cannot be greater than max_employees", 400);
    }

    let whereClauses = [];
    if (filters.search) {
      whereClauses.push(`name LIKE '%${filters.search}%'`);
    }
    if (filters.min_employees) {
      whereClauses.push(`num_employees > filters.min_employees`);
    }
    if (filters.max_employees) {
      whereClauses.push(`num_employees < filters.max_employees`);
    }

    let whereString = whereClauses.join(' AND ');
    if (whereClauses.length > 0) {
      whereString = `WHERE ` + whereString; 
    }

    const result = await db.query(
      `SELECT handle, name
       FROM companies
       ${whereString}`);

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
}

module.exports = Company;