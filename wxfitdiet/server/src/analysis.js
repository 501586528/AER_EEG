function buildAnalysisTemplate(records) {
  return { type: 'analysis', records }
}
function generateAnalysis(records) {
  const total = records.reduce((s, r) => s + (r.calories || 0), 0)
  const nutrients = { calories: total, carbohydrate: '55%', protein: '25%', fat: '20%' }
  const evaluation = ['优质蛋白来源充足', '精制碳水占比过高', '膳食纤维摄入不足']
  const recommendations = ['用全谷物替代1/3的精制主食', '增加深色蔬菜至每日500g', '下午茶建议用坚果替代饼干']
  return { summary: '蛋白质摄入充足但碳水比例偏高，蔬菜水果摄入不足', nutrients, evaluation, recommendations }
}
function buildRecommend({ records, analysis, profile }) {
  const plans = []
  for (let i = 1; i <= 5; i++) {
    plans.push({ id: `P${i}`, title: `方案${i}`, level: ['易','中','难'][i%3], effect: ['低','中','高'][i%3], score: Math.random()*100 })
  }
  return plans
}
function scoreAndSort(plans) {
  return plans.sort((a,b) => b.score - a.score)
}
function visualizePlans(plans) {
  return { pie: plans.map(p => ({ label: p.title, value: Math.round(p.score) })) }
}
module.exports = { buildAnalysisTemplate, generateAnalysis, buildRecommend, scoreAndSort, visualizePlans }