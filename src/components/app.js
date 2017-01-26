const { remote, ipcRenderer, clipboard } = require('electron')
const { app } = remote.require('electron')
const { h, render, Component } = require('preact')

function refreshSize () {
  const width = window.outerWidth
  const height = document.querySelector('body').clientHeight + 11

  ipcRenderer.send('window-size', width, height)
}

module.exports = class App extends Component {
  constructor () {
    super()

    this.state = {
      shareLink: null,
      filePaths: [],
      downloadLink: '',
      downloaded: false,
      shared: false,
      downloading: false,
      sharing: false
    }
  }

  componentDidMount () {
    refreshSize()

    ipcRenderer.on('file-paths', (event, filePaths) => {
      this.setState({ filePaths })
    })

    ipcRenderer.on('share-link', (event, shareLink) => {
      this.setState({ shareLink, sharing: true })
      clipboard.writeText(shareLink)
    })

    ipcRenderer.on('downloaded', (event, filePaths) => {
      this.setState({ downloading: false, downloadLink: '' })

      new Notification('Hypershare', {
        title: 'Hypershare',
        body: `Saved items to Downloads!`
      })
    })

    ipcRenderer.on('cancelled-download', () => {
      this.setState({ downloading: false, downloadLink: '' })
    })

    ipcRenderer.on('cancelled-share', () => {
      this.setState({ sharing: false, shareLink: '', filePaths: [] })
    })
  }

  componentDidUpdate () {
    if (!this.state.downloading && this.state.downloadLink === '') {
      this.downloadField.value = ''
    }

    refreshSize()
  }

  render () {
    return <div>
      <div className='header'>
        <h1>Hypershare</h1>
        <a href='#' title='Quit' onClick={event => app.quit()}>👋</a>
      </div>
      <div className='share-container'>
        {this.state.filePaths.length > 0 && !this.state.shareLink
          ? <ul>
            {this.state.filePaths.map(filePath => <li>{filePath}</li>)}
          </ul>
        : {}}

        {this.state.shareLink ? <h4>{this.state.shareLink}</h4> : {}}

        <button
          onClick={event => {
            if (this.state.shareLink) {
              ipcRenderer.send('cancel-share')
              return
            }

            if (this.state.filePaths.length > 0) {
              ipcRenderer.send('share')
              this.setState({ sharing: true })
            } else {
              ipcRenderer.send('browse')
            }
          }}>{
            this.state.shareLink ? 'Cancel Sharing (Link Copied To Clipboard)'
          : this.state.sharing ? ['Generating Link ', <span>⏳</span>]
          : this.state.filePaths.length > 0 ? ['Share ', <span>📡</span>]
          : ['Browse ', <span>🔎</span>]
        }</button>
      </div>
      <div className='download-container'>
        {
          this.state.downloading ? <h4>{this.state.downloadLink}</h4>
          : <input
            id='download-field'
            type='text'
            placeholder='Enter link'
            ref={input => { this.downloadField = input }}
            onChange={event => {
              setTimeout(() => {
                const downloadLink = this.downloadField.value
                this.setState({ downloadLink })
              }, 1)
            }}
            onKeyUp={event => {
              setTimeout(() => {
                const downloadLink = this.downloadField.value
                this.setState({ downloadLink })
              }, 1)
            }} />
        }
        {this.state.downloadLink.length > 0
          ? <button
            onClick={event => {
              if (this.state.downloading) {
                ipcRenderer.send('cancel-download')
              } else {
                ipcRenderer.send('hash', this.downloadField.value)
                this.setState({ downloading: true })
              }
            }}>
            {this.state.downloading ? ['Cancel Download ', <span>⏳</span>]
              : ['Download ', <span>💾</span>]}
          </button> : {}}
      </div>
    </div>
  }
}
