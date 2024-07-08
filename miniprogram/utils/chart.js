import * as echarts from "../asset/ec-canvas/echarts"
import { getWeekRange } from "../utils/time"
function initChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(chart);
  const db = wx.cloud.database();
  const _ = db.command;
  const $ = db.command.aggregate;
  var { firstDayOfWeek } = getWeekRange();

  wx.cloud.callFunction({
    name: 'login',
    success: async (id_res) => {
      const userOpenId = id_res.result.data._openid;
      try {
        var f = new Date(firstDayOfWeek),
        a = $.dateFromString({
          dateString: f.toJSON()
        });
        const result = await db.collection('track')
          .aggregate()
          .addFields({
            matched: $.gte(["$endTime", a])
          })
          .match({
            _openid: userOpenId,
            matched:true
          })
          .unwind('$transport')
          .group({
            _id: '$transport',
            count: $.sum(1)
          })
          .end();
        console.log('result of query',result)        
        let walking = 0;
        let cycling = 0;
        let pub_transit = 0;
        let driving = 0;
        result.list.forEach(item => {
          if (item._id === "步行") {
            walking = item.count;
          } else if (item._id === "地铁" || item._id === "高铁" || item._id === "公交车") {
            pub_transit += item.count;
          } else if (item._id === "自行车(共享单车)" || item._id === "电动自行车") {
            cycling += item.count;
          } else {
            driving += item.count;
          }
        });

        var option = {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          legend: {
            orient: 'vertical',
            x: 'left',
            data: ['步行', '骑行', '公交', '开车'],
            textStyle: {
              color: '#ffffff'
            }
          },
          series: [{
            label: {
              show: false,
              position: 'center'
            },
            labelLine: {
              show: false
            },
            avoidLabelOverlap: false,
            emphasis: {
              label: {
                show: true,
                fontSize: '20',
                fontWeight: 'bold',
                fontColor: '#ffffff',
                formatter: '{b} : {c}'
              }
            },
            type: 'pie',
            center: ['50%', '50%'],
            radius: ['60%', '90%'],
            data: [{
              value: walking,
              name: '步行'
            }, 
            {
              value: cycling,
              name: '骑行'
            },
            {
              value: pub_transit,
              name: '公交'
            }, {
              value: driving,
              name: '开车'
            }]
          }]
        };

        chart.setOption(option);
      } catch (error) {
        console.error('Error getting transportation data:', error);
      }
    }
  });
  return chart;
}

export {initChart}
