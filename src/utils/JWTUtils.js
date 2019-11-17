const jwt = require('jsonwebtoken')

module.exports = class JWTUtils {
  constructor (starship) {
    this.starship = starship
  }

  decode (token) {
    let rst
    try {
      rst = jwt.verify(token, this.starship._secret)
    } catch (e) {
      rst = null
    }
    return rst
  }

  encode (access, refresh) {
    return jwt.sign({ access: access, refresh: refresh }, this.starship._secret)
  }
}
