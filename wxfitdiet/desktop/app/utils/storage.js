export function asyncSet(key, value) {
  return new Promise((resolve, reject) => {
    const s = JSON.stringify(value)
    if (s.length > 1024 * 1024) { reject('超过1MB限制'); return }
    setTimeout(() => { localStorage.setItem(key, s); resolve(true) }, 0)
  })
}
export function asyncGet(key) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const v = localStorage.getItem(key)
      resolve(v ? JSON.parse(v) : null)
    }, 0)
  })
}
export async function pushDoc(key, doc) {
  const s = typeof doc === 'string' ? doc : JSON.stringify(doc)
  if (s.length > 1024 * 1024) throw '超过1MB限制'
  const arr = (await asyncGet(key)) || []
  arr.unshift({ ts: Date.now(), text: typeof doc === 'string' ? doc : s })
  return asyncSet(key, arr)
}
export async function cleanup() {
  const last = await asyncGet('cache_last_cleanup')
  const now = Date.now()
  if (last && now - last < 24 * 3600 * 1000) return true
  const arr = (await asyncGet('rag_docs_diet')) || []
  const pruned = arr.filter(x => now - x.ts < 90 * 24 * 3600 * 1000)
  await asyncSet('rag_docs_diet', pruned)
  await asyncSet('cache_last_cleanup', now)
  return true
}
export function startCleanup() {
  setInterval(() => { cleanup() }, 3600 * 1000)
}

export async function addDietRecord(rec) {
  const s = JSON.stringify(rec)
  if (s.length > 1024 * 1024) throw '超过1MB限制'
  const list = (await asyncGet('diet_records')) || []
  list.unshift(rec)
  return asyncSet('diet_records', list)
}
export async function getDietRecords() {
  const list = (await asyncGet('diet_records')) || []
  const toTs = t => {
    if (!t) return 0
    const iso = t.replace(' ', 'T')
    const d = new Date(iso)
    return d.getTime() || 0
  }
  return list.sort((a,b) => toTs(b.time) - toTs(a.time))
}
export async function updateDietRecord(id, patch) {
  const list = (await asyncGet('diet_records')) || []
  const idx = list.findIndex(x => x.id === id)
  if (idx >= 0) { list[idx] = { ...list[idx], ...patch } }
  return asyncSet('diet_records', list)
}