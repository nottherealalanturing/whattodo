const passport = require('passport')
const passportJWT = require('passport-jwt')
const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt
const jwt = require('jsonwebtoken')
const { User } = require('../models/v1')

const jwtOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}

const jwtStrategy = new JWTStrategy(jwtOptions, async (jwtPayload, done) => {
  try {
    const user = await User.findById(jwtPayload.sub)
    if (!user) {
      return done(null, false)
    }
    return done(null, user)
  } catch (error) {
    return done(error, false)
  }
})

passport.use(jwtStrategy)

const generateToken = (user) => {
  const payload = {
    sub: user._id,
    iat: Date.now()
  }
  const options = {
    expiresIn: '1d',
    issuer: process.env.JWT_ISSUER
  }

  const signedToken = jwt.sign(payload, process.env.JWT_SECRET, options)

  return {
    token: 'Bearer ' + signedToken.token,
    expires: signedToken.expiresIn
  }
}

module.exports = { passport, generateToken }
