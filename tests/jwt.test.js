const JWTUtils = require('../src/utils/JWTUtils')
const jwtUtils = new JWTUtils({ _secret: 'testing' }) // This is a fake Starship instance;  using a real one is overkill

test('tests if library can sign jwt tokens', () => {
  expect(jwtUtils.encode('fake access', 'fake refresh')).toBeDefined()
})

// test token for the next test
const token = jwtUtils.encode('yay', 'yoy')

test('tests if library can verify jwt token', () => {
  expect(jwtUtils.decode(token).access).toBe('yay')
})

test('tests if library will return null to invalid tokens', () => {
  expect(jwtUtils.decode('random string')).toBeNull()
})
