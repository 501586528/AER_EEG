import { calculateTarget } from './utils/nutrition.js'
import { validateProfile, mapGoalToArray } from './utils/validators.js'
import { asyncSet, asyncGet, pushDoc, startCleanup, addDietRecord, getDietRecords, updateDietRecord } from './utils/storage.js'
import { buildAnalysisPrompt } from './utils/prompt.js'
const tabs = document.querySelectorAll('.nav button')
const sections = document.querySelectorAll('.tab')
tabs.forEach(b => b.addEventListener('click', () => {
  sections.forEach(s => s.classList.add('hidden'))
  document.getElementById(b.dataset.tab).classList.remove('hidden')
}))
startCleanup()
async function loadProfile() {
  const p = await asyncGet('user_profile')
  if (!p) return
  document.getElementById('ageNum').value = p.age || ''
  const g = p.gender || 'male'
  const node = document.querySelector(`input[name="gender"][value="${g}"]`)
  if (node) node.checked = true
  document.getElementById('height').value = p.height || ''
  document.getElementById('weight').value = p.weight || ''
  document.getElementById('goalSelect').value = p.goal || ''
  document.getElementById('dietNotes').value = p.dietNotes || ''
}
loadProfile()
function autoSave() {
  const age = Number(document.getElementById('ageNum').value)
  const gender = document.querySelector('input[name="gender"]:checked').value
  const height = Number(document.getElementById('height').value)
  const weight = Number(document.getElementById('weight').value)
  const goal = document.getElementById('goalSelect').value
  const dietNotes = document.getElementById('dietNotes').value
  asyncSet('user_profile', { age, gender, height, weight, goal, dietNotes })
}
['ageNum','height','weight','goalSelect','dietNotes'].forEach(id => {
  document.getElementById(id).addEventListener('input', autoSave)
})
document.getElementById('btnLogin').addEventListener('click', async () => {
  const r = await window.api.auth()
  document.querySelector('[data-tab="profile"]').click()
})
document.getElementById('btnSave').addEventListener('click', async () => {
  const age = Number(document.getElementById('ageNum').value)
  const gender = document.querySelector('input[name="gender"]:checked').value
  const height = Number(document.getElementById('height').value)
  const weight = Number(document.getElementById('weight').value)
  const goal = document.getElementById('goalSelect').value
  const dietNotes = document.getElementById('dietNotes').value
  const valid = validateProfile({ age, gender, height, weight, goal })
  if (!valid.ok) { const e = document.getElementById('errorMsg'); e.textContent = valid.message; e.style.display = 'block'; return }
  const goals = mapGoalToArray(goal)
  const target = calculateTarget({ age, gender, height, weight, frequency: '3-4', goals })
  await asyncSet('nutrition_target', target)
  await asyncSet('user_profile', { age, gender, height, weight, goal, dietNotes })
  if (dietNotes && dietNotes.trim()) await pushDoc('rag_docs_diet', dietNotes.trim())
  const e = document.getElementById('errorMsg'); e.textContent = ''; e.style.display = 'none'
  document.querySelector('[data-tab="diet"]').click()
})
function uuid() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c==='x'?r:(r&0x3|0x8); return v.toString(16) }) }
function fmt(dt) {
  const pad = n => n.toString().padStart(2,'0')
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}
function estimateCalories(text) {
  const map = { '米饭': 116, '面包': 265, '牛奶': 60, '鸡胸肉': 165, '苹果': 52, '香蕉': 89 }
  let total = 0
  Object.keys(map).forEach(k => { if (text.includes(k)) total += map[k] })
  return total || ''
}
async function renderDietList() {
  const list = await getDietRecords()
  const el = document.getElementById('dietList')
  el.innerHTML = ''
  list.forEach((rec, idx) => {
    const card = document.createElement('div')
    card.className = 'diet-card'
    const img = document.createElement('img')
    img.src = rec.image || ''
    const body = document.createElement('div')
    body.innerHTML = `<div>${rec.text || ''}</div><div class='diet-meta'>${rec.time} · ${rec.calories} 千卡</div>`
    card.appendChild(img)
    card.appendChild(body)
    el.appendChild(card)
    if (idx === 0) {
      const edit = document.createElement('div')
      edit.innerHTML = `<input id='editText' value='${rec.text || ''}' /><input id='editCal' value='${rec.calories || ''}' /><input id='editTime' type='datetime-local' /> <button id='btnQuickSave'>快速保存</button>`
      el.appendChild(edit)
      const t = rec.time.replace(' ', 'T')
      const et = edit.querySelector('#editTime')
      et.value = t
      edit.querySelector('#btnQuickSave').addEventListener('click', async () => {
        await updateDietRecord(rec.id, { text: edit.querySelector('#editText').value, calories: Number(edit.querySelector('#editCal').value) || 0, time: et.value.replace('T', ' ') })
        renderDietList()
      })
    }
  })
}
const photo = document.getElementById('photo')
photo.addEventListener('change', async () => {
  const f = photo.files && photo.files[0]
  if (!f) return
  const stored = await window.api.fileStore(f.path || '')
  photo.dataset.storedPath = stored && stored.storedPath ? stored.storedPath : ''
})
document.getElementById('btnVoice').addEventListener('click', async () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) { alert('当前环境暂不支持语音识别'); return }
  const recog = new SpeechRecognition()
  recog.lang = 'zh-CN'
  recog.onresult = (e) => {
    const text = Array.from(e.results).map(r => r[0].transcript).join(' ')
    const el = document.getElementById('foodText')
    el.value = (el.value || '') + (text ? ` ${text}` : '')
    const est = estimateCalories(el.value)
    document.getElementById('caloriesAuto').value = est
  }
  recog.start()
})
document.getElementById('foodText').addEventListener('input', () => {
  const text = document.getElementById('foodText').value
  const est = estimateCalories(text)
  document.getElementById('caloriesAuto').value = est
})
document.getElementById('timePicker').value = new Date().toISOString().slice(0,16)
function showToast() {
  const t = document.getElementById('toast')
  t.style.opacity = '1'
  setTimeout(() => { t.style.opacity = '0' }, 2000)
}
document.getElementById('btnSaveDiet').addEventListener('click', async () => {
  const txt = document.getElementById('foodText').value.trim()
  const img = document.getElementById('photo').dataset.storedPath || ''
  const calAuto = Number(document.getElementById('caloriesAuto').value)
  const calManual = Number(document.getElementById('caloriesManual').value)
  const cal = !isNaN(calManual) && calManual > 0 ? calManual : (!isNaN(calAuto) ? calAuto : 0)
  const time = document.getElementById('timePicker').value.replace('T', ' ')
  if (!txt && !img) { const e = document.getElementById('dietError'); e.textContent = '请至少填写文字或上传图片'; e.style.display = 'block'; return }
  const rec = { id: uuid(), text: txt, image: img, calories: cal, time }
  await addDietRecord(rec)
  showToast()
  document.getElementById('dietError').style.display = 'none'
  document.getElementById('foodText').value = ''
  document.getElementById('caloriesManual').value = ''
  document.getElementById('caloriesAuto').value = ''
  document.getElementById('photo').value = ''
  renderDietList()
})
renderDietList()
async function runAnalysis() {
  const records = await getDietRecords()
  const prompt = buildAnalysisPrompt(records)
  try {
    const r = await fetch('http://localhost:8787/analysis/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
    const data = await r.json()
    const res = data.result || {}
    document.getElementById('analysisText').textContent = res.summary || ''
    const carb = parseInt((res.nutrients && res.nutrients.carbohydrate || '0').toString().replace('%',''))
    const protein = parseInt((res.nutrients && res.nutrients.protein || '0').toString().replace('%',''))
    const fat = parseInt((res.nutrients && res.nutrients.fat || '0').toString().replace('%',''))
    document.getElementById('barCarb').style.width = `${carb}%`
    document.getElementById('barProtein').style.width = `${protein}%`
    document.getElementById('barFat').style.width = `${fat}%`
  } catch (e) {
    document.getElementById('analysisText').textContent = '分析失败'
  }
}
document.getElementById('btnAnalyze').addEventListener('click', runAnalysis)
document.getElementById('btnExportAnalysis').addEventListener('click', async () => { await window.api.exportAnalysisPdf() })
async function loadAnalysis() {
  const t = await window.api.storageGet('nutrition_target')
  document.getElementById('total').textContent = `${(t && t.totalCalories) || 0} 千卡`
  const r = t && t.macroRatio ? t.macroRatio : { carb: 0, protein: 0, fat: 0 }
  document.getElementById('ratio').textContent = `碳水：${r.carb * 100}% 蛋白质：${r.protein * 100}% 脂肪：${r.fat * 100}%`
}
document.querySelector('[data-tab="analysis"]').addEventListener('click', loadAnalysis)
document.getElementById('btnGen').addEventListener('click', async () => {
  const n = Number(document.getElementById('count').value)
  const r = await window.api.recommend({ n })
  const el = document.getElementById('plans')
  el.innerHTML = ''
  r.plans.forEach(p => {
    const div = document.createElement('div')
    div.textContent = `${p.title} 难度${p.level} 预估效果${p.effect}`
    el.appendChild(div)
  })
})
document.getElementById('btnQR').addEventListener('click', async () => {
  const r = await window.api.share({ ttlDays: 7 })
  document.getElementById('qr').src = r.url || ''
})
document.getElementById('btnXLS').addEventListener('click', async () => {
  await window.api.export({ type: 'excel' })
})
document.getElementById('btnPDF').addEventListener('click', async () => {
  await window.api.export({ type: 'pdf' })
})