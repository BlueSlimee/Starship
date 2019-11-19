const express = require('express')
const router = express.Router()

module.exports = (starship) => {
  router.get('/', (req, res) => res.redirect(starship._authURL))

  router.get('/callback', async (req, res) => {
    if (!req.query.code) return res.status(400).json({ error: true, message: 'No code provided!', code: 0 })
    const d = await starship._requestUtils.getTokens(req.query.code)
    if (!d) return res.redirect(`${starship._websiteURL}?code=4`)
    return res.redirect(`${starship._websiteURL}?token=${starship.jwt.encode(d.access, d.refresh)}`)
  })

  router.get('/info', async (req, res) => {
    const token = req.query.token
    if (!token) return res.status(400).json({ error: true, message: 'No token provided!', code: 1 })

    const tokenData = await starship.jwt.decode(token)
    if (!tokenData) return res.status(401).json({ error: true, message: 'A invalid token was provided!', code: 2 })

    const userData = await starship._requestUtils.getUserData(tokenData.access, tokenData.refresh)
    if (!userData) return res.status(401).json({ error: true, message: 'All tokens are invalid!', code: 3 })
    starship.debug(`Obtained info for ${userData.data.username}!`)

    res.json({ error: false, data: userData.data, newToken: userData.newToken })
  })
  return router
}
