class LRU {
  constructor(limit = 500) {
    this.limit = limit
    this.map = new Map()
  }
  get(key) {
    if (!this.map.has(key)) return null
    const val = this.map.get(key)
    this.map.delete(key)
    this.map.set(key, val)
    return val
  }
  set(key, val) {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, val)
    if (this.map.size > this.limit) {
      const first = this.map.keys().next().value
      this.map.delete(first)
    }
  }
}

function cacheRecord(record) {
  const lru = new LRU(1000)
  const now = Date.now()
  const key = 'diet_cache'
  const list = wx.getStorageSync(key) || []
  const pruned = list.filter(x => now - x.ts < 90 * 24 * 3600 * 1000)
  pruned.forEach(x => lru.set(`${x.id}`, x))
  lru.set(`${record.id}`, { ...record, ts: now })
  const out = Array.from(lru.map.values())
  wx.setStorageSync(key, out)
}

module.exports = { LRU, cacheRecord }