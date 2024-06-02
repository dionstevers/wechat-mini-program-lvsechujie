Page({
  data: {
    credits: 0,
    prizes: [
      { image: '../../asset/img/prizeempty.png', title: '吨吨鹅针织袋', description: '碳行家限量针织带', price: 100 },
      { image: '../../asset/img/prizeempty.png', title: '顿顿鸡笔记本', description: '碳行家限量笔记本', price: 200 },
      { image: '../../asset/img/prizeempty.png', title: 'Prize 3', description: 'n3', price: 300 },
      { image: '../../asset/img/prizeempty.png', title: 'Prize 4', description: ' 4', price: 400 }
      // Add more prize objects as needed
    ],
    prizeList:[],
    claimedprizes:[]

  },
  onLoad(){
    this.getLotteryInfo()
  },
  onShow(){
    this.getLotteryInfo()
  },
  navigateToLottery: function() {
    // Add your navigation logic here
    wx.navigateTo({
      url: '/pages/store/store'
    });
  },
  async getMerchData(){
    try{
      const db = wx.cloud.database();
      const res = await db.collection('merch').get()
      
    }catch(err){
      console.log(err)
    }
  },
  navigateToPrizes: function() {
    var prizelist = JSON.stringify(this.data.prizeList);
    var claimedprizes = JSON.stringify(this.data.claimedprizes);
    // Add your navigation logic here
    wx.navigateTo({
      url: "/pages/myprize/myprize?prizelist=" + prizelist + "&claimedprizes=" + claimedprizes
    });
  },
  async getLotteryInfo() {
    wx.showToast({
      title: "数据更新中",
      icon: "loading",
      mask: true,
      duration: 10000
    });
    const db = wx.cloud.database();
    try {
      db.collection("lottery")
        .where({
          _openid: this.data.openID
        })
        .watch({
          onChange: snapshot => {
            console.log("docs's changed events", snapshot.docChanges[0]);
            console.log("query result snapshot after the event", snapshot.docs[0]);
            this.setData({
              credits: snapshot.docs[0].credit,
              _id: snapshot.docs[0]._id,
              attempts: snapshot.docs[0].attempts,
              prizeList: snapshot.docs[0].prizes,
              claimedprizes: snapshot.docs[0].claimedprizes
            });
            wx.hideToast();
          },
          onError: err => {
            console.log(err);
          }
        });

    } catch (err) {
      console.log(err);
    }
  },
});
