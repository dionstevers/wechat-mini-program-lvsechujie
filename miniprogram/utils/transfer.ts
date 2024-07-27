async function transfer(money: number, _openid: string, batch_name: string, batch_remark:string){
  try{
    const result = await wx.cloud.callFunction({
      name: 'transfer',
      data: { money, _openid, batch_name,batch_remark },
    });
    console.log(result)
    return result;
  }catch (err) {
    console.log(err)
  }
}


export { transfer }