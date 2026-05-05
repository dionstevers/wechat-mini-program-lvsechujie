// util/log.ts

// Function to format the current date and time as a string
function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = addPadding(date.getMonth() + 1);
  const day = addPadding(date.getDate());
  const hours = addPadding(date.getHours());
  const minutes = addPadding(date.getMinutes());
  const seconds = addPadding(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Helper function to add padding
function addPadding(number: number): string {
  return number < 10 ? '0' + number : number.toString();
}

// Log an event and update the global log data
function logEvent(eventName: string) {
  const time = formatDateTime(new Date());
  const logMessage = `[${eventName}] triggered [${time}]`;

  // Update the global app data

  const app = getApp();

  if (!app.globalData.log) {
    app.globalData.log = [];
  }
  app.globalData.log.push(logMessage);

  console.log(logMessage); // Optional: Log to console for debugging
  //save log to local storage 
  saveLogToStorage(logMessage)
  // check and update log
  checkAndUploadLogs()
}
// Save log to local storage
function saveLogToStorage(logMessage: string) {
  try {
    let logs = wx.getStorageSync('logs') || [];
    logs.push(logMessage);
    wx.setStorageSync('logs', logs);
  } catch (e) {
    console.error('Failed to save log to storage:', e);
  }
}
// Check storage size and upload logs if necessary
async function checkAndUploadLogs() {
  try {
    const logs = wx.getStorageSync('logs') || [];
    const logsSize = JSON.stringify(logs).length;
    console.log(logsSize)
    // Check if storage size exceeds 1MB ( now testing, set to 10kb )
    // TODO: Change storage size limit upon experiment
    // NOTE: the current size is about 100 logs 
    if (logsSize > 0.5 * 1024 * 10.24) {
      const app = getApp();
      const openid = app.globalData.openID;

      if (!openid) {
        console.error('OpenID is not available in global data');
        return;
      }

      // Upload logs to the cloud database
      await uploadLogsToCloud(logs, openid);

      // Clear local storage after uploading
      wx.removeStorageSync('logs');
    }
  } catch (e) {
    console.error('Failed to check and upload logs:', e);
  }
}

// Upload logs to the cloud database
async function uploadLogsToCloud(logs: string[], openid: string) {
  try {
    const db = wx.cloud.database();
    const logCollection = db.collection('log');

    await logCollection.add({
      data: {
        openid: openid,
        logs: logs,
        timestamp: new Date(),
      },
    });

    console.log('Logs successfully uploaded to the cloud');
  } catch (e) {
    console.error('Failed to upload logs to the cloud:', e);
  }
}
// Export the logEvent function for use in other parts of the application
export { logEvent };
