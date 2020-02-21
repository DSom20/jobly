const db = require("../db");
const ExpressError = require("../expressError");
const partialUpdate = require("../helpers/partialUpdate");

class Job {

  static async create({ id, title, salary, equity, company_handle, date_posted }) {
    const result = await db.query(`INSERT INTO jobs
      (title,
      salary,
      equity,
      company_handle)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, salary, equity, company_handle, date_posted`,
      [title, salary, equity, company_handle]);

    return result.rows[0];
  }

  static async getAll() {
    const result = await db.query(`SELECT title, company_handle
      FROM jobs
      ORDER BY date_posted DESC`);
    return result.rows;
  }

  static async getAllFiltered(data) {
    let baseQuery = `SELECT title, company_handle FROM jobs`;
    let whereExpressions = [];
    let queryValues = [];

    // For each possible search term, add to whereExpressions and
    // queryValues so we can generate the right SQL

    if (data.min_salary) {
      queryValues.push(+data.min_salary);
      whereExpressions.push(`salary >= $${queryValues.length}`);
    }

    if (data.min_equity) {
      queryValues.push(+data.min_equity);
      whereExpressions.push(`equity >= $${queryValues.length}`);
    }

    if (data.search) {
      queryValues.push(`%${data.search}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      baseQuery += " WHERE ";
    }

    // Finalize query and return results

    let finalQuery =
      baseQuery + whereExpressions.join(" AND ") + " ORDER BY title";
    const jobsRes = await db.query(finalQuery, queryValues);
    return jobsRes.rows;
  }

  static async getOne(id) {
    const jobsResponse = await db.query(
      `SELECT id, title, salary, equity, company_handle, date_posted
      FROM jobs
      WHERE id=$1`, [id]);
    
    const job = jobsResponse.rows[0];

    if (!job) {
      throw new ExpressError("Page not found. Job does not exist.", 404);
    }

    const companiesResponse = await db.query(
      `SELECT name, num_employees, description, logo_url, handle
        FROM companies 
        WHERE handle = $1`,
      [job.company_handle]
    );
  
    job.company = companiesResponse.rows[0];
    return job;
  }

  static async getJobsFromCompany(companyHandle) {
    const jobsResult = await db.query(
      `SELECT id, title, salary, equity, company_handle, date_posted
      FROM jobs
      WHERE company_handle=$1`,
      [companyHandle]
    );
    return {jobs: jobsResult.rows};
  }

  static async update(id, jobData) {
    const { query, values } = partialUpdate("jobs", jobData, "id", id);
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      `DELETE FROM jobs WHERE id=$1 RETURNING title`,
      [id]
    )
    return result.rows[0];
  }

}

module.exports = Job;