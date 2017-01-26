const { h, render } = require('preact')

require('register-jsx')({ factory: 'h' })

const App = require('./components/app')

window.onload = () => {
  render(h(App), document.body)
}
