const db = require("../db");
const ExpressError = require("../expressError");
const partialUpdate = require("../helpers/partialUpdate");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");


class User {

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]);
    const user = result.rows[0];

    if (user) {
      return (await bcrypt.compare(password, user.password) === true);
    }
    return false;
  }

  /* 
    Retrieves all users,
    Returns[{ username, first_name, last_name, email }, ...]
  */
  static async getAll() {
    const result = await db.query(`SELECT username, first_name, last_name, email FROM users`)
    return result.rows;
  }

  /*
    Creates new user in database. Returns that user object { user }
  */
  static async create({ username, password, first_name, last_name, email, photo_url }) {
    const duplicateCheck = await db.query(
      `SELECT username 
        FROM users 
        WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0]) {
      throw new ExpressError(
        `That username is already taken.'${username}`,
        400
      );
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(`INSERT INTO users (
      username, password, first_name, last_name, email, photo_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING username, password, first_name, last_name, email, photo_url`,
      [username, hashedPassword, first_name, last_name, email, photo_url]);

    return result.rows[0];
  }

  static async getOne(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, email, photo_url
      FROM users
      WHERE username=$1`,
      [username]
    );
    return result.rows[0];
  }

  /*
    Updates a single user with matching username. Updates only the columns that are provided in userData object. 
  */
  static async update(username, userData) {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    }
    const { query, values } = partialUpdate("users", userData, "username", username);
    const result = await db.query(query, values);
    const user = result.rows[0];

    if (!user) {
      throw new ExpressError(`There exists no user '${username}'`, 404);
    }

    delete user.password;
    delete user.is_admin;

    return user;
  }

  /*
    Deletes a single user with matching username from db. Returns object with delete message.
  */
  static async delete(username) {
    const result = await db.query(
      `DELETE FROM users WHERE username=$1 RETURNING username`,
      [username]
    )
    return result.rows[0];
  }
}

module.exports = User;