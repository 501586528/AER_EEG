function isAllowed(role, action) {
  const rules = {
    user: ['read', 'create'],
    nutritionist: ['read', 'create', 'approve'],
    admin: ['read', 'create', 'approve', 'manage']
  }
  const list = rules[role] || []
  return list.includes(action)
}

module.exports = { isAllowed }