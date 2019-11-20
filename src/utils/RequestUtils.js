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
      this.starship.debug(`Trying to fetch guilds for ${data.username}...`)
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
    this.starship.debug('Trying to fetch the user's guilds...')
    return superagent
      .get('https://discordapp.com/api/users/@me/guilds')
      .ok(res => res.status === 429 || res.status === 200)
      .set('Authorization', `Bearer ${access}`)
      .then((res) => {
        this.starship.debug(`Successfully fetched user\'s guilds. (${res.body})`)
        return this._handleSuccess(res.body, 'guilds', access)
      }).catch((error) => {
        this.starship.debug(`Failed to fetch user's guilds. (${error.response.body})`)
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
        return this._handleSuccess(res.body, 'user', access)
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
        return this._handleSuccess(res.body, 'tokens', code)
      }).catch((error) => {
        return this._handleError(error)
      })
  }

  async _handleSuccess (data, funName, access) {
    return new Promise((resolve) => {
      if (data.message.startsWith('You are being') && data.code === 0) {
        let fun
        // I know this is HELLA dumb but I don't want to use switch/case statments so idk
        if (funName === 'tokens') fun = this._getTokens
        else if (funName === 'user') fun = this._getUser
        else if (funName === 'guilds') fun = this._getGuilds
        
        this.starship.debug(`Yay, rate limit. Retrying the request after ${data.retry_after}ms.`) 
        setTimeout(() => {
          this.starship.debug('Retrying the request...')
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
