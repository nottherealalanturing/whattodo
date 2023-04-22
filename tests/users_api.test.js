const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)

const initialUser = {
  name: 'Aaron',
  email: 'aaron@email.com',
  password: 'password'
}

describe('Signup endpoint', () => {
  test('create a new user and return token', async () => {
    const response = await api.post('/api/v1/auth/signup').send(initialUser)
    expect(response.body.token.split(' ')[1]).not.toBeNull()
  })
})

describe('Login endpoint', () => {
  test('should respond with 200 and should return a token on succesful login', async () => {
    const validCredentials = {
      email: 'aaron@email.com',
      password: 'password'
    }

    const response = await api
      .post('/api/v1/auth/signin')
      .send(validCredentials)

    expect(response.status).toBe(200)

    expect(response.body.token.split(' ')[1]).not.toBeNull()
  })

  test('should respond with 401 when given invalid credentials', async () => {
    const invalidCredentials = {
      email: 'user@fake.com',
      password: 'fakepassword'
    }

    const response = await api
      .post('/api/v1/auth/signin')
      .send(invalidCredentials)

    expect(response.status).toBe(401)

    expect(response.body.token).toBeUndefined()
  })
})
