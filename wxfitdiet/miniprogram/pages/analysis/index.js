Page({
  data: {
    target: wx.getStorageSync('nutrition_target') || { totalCalories: 0 },
    ratio: (wx.getStorageSync('nutrition_target') || { macroRatio: { carb: 0, protein: 0, fat: 0 } }).macroRatio,
    microPercent: 0,
    ranges: ['7天', '30天'],
    rangeLabel: '7天'
  },
  onRange(e) {
    this.setData({ rangeLabel: this.data.ranges[e.detail.value] })
  }
})