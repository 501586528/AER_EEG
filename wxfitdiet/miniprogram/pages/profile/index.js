const validators = require('../../utils/validators.js')
const nutrition = require('../../utils/nutrition.js')

Page({
  data: {
    ageRange: Array.from({ length: 63 }, (_, i) => i + 18),
    age: null,
    gender: 'male',
    height: '',
    weight: '',
    freqOptions: ['每周1-2次', '每周3-4次', '每周5次以上'],
    freqLabel: '',
    goals: [],
    fastingGlucose: '',
    postprandialGlucose: '',
    sbp: '',
    dbp: '',
    growthStages: ['骨龄I', '骨龄II', '骨龄III'],
    growthStage: ''
  },
  onAgeChange(e) {
    this.setData({ age: this.data.ageRange[e.detail.value] })
  },
  onGenderChange(e) {
    this.setData({ gender: e.detail.value })
  },
  onHeight(e) {
    this.setData({ height: e.detail.value })
  },
  onWeight(e) {
    this.setData({ weight: e.detail.value })
  },
  onFreqChange(e) {
    const label = this.data.freqOptions[e.detail.value]
    this.setData({ freqLabel: label })
  },
  onGoalsChange(e) {
    this.setData({ goals: e.detail.value })
  },
  onFastingGlucose(e) {
    this.setData({ fastingGlucose: e.detail.value })
  },
  onPostprandialGlucose(e) {
    this.setData({ postprandialGlucose: e.detail.value })
  },
  onSbp(e) {
    this.setData({ sbp: e.detail.value })
  },
  onDbp(e) {
    this.setData({ dbp: e.detail.value })
  },
  onGrowthStageChange(e) {
    this.setData({ growthStage: this.data.growthStages[e.detail.value] })
  },
  onSubmit() {
    const data = this.data
    const valid = validators.validateProfile({
      age: data.age,
      gender: data.gender,
      height: Number(data.height),
      weight: Number(data.weight),
      freqLabel: data.freqLabel,
      goals: data.goals,
      fastingGlucose: data.fastingGlucose,
      postprandialGlucose: data.postprandialGlucose,
      sbp: data.sbp,
      dbp: data.dbp,
      growthStage: data.growthStage
    })
    if (!valid.ok) {
      wx.showToast({ title: valid.message, icon: 'none' })
      return
    }
    const freq = validators.mapFreqLabel(data.freqLabel)
    const target = nutrition.calculateTarget({
      age: data.age,
      gender: data.gender,
      height: Number(data.height),
      weight: Number(data.weight),
      frequency: freq,
      goals: data.goals
    })
    wx.setStorageSync('user_profile', { ...data })
    wx.setStorageSync('nutrition_target', target)
    wx.navigateTo({ url: '/pages/diet/index' })
  }
})