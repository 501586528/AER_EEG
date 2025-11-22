Page({
  data: { qrUrl: '' },
  onGenerateQR() {
    wx.cloud.callFunction({ name: 'share', data: { ttlDays: 7 } }).then(res => {
      this.setData({ qrUrl: res.result && res.result.url ? res.result.url : '' })
    })
  }
})