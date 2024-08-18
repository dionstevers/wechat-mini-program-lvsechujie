import { logEvent } from "../../utils/log"
import { formatTime } from '../../utils/time'
import { updateColor } from '../../utils/colorschema'
import  { logEvent } from '../../utils/log'
const app = getApp()

Page({
  data: {
    openID: '',
    currentTab: 0,
    tabs: ["收件箱", "发件箱"],
    messages: [],
    type: "",
    message: "",
    types: ["奖品兑换", "功能建议", "问题修复"],
    expandedMessageIndex: -1,
    selectedMessageIndex: -1,
    background: null
  },
  onPullDownRefresh() {
    wx.showNavigationBarLoading()
    this.loadMessages();
    //设置延时停止动画
    setTimeout(() => {
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh()
    }, 1500);

  },
  onLoad() {
    this.setData({
      openID: getApp().globalData.openID
    })
    this.loadMessages();
  },

  onShow() {
    // 更新颜色
    updateColor();
  },

  switchTab(event: any) {
    this.setData({
      currentTab: event.currentTarget.dataset.index
    });
  },

  loadMessages() {
    const db = wx.cloud.database();
    const openid = this.data.openID;
    db.collection('messages')
      .where({
        _openid: openid
      })
      .orderBy('stage', 'desc')
      .orderBy('time', 'desc')
      .get()
      .then(res => {
        const messages = res.data.map((message: any) => {
          return {
            ...message,
            formattedTime: formatTime(message.time) // Format time for each message
          };
        });

        this.setData({
          inboxMessages: messages
        });
      })
      .catch(err => {
        console.error('Error loading messages:', err);
      });
  },

  // formatTime(time: number) {
  //   const date = new Date(time);
  //   const year = date.getFullYear();
  //   const month = this.padZero(date.getMonth() + 1);
  //   const day = this.padZero(date.getDate());
  //   const hour = this.padZero(date.getHours());
  //   const minute = this.padZero(date.getMinutes());
  //   const formattedTime = `${year}-${month}-${day} ${hour}:${minute}`;
  //   return formattedTime;
  // },

  // padZero(num: number) {
  //   return num < 10 ? '0' + num : num;
  // },

  toggleMessage(event: any) {
    const index = event.currentTarget.dataset.index;
    const message = this.data.inboxMessages[index];

    if (message.stage === 1) {
      if(message.type === '证书发放'){
        wx.setClipboardData({
          data: message.response,
          success(res) {
            wx.getClipboardData({
              success(res) {
                console.log(res.data); // data
                wx.showToast({
                  title: '证书链接已复制',
                  icon: 'success'
                });
              }
            });
          }
        });
        return;
      }
      wx.setClipboardData({
        data: message.response,
        success(res) {
          wx.getClipboardData({
            success(res) {
              console.log(res.data); // data
              wx.showToast({
                title: '内容已复制',
                icon: 'success'
              });

            }
          });
        }
      });
    }

    this.setData({
      selectedMessageIndex: this.data.selectedMessageIndex === index ? -1 : index
    });
  },

  bindPickerChange(e: any) {
    this.setData({
      type: this.data.types[e.detail.value]
    });
  },

  bindMessageInput(e: any) {
    this.setData({
      message: e.detail.value
    });
  },

  submitMessage() {
    const db = wx.cloud.database();
    const { type, message, openID } = this.data;
    if (!type || !message) {
      wx.showToast({
        title: '请完整填写',
        icon: 'none'
      });
      return;
    }
    wx.requestSubscribeMessage({
      tmplIds: ['wMLq-UxGYlMV9gp9UjaV3y4mjXtzerIVkMswu9BPNwM'],
      success: (res) => {
        db.collection('messages').add({
          data: {
            type,
            message,
            sender: openID,
            time: new Date(),
            stage: 0, // 0 stands for processing state, and 1 stands for processed stage
            response: "" // Set response to empty string for newly submitted messages
          }
        }).then(dbRes => {
          wx.showModal({
            title:'发送成功',
            content:'客服回复将在服务通知与消息中心处同步显示，请注意查收',
            showCancel:false
            })
          this.setData({
            type: "",
            message: ""
          });
          this.loadMessages(); // Reload messages to reflect the new message
        }).catch(dbErr => {
          wx.showToast({
            title: 'Failed to send',
            icon: 'none'
          });
          console.log(dbErr);
        });
      },
      fail: (error) => {
        console.log(error);
      }
    });
  },

  onShareAppMessage() {
    logEvent("Share App")
    return {
      title: "快来一起低碳出街~",
      path:`/pages/index/index?sharedFromID=${app.globalData.openID}`,
      imageUrl: "https://696c-iluvcarb-0gzvs45g82b57f98-1315168954.tcb.qcloud.la/logo/WechatIMG778.jpg?sign=c7c5732217972f1c9393850e9e040d70&t=1713096313",
      success: function(res){
        console.log(res.shareTickets[0])
      },
      fail:function(res){
        console.log('share failed')
      }
    }
  }
});
