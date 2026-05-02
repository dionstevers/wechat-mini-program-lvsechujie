// components/tab_bar/index.ts
Component({

  /**
   * Properties — pages set `selected` to indicate active tab.
   */
  properties: {
    selected: {
      type: Number,
      value: 0,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    color: "#FFFFFF",
    selectedColor: "#f9bc60",
    devMode: false,
    list: [
      {
        "pagePath": "/pages/home/home",
        "iconPath": "/asset/img/trip.png",
        "text": "行程记录",
        "selectedIconPath": "/asset/img/trip_highlight.png",
        "isTab": true
      },
      {
        "pagePath": "/pages/news-feed/news-feed",
        "text": "信息中心",
        "iconPath": "/asset/img/info.png",
        "selectedIconPath": "/asset/img/info_highlight.png",
        "isTab": true
      },
      {
        "pagePath":"/pages/center/center",
        "text": "个人积分",
        "iconPath": "/asset/img/personal.png",
        "selectedIconPath": "/asset/img/personal_highlight.png",
        "isTab": true
      }
    ],
  },
  attached() {
    const app = getApp()
    this.setData({ devMode: app.globalData && app.globalData.devMode })
  },
  /**
   * 组件的方法列表
   */
  methods: {

    switchTab(e) {
      const data = e.currentTarget.dataset
      const idx = Number(data.index)
      if (idx === this.data.selected) return
      const item = this.data.list[idx]
      if (!item) return
      const url = item.pagePath
      const fail = (err) => console.error('[tab-bar] nav failed', err)
      // tabbar pages must use switchTab; non-tabbar pages must use redirectTo.
      if (item.isTab) {
        wx.switchTab({ url, fail })
      } else {
        wx.redirectTo({ url, fail })
      }
    },
  }
})