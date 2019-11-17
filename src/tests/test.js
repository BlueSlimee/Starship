const express = require('express')
const { Starship } = require('../')

const app = express()
app.use(express.json())

const starship = new Starship({
  clientSecret: 'kwhsoshsoakaj',
  clientID: '12892739174917397',
  redirectURL: 'https://blueslimee.codes/auth/callback',
  websiteURL: 'https://blueslimee.codes',
  scopes: ['identify', 'guilds', 'email'],
  secret: 'JWT secret. You should never send this to anyone!'
})

starship.use(app)

app.get('/test', (req, res) => {
  if (req.isAuthenticated) {
    res.json({ authenticated: 'yes!! :)' })
  } else {
    res.json({ authenticated: 'no... :(' })
  }
})

app.listen(3000, () => console.log('Yay, the website is online!'))
