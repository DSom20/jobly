const request = require("supertest");
const app = require("../../app");
const db = require("../../db.js");
const User = require("../../models/userModel");
const ExpressError = require("../../expressError");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../../config");


process.env.NODE_ENV === "test";

describe("User Routes Test", function () {

  let testUserA;
  let testUserB;
  let testUserC;

  beforeEach(async function () {
    await db.query("DELETE FROM users");

    testUserA = await User.create({
      username: 'test_user1',
      password: 'secret',
      first_name: 'Test',
      last_name: 'SampleA',
      email: "example1@example.com"
    });

    testUserB = await User.create({
      username: 'test_user2',
      password: 'secret',
      first_name: 'Test',
      last_name: 'SampleB',
      email: "example2@example.com"
    });

    testUserC = await User.create({
      username: 'test_user3',
      password: 'secret',
      first_name: 'Test',
      last_name: 'SampleC',
      email: "example3@example.com"
    });
  });

  describe('GET /', function () {
    test('gets list of all users', async function () {
      let response = await request(app).get('/users');

      expect(response.statusCode).toEqual(200);
      expect(response.body.users).toHaveLength(3);
    });
  });

  describe('POST /', function () {
    test('creates new user for valid data supplied', async function () {
      let plainTextPassword = 'test_password';

      let response = await request(app).post('/users')
        .send({
          username: 'test_user',
          password: plainTextPassword,
          first_name: 'Test',
          last_name: 'Sample',
          email: "example@example.com"
        });

   
      expect(await bcrypt.compare(plainTextPassword, response.body.user.password)).toEqual(true);

      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({
        user: {
          username: 'test_user',
          password: expect.any(String),
          first_name: 'Test',
          last_name: 'Sample',
          email: "example@example.com",
          photo_url: null
        }
      });

      let response2 = await request(app).get('/users');
      expect(response2.body.users).toHaveLength(4);
    });

    test('returns 400 error for invalid data supplied -- no username', async function () {
      let response = await request(app).post('/users')
        .send({
          password: 'secret',
          first_name: 'Test',
          last_name: 'Sample',
          email: "example@example.com"
        });

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        "status": 400,
        "message": [
          "instance requires property \"username\""
        ]
      });

      let response2 = await request(app).get('/users');
      expect(response2.body.users).toHaveLength(3);
    });
  });

  describe('GET /users/:username', function () {
    test('gets one valid user from username supplied', async function () {
      let response = await request(app).get(`/users/${testUserA.username}`);

      expect(response.statusCode).toEqual(200);
      
      delete testUserA.password;
      expect(response.body).toEqual({user: { ...testUserA }});
    });

    test('returns 404 error for invalid username', async function () {
      let response = await request(app).get(`/users/fake_username`);

      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        "status": 404,
        "message": "Page not found. User does not exist."
      });
    });
  });

  describe('PATCH /users/:username', function () {
    test('updates valid user from username supplied', async function () {
      let response = await request(app).patch(`/users/${testUserA.username}`)
        .send({
          email: "example99@example.com"
        });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        user: {
          username: 'test_user1',
          first_name: 'Test',
          last_name: 'SampleA',
          email: "example99@example.com",
          photo_url: null
        }
      });

      let response2 = await request(app).get(`/users/${testUserA.username}`);

      expect(response2.body).toEqual({
        user: {
          username: 'test_user1',
          first_name: 'Test',
          last_name: 'SampleA',
          email: "example99@example.com",
          photo_url: null
        }
      });
    });

    test('returns 404 error for invalid user username', async function () {
      let response = await request(app).patch(`/users/fake_username`)
        .send({
          email: "example99@example.com"
        });

      expect(response.statusCode).toEqual(404);
      expect(response.body).toEqual({
        "status": 404,
        "message": "There exists no user 'fake_username'"
      });
    });

    test('returns 400 error for invalid user with invalid update data', async function () {
      let response = await request(app).patch(`/users/fake_username`)
        .send({
          email: "wrong data type"
        });

      expect(response.statusCode).toEqual(400);
      expect(response.body).toEqual({
        "status": 400,
        "message": [
          "instance.email does not conform to the \"email\" format"
        ]
      });
    });

    describe('DELETE /users/:username', function () {
      test('deletes user from username supplied', async function () {
        let response = await request(app).delete(`/users/${testUserA.username}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
          message: `${testUserA.username} deleted.`
        });
      });

      test('returns 404 for invalid user', async function () {
        let response = await request(app).delete('/users/fake_username');

        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({
          "status": 404,
          "message": "Page not found. User does not exist."
        });
      });
    });
  });
});

afterAll(async function () {
  await db.end();
});