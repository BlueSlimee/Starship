const RequestUtils = require('../src/utils/RequestUtils')
const requestUtils = new RequestUtils({ _scopes: ['identify', 'guilds'] }) // We just want to check if there's any error so we don't need to pass a actual Starship instance

test('tests if getUserData and its dependencies are working properly', () => {
  expect(requestUtils.getUserData('a')).toBeNull()
})
