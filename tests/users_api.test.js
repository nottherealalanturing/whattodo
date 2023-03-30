const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const { User } = require('../models/v1');
const { generateToken } = require('../utils/auth');

const api = supertest(app);

const initialUser = {
  name: 'Aaron',
  email: 'aaron@email.com',
  password: 'password',
};

/* const user = await new User({
  name: 'test',
  email: 'test@email.com',
  password: 'password',
});
 */
/* jest.mock('passport', () => {
  return {
    authenticate: jest.fn(() => (req, res, next) => {
      req.user = { _id: 'testUserId' };
      next();
    }),
  };
}); */

jest.mock('passport');

beforeAll(async () => {
  await User.deleteMany({});
});

describe('Signup endpoint', () => {
  test('create a new user and return token', async () => {
    const response = await api.post('/api/v1/auth/signup').send(initialUser);

    expect(response.body.token.split(' ')[1]).not.toBeNull();
  });
});

describe('Login endpoint', () => {
  test('should respond with 200 and should return a token on succesful login', async () => {
    const validCredentials = {
      email: 'aaron@email.com',
      password: 'password',
    };

    const response = await api
      .post('/api/v1/auth/signin')
      .send(validCredentials);

    expect(response.status).toBe(200);

    expect(response.body.token.split(' ')[1]).not.toBeNull();
  });

  test('should respond with 401 when given invalid credentials', async () => {
    const invalidCredentials = {
      email: 'user@fake.com',
      password: 'fakepassword',
    };

    const response = await api
      .post('/api/v1/auth/signin')
      .send(invalidCredentials);

    expect(response.status).toBe(401);

    expect(response.body.token).toBeUndefined();
  });
});
/* 
describe('Friend endpoint', () => {
  test('send a friend request to a user', async () => {
    const friend = await User.findOne({ email: 'test@email.com' });

    const authToken = generateToken(friend);

    const friendId = friend._id;
    const response = await api
      .post('/api/v1/auth/friends')
      .set('Authorization', authToken)
      .send({ friendId });

    console.log(response);
  });
}); */

describe('POST /friends', () => {
  test('Should send a friend request', async () => {
    const user = {
      id: 'user-id-1',
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'password123',
    };

    const friend = {
      id: 'user-id-2',
      name: 'Jane Doe',
      email: 'janedoe@example.com',
      password: 'password456',
    };

    passport.authenticate.mockImplementation(() => (req, res, next) => {
      req.user = { id: '123' };
      next();
    });

    // Register user and friend
    const registeredUser = await api.post('/api/v1/auth/signup').send(user);
    const registeredFriend = await api.post('/api/v1/auth/signup').send(friend);

    // Authenticate user and send friend request
    const response = await api
      .post('/friends')
      .send({ friendId: registeredFriend.body.user._id })
      .set('Authorization', `${generateToken(registeredUser).token}`);

    // Assert response status code and message
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Friend request sent');
  });
});
afterAll(async () => {
  await mongoose.connection.close();
});
