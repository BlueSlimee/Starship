const fetch = require('node-fetch')
const btoa = require('btoa')

module.exports = class RequestUtils {
  constructor (starship) {
    this.cache = []
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
      access: data.access,
      refresh: data.refresh
    }
  }

  async getUserData (access, refresh) {
    const cacheData = this.starship._cache.filter(a => a.access === access)
    if (cacheData) return cacheData

    let data = await this._getUser(access)
    let newToken
    if (data.error) return null
    data = data.data

    if (data.message) {
      const tokens = await this.getTokens(refresh)
      if (tokens.error) return null
      newToken = tokens
      access = tokens.access_token
      const newData = await this._getUser(tokens.access, tokens.refresh)
      if (newData.error) return null
      data = newData.data
    }

    if (this.starship.scopes.includes(a => a === 'guilds')) {
      data.guilds = await this._getGuilds(access)
    }
    if (this.starship._filter) data = this.starship._filter(data)
    this._cache.push({ data, access })
    
    return {
      data: data,
      newToken
    }
  }

  _getGuilds (access) {
    return fetch('https://discordapp.com/api/users/@me/guilds', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access}`
      }
    }).then(r => r.json()).then((data) => {
      return this._handleSuccess(data, this._getGuilds, access)
    }).catch((error) => {
      return this._handleError(error)
    })
  }

  _getUser (access) {
    return fetch('https://discordapp.com/api/users/@me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access}`
      }
    }).then(r => r.json()).then((data) => {
      return this._handleSuccess(data, this._getUser, access)
    }).catch((error) => {
      return this._handleError(error)
    })
  }

  _getTokens (code) {
    return fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${this.starship._redirectURL}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.creds}`
      }
    }).then(r => r.json()).then((data) => {
      return this._handleSuccess(data, this._getTokens, code)
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
      _stack: error,
      data: null,
      rateLimited: false
    }
  }
  
  _showError (error) {
    console.log(`[Starship] An error was caught while trying to create a request.\n[Starship] This is probably a Discord issue.\n[Starship] Error message: ${error.message}`)
  }
}
