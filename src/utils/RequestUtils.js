const fetch = require('node-fetch')
const btoa = require('btoa')

module.exports = class RequestUtils {
  constructor (starship) {
    this.starship = starship
    this._cache = []
    this.cred = btoa(`${starship._clientID}:${starship._clientSecret}`)

    setInterval(() => {
      this._cache = []
    }, 15 * 60 * 1000)
  }

  async getUserData (access, refresh) {
    if (this._cache.filter(a => a.access === access)[0]) {
      return { data: this._cache.filter(a => a.access === access)[0].data }
    }

    const d = await this._getUserData(access)

    if (d.error && d.error.status === 401 && refresh) {
      const newAccess = await this._getData(refresh)
      if (newAccess.error || !newAccess.access_token) return null
      const userData = await this._getUserData(newAccess)
      this._cache.push({ data: userData, access: newAccess })
      return { newToken: this.starship.jwt.encode(newAccess.access_token, newAccess.refresh_token), data: userData }
    } else if (d.error && !refresh) {
      return null
    }

    this._cache.push({ data: d, access: access })
    return { data: d }
  }

  async _getUserData (access) {
    return fetch('https://discordapp.com/api/users/@me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access}`
      }
    }).then(r => r.json()).then(async (d) => {
      d.guilds = this.starship.scopes.filter(a => a === 'guilds')[0] ? await this._getUserGuilds(access) : null
      return d
    }).catch(error => {
      return { error }
    })
  }

  async _getUserGuilds (access) {
    return fetch('https://discordapp.com/api/users/@me/guilds', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access}`
      }
    }).then(r => r.json()).catch(error => {
      console.log(`[Starship] An unexpected error was caught when trying to fetch the user's guilds.\n[Starship] This is probably a issue with Discord.\n[Starship] Error message: ${error.message}`)
      return null
    })
  }

  _getData (code) {
    return fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${this.starship._redirectURL}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.cred}`
      }
    }).then(r => r.json()).catch(error => {
      return { error }
    })
  }
}
