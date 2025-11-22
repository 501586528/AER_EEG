export function bmr({ gender, weight, height, age }) {
  if (gender === 'male') return 13.397 * weight + 4.799 * height - 5.677 * age + 88.362
  return 9.247 * weight + 3.098 * height - 4.33 * age + 447.593
}
export function activityMultiplier(freq) {
  if (freq === '1-2') return 1.375
  if (freq === '3-4') return 1.55
  return 1.725
}
export function adjustByGoals(total, goals) {
  let t = total
  if (goals.includes('fat_loss')) t = t * 0.85
  if (goals.includes('muscle_gain')) t = t * 1.2
  return Math.round(t)
}
export function macroSplit(goals) {
  if (goals.includes('fat_loss')) return { carb: 0.4, protein: 0.3, fat: 0.3 }
  if (goals.includes('muscle_gain')) return { carb: 0.5, protein: 0.25, fat: 0.25 }
  return { carb: 0.5, protein: 0.2, fat: 0.3 }
}
export function gramsFromCalories(total, split) {
  const carb = Math.round((total * split.carb) / 4)
  const protein = Math.round((total * split.protein) / 4)
  const fat = Math.round((total * split.fat) / 9)
  return { carb, protein, fat }
}
export function calculateTarget({ age, gender, height, weight, frequency, goals }) {
  const base = bmr({ gender, weight, height, age })
  const total = base * activityMultiplier(frequency)
  const adjusted = adjustByGoals(total, goals)
  const split = macroSplit(goals)
  const grams = gramsFromCalories(adjusted, split)
  return { totalCalories: adjusted, macroRatio: split, macroGrams: grams }
}