const Bmob = require("../../utils/bmob.js");
Page({
  data: {
    currentTab: 0,
    currentType: "1",
    showCart: false,
    sumNum: 0,
    sumMon: 0,
    noOrder: true,
    menu:[]
  },
  onShareAppMessage() {
    return {
      title: "点餐小程序",
      path: "./pages/order/order"
    }
  },
  bindChange(e) {
    this.setData({ currentTab: e.detail.current });
  },
  onLoad(options) {
    
    if (options.tid){
      wx.setStorage({
        key: "place",
        data: options.tid
      })
    }else{
      wx.removeStorage({
        key: 'place',
        success: function (res) {
          console.log(res.data)
        }
      })
    }

    this.setData({
      currentTab: options.currentTab
    })
    wx.getSystemInfo({
      success: res => {
        this.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }
    });

    const Menu_type = Bmob.Object.extend("menu_type");
    const query = new Bmob.Query(Menu_type);
    query.find({
      success: result => {
        const typeArray = [];
        let hot = {id:"rexiao",type_name:"热销"};
        let rec = {id:"tuijian",type_name:"推荐"};
        for (let object of result) {
          typeArray.push({
            id: object.id,
            type_name: object.get('type_name')
          });          
        }
        typeArray.unshift(hot); //热销
        typeArray.unshift(rec); //推荐

        console.log(typeArray)
        this.setData({
          currentType: typeArray[0].id,
          menu: typeArray
        })


        
      },
      error: error => {

      }
    })

    const Menu = Bmob.Object.extend("menu");
    const Mquery = new Bmob.Query(Menu);
    Mquery.include("type");
    Mquery.find({
      success: result => {
        const menuType = this.data.menu,
          menuArray = [],
          Data = [];

        for (let object of result) {
          menuArray.push({
            id:object.id,
            type_name: object.get("type").get("type_name"),
            is_rec: object.get("is_rec"),
            is_hot: object.get("is_hot"),
            price: object.get("price"),
            menu_name: object.get("menu_name"),
            createdAt: object.createdAt,
            menu_logo: object.get("menu_logo"),
            sale_number: object.get("sale_number"),
            num: 0
          });
        }
        for (let item of menuType) {
          const menuData = { foodType: item.type_name, id: item.id, data: [] };
          for (let items of menuArray) {
            if (item.type_name == items.type_name) {
              menuData.data.push(items);
            }
            if (items.is_hot && item.type_name == "热销"){
              menuData.data.push(items);
            }
            if (items.is_rec && item.type_name == "推荐") {
              menuData.data.push(items);
            }
          }
          Data.push(menuData);
        }
        this.setData({
          menu: Data
        })
      },
      error: function (error) {
      }
    })

    wx.getStorage({
      key: 'openid',
      success: ress => {
        const currentUser = Bmob.User.current();

        const me = new Bmob.User();
        me.id = currentUser.id;

        const Order = Bmob.Object.extend("Order");
        const queryOrder = new Bmob.Query(Order);
        queryOrder.equalTo("orderUser", me);
        queryOrder.descending("createdAt");
        queryOrder.find({
          success: result => {
            const orderArray = [];
            for (let object of result) {
              let status;
              switch (object.get("status")) {
                case 1:
                  status = "等待确认";
                  break;
                case 2:
                  status = "已确认";
                  break;
                default:
                  status = "待付款";
                  break;
              }

              orderArray.push({
                orderId: object.get("orderId"),
                orderDetail: object.get("orderDetail"),
                amount: object.get("amount"),
                remarks: object.get("remarks"),
                status: status,
                createdAt: object.createdAt
              });
            }
            this.setData({
              orderArray: orderArray
            })
          },
          error: error => {
          }
        })
      }
    })
  },
  refresh(){
    this.onShow()
  },
  onShow() {
    wx.getStorage({
      key: 'openid',
      success: ress => {
        const currentUser = Bmob.User.current();

        const me = new Bmob.User();
        me.id = currentUser.id;

        const Order = Bmob.Object.extend("Order");
        const queryOrder = new Bmob.Query(Order);
        queryOrder.descending("createdAt");
        queryOrder.equalTo("orderUser", me);
        queryOrder.find({
          success: result => {
            const orderArray = [];
            for (let object of result) {
              let status;
              switch (object.get("status")) {
                case 1:
                  status = "等待确认";
                  break;
                case 2:
                  status = "已确认";
                  break;
                default:
                  status = "待付款";
                  break;
              }

              orderArray.push({
                orderId: object.get("orderId"),
                orderDetail: object.get("orderDetail"),
                remarks: object.get("remarks"),
                status: status,
                amount: object.get("amount"),
                createdAt: object.createdAt
              });
            }
            this.setData({
              orderArray: orderArray
            })
          },
          error: error => {
          }
        })
      }
    })

    wx.setStorage({
      key: "orderResult",
      data: {}
    })
  },
  swichNav(e) {
    if (this.data.currentTab === e.target.dataset.current) {
      return false;
    } else {
      this.setData({
        currentTab: e.target.dataset.current
      })
    }
  },
  chooseType(event) {
    this.setData({
      currentType: event.target.dataset.foodtype
    })
  },
  seeDetailCart() {
    if (this.data.noOrder) return false;
    
    this.setData({
      showCart: !this.data.showCart
    })
  },
  addFoodNum(e) {
    let addFoodNum = e.target.dataset.num + 1,
      idx = parseInt(e.target.dataset.idx),
      jdx = parseInt(e.target.dataset.jdx),
      foodName = e.target.dataset.foodName,
      price = e.target.dataset.price,
      sumNum = this.data.sumNum + 1,
      isOrder = this.data.noOrder,
      jsonA = this.data.menu;

    console.log(jsonA)

    jsonA[idx]["data"][jdx]["num"] = addFoodNum;



    if (sumNum > 0) {
      isOrder = false;
    }

    let sumPrice = parseFloat(this.data.sumMon) + parseFloat(price);
    sumPrice = parseFloat(sumPrice.toFixed(2));

    this.setData({
      menu: jsonA,
      sumNum: sumNum,
      noOrder: isOrder,
      sumMon: sumPrice
    });


  },
  reduceFoodNum(event) {
    let redFoodNum = event.target.dataset.num - 1,
      foodName = event.target.dataset.foodName,
      idx = parseInt(event.target.dataset.idx),
      jdx = parseInt(event.target.dataset.jdx),
      price = parseFloat(event.target.dataset.price),
      sumNum = parseFloat(this.data.sumNum) - 1,
      isOrder = this.data.noOrder,
      jsonB = this.data.menu;

    jsonB[idx]["data"][jdx]["num"] = redFoodNum;

    if (sumNum <= 0 ) {
      isOrder = true;
      this.setData({
        showCart: false
      })
    }

    let sumPrice = this.data.sumMon - price;
    sumPrice = parseFloat(sumPrice.toFixed(2));

    this.setData({
      menu: jsonB,
      sumNum: sumNum,
      noOrder: isOrder,
      sumMon: sumPrice
    })

  },
  hiddenLayer() {
    this.setData({
      showCart: false
    })
  },
  clearCart() {
    wx.showModal({
      content: '清空购物车？',
      success: res => {
        if (res.confirm) {
          let jsonC = this.data.menu;
          for (let i in jsonC) {
            for (let j in jsonC[i].data) {
              jsonC[i].data[j].num = 0;
            }
          }
          this.setData({
            menu: jsonC,
            sumNum: 0,
            sumMon: 0,
            noOrder: true,
            showCart: false
          })
        }
      }
    })

  },
  placeOrder() {
    if (this.data.noOrder) return false;

    const detailArray = [];
    const jsonC = this.data.menu;
    for (let i=2; i<jsonC.length; i++) {
      for (let j in jsonC[i].data) {
        if (jsonC[i].data[j].num) {
          detailArray.push({
            id: jsonC[i].data[j].id,
            menu_name: jsonC[i].data[j].menu_name,
            num: jsonC[i].data[j].num,
            price: jsonC[i].data[j].price
          });
        }
      }
    }
    const orderResult = {
      sumMon: this.data.sumMon,
      detail: detailArray
    }
    wx.setStorage({
      key: "orderResult",
      data: orderResult
    })
    wx.navigateTo({
      url: '../balance/balance'
    })
  }
})