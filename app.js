const express = require('express')
const database = require('./utils/database')
const middleware = require('./utils/middleware')
const cors = require('cors')
const {
  usersRouter,
  groupsRouter,
  tasksRouter,
  commentsRouter
} = require('./controllers/v1')
const passport = require('passport')
const app = express()
require('express-async-errors')

database()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(middleware.requestLogger)

require('./utils/auth')(passport)

app.use(passport.initialize())

app.use('/api/v1/auth', usersRouter)
app.use('/api/v1/groups', groupsRouter)
app.use('/api/v1/tasks', tasksRouter)
app.use('/api/v1/comments', commentsRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
