
// Page初始化函数
Page({
  // 数据初始化
  data: {
    question: '',  // 从数据库获取的题目
    choices: '',   // 从数据库获取的选项
    prompt: '',    // 从数据库获取的提示内容
    ans: '',
    selectedChoiceIndex: -1,  // 用户选择的选项索引 
    showingPrompt: false,     // 是否显示提示内容
  },

  // 页面加载时触发
  onLoad() {
    // 从数据库中获取题目、选项和提示内容，然后更新data中的相应字段
    this.getDataFromDatabase();
    
  },
  onUnload(){
    wx.enableAlertBeforeUnload(
      {
      message: '答题未完成将导致扣分，请确认是否退出',
      success:function(res){
        console.log('成功调用',res)
      },
      fail: function (err){
        console.log('调用失败',err)
      }
      
    })
// 减分机制
    // if(this.data.status== null && this.data.userInfo.testGroup == 2){
    //   const db = wx.cloud.database();
    //   const _ = db.command;
    //   db.collection('userInfo').doc(this.data.userInfo._id).update({
    //     data:{
    //       credit: _.inc(-10)
    //   }
    // })
    // }
  },
  // 选择选项触发的事件处理函数
  selectChoice(event) {
    const selectedChoiceIndex = event.detail.value;
    this.setData({
      selectedChoiceIndex: selectedChoiceIndex,
    });
  },

  // 提交按钮触发的事件处理函数
  submit() {
    if (this.data.selectedChoiceIndex) {
      
    }
  },

  // 显示提示按钮触发的事件处理函数
  showPrompt() {
    this.setData({
      showingPrompt: true,
    });
  },

  // 从数据库中获取数据的方法，可以根据自己的实际情况实现
  getDataFromDatabase() {
    // 获取云数据库实例
    const db = wx.cloud.database()
    
    db.collection('quiz').get().then((res) => {

      console.log('we got the quizzes')
      const quizData = res.data;
      console.log('the data is ', quizData)
      // 随机生成一个索引以选择一道题
      const randomIndex = Math.floor(Math.random() * quizData.length);
      const randomQuiz = quizData[randomIndex];
      // 更新页面的quizData字段，用于展示数据
      this.setData({
        'question': randomQuiz.question,
        'choices': randomQuiz.selection,
        'prompt': randomQuiz.hint,
        'ans':randomQuiz.answer


      });
    }).catch((error) => {
      // 处理获取数据失败的情况
      console.error('获取数据失败', error);
    });
  },
});
