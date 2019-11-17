const authRouter = require('./routers/authRouter')
const JWTUtils = require('./utils/JWTUtils')
const RequestUtils = require('./utils/RequestUtils')

module.exports = class Starship {
  constructor (options, filter) {
    if (typeof (options.redirectURL) !== 'string') {
      throw new TypeError('Missing redirect URL, or redirect URL isn\'t a string.')
    }
    this._redirectURL = encodeURIComponent(options.redirectURL)

    if (typeof (options.websiteURL) !== 'string') {
      throw new TypeError('Missing website URL, or website URL isn\'t a string.')
    }
    this._websiteURL = options.websiteURL

    if (typeof (options.clientID) !== 'string') {
      throw new TypeError('Missing client ID or client ID isn\'t a string.')
    }
    this._clientID = options.clientID

    if (!Array.isArray(options.scopes)) {
      throw new TypeError('Missing OAuth scopes, or scopes isn\'t an array.')
    }
    this._scopes = options.scopes
    this._authURL = `https://discordapp.com/api/oauth2/authorize?client_id=${options.clientID}&redirect_uri=${encodeURIComponent(options.redirectURL)}&response_type=code&scope=${options.scopes.join('%20')}`

    if (typeof (options.clientSecret) !== 'string') {
      throw new TypeError('Missing client secret, or client secret isn\'t a string.')
    }
    this._clientSecret = options.clientSecret

    this._filter = filter
    this._secret = options.secret || 'you know i got a bellyache'
  }

  use (app) {
    this.app = app
    this.jwt = new JWTUtils(this)
    this._requestUtils = new RequestUtils(this)
    this.app.use(this._expressMiddleware())
    this._registerRoutes(app)
  }

  _expressMiddleware () {
    const { jwt, _requestUtils } = this
    return (req, res, next) => {
      const data = jwt.decode(req.query.token || req.body.token)
      req.isAuthenticated = Boolean((data || {}).access)
      req.user = req.isAuthenticated ? _requestUtils.getUserData(data.access, data.refresh) : null

      next()
    }
  }

  _registerRoutes (app) {
    app.use('/auth', authRouter(this))
  }
}
