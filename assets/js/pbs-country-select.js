(function () {
  'use strict';
  var popular=['US','GB','CA','AU','NZ','SG','HK','CN','JP','KR','DE','FR'];
  function options(continent){return window.pbsCountries.filter(function(country){return !continent || country.continent===continent;}).map(function(country){return Object.assign({order:popular.indexOf(country.code)<0?99:popular.indexOf(country.code)},country);});}
  function mount(element,settings){
    settings=settings || {};
    var multiple=element.multiple;
    var control=new TomSelect(element,{
      options:options(settings.continent),items:settings.values || [],valueField:'value',labelField:'value',searchField:['value','en','code'],sortField:[{field:'order',direction:'asc'},{field:'$score',direction:'desc'}],
      plugins:multiple?{remove_button:{title:'移除'}}:{clear_button:{title:'清空'}},maxItems:multiple?null:1,maxOptions:300,create:false,closeAfterSelect:!multiple,
      placeholder:settings.placeholder || element.dataset.placeholder || '搜索国家 / 地区',
      render:{option:function(data,escape){return '<div class="pbs-country-option"><span>'+escape(data.value)+'</span><small>'+escape(data.en)+'</small></div>';},no_results:function(){return '<div class="no-results">未找到国家 / 地区</div>'; }},
      onChange:function(value){if(settings.onChange)settings.onChange(value);}
    });
    control.wrapper.classList.add('pbs-country-select');
    var region=settings.continent || '';
    control.setRegion=function(continent,values){
      if(region!==continent){region=continent;control.clear(true);control.clearOptions();control.addOptions(options(continent));}
      control.setValue(values || [],true);
    };
    return control;
  }
  window.pbsCountrySelect={mount:mount,options:options};
  document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('[data-country-select]').forEach(function(element){mount(element);});});
})();
