const cloud = require('wx-server-sdk');

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

async function fetchMessage(db, messageID) {
  try {
    const message = await db.collection('messages').doc(messageID).get();
    console.log("Fetched message:", message);
    return message.data;
  } catch (error) {
    console.error("Error fetching message:", error);
    throw new Error("Error fetching message");
  }
}

async function sendInitialNotification(message) {
  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: message.sender,
      page: '/pages/index/index',
      data: {
        thing1: { value: message.type },
        thing2: { value: '审核中' },
        thing4: { value: '请于通知中心查看最新进展' }
      },
      templateId: '0E8lHFKjSYWUJMA9NB7iKEFnTWwg3ivKOS8XTXrOKRU'
    });
    return result;
  } catch (error) {
    console.error("Error sending initial notification:", error);
    throw error;
  }
}
function formatDateTime(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

async function sendStageOneNotification(message) {
  try {
    const currentTime = new Date();
    const result = await cloud.openapi.subscribeMessage.send({
      touser: message.sender,
      page: '/pages/index/index',
      data: {
        thing1: { value: '现金奖励' },
        amount2: { value: '20' },
        time3: { value: formatDateTime(currentTime)},
        thing4: { value: '请及时领取' }
      },
      templateId: '5wXvMNdaUfyr5TP_XsMxUeI4waBCtaPo_MRaJK6PkbQ'
    });
    return result;
  } catch (error) {
    console.error("Error sending stage one notification:", error);
    throw error;
  }
}

exports.main = async (event, context) => {
  console.log("Received event:", event);

  const db = cloud.database();
  let message;

  try {
    if (event.stage === 0) {
      const messageID = event.messageID;
      if (!messageID || (typeof messageID !== 'string' && typeof messageID !== 'number')) {
        throw new Error("Invalid messageID: it must be a string or number");
      }
      message = await fetchMessage(db, messageID);
      return await sendInitialNotification(message);
    } else if (event.data && event.data.updatedFields && event.data.updatedFields.stage === 1) {
      const docId = event.data.docId;
      if (!docId || (typeof docId !== 'string' && typeof docId !== 'number')) {
        throw new Error("Invalid docId: it must be a string or number");
      }
      message = await fetchMessage(db, docId);
      return await sendStageOneNotification(message);
    } else {
      throw new Error("No valid stage found or missing data");
    }
  } catch (error) {
    console.error("Error in main function:", error);
    return { success: false, error: error.message };
  }
};
