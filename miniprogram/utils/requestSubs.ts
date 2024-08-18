function requestSubs(){
  wx.requestSubscribeMessage({
    tmplIds: ['5y8YOFHy-A9pS5kMFtk0iQhHVK8tC0uT7M5O17yCaeg','e4UcMMrp4Vqxn__UBC8UOEaoSDfd5ua1s3WUpmUfdWE'],
    success: function(res){
      console.log(res)
    },
    fail: function(err){
      console.log(err)
    }
  });
}

export { requestSubs }