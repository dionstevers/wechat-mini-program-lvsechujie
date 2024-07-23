// pages/store/store.ts
import { updateColor } from '../../utils/colorschema'
import { logEvent } from "../../utils/log";
const app = getApp();

Page({
  data: {
    background: null,
    prize: 0,
    prizes: [],
    claimedprizes: [],
    angle: 0,
    attempts: 0,
    _id: 0,
    testGroup: 0,
    openID: "",
    random: "",
    trasn: 0,
    spinning: false,
    cost: 20,
    userInfo: null,
    credit: 0,
    xml:[],
    prizeList:[],
    prizeProbabilities:[],
    luckylist: [{ time: "超过50%概率获得10元以上奖励！" }, { time: "奖品将于每月月底统一发放！" }, { time: "还等什么，快来抽奖吧！" }]
  },
  
  async angleGenerator() {
    var angle = 0;
    var prize = 0;
    const prob = Math.floor(Math.random() * 100);
    const random = Math.random();

    this.data.prizeList.forEach((item,index) => {
        const {ratio, value, min, max} = item || {}

        if(prob > min && prob <= max){
          prize = index
          angle = Math.floor(ratio + random * value);
        }
    });

    // //一等奖 3%概率抽到
    // if (prob <= 3) {
    //   angle = Math.floor(40 + random * 40);
    //   prize = 1;
    // }
    // // 第二有价值的奖品 7%概率抽到
    // if (prob > 3 && prob <= 10) {
    //   angle = Math.floor(100 + random * 40);
    //   prize = 2;
    // }
    // // 10% 概率
    // if (prob > 10 && prob <= 20) {
    //   angle = Math.floor(160 + random * 40);
    //   prize = 3;
    // }

    // // 15% 概率
    // if (prob > 20 && prob <= 35) {
    //   angle = Math.floor(220 + random * 40);
    //   prize = 4;
    // }
    // // 30% 概率
    // if (prob > 35 && prob <= 65) {
    //   angle = Math.floor(280 + Math.random() * 40);
    //   prize = 5;
    // }
    // // 35% 概率
    // else {
    //   angle = Math.floor(340 + Math.random() * 20);
    //   prize = 6;
    // }
    this.setData({
      angle: angle,
      prize: prize
    });
  },
  async startSpin() {
    logEvent("Lottery Spin");
    let that = this;
    if (that.data.credit < that.data.cost) {
      wx.showToast({
        title: "积分不足",
        icon: "error"
      });
      return;
    }
    if (that.data.spinning) {
      return;
    }
    if (!that.data.spinning) {
      that.setData({
        spinning: true
      });
    }
    let num = 0;
    that.angleGenerator();
    that.setData({
      // random-最终角度-从后端获得概率
      trasn: 0,
      spinning: true
    });
    let a = setInterval(function () {
      that.setData({
        trasn: that.data.trasn + 5
      });
      //  累计转3圈
      if (360 <= that.data.trasn) {
        that.data.trasn = 0;
        num = num + 1;
      }
      //  3圈得到结果、重置timer
      if (num == 3) {
        let b = setInterval(async function () {
          that.setData({
            trasn: that.data.trasn + 2
          });
          if (that.data.angle <= that.data.trasn) {

            try {
              clearInterval(b);
              const db = wx.cloud.database();
              const _ = db.command;
              const prizeList = that.data.prizeList || []
              // const prizeList = ["placeholder", "京东E卡100元", "京东E卡50元", "京东E卡40元", "京东图书品类卡30元", "京东E卡20元", "京东E卡10元"];
              const openid = app.globalData.openID;
              wx.cloud.callFunction({
                name: 'lottery',
                data: {
                  openid,
                  lottery_probability_id: prizeList[that.data.prize]?._id,
                  lottery_probability_name: prizeList[that.data.prize]?.title
                },
                success: res => {
                  if (res.result !== undefined ) {
                    that.setData({
                      trasn: 0,
                      spinning: false
                    });
                    wx.showModal({
                      title: "恭喜中奖",
                      content: "您获得：" + prizeList[that.data.prize]?.title,
                      showCancel: false
                    });

                  } else {
                    wx.showToast({
                      title:'请稍后再试',
                      icon: 'error',
                      duration:2000
                    })
                  }
                },
                fail: err => {
                  console.error('Error calling cloud function:', err);
                  wx.showToast({
                    title: '请稍后再试',
                    icon: 'error',
                    duration: 2000,
                  });
                }
              });
              // await db
              //   .collection("lottery")
              //   .doc(that.data._id)
              //   .update({
              //     data: {
              //       credit: _.inc(-that.data.cost),
              //       prizes: _.push([prizeList[that.data.prize]?.title]),
              //       attempt: _.inc(1)
              //     }
              //   });
              // that.setData({
              //   trasn: 0,
              //   spinning: false
              // });
              // wx.showModal({
              //   title: "恭喜中奖",
              //   content: "您获得：" + prizeList[that.data.prize]?.title,
              //   showCancel: false
              // });
            } catch (err) {
              console.log(err);
            }
          }
        }, 8);

        clearInterval(a);
      }
    }, 8);
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
              credit: snapshot.docs[0].credit,
              _id: snapshot.docs[0]._id,
              attempts: snapshot.docs[0].attempts,
              prizes: snapshot.docs[0].prizes,
              claimedprizes: snapshot.docs[0].claimedprizes
            });
            wx.hideToast();
          },
          onError: err => {
            console.log(err);
          }
        });

        // let res = (await db.collection('merch').where({
        //   attribute: "lottery"
        // }).get());

        let res = (await db.collection('lotteryProbability').where({
          attribute: "lottery"
        }).orderBy("sort", "asc").get());


        this.setData({
          prizeList: res?.data
        })

    } catch (err) {
      console.log(err);
    }
  },
  toMyprize() {
    var prizelist = JSON.stringify(this.data.prizes);


    var claimedprizes = JSON.stringify(this.data.claimedprizes);

    wx.navigateTo({
      url: "/pages/myprize/myprize?prizelist=" + prizelist + "&claimedprizes=" + claimedprizes
    });
  },
  onLoad() {
    const cost = 150;

    this.setData({
      userInfo: app.globalData.userInfo,
      testGroup: app.globalData.userInfo.testGroup,
      openID: app.globalData.openID,
      cost: cost
    });
    this.getLotteryInfo();
  },

  onShow() {
    // 更新颜色
    updateColor();
  },

  onShareAppMessage() {
    logEvent("Share App")
    return {
      title: "快来一起低碳出街~",
      path:`/pages/index/index?sharedFromID=${app.globalData.openid}`,
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
