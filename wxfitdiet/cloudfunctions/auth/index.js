exports.main = async (event, context) => {
  const user = { id: Date.now(), role: 'user' }
  return { user }
}