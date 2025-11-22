const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const base = path.join(__dirname, '../data')
const dietFile = path.join(base, 'diet_records.json')
const profileFile = path.join(base, 'profile.json')
const cacheDir = path.join(base, 'analysis_cache')
const prefFile = path.join(base, 'preferences.json')

function ensure() { fs.mkdirSync(base, { recursive: true }); fs.mkdirSync(cacheDir, { recursive: true }) }
function key() { return process.env.WXFD_SECRET || '' }
function enc(data) {
  const k = key()
  if (!k) return Buffer.from(JSON.stringify(data))
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', crypto.createHash('sha256').update(k).digest(), iv)
  const enc = Buffer.concat([c.update(JSON.stringify(data)), c.final()])
  const tag = c.getAuthTag()
  return Buffer.concat([Buffer.from('G'), iv, tag, enc])
}
function dec(buf) {
  if (!buf || !buf.length) return null
  if (buf[0] !== 71) return JSON.parse(buf.toString('utf-8'))
  const k = key()
  if (!k) return null
  const iv = buf.slice(1, 13)
  const tag = buf.slice(13, 29)
  const data = buf.slice(29)
  const d = crypto.createDecipheriv('aes-256-gcm', crypto.createHash('sha256').update(k).digest(), iv)
  d.setAuthTag(tag)
  const out = Buffer.concat([d.update(data), d.final()])
  return JSON.parse(out.toString('utf-8'))
}
async function saveRecord(rec) {
  ensure()
  const raw = fs.existsSync(dietFile) ? fs.readFileSync(dietFile) : null
  const list = raw ? (dec(raw) || []) : []
  list.unshift(rec)
  const buf = enc(list)
  fs.writeFileSync(dietFile, buf)
  const bdir = path.join(base, 'backups')
  fs.mkdirSync(bdir, { recursive: true })
  fs.writeFileSync(path.join(bdir, `diet_${Date.now()}.json`), buf)
}
async function listRecords() {
  ensure()
  if (!fs.existsSync(dietFile)) return []
  const raw = fs.readFileSync(dietFile)
  const list = dec(raw)
  return Array.isArray(list) ? list.sort((a,b) => new Date(b.time.replace(' ','T')) - new Date(a.time.replace(' ','T'))) : []
}
async function saveProfile(p) {
  ensure()
  fs.writeFileSync(profileFile, JSON.stringify({ ...p, ts: Date.now() }))
}
async function getProfile() {
  ensure()
  if (!fs.existsSync(profileFile)) return {}
  return JSON.parse(fs.readFileSync(profileFile, 'utf-8'))
}
async function saveAnalysisCache(key, data) {
  ensure()
  fs.writeFileSync(path.join(cacheDir, `${key}.json`), JSON.stringify({ data, ts: Date.now() }))
}
async function getAnalysisCache(key) {
  ensure()
  const p = path.join(cacheDir, `${key}.json`)
  if (!fs.existsSync(p)) return null
  const o = JSON.parse(fs.readFileSync(p, 'utf-8'))
  return o.data
}
async function savePreferences(prefs) {
  ensure()
  fs.writeFileSync(prefFile, JSON.stringify({ data: prefs, ts: Date.now() }))
}
async function getPreferences() {
  ensure()
  if (!fs.existsSync(prefFile)) return null
  return JSON.parse(fs.readFileSync(prefFile, 'utf-8')).data
}
module.exports = { saveRecord, listRecords, saveProfile, getProfile, saveAnalysisCache, getAnalysisCache, savePreferences, getPreferences }