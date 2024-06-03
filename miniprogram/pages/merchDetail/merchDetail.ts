Page({
  data: {
    merch: {
      merch_id: '',
      image: '',
      title: '',
      description: '',
      longDescription: '',
      price: 0
    }
  },
  onLoad(options) {
    const merchId = options.merch_id;
    this.getMerchDetail(merchId);
  },
  getMerchDetail(merchId) {
    const prizes = wx.getStorageSync('prizes');
    const merch = prizes.find(item => item.merch_id == merchId);
    if (merch) {
      this.setData({ merch });
    }
  },
  claimMerch() {
    wx.showToast({
      title: 'Merch claimed!',
      icon: 'success'
    });
  }
});
