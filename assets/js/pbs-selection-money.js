(function () {
  'use strict';
  var rates={CNY:1,USD:7.2,GBP:9.3,EUR:7.8,CAD:5.2,AUD:4.8,NZD:4.4,SGD:5.3,HKD:0.92};
  function amount(value,currency){return parseFloat(String(value || '0').replace(/,/g,''))*(rates[currency] || 1);}
  function tuition(info){return amount(info.tuition,info.tuitionCcy);}
  function living(info){return amount(info.living,info.livingCcy);}
  function years(info){return (String(info.duration).match(/[\d.]+/g) || ['0']).map(Number);}
  function total(info){return (tuition(info)+living(info))*Math.max.apply(null,years(info));}
  function format(value){return '≈ ￥'+(value/10000).toFixed(1)+'万（人民币）';}
  function cny(value){return '≈ ￥'+Math.round(value).toLocaleString('zh-CN');}
  function totalLabel(info){
    var duration=years(info),annual=tuition(info)+living(info),min=Math.min.apply(null,duration),max=Math.max.apply(null,duration);
    return min===max?format(annual*max):'≈ ￥'+(annual*min/10000).toFixed(1)+'–'+(annual*max/10000).toFixed(1)+'万（人民币）';
  }
  window.pbsSelectionMoney={rates:rates,amount:amount,tuition:tuition,living:living,total:total,format:format,cny:cny,totalLabel:totalLabel};
})();
