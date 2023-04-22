const supertest = require('supertest')
const app = require('../app')
const { User, FriendRequest } = require('../models/v1')

const api = supertest(app)

describe('Friends endpoint', () => {
  test.only('should respond with 200 and send a friend request', async () => {
    const requester = await User.create({
      name: 'Requester',
      email: 'requester@example.com',
      password: 'password'
    })

    const recipient = await User.create({
      name: 'Recipient',
      email: 'recipient@example.com',
      password: 'password'
    })

    const friendRequest = await FriendRequest.create({
      requester: requester._id,
      recipient: recipient._id,
      status: 'pending'
    })

    const res = await api.post('/api/v1/auth/signin').send({
      email: 'requester@example.com',
      password: 'password'
    })

    const token = res.body.token
    console.log(res)
  })
})
