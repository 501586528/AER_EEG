const nutrition = require('../miniprogram/utils/nutrition')

describe('nutrition engine', () => {
  test('bmr male', () => {
    const v = nutrition.bmr({ gender: 'male', weight: 70, height: 175, age: 30 })
    expect(v).toBeGreaterThan(1600)
    expect(v).toBeLessThan(2000)
  })
  test('bmr female', () => {
    const v = nutrition.bmr({ gender: 'female', weight: 55, height: 165, age: 28 })
    expect(v).toBeGreaterThan(1300)
    expect(v).toBeLessThan(1800)
  })
  test('activity multiplier', () => {
    expect(nutrition.activityMultiplier('1-2')).toBeCloseTo(1.375)
    expect(nutrition.activityMultiplier('3-4')).toBeCloseTo(1.55)
    expect(nutrition.activityMultiplier('5+')).toBeCloseTo(1.725)
  })
  test('goal adjust', () => {
    expect(nutrition.adjustByGoals(2000, ['fat_loss'])).toBe(1700)
    expect(nutrition.adjustByGoals(2000, ['muscle_gain'])).toBe(2400)
    expect(nutrition.adjustByGoals(2000, ['fat_loss', 'muscle_gain'])).toBe(2040)
  })
  test('macro split', () => {
    expect(nutrition.macroSplit(['fat_loss']).fat).toBeCloseTo(0.3)
    expect(nutrition.macroSplit(['muscle_gain']).protein).toBeCloseTo(0.25)
    expect(nutrition.macroSplit(['maintain']).carb).toBeCloseTo(0.5)
  })
  test('grams from calories', () => {
    const g = nutrition.gramsFromCalories(2000, { carb: 0.5, protein: 0.3, fat: 0.2 })
    expect(g.carb).toBe(250)
    expect(g.protein).toBe(150)
    expect(g.fat).toBe(44)
  })
  test('calculate target', () => {
    const t = nutrition.calculateTarget({ age: 30, gender: 'male', height: 175, weight: 70, frequency: '3-4', goals: ['fat_loss'] })
    expect(t.totalCalories).toBeGreaterThan(1500)
    expect(t.macroGrams.carb).toBeGreaterThan(100)
  })
  test('gi value bounds', () => {
    expect(nutrition.giValue({ fiber: 100, sugar: 0, fat: 0 })).toBe(0)
    expect(nutrition.giValue({ fiber: 0, sugar: 200, fat: 0 })).toBe(100)
  })
  test('predict glucose curve length', () => {
    const curve = nutrition.predictGlucoseCurve({ fiber: 5, sugar: 10, fat: 5 })
    expect(curve.length).toBe(13)
    expect(curve[0].t).toBe(0)
    expect(curve[curve.length - 1].t).toBe(120)
  })
})