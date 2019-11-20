const superagent = require('superagent')
const btoa = require('btoa')

module.exports = class RequestUtils {
  constructor (starship) {
    this._cache = []
    this.starship = starship
    this._creds = btoa(`${starship._clientID}:${starship._clientSecret}`)
    setInterval(() => {
      this.cache = []
    }, 10 * 60 * 1000)
  }

  async getTokens (code) {
    let data = await this._getTokens(code)
    if (data.error) return null
    data = data.data

    return {
      access: data.access_token,
      refresh: data.refresh_token
    }
  }

  async getUserData (access, refresh) {
    const cacheData = this._cache.filter(a => a.access === access)[0]
    if (cacheData) {
      this.starship.debug(`Data for ${cacheData.data.username} found in cache; returing the cache data...`)
      return { data: cacheData.data }
    }

    let data = await this._getUser(access)
    this.starship.debug(data.data ? `Data for user ${data.data.username} fetched with success.` : 'Failed to fetch user profile using the provided token; trying with the refresh token')
    let newToken
    if (data.error) return null
    data = data.data

    if (data.message && data.code) {
      const tokens = await this.getTokens(refresh)
      if (!tokens) return null
      this.starship.debug('Obtained new credentials with the refresh token')
      newToken = tokens
      access = tokens.access
      const newData = await this._getUser(tokens.access, tokens.refresh)
      if (newData.error) return null
      data = newData.data
    }

    if (this.starship._scopes.includes(a => a === 'guilds')) {
      const guildData = await this._getGuilds(access)
      if (guildData.error) data.guilds = []
      else data.guilds = guildData.data
    }

    if (this.starship._filter) {
      data = await this.starship._filter(data)
    }

    this._cache.push({ data, access })

    return {
      data,
      newToken
    }
  }

  _getGuilds (access) {
    return superagent
      .get('https://discordapp.com/api/users/@me/guilds')
      .ok(res => res.status === 429 || res.status === 200)
      .set('Authorization', `Bearer ${access}`)
      .then((res) => {
        console.log(res.body)
        return this._handleSuccess(res.body, this._getGuilds, access)
      }).catch((error) => {
        return this._handleError(error)
      })
  }

  _getUser (access) {
    return superagent
      .get('https://discordapp.com/api/users/@me')
      .ok(res => res.status <= 403 || res.status === 429 || res.status === 200)
      .set('Authorization', `Bearer ${access}`)
      .then((res) => {
        console.log(res.body)
        return this._handleSuccess(res.body, this._getUser, access)
      }).catch((error) => {
        return this._handleError(error)
      })
  }

  _getTokens (code) {
    return superagent
      .post(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${this.starship._redirectURL}`)
      .ok(res => res.status === 429 || res.status === 200)
      .set('Authorization', `Basic ${this._creds}`)
      .then((res) => {
        console.log(res.body)
        return this._handleSuccess(res.body, this._getTokens, code)
      }).catch((error) => {
        return this._handleError(error)
      })
  }

  async _handleSuccess (data, fun, access) {
    return new Promise((resolve) => {
      if (data.message === 'You are being rate limited.') {
        setTimeout(async () => {
          resolve(fun(access))
        }, data.retry_after)
      } else {
        resolve({
          error: false,
          _stack: null,
          rateLimited: null,
          data: data,
          retryAfter: null
        })
      }
    })
  }

  _handleError (data) {
    this._showError(data)
    return {
      error: true,
      _stack: data,
      data: null,
      rateLimited: false
    }
  }

  _showError (error) {
    console.log(`[Starship] An error was caught while trying to create a request.\n[Starship] This is probably a Discord issue.\n[Starship] Error data: ${error.response.status} - ${error.response.text}\n[Starship] Error message: ${error.stack}`)
  }
}
