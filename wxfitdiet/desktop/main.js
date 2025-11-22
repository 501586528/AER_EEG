const { app, BrowserWindow, ipcMain, Tray, Menu, shell, nativeImage } = require('electron')
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
  try {
    const iconPath = process.platform === 'win32'
      ? path.join(__dirname, 'app', 'icon.ico')
      : path.join(__dirname, 'app', 'icon.png')
    const icon = fs.existsSync(iconPath) ? iconPath : nativeImage.createEmpty()
    tray = new Tray(icon)
    const menu = Menu.buildFromTemplate([
      { label: '显示', click: () => win.show() },
      { label: '隐藏', click: () => win.hide() },
      { label: '退出', click: () => app.quit() }
    ])
    tray.setToolTip('WxFitDiet')
    tray.setContextMenu(menu)
  } catch (e) {
    tray = null
  }
  ;(async () => {
    const cfg = loadLlmConfig()
    if (!cfg.api_key) { console.error('LLM FAIL no_api_key'); return }
    try {
      const base = new URL(cfg.base_url)
      const pathName = base.pathname.replace(/\/$/, '') + '/chat/completions'
      const urlObj = new URL(base.origin + pathName)
      const payload = { model: 'deepseek-chat', messages: [{ role: 'user', content: 'ping' }] }
      const r = await reqJson(urlObj, payload, { Authorization: `Bearer ${cfg.api_key}` }, cfg.timeout_ms)
      if (r.status === 200) console.log('LLM OK', r.status)
      else console.error('LLM FAIL', r.status)
    } catch (e) {
      console.error('LLM FAIL', e && e.message ? e.message : 'error')
    }
  })()
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
function readYaml(p) {
  if (!fs.existsSync(p)) return null
  const raw = fs.readFileSync(p, 'utf-8')
  const out = {}
  raw.split(/\r?\n/).forEach(line => {
    const s = line.trim()
    if (!s || s.startsWith('#')) return
    const i = s.indexOf(':')
    if (i <= 0) return
    const k = s.slice(0, i).trim()
    let v = s.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('\'') && v.endsWith('\''))) v = v.slice(1, -1)
    out[k] = v.replace(/\$\{([A-Z0-9_]+)\}/g, (_, n) => process.env[n] || '')
  })
  return out
}
function loadLlmConfig() {
  const p = path.resolve(__dirname, '../server/data/config.yaml')
  const y = readYaml(p) || {}
  const base_url = y.base_url || process.env.LLM_API_URL || 'https://api.deepseek.com/v1'
  const api_key = y.api_key || process.env.LLM_API_KEY || ''
  const timeout_ms = Number(y.timeout_ms || process.env.LLM_TIMEOUT_MS || 30000)
  return { base_url, api_key, timeout_ms }
}
function ensureDir(...parts) {
  const dir = path.join(...parts)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}
function writeJsonFile(dir, base, obj) {
  const ts = new Date()
  const pad = n => n.toString().padStart(2, '0')
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`
  const idxPath = path.join(dir, `${base}-index.json`)
  let v = 1
  if (fs.existsSync(idxPath)) { try { const idx = JSON.parse(fs.readFileSync(idxPath, 'utf-8')); v = Number(idx.version || 0) + 1 } catch {} }
  fs.writeFileSync(idxPath, JSON.stringify({ version: v, ts: Date.now() }))
  const file = path.join(dir, `${base}-${stamp}-v${v}.json`)
  fs.writeFileSync(file, JSON.stringify({ version: v, timestamp: stamp, data: obj }, null, 2))
  return file
}
function toCsv(obj) {
  const rows = []
  function push(k, v) { rows.push(`${JSON.stringify(k)},${JSON.stringify(v)}`) }
  if (obj.summary) push('summary', obj.summary)
  if (obj.nutrients) Object.keys(obj.nutrients).forEach(k => push(`nutrients.${k}`, obj.nutrients[k]))
  if (Array.isArray(obj.evaluation)) obj.evaluation.forEach((x, i) => push(`evaluation[${i}]`, x))
  if (Array.isArray(obj.recommendations)) obj.recommendations.forEach((x, i) => push(`recommendations[${i}]`, x))
  return rows.join('\n')
}
function reqJson(urlObj, body, headers, timeout) {
  return new Promise((resolve, reject) => {
    const lib = urlObj.protocol === 'https:' ? require('https') : require('http')
    const req = lib.request({
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers }
    }, res => {
      let buf = ''
      res.on('data', d => { buf += d })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: buf ? JSON.parse(buf) : {} }) } catch { resolve({ status: res.statusCode, text: buf }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(timeout, () => { req.destroy(new Error('timeout')) })
    req.write(JSON.stringify(body || {}))
    req.end()
  })
}
ipcMain.handle('llm:analyze', async (e, args) => {
  const cfg = loadLlmConfig()
  if (!cfg.api_key) return { error: 'no_api_key' }
  const base = new URL(cfg.base_url)
  const pathName = base.pathname.replace(/\/$/, '') + '/chat/completions'
  const urlObj = new URL(base.origin + pathName)
  const payload = { model: 'deepseek-chat', messages: [{ role: 'user', content: args && args.prompt ? args.prompt : '请分析' }] }
  const r = await reqJson(urlObj, payload, { Authorization: `Bearer ${cfg.api_key}` }, cfg.timeout_ms)
  if (r.status !== 200) return { error: 'request_failed', status: r.status, body: r.json || r.text }
  const choices = r.json && r.json.choices ? r.json.choices : []
  const content = choices[0] && choices[0].message && choices[0].message.content ? choices[0].message.content : ''
  let result = null
  try { result = JSON.parse(content) } catch { result = { summary: content } }
  return { result }
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
ipcMain.handle('analysis:save', async (e, payload) => {
  const dir = ensureDir(app.getPath('userData'), 'analysis')
  const file = writeJsonFile(dir, 'analysis', payload)
  const csv = toCsv(payload.result || payload)
  fs.writeFileSync(file.replace(/\.json$/, '.csv'), csv)
  return { file }
})
function getStorageItem(key) {
  const data = readJson('storage.json')
  const found = data.find(x => x.key === key)
  return found ? found.value : null
}
function validatePlanAgainstProfile(plan, profile) {
  const allergies = (profile && profile.allergies) ? [].concat(profile.allergies) : []
  let avoided = true
  const week = (plan && plan.week) || []
  week.forEach(d => {
    ['breakfast', 'lunch', 'dinner'].forEach(m => {
      const ing = (((d || {}).meals || {})[m] || {}).ingredients || []
      ing.forEach(item => { allergies.forEach(a => { if (String(item).includes(a)) avoided = false }) })
    })
  })
  return { avoidedAllergens: avoided }
}
ipcMain.handle('llm:plan', async (e, args) => {
  const cfg = loadLlmConfig()
  if (!cfg.api_key) return { error: 'no_api_key' }
  const base = new URL(cfg.base_url)
  const pathName = base.pathname.replace(/\/$/, '') + '/chat/completions'
  const urlObj = new URL(base.origin + pathName)
  const payload = { model: 'deepseek-chat', messages: [{ role: 'user', content: args && args.prompt ? args.prompt : '生成周计划' }] }
  const r = await reqJson(urlObj, payload, { Authorization: `Bearer ${cfg.api_key}` }, cfg.timeout_ms)
  if (r.status !== 200) return { error: 'request_failed', status: r.status, body: r.json || r.text }
  const choices = r.json && r.json.choices ? r.json.choices : []
  const content = choices[0] && choices[0].message && choices[0].message.content ? choices[0].message.content : ''
  let plan = null
  try { plan = JSON.parse(content) } catch { plan = { summary: content } }
  const profile = getStorageItem('user_profile') || {}
  const validation = validatePlanAgainstProfile(plan, profile)
  return { plan, validation }
})
ipcMain.handle('plan:save', async (e, payload) => {
  const dir = ensureDir(app.getPath('userData'), 'plans')
  const file = writeJsonFile(dir, 'plan', payload)
  return { file }
})