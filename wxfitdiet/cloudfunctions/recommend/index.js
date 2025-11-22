const { isAllowed } = require('../common/rbac')
exports.main = async (event, context) => {
  const role = (event.role || 'user')
  if (!isAllowed(role, 'create')) return { error: 'forbidden' }
  const n = Number(event.n || 3)
  const plans = Array.from({ length: n }).map((_, i) => ({ id: i + 1, title: `方案${i + 1}`, level: ['易', '中', '难'][i % 3], effect: ['低', '中', '高'][i % 3] }))
  return { plans }
}