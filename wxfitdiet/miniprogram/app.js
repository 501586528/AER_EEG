App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ env: "prod" });
    }
  },
  globalData: {
    user: null
  }
});