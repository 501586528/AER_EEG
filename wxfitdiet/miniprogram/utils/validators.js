function inRange(n, min, max) {
  return typeof n === 'number' && !isNaN(n) && n >= min && n <= max
}

function validateProfile(p) {
  if (!inRange(p.age, 18, 80)) return { ok: false, message: '年龄18-80岁' }
  if (p.gender !== 'male' && p.gender !== 'female') return { ok: false, message: '请选择性别' }
  if (!inRange(p.height, 100, 250)) return { ok: false, message: '身高100-250cm' }
  if (!inRange(p.weight, 30, 200)) return { ok: false, message: '体重30-200kg' }
  if (!p.freqLabel) return { ok: false, message: '请选择运动频率' }
  if (!Array.isArray(p.goals) || p.goals.length === 0) return { ok: false, message: '请选择健康目标' }
  if (p.goals.includes('special')) {
    if (p.fastingGlucose && isNaN(Number(p.fastingGlucose))) return { ok: false, message: '空腹血糖需为数字' }
    if (p.postprandialGlucose && isNaN(Number(p.postprandialGlucose))) return { ok: false, message: '餐后血糖需为数字' }
    if (p.sbp && isNaN(Number(p.sbp))) return { ok: false, message: '收缩压需为数字' }
    if (p.dbp && isNaN(Number(p.dbp))) return { ok: false, message: '舒张压需为数字' }
    if (!p.growthStage && p.gender && p.age && p.age < 18) return { ok: false, message: '请选择生长阶段' }
  }
  return { ok: true }
}

function mapFreqLabel(label) {
  if (label === '每周1-2次') return '1-2'
  if (label === '每周3-4次') return '3-4'
  if (label === '每周5次以上') return '5+'
  return '1-2'
}

module.exports = { validateProfile, mapFreqLabel }