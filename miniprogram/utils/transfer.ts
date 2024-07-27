interface TransferResult {
  errMsg: string;
  result?: {
    error?: {
      code: string;
      message: string;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Transfers money to a specified user.
 * @param money Amount of money to transfer.
 * @param _openid OpenID of the recipient.
 * @param batch_name Name of the batch.
 * @param batch_remark Remark for the batch.
 * @param success Callback function for successful transfer.
 * @param fail Callback function for failed transfer.
 * @param error Callback function for error during transfer.
 * @returns Returns a Promise resolving to the result of the transfer.
 */
async function transfer({
  money, 
  _openid, 
  batch_name, 
  batch_remark, 
  success, 
  failed, 
  error 
}: { 
  money: number; 
  _openid: string; 
  batch_name: string; 
  batch_remark: string; 
  success?: (result: any) => void | Promise<void>; 
  failed?: (error: any) => void | Promise<void>; 
  error?: (err: any) => void | Promise<void>; 
}): Promise<any> {
  try {
    const result = await wx.cloud.callFunction({
      name: 'transfer',
      data: { money, _openid, batch_name, batch_remark },
    }) as TransferResult;

    if (result.errMsg === "cloud.callFunction:ok") {
      const { result: functionResult } = result;
      if (functionResult && !functionResult.error) {
        if (success) success(functionResult);
      } else {
        if (failed) failed(functionResult?.error || 'Unknown error');
      }
    } else {
      if (failed) failed(result.errMsg);
    }

    return result.result;
  } catch (err) {
    if (error) {
      error(err);
    } else {
      console.log(err);
    }
    throw err;
  }
}

export { transfer };
