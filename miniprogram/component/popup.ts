// component/popup.ts
Component({
  /**
   * 组件的属性列表
   */
  options:{
    multipleSlots:true
  },
  properties: {
    title:{
      type: String,
      value:'标题'
    },
    content:{
      type:String,
      value:'内容'
    },
    btn_no:{
      type:String,
      value:'取消'
    },
    btn_yes:{
      type:String,
      value:'确定'
    }
     
  },

  /**
   * 组件的初始数据
   */
  data: {
    flag:true,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    hidePopup:function(){
      this.setData({
        flag : ! this.data.flag
      })
    },
    showPopup:function(){
      this.setData({
        flag : ! this.data.flag
      })
    },
    // trigger event --触发事件
    // 内部私有方法以下划线开头
    _error(){
      this.triggerEvent("error")
    },
    _success(){
      this.triggerEvent("success");
    }
  },

})
