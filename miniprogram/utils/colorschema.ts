const app = getApp()

type Colors = keyof typeof app.constData.VERSION_STYLE_COLOR;

/**
 * 根据全局颜色设置背景样式，并更新当前页面
 * @param color App中的全局常量中的颜色名称
 */
function setColorStyle(color: Colors) { 
  // 更改全局颜色
  app.globalData.backgroundColorStyle = color;

  // 更新当前页面
  updateColor();
}

/**
 * 更新当前页面颜色为全局颜色
 */
function updateColor() {
  // 更新页面颜色
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  if (currentPage) {
    currentPage.setData({
      colorStyle: app.globalData.backgroundColorStyle,
      background: app.constData.VERSION_STYLE_COLOR[app.globalData.backgroundColorStyle].background
    });
  }

  // 更改顶部导航条颜色
  wx.setNavigationBarColor({
    backgroundColor: app.constData.VERSION_STYLE_COLOR[app.globalData.backgroundColorStyle].Bar,
    frontColor: '#ffffff',
  })

  // 更改底部选择栏颜色
  wx.setTabBarStyle({
    backgroundColor: app.constData.VERSION_STYLE_COLOR[app.globalData.backgroundColorStyle].Bar,
  });
}

export { setColorStyle, updateColor }