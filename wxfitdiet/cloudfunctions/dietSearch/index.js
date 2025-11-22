exports.main = async (event, context) => {
  if (event.preset) {
    const items = Array.from({ length: 10 }).map((_, i) => ({ id: i + 1, name: `常见菜品${i + 1}`, calories: 100 + i * 10 }))
    return { items }
  }
  const q = event.q || ''
  const items = q ? [{ id: 1, name: q, calories: 200 }] : []
  return { items }
}