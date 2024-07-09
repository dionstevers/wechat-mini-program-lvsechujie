// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = wx.cloud.database()
const _  = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const { senderID, receiverID } = event;
  if (senderID === receiverID) {
    return { message: 'Sender and receiver cannot be the same.' }
  }

  try {
    // Locate the sender's entry
    const senderEntry = await db.collection('relations').where({
      openid: senderID
    }).get()
    
    // Locate the receiver's entry
    const receiverEntry = await db.collection('relations').where({
      openid: receiverID
    }).get()

    // Update the sender's entry
    if (senderEntry.data.length > 0) {
      const senderFriends = senderEntry.data[0].friends
      if (!senderFriends.includes(receiverID)) {
        await db.collection('relations').doc(senderEntry.data[0]._id).update({
          data: {
            friends: _.push(receiverID)
          }
        })
      }
    }

    // Update the receiver's entry
    if (receiverEntry.data.length > 0) {
      const receiverFriends = receiverEntry.data[0].friends
      if (!receiverFriends.includes(senderID)) {
        await db.collection('relations').doc(receiverEntry.data[0]._id).update({
          data: {
            friends: _.push(senderID)
          }
        })
      }
    }

    return { message: 'Friends list updated successfully.' }
  } catch (error) {
    return { error: error.message }
  }
}
