const { ipcMain, dialog, systemPreferences, Menu } = require('electron')
const menubar = require('menubar')
const template = require('./src/menu')
const Hypershare = require('hypershare')
const hs = new Hypershare()

const darkMode = systemPreferences.isDarkMode()

let filePaths = []
let downloadLink = null
let shareLink = null

const mb = menubar({
  height: 1,
  // alwaysOnTop: true,
  transparent: true,
  vibrancy: darkMode ? 'dark' : 'light'
})

mb.on('ready', () => {
  console.log('app is ready')
  Menu.setApplicationMenu(template)
})

mb.on('after-create-window', () => {
  mb.window.loadURL(`file://${__dirname}/src/index.html`)
  // mb.window.webContents.openDevTools({ detach: true })
})

ipcMain.on('hash', (event, hash) => {
  if (downloadLink) return

  downloadLink = hash
  hs.download(downloadLink, mb.app.getPath('downloads')).then(filenames => {
    downloadLink = null
    mb.window.webContents.send('downloaded', filenames)
  }).catch(err => {
    console.error(err)
    downloadLink = null
    mb.window.webContents.send('cancelled-download')
  })
})

ipcMain.on('browse', () => {
  filePaths = dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections']
  })

  if (!filePaths) return

  mb.window.webContents.send('file-paths', filePaths)
})

ipcMain.on('share', () => {
  if (shareLink) return

  hs.share(filePaths).then(link => {
    shareLink = link
    mb.window.webContents.send('share-link', link)
  }).catch(err => {
    console.error(err)
    shareLink = null
    mb.window.webContents.send('cancelled-share')
  })
})

ipcMain.on('window-size', (event, width, height) => {
  mb.window.setSize(width, height, true)
})

ipcMain.on('cancel-download', event => {
  if (downloadLink) {
    hs.close(downloadLink).then(() => {
      mb.window.webContents.send('cancelled-download')
    })
  }
})

ipcMain.on('cancel-share', event => {
  if (shareLink) {
    hs.close(shareLink).then(() => {
      shareLink = null
      mb.window.webContents.send('cancelled-share')
    })
  }
})
