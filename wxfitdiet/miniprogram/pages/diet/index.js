const lru = require('../../utils/lru.js')

Page({
  data: {
    query: '',
    results: [],
    presets: [],
    imageResultText: '',
    customName: '',
    customCalories: ''
  },
  onQuery(e) {
    this.setData({ query: e.detail.value })
  },
  onSearch() {
    const q = this.data.query
    wx.showLoading({ title: '搜索中' })
    wx.cloud.callFunction({ name: 'dietSearch', data: { q } })
      .then(res => {
        const list = res.result && res.result.items ? res.result.items : []
        this.setData({ results: list })
        wx.hideLoading()
      }).catch(() => {
        wx.hideLoading()
        wx.showToast({ title: '搜索失败', icon: 'none' })
      })
  },
  onPickImage() {
    wx.chooseMedia({ count: 1, mediaType: ['image'] }).then(r => {
      const file = r.tempFiles[0]
      wx.showLoading({ title: '识别中' })
      wx.cloud.uploadFile({ cloudPath: `diet/${Date.now()}.jpg`, filePath: file.tempFilePath })
        .then(u => wx.cloud.callFunction({ name: 'visionRecog', data: { fileID: u.fileID } }))
        .then(res => {
          const t = res.result && res.result.text ? res.result.text : ''
          this.setData({ imageResultText: t })
          wx.hideLoading()
        }).catch(() => {
          wx.hideLoading()
          wx.showToast({ title: '识别失败', icon: 'none' })
        })
    })
  },
  onLoadPresets() {
    wx.cloud.callFunction({ name: 'dietSearch', data: { preset: true } })
      .then(res => {
        const list = res.result && res.result.items ? res.result.items : []
        this.setData({ presets: list })
      })
  },
  onCustomName(e) {
    this.setData({ customName: e.detail.value })
  },
  onCustomCalories(e) {
    this.setData({ customCalories: e.detail.value })
  },
  onAddCustom() {
    const name = this.data.customName
    const cal = Number(this.data.customCalories)
    if (!name || isNaN(cal)) {
      wx.showToast({ title: '请填写完整', icon: 'none' })
      return
    }
    const item = { id: Date.now(), name, calories: cal }
    const list = this.data.results.slice()
    list.unshift(item)
    this.setData({ results: list, customName: '', customCalories: '' })
  },
  addRecord(item) {
    const id = `${Date.now()}`
    lru.cacheRecord({ id, item, ts: Date.now() })
  }
})