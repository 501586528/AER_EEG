export function buildAnalysisPrompt(records) {
  const data = {
    records: records.map(r => ({ time: r.time, text: r.text, calories: r.calories || 0 }))
  }
  const json = JSON.stringify(data, null, 2)
  const tpl = [
    '你是一名专业营养师，请基于以下用户饮食记录进行分析：',
    json,
    '分析要求：',
    '1. 计算总热量摄入及三大营养素比例',
    '2. 评估膳食结构是否均衡（谷物/蔬菜/蛋白质等）',
    '3. 指出可能存在的营养缺乏或过量问题',
    '4. 提供3条具体改进建议',
    '请用以下JSON格式返回分析结果：',
    '{ "summary": "总体评价摘要", "nutrients": { "calories": xxx, "carbohydrate": "xx%", "protein": "xx%", "fat": "xx%" }, "evaluation": ["优点1","问题1","问题2"], "recommendations": ["建议1","建议2","建议3"] }'
  ].join('\n')
  return '请根据以下饮食记录数据进行分析\n' + tpl
}