const logger = require('./logger.js')

const passport = require('passport')

const authMiddleware = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err)
    }
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    req.user = user
    return next()
  })(req, res, next)
}

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('path:', request.path)
  logger.info('body:', request.body)
  logger.info('- - -:')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  response.status(error.statusCode).json({
    msg: error.message,
    success: false
  })
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  authMiddleware
}
