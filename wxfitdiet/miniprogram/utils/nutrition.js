function bmr({ gender, weight, height, age }) {
  if (gender === 'male') return 13.397 * weight + 4.799 * height - 5.677 * age + 88.362
  return 9.247 * weight + 3.098 * height - 4.33 * age + 447.593
}

function activityMultiplier(freq) {
  if (freq === '1-2') return 1.375
  if (freq === '3-4') return 1.55
  return 1.725
}

function adjustByGoals(total, goals) {
  let t = total
  if (goals.includes('fat_loss')) t = t * 0.85
  if (goals.includes('muscle_gain')) t = t * 1.2
  return Math.round(t)
}

function macroSplit(goals) {
  if (goals.includes('fat_loss')) return { carb: 0.4, protein: 0.3, fat: 0.3 }
  if (goals.includes('muscle_gain')) return { carb: 0.5, protein: 0.25, fat: 0.25 }
  return { carb: 0.5, protein: 0.2, fat: 0.3 }
}

function gramsFromCalories(total, split) {
  const carb = Math.round((total * split.carb) / 4)
  const protein = Math.round((total * split.protein) / 4)
  const fat = Math.round((total * split.fat) / 9)
  return { carb, protein, fat }
}

function calculateTarget({ age, gender, height, weight, frequency, goals }) {
  const base = bmr({ gender, weight, height, age })
  const total = base * activityMultiplier(frequency)
  const adjusted = adjustByGoals(total, goals)
  const split = macroSplit(goals)
  const grams = gramsFromCalories(adjusted, split)
  return { totalCalories: adjusted, macroRatio: split, macroGrams: grams }
}

function giValue(meal) {
  const base = 50
  const fiber = meal.fiber || 0
  const sugar = meal.sugar || 0
  const fat = meal.fat || 0
  let gi = base + sugar * 0.5 - fiber * 0.8 - fat * 0.2
  if (gi < 0) gi = 0
  if (gi > 100) gi = 100
  return Math.round(gi)
}

function predictGlucoseCurve(meal) {
  const gi = giValue(meal)
  const points = []
  for (let t = 0; t <= 120; t += 10) {
    const v = Math.round(80 + gi * Math.exp(-t / 60))
    points.push({ t, v })
  }
  return points
}

module.exports = { bmr, activityMultiplier, adjustByGoals, macroSplit, gramsFromCalories, calculateTarget, giValue, predictGlucoseCurve }