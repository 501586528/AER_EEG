const db = [
  { name: '米饭', caloriesPer100g: 116 },
  { name: '面包', caloriesPer100g: 265 },
  { name: '牛奶', caloriesPer100g: 60 },
  { name: '鸡胸肉', caloriesPer100g: 165 },
  { name: '苹果', caloriesPer100g: 52 },
  { name: '香蕉', caloriesPer100g: 89 }
]
function queryFood(name) {
  const n = (name || '').toLowerCase()
  return db.filter(x => x.name.toLowerCase().includes(n))
}
module.exports = { queryFood }