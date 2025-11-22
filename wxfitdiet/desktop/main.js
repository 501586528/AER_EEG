const { app, BrowserWindow, ipcMain, Tray, Menu, shell } = require('electron')
const path = require('path')
const fs = require('fs')
let win
let tray
function createWindow() {
  win = new BrowserWindow({ width: 1080, height: 720, webPreferences: { preload: path.join(__dirname, 'preload.js') } })
  win.loadFile(path.join(__dirname, 'app/index.html'))
}
function ensureDataFile(name) {
  const dir = app.getPath('userData')
  const p = path.join(dir, name)
  if (!fs.existsSync(p)) fs.writeFileSync(p, '[]')
  return p
}
function readJson(name) {
  const p = ensureDataFile(name)
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}
function writeJson(name, data) {
  const p = ensureDataFile(name)
  fs.writeFileSync(p, JSON.stringify(data))
}
app.whenReady().then(() => {
  createWindow()
  tray = new Tray(process.platform === 'win32' ? path.join(__dirname, 'app/icon.ico') : path.join(__dirname, 'app/icon.png'))
  const menu = Menu.buildFromTemplate([
    { label: '显示', click: () => win.show() },
    { label: '隐藏', click: () => win.hide() },
    { label: '退出', click: () => app.quit() }
  ])
  tray.setToolTip('WxFitDiet')
  tray.setContextMenu(menu)
})
ipcMain.handle('auth', async () => {
  return { user: { id: Date.now(), role: 'user' } }
})
ipcMain.handle('dietSearch', async (e, args) => {
  if (args && args.preset) {
    const items = Array.from({ length: 10 }).map((_, i) => ({ id: i + 1, name: `常见菜品${i + 1}`, calories: 100 + i * 10 }))
    return { items }
  }
  const q = (args && args.q) || ''
  const items = q ? [{ id: Date.now(), name: q, calories: 200 }] : []
  return { items }
})
ipcMain.handle('visionRecog', async () => {
  return { text: '识别结果' }
})
ipcMain.handle('recommend', async (e, args) => {
  const n = Number(args && args.n ? args.n : 3)
  const plans = Array.from({ length: n }).map((_, i) => ({ id: i + 1, title: `方案${i + 1}`, level: ['易', '中', '难'][i % 3], effect: ['低', '中', '高'][i % 3] }))
  return { plans }
})
ipcMain.handle('share', async () => {
  return { url: 'data:image/png;base64,' }
})
ipcMain.handle('export', async (e, args) => {
  const type = (args && args.type) || 'excel'
  const dir = app.getPath('downloads')
  const file = path.join(dir, type === 'excel' ? 'report.xlsx' : 'report.pdf')
  fs.writeFileSync(file, '')
  shell.showItemInFolder(file)
  return { url: file }
})
ipcMain.handle('pdf:export', async () => {
  const w = BrowserWindow.getFocusedWindow() || win
  if (!w) return { error: 'no_window' }
  const pdf = await w.webContents.printToPDF({ pageSize: 'A4' })
  const file = path.join(app.getPath('downloads'), `analysis_${Date.now()}.pdf`)
  fs.writeFileSync(file, pdf)
  shell.showItemInFolder(file)
  return { url: file }
})
ipcMain.handle('file:store', async (e, args) => {
  const src = args && args.path
  if (!src) return { error: 'no_path' }
  const ext = path.extname(src) || '.bin'
  const dir = path.join(app.getPath('userData'), 'diet')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const dst = path.join(dir, `${id}${ext}`)
  fs.copyFileSync(src, dst)
  return { storedPath: dst }
})
ipcMain.handle('storage:get', async (e, key) => {
  const data = readJson('storage.json')
  const found = data.find(x => x.key === key)
  return found ? found.value : null
})
ipcMain.handle('storage:set', async (e, key, value) => {
  const data = readJson('storage.json')
  const idx = data.findIndex(x => x.key === key)
  if (idx >= 0) data[idx].value = value
  else data.push({ key, value })
  writeJson('storage.json', data)
  return true
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})