Page({
  data: {},
  onLogin() {
    wx.login({
      success: () => {
        wx.cloud.callFunction({
          name: "auth",
          data: {}
        }).then(res => {
          const app = getApp();
          app.globalData.user = res.result && res.result.user;
          wx.navigateTo({ url: "/pages/profile/index" });
        }).catch(() => {
          wx.showToast({ title: "登录失败", icon: "none" });
        });
      },
      fail: () => {
        wx.showToast({ title: "微信登录失败", icon: "none" });
      }
    });
  }
});