function parseDietText(text) {
  const units = [
    { k: ['克','g'], mul: 1 },
    { k: ['千克','公斤','kg'], mul: 1000 },
    { k: ['磅','lb','lbs'], mul: 453.592 },
    { k: ['盎司','oz'], mul: 28.3495 }
  ]
  const items = []
  const tokens = text.split(/[，,。.;\n]/).map(x => x.trim()).filter(Boolean)
  tokens.forEach(t => {
    let grams = 0
    units.forEach(u => {
      u.k.forEach(k => {
        const m = t.match(new RegExp('(\\d+(?:\\.\\d+)?)\s*' + k))
        if (m) grams = Number(m[1]) * u.mul
      })
    })
    items.push({ text: t, grams: grams ? Math.round(grams) : null })
  })
  let calories = 0
  items.forEach(i => { if (i.grams) calories += Math.round(i.grams * 1.5) })
  return { items, calories }
}
module.exports = { parseDietText }