export function inRange(n, min, max) {
  return typeof n === 'number' && !isNaN(n) && n >= min && n <= max
}
export function validateProfile(p) {
  if (!inRange(p.age, 18, 99)) return { ok: false, message: '年龄需在18-99之间' }
  if (!['male','female','other'].includes(p.gender)) return { ok: false, message: '请选择性别' }
  if (!inRange(p.height, 100, 250)) return { ok: false, message: '身高需在100-250cm' }
  if (!inRange(p.weight, 30, 200)) return { ok: false, message: '体重需在30-200kg' }
  if (!p.goal) return { ok: false, message: '请选择健康目标' }
  return { ok: true }
}
export function mapGoalToArray(goal) {
  if (!goal) return []
  return [goal]
}