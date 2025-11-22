const http = require('http')
const url = require('url')
const crypto = require('crypto')
const { loadConfig, setApiUrl, setApiKey, setConfigPath, startWatch } = require('./src/config')
const { parseDietText } = require('./src/parser')
const { queryFood } = require('./src/fooddb')
const { saveRecord, listRecords, saveProfile, getProfile, saveAnalysisCache, getAnalysisCache } = require('./src/storage')
const { buildAnalysisTemplate, generateAnalysis, buildRecommend, scoreAndSort, visualizePlans } = require('./src/analysis')
const { logInfo, logError } = require('./src/logger')

const RATE = {}
function rateLimit(ip) {
  const now = Date.now()
  const rec = RATE[ip] || { t: now, c: 0 }
  if (now - rec.t > 1000) { rec.t = now; rec.c = 0 }
  rec.c += 1
  RATE[ip] = rec
  return rec.c <= 20
}
function writeJson(res, code, data) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.end(JSON.stringify(data))
}
function readBody(req, res) {
  return new Promise((resolve, reject) => {
    let size = 0
    const limit = 1024 * 1024
    let buf = ''
    req.on('data', chunk => {
      size += chunk.length
      if (size > limit) { reject(new Error('payload_too_large')); req.destroy() }
      else buf += chunk.toString('utf-8')
    })
    req.on('end', () => {
      try { resolve(buf ? JSON.parse(buf) : {}) } catch (e) { reject(new Error('invalid_json')) }
    })
  })
}
function hash(obj) { return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex') }

const arg = (process.argv || []).find(x => x.startsWith('--config='))
if (arg) setConfigPath(arg.split('=')[1])
startWatch()
loadConfig()
const server = http.createServer(async (req, res) => {
  const ip = req.socket.remoteAddress || 'local'
  if (!rateLimit(ip)) return writeJson(res, 429, { error: 'too_many_requests' })
  const parsed = url.parse(req.url, true)
  try {
    if (req.method === 'GET' && parsed.pathname === '/config/get') {
      return writeJson(res, 200, loadConfig())
    }
    if (req.method === 'POST' && parsed.pathname === '/config/set') {
      const body = await readBody(req, res)
      const ok = setApiUrl(body.apiUrl)
      return writeJson(res, ok ? 200 : 400, ok ? loadConfig() : { error: 'invalid_url' })
    }
    if (req.method === 'POST' && parsed.pathname === '/config/setKey') {
      const body = await readBody(req, res)
      const ok = setApiKey(body.apiKey)
      return writeJson(res, ok ? 200 : 400, ok ? { ok: true } : { error: 'invalid_key' })
    }
    if (req.method === 'POST' && parsed.pathname === '/diet/parse') {
      const body = await readBody(req, res)
      const result = parseDietText(body.text || '')
      return writeJson(res, 200, { items: result.items, calories: result.calories })
    }
    if (req.method === 'GET' && parsed.pathname === '/diet/query') {
      const name = parsed.query.name || ''
      return writeJson(res, 200, { items: queryFood(name) })
    }
    if (req.method === 'POST' && parsed.pathname === '/diet/record') {
      const body = await readBody(req, res)
      const rec = body.record
      if (!rec || !rec.id || !rec.time) return writeJson(res, 400, { error: 'invalid_record' })
      await saveRecord(rec)
      return writeJson(res, 200, { ok: true })
    }
    if (req.method === 'GET' && parsed.pathname === '/diet/list') {
      return writeJson(res, 200, { records: await listRecords() })
    }
    if (req.method === 'POST' && parsed.pathname === '/profile/set') {
      const body = await readBody(req, res)
      await saveProfile(body.profile || {})
      return writeJson(res, 200, { ok: true })
    }
    if (req.method === 'GET' && parsed.pathname === '/profile/get') {
      return writeJson(res, 200, { profile: await getProfile() })
    }
    if (req.method === 'POST' && parsed.pathname === '/analysis/run') {
      const body = await readBody(req, res)
      const records = await listRecords()
      const template = buildAnalysisTemplate(records)
      const key = hash(template)
      const cached = await getAnalysisCache(key)
      if (cached) return writeJson(res, 200, { cached: true, result: cached })
      const result = generateAnalysis(records)
      await saveAnalysisCache(key, result)
      return writeJson(res, 200, { cached: false, result })
    }
    if (req.method === 'GET' && parsed.pathname === '/analysis/cache') {
      const key = parsed.query.key || ''
      const r = await getAnalysisCache(key)
      return writeJson(res, r ? 200 : 404, r ? { result: r } : { error: 'not_found' })
    }
    if (req.method === 'POST' && parsed.pathname === '/recommend/generate') {
      const body = await readBody(req, res)
      const profile = await getProfile()
      const records = await listRecords()
      const analysisKey = body.analysisKey || hash(buildAnalysisTemplate(records))
      const analysis = await getAnalysisCache(analysisKey)
      const plans = buildRecommend({ records, analysis, profile })
      const scored = scoreAndSort(plans)
      const viz = visualizePlans(scored)
      return writeJson(res, 200, { plans: scored, viz })
    }
    writeJson(res, 404, { error: 'not_found' })
  } catch (e) {
    logError(e.message || 'error')
    writeJson(res, 500, { error: 'server_error' })
  }
})

if (require.main === module) {
  const port = process.env.PORT || 8787
  server.listen(port, () => { logInfo(`server:${port}`) })
}

module.exports = { server }