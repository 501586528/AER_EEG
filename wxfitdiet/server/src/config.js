const fs = require('fs')
const path = require('path')
let CONFIG_PATH = path.join(__dirname, '../data/config.yaml')
let CONFIG_CACHE = null
function setConfigPath(p) {
  if (typeof p === 'string' && p.length > 0) CONFIG_PATH = path.isAbsolute(p) ? p : path.join(process.cwd(), p)
}
function interpolate(v) {
  if (typeof v !== 'string') return v
  return v.replace(/\$\{([A-Z0-9_]+)\}/g, (_, k) => process.env[k] || '')
}
function parseYaml(raw) {
  const out = {}
  const lines = raw.split(/\r?\n/)
  lines.forEach(line => {
    const s = line.trim()
    if (!s || s.startsWith('#')) return
    const idx = s.indexOf(':')
    if (idx <= 0) return
    const key = s.slice(0, idx).trim()
    let val = s.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) val = val.slice(1, -1)
    if (/^\d+$/.test(val)) val = Number(val)
    out[key] = interpolate(val)
  })
  return out
}
function parseJsonWithComments(raw) {
  const cleaned = raw.split(/\r?\n/).filter(l => !l.trim().startsWith('//')).join('\n')
  const obj = JSON.parse(cleaned)
  Object.keys(obj).forEach(k => { obj[k] = interpolate(obj[k]) })
  return obj
}
function readFileConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
  if (CONFIG_PATH.endsWith('.yaml') || CONFIG_PATH.endsWith('.yml')) return parseYaml(raw)
  return parseJsonWithComments(raw)
}
function validateUrl(u) {
  try { const o = new URL(u); return ['http:', 'https:'].includes(o.protocol) } catch { return false }
}
function validateKey(k) {
  if (typeof k !== 'string') return false
  if (!k) return false
  return k.length >= 8
}
function validate(cfg) {
  if (!validateUrl(cfg.base_url)) return { ok: false, message: 'invalid base_url' }
  if (!validateKey(cfg.api_key)) return { ok: false, message: 'invalid api_key' }
  if (typeof cfg.timeout_ms !== 'number' || cfg.timeout_ms <= 0) return { ok: false, message: 'invalid timeout_ms' }
  if (typeof cfg.max_retries !== 'number' || cfg.max_retries < 0) return { ok: false, message: 'invalid max_retries' }
  if (!['debug','info','warn','error'].includes(cfg.log_level)) return { ok: false, message: 'invalid log_level' }
  return { ok: true }
}
function loadConfig() {
  const def = {
    base_url: process.env.LLM_API_URL || 'https://api.deepseek.com/v1',
    api_key: process.env.LLM_API_KEY || '',
    timeout_ms: Number(process.env.LLM_TIMEOUT_MS || 30000),
    max_retries: Number(process.env.LLM_MAX_RETRIES || 3),
    log_level: process.env.LLM_LOG_LEVEL || 'info'
  }
  const fileCfg = readFileConfig() || {}
  const merged = { ...def, ...fileCfg }
  const v = validate(merged)
  CONFIG_CACHE = v.ok ? merged : def
  return CONFIG_CACHE
}
function writeCfg(next) {
  const dir = path.dirname(CONFIG_PATH)
  fs.mkdirSync(dir, { recursive: true })
  if (CONFIG_PATH.endsWith('.yaml') || CONFIG_PATH.endsWith('.yml')) {
    const lines = [
      `base_url: "${next.base_url}"`,
      `api_key: "${next.api_key}"`,
      `timeout_ms: ${next.timeout_ms}`,
      `max_retries: ${next.max_retries}`,
      `log_level: ${next.log_level}`
    ]
    fs.writeFileSync(CONFIG_PATH, lines.join('\n'))
  } else {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2))
  }
}
function setApiUrl(u) {
  if (!validateUrl(u)) return false
  const cur = loadConfig()
  const next = { ...cur, base_url: u }
  writeCfg(next)
  CONFIG_CACHE = next
  return true
}
function setApiKey(k) {
  if (!validateKey(k)) return false
  const cur = loadConfig()
  const next = { ...cur, api_key: k }
  writeCfg(next)
  CONFIG_CACHE = next
  return true
}
function startWatch() {
  try {
    fs.watchFile(CONFIG_PATH, { interval: 1000 }, () => { loadConfig() })
  } catch {}
}
module.exports = { loadConfig, setApiUrl, setApiKey, setConfigPath, startWatch }