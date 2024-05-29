// pages/notification-center/notification-center.ts
Page({
  data: {
    openID:'',
    currentTab: 0,
    tabs: ["Inbox", "Send Message"],
    messages: [],
    type: "",
    message: "",
    types: ["Type1", "Type2", "Type3"],
    expandedMessageIndex: -1
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
    db.collection('messages').get().then(res => {
      this.setData({
        messages: res.data
      });
    });
  },

  toggleMessage(event: any) {
    const index = event.currentTarget.dataset.index;
    this.setData({
      expandedMessageIndex: this.data.expandedMessageIndex === index ? -1 : index
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
    console.log(this.data.openID);
    const { type, message, openID } = this.data;
  
    wx.requestSubscribeMessage({
      tmplIds: ['5wXvMNdaUfyr5TP_XsMxUeI4waBCtaPo_MRaJK6PkbQ', '0E8lHFKjSYWUJMA9NB7iKEFnTWwg3ivKOS8XTXrOKRU'],
      success: (res) => {
        const db = wx.cloud.database();
        db.collection('messages').add({
          data: {
            type,
            message,
            sender: openID,
            time: new Date(),
            stage: 0 // 0 stands for processing state, and 1 stands for processed stage
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
