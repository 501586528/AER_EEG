function render(template, vars) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k]
    if (v == null) return ''
    if (typeof v === 'object') return JSON.stringify(v, null, 2)
    return String(v)
  })
}
export function buildAnalysisPrompt({ records, profile, timeframe }) {
  const data = {
    timeframe: timeframe || '最近记录',
    profile: profile || {},
    records: records.map(r => ({ time: r.time, text: r.text, calories: r.calories || 0 }))
  }
  const template = [
    '请根据以下饮食记录数据进行分析',
    '你是一名专业营养师，请基于以下用户饮食记录进行分析：',
    '{{ data }}',
    '分析要求：',
    '1. 计算总热量摄入及三大营养素比例',
    '2. 评估膳食结构是否均衡（谷物/蔬菜/蛋白质等）',
    '3. 指出可能存在的营养缺乏或过量问题',
    '4. 提供3条具体改进建议',
    '请用以下JSON格式返回分析结果：',
    '{ "summary": "总体评价摘要", "nutrients": { "calories": xxx, "carbohydrate": "xx%", "protein": "xx%", "fat": "xx%" }, "evaluation": ["优点1","问题1","问题2"], "recommendations": ["建议1","建议2","建议3"] }'
  ].join('\n')
  return render(template, { data })
}
export function buildTemplateWithVars(template, vars) {
  return render(template, vars)
}
export function buildPlanPrompt({ profile, analysis, constraints }) {
  const data = {
    profile: profile || {},
    analysis: analysis || {},
    constraints: constraints || {}
  }
  const template = [
    '你是一名资深营养师与临床膳食专家，请依据以下整合数据生成个性化一周饮食方案：',
    '【用户健康背景（基于分析与个人信息）】',
    '{{ data }}',
    '要求：',
    '1. 给出7天早/中/晚三餐的计划',
    '2. 每餐提供具体食材清单与简洁烹饪建议',
    '3. 说明营养搭配与理由',
    '4. 提供可替代食材选项以满足地域可获得性',
    '5. 严格避开用户的饮食限制与过敏源',
    '输出JSON：{ "week": [ { "day": 1, "meals": { "breakfast": { "ingredients": [...], "cook": "..." }, "lunch": {...}, "dinner": {...} }, "notes": "..." } ... ], "nutritionSummary": { "caloriesPerDay": 2000, "carb": "50%", "protein": "25%", "fat": "25%" }, "alternatives": [{ "item": "...", "options": ["..."] }], "compliance": { "avoidedAllergens": true, "fitsPreferences": true } }'
  ].join('\n')
  return render(template, { data })
}