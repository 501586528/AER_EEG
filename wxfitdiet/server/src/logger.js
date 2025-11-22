const fs = require('fs')
const path = require('path')
const logFile = path.join(__dirname, '../data/server.log')
function log(level, msg) {
  const line = `${new Date().toISOString()} ${level} ${msg}\n`
  process.stdout.write(line)
  try { fs.appendFileSync(logFile, line) } catch {}
}
function logInfo(m) { log('INFO', m) }
function logError(m) { log('ERROR', m) }
module.exports = { logInfo, logError }