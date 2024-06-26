import { formatTime } from '../../utils/time'

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
    selectedMessageIndex: -1
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
      .orderBy('stage', 'asc')
      .orderBy('time', 'asc')
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
    const { type, message, openID } = this.data;

    if (!type || !message) {
      wx.showToast({
        title: 'Please fill in all fields',
        icon: 'none'
      });
      return;
    }

    wx.requestSubscribeMessage({
      tmplIds: ['0E8lHFKjSYWUJMA9NB7iKEFnTWwg3ivKOS8XTXrOKRU','5wXvMNdaUfyr5TP_XsMxUeI4waBCtaPo_MRaJK6PkbQ'],
      success: (res) => {
        const db = wx.cloud.database();
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
          wx.showToast({
            title: 'Message sent',
            icon: 'success'
          });

          // Call cloud function to send the initial notification
          wx.cloud.callFunction({
            name: 'sendNotification',
            data: {
              messageID: dbRes._id,
              stage: 0, // Indicate this is the initial message creation stage
            }
          }).then(cloudRes => {
            console.log('Initial notification sent', cloudRes);
          }).catch(cloudErr => {
            console.error('Error sending initial notification', cloudErr);
          });

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
  }
});
