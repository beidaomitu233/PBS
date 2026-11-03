(function () {
  'use strict';
  var rates=window.pbsSchoolCatalog.rates;
  function amount(value,currency){var number=parseFloat(String(value == null?'':value).replace(/,/g,''));return Number.isFinite(number) && rates[currency]!=null?number*rates[currency]:null;}
  function tuition(info){return amount(info.tuition,info.tuitionCcy);}
  function living(info){return amount(info.living,info.livingCcy);}
  function years(info){return (String(info.duration).match(/[\d.]+/g) || ['0']).map(Number);}
  function total(info){var fee=tuition(info),life=living(info);return fee==null || life==null?null:(fee+life)*Math.max.apply(null,years(info));}
  function format(value){return value==null?'未收录':'≈ ￥'+(value/10000).toFixed(1)+'万（人民币）';}
  function cny(value){return value==null?'未收录':'≈ ￥'+Math.round(value).toLocaleString('zh-CN');}
  function totalLabel(info){
    if(tuition(info)==null || living(info)==null)return '未收录';
    var duration=years(info),annual=tuition(info)+living(info),min=Math.min.apply(null,duration),max=Math.max.apply(null,duration);
    return min===max?format(annual*max):'≈ ￥'+(annual*min/10000).toFixed(1)+'–'+(annual*max/10000).toFixed(1)+'万（人民币）';
  }
  window.pbsSelectionMoney={rates:rates,amount:amount,tuition:tuition,living:living,total:total,format:format,cny:cny,totalLabel:totalLabel};
})();
