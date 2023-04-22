const mongoose = require('mongoose')
const { User, FriendRequest } = require('../models/v1')

beforeAll(async () => {
  await User.deleteMany({})
  await FriendRequest.deleteMany({})
})

afterAll(async () => {
  await mongoose.connection.close()
})
