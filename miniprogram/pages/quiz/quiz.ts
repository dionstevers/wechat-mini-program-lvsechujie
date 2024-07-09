import { updateColor } from '../../utils/colorschema'

// Page初始化函数
export{}
const app = getApp()
Page({
  // 数据初始化
  data: {
    answered: false,
    link:null,
    _id: null,
    question: '',  // 从数据库获取的题目
    choices: '',   // 从数据库获取的选项
    prompt: '',    // 从数据库获取的提示内容
    ans: '',
    selectedChoiceIndex: null,  // 用户选择的选项索引 
    showingPrompt: false,     // 是否显示提示内容
    openID: null,
    background: null
  },

  // 页面加载时触发
  onLoad(option) {
    updateColor();

    // 从数据库中获取题目、选项和提示内容，然后更新data中的相应字段
    
    this.getDataFromDatabase();
    this.setData({
      openID : app.globalData.openID,
      link: option.link
    })
    if(!this.data.answered){
      wx.enableAlertBeforeUnload({
        message:'答题未完成将导致中奖概率大幅降低，您确定要这么做吗'
      })
    }
    
    
  },
  async onUnload(){
    // const db = wx.cloud.database()
    // const _ = db.command
    // if(!this.data.selectedChoiceIndex){
    //   const res = await db.collection('lottery').where({_openid:this.data.openID}).get()
    //     this.setData({
    //       _id: res.data[0]._id
    //     })
    //     await db.collection('lottery').doc(this.data._id).update({
    //       data:{
    //         credit : _.inc(-10)
    //       }
    //     })
    // }
    // if(!this.data.selectedChoiceIndex){
    //   wx.showModal({
    //     title: '未完成答题',
    //     content: '答题未完成将导致中奖概率大幅降低，您确定要这么做吗'
    //   })
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
  async submit() {
    const db = wx.cloud.database()
    const _  = db.command
    if (this.data.selectedChoiceIndex) {
      this.setData({
        answered: true
      })
      wx.showToast({
        title:'上传中',
        icon: 'loading',
        mask: true,
        duration: 20000
      })
      try{
        await db.collection('quizAns').add({
          data:{
            Qid: this.data._id,
            Aid: this.data.link,
            userAns: this.data.selectedChoiceIndex,
            Date: new Date()
          }
        })
        const res = await db.collection('lottery').where({_openid:this.data.openID}).get()
        this.setData({
          _id: res.data[0]._id
        })
        // await db.collection('lottery').doc(this.data._id).update({
        //   data:{
        //     credit : _.inc(10)
        //   }
        // })
        wx.hideToast()
        wx.showModal({
          title: '成功上传',
          content:'感谢您的参与',
          showCancel: false,
          success(res){
            if (res.confirm) {
              wx.switchTab({
                url: '/pages/information/information'
              })
            }
          }
        })
        
      }catch(err){console.log(err)}
      
    }else{
      wx.showToast({
        title:'请选择至少一项',
        icon: 'error',
        duration: 1000,
        mask: true
      })
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
        question : randomQuiz.question,
        choices : randomQuiz.selection,
        prompt : randomQuiz.hint,
        ans :randomQuiz.answer,
        _id: randomQuiz._id
      });
    }).catch((error) => {
      // 处理获取数据失败的情况
      console.error('获取数据失败', error);
    });
  },
});
