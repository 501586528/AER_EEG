Page({
  data: {
    counts: ['3', '4', '5', '6', '7', '8', '9', '10'],
    countLabel: '3',
    plans: []
  },
  onCountChange(e) {
    this.setData({ countLabel: this.data.counts[e.detail.value] })
  },
  onGenerate() {
    const n = Number(this.data.countLabel)
    wx.showLoading({ title: '生成中' })
    wx.cloud.callFunction({ name: 'recommend', data: { n } })
      .then(res => {
        const list = res.result && res.result.plans ? res.result.plans : []
        this.setData({ plans: list })
        wx.hideLoading()
      }).catch(() => {
        wx.hideLoading()
        wx.showToast({ title: '生成失败', icon: 'none' })
      })
  }
})