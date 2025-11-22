Page({
  onExportExcel() {
    wx.cloud.callFunction({ name: 'export', data: { type: 'excel' } }).then(res => {
      const url = res.result && res.result.url ? res.result.url : ''
      if (url) wx.downloadFile({ url })
    })
  },
  onExportPDF() {
    wx.cloud.callFunction({ name: 'export', data: { type: 'pdf' } }).then(res => {
      const url = res.result && res.result.url ? res.result.url : ''
      if (url) wx.downloadFile({ url })
    })
  }
})