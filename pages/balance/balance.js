var Bmob = require("../../utils/bmob.js");
Page({
  data:{
    sumMon:null,
    detail:null,
    localPlace:false,
  },
  onShow() {
    //获取订单
    wx.getStorage({
      key: 'orderResult',
      success: ( res ) => {
        this.setData({
          sumMon: res.data.sumMon,
          detail: res.data.detail
        })

      }
    })

    // //获取桌号
    // wx.getStorage({
    //   key: 'place',
    //   success: ({data}) => {
    //     if (data) {
    //       this.setData({
    //         place:data,
    //         localPlace:true
    //       })
    //     }
    //   }
    // })
  },
  onHide(){
    wx.setStorage({
      key: "place",
      data: null
    })
  },
  pay(event){
    //console.log(event);
    let remarks = event.detail.value.remarks,
      sumMon = this.data.sumMon;
    let orderDetail = this.data.detail;

    if (remarks == "") remarks = "无";
    
    wx.scanCode({
      success: (res) => {
        console.log(res);
        wx.getStorage({
          key: 'openid',
          success: ress => {
            const currentUser = Bmob.User.current();
            const OrderB = Bmob.Object.extend("Order");
            const Order = new OrderB();
            let me = new Bmob.User();
            me.id = currentUser.id;

            //销售份增加
            const Diary = Bmob.Object.extend("menu");
            const query = new Bmob.Query(Diary);
            query.find({
              success: (res) => {
                for (let object of res) {
                  //console.log(object.id)
                  for (let i in orderDetail) {
                    if (object.id == orderDetail[i].id) {
                      object.increment("sale_number");
                      object.save();
                    }
                  }
                }
              },
              error: (error) => {
                console.log("查询失败: " + error.code + " " + error.message);
              }
            });

            //console.log(parseInt(sumMon))
            //console.log(parseInt(orderDetail))
            Order.set("orderUser", me);
            Order.set("amount", sumMon);
            Order.set("status", 1);
            Order.set("orderDetail", orderDetail);
            Order.save(null, {
              success: result => {
                wx.redirectTo({
                  url: '../transaction/transaction'
                })
              },
              error: (result, error) => {

              }
            });
          }
        })
      },
      'fail': res => {
        console.log(res);
        wx.getStorage({
          key: 'openid',
          success: ress => {
            const currentUser = Bmob.User.current();
            const OrderB = Bmob.Object.extend("Order");
            const Order = new OrderB();
            const me = new Bmob.User();
            me.id = currentUser.id;
            Order.set("remarks", remarks);
            Order.set("orderUser", me);
            Order.set("amount", parseInt(sumMon));
            Order.set("status", 0);
            Order.set("orderDetail", orderDetail);
            Order.save(null, {
              success: result => {
                //console.log(result.id)
              },
              error: (result, error) => {

              }
            });
          }
        })
      }
    })
  },
  settlement(event) {
    let remarks = event.detail.value.remarks,
      sumMon = this.data.sumMon;
      let orderDetail = this.data.detail;

      if (remarks == "") remarks = "无";
      
      wx.getStorage({
        key: 'openid',
        success: res => {
          
          const openId = res.data;
          if (!openId) {
            console.log('未获取到openId请刷新重试');
          }
          //传参数金额，名称，描述,openid
          Bmob.Pay.wechatPay(sumMon, '点餐小程序', '描述', openId).then( resp => {
            //服务端返回成功
            const timeStamp = resp.timestamp,
              nonceStr = resp.noncestr,
              packages = resp.package,
              orderId = resp.out_trade_no,//订单号，如需保存请建表保存。
              sign = resp.sign;

            //打印订单号
            console.log(orderId);
            //发起支付
            wx.requestPayment({
              'timeStamp': timeStamp,
              'nonceStr': nonceStr,
              'package': packages,
              'signType': 'MD5',
              'paySign': sign,
              'success': res => {
                //付款成功,这里可以写你的业务代码
                wx.getStorage({
                  key: 'openid',
                  success: ress => {
                    const currentUser = Bmob.User.current();
                    const OrderB = Bmob.Object.extend("Order");
                    const Order = new OrderB();
                    let me = new Bmob.User();
                    me.id = currentUser.id;
                    
                    //销售份增加
                    const Diary = Bmob.Object.extend("menu");
                    const query = new Bmob.Query(Diary);
                    query.find({
                      success: (res) => {
                        for (let object of res) {
                          console.log(object.id)
                          for (let i in orderDetail) {
                            if (object.id == orderDetail[i].id) {
                              object.increment("sale_number");
                              object.save();
                            }
                          }
                        }
                      },
                      error: (error) => {
                        console.log("查询失败: " + error.code + " " + error.message);
                      }
                    });

                    //console.log(tableNum)
                    //console.log(peopleNum)
                    //console.log(remarks)
                    //console.log(parseInt(sumMon))
                    //console.log(parseInt(orderDetail))
                    //console.log(parseInt(orderId))
                    //Order.set("tableNum", tableNum);
                    //Order.set("peopleNum", peopleNum);
                    Order.set("remarks", remarks);
                    Order.set("orderUser", me);
                    Order.set("amount", sumMon);
                    Order.set("status", 1);
                    Order.set("orderDetail", orderDetail);
                    Order.set("orderId", orderId);
                    Order.save(null, {
                      success: result => {
                        wx.redirectTo({
                          url: '../transaction/transaction'
                        })
                      },
                      error: (result, error) => {

                      }
                    });
                  }
                })
              },
              'fail': res => {

                wx.getStorage({
                  key: 'openid',
                  success: ress => {
                    const currentUser = Bmob.User.current();
                    const OrderB = Bmob.Object.extend("Order");
                    const Order = new OrderB();
                    const me = new Bmob.User();
                    me.id = currentUser.id;
                    //Order.set("tableNum", tableNum);
                    //Order.set("peopleNum", peopleNum);
                    Order.set("remarks", remarks);
                    Order.set("orderUser", me);
                    Order.set("amount", parseInt(sumMon));
                    Order.set("status", 0);
                    Order.set("orderDetail", res.data);
                    Order.save(null, {
                      success: result => {
                        //console.log(result.id)
                      },
                      error: (result, error) => {

                      }
                    });
                  }
                })
              }
            })

          }, err => {
            console.log('服务端返回失败');
            console.log(err);
          });
        }
      })
  }
})