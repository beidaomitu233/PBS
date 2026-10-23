(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('mode') === 'catalog') return;
  var root, records, state, timer;
  var chevron='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>';
  var spark='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linejoin="round" d="m9 3 2.5 6.5L18 12l-6.5 2.5L9 21l-2.5-6.5L0 12l6.5-2.5L9 3Zm10-2 1.4 3.6L24 6l-3.6 1.4L19 11l-1.4-3.6L14 6l3.6-1.4L19 1Z"/></svg>';
  var scoreTypes=['雅思','新托福','老托福','GPA','IB','A-Level','AP','SAT','高考总分'];
  var extras={
    cmu:{category:'工科',discipline:'计算机科学与技术',direction:'人工智能',careers:['互联网 / 科技','金融'],cooperation:'有合作',softRank:80,life:12},
    uiuc:{category:'工科',discipline:'计算机科学与技术',direction:'软件工程',careers:['互联网 / 科技','咨询'],cooperation:'有合作',softRank:52,life:10},
    gatech:{category:'工科',discipline:'计算机科学与技术',direction:'人工智能',careers:['互联网 / 科技','制造业'],cooperation:'无合作',softRank:151,life:10},
    nyu:{category:'理科',discipline:'统计学',direction:'数据科学',careers:['金融','互联网 / 科技'],cooperation:'有合作',softRank:28,life:16},
    bu:{category:'工科',discipline:'计算机科学与技术',direction:'软件工程',careers:['互联网 / 科技','咨询'],cooperation:'无合作',softRank:101,life:14},
    nus:{category:'工科',discipline:'电子工程',direction:'通信工程',careers:['互联网 / 科技','制造业'],cooperation:'有合作',softRank:68,life:9},
    hku:{category:'理科',discipline:'统计学',direction:'数据科学',careers:['金融','咨询'],cooperation:'无合作',softRank:69,life:10}
  };
  function esc(v){return String(v == null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function defaults(){return {keyword:'',prompt:'',continent:'',countries:[],schools:[],stage:'',duration:'',categories:[],disciplines:[],directions:[],board:'',rank:'',languages:[],scores:[{type:'雅思',value:''}],feeType:'firstLife',feeMin:'',feeMax:'',period:null,careers:[],employers:[],salaryMin:0,salaryMax:100,cooperation:'',includeUnknown:true};}
  function readState(){
    var value;try{value=JSON.parse(new URLSearchParams(location.search).get('filters') || 'null');}catch(e){}
    var next=Object.assign(defaults(),value && typeof value==='object' && !Array.isArray(value)?value:{});
    ['countries','schools','categories','disciplines','directions','languages','careers','employers'].forEach(function(key){if(!Array.isArray(next[key])) next[key]=[];});
    if(!Array.isArray(next.scores) || !next.scores.length) next.scores=[{type:'雅思',value:''}];
    next.scores=next.scores.map(function(row){return {type:scoreTypes.indexOf(row.type)>=0?row.type:'雅思',value:String(row.value || '')};});
    return next;
  }
  function selected(value,filter){return !filter.length || (unknown(value)?state.includeUnknown:filter.indexOf(value)>=0);}
  function any(values,filter){return !filter.length || (!values.length?state.includeUnknown:values.some(function(value){return filter.indexOf(value)>=0;}));}
  function unknown(value){return value===null || value===undefined || value==='';}
  function accepts(value,predicate){return unknown(value)?state.includeUnknown:predicate(value);}
  function unique(list){return Array.from(new Set(list));}
  function makeRecords(){
    return Array.from(document.querySelectorAll('#schoolList [data-school]')).map(function(card){
      var d=card.dataset,info=window.SCHOOL_INFO[d.school] || {},extra=extras[d.school] || {};
      var record=Object.assign({id:d.school,card:card,name:info.name,country:d.country,continent:['美国','加拿大'].indexOf(d.country)>=0?'北美洲':['英国','德国','法国'].indexOf(d.country)>=0?'欧洲':['澳大利亚','新西兰'].indexOf(d.country)>=0?'大洋洲':'亚洲',stage:/BS|学士|本科/.test(d.degree)?'本科':'硕士',years:Math.max.apply(null,(d.duration.match(/[\d.]+/g)||[0]).map(Number)),rank:Number(d.rank),language:info.language,tuition:Number(d.tuition),start:info.appStart,end:info.appDeadline,keyword:[d.kw,info.name,info.major,info.degree,info.intro].join(' ').toLowerCase(),scores:{'雅思':d.ielts,'新托福':d.toefl,'GPA':d.gpa},careers:[],employers:[]},extra);
      var aliases={Google:'谷歌',Microsoft:'微软',Amazon:'亚马逊',HSBC:'汇丰'};
      record.employers=(info.employers || '').split(/[、,，]/).map(function(name){name=name.trim();return aliases[name] || name;}).filter(Boolean);
      var salary=String(info.salary || '').match(/([\d,]+)\s*\//),salaryRates={USD:7.2,SGD:5.3,HKD:.92};
      record.salary=salary?Math.round(Number(salary[1].replace(/,/g,''))*(salaryRates[(info.salary.match(/USD|SGD|HKD/) || [])[0]] || 1)/1000)/10:null;
      return record;
    });
  }
  function pills(key,label,options){return '<div class="sc-field"><span>'+label+'</span><div class="sc-pills">'+options.map(function(pair){return '<button type="button" data-pick="'+key+'" data-value="'+pair[0]+'" aria-pressed="false">'+pair[1]+'</button>';}).join('')+'</div></div>';}
  function multi(key,label){return '<div class="sc-field"><span id="sc-label-'+key+'">'+label+'</span><details class="sc-multi" data-multi="'+key+'"><summary aria-labelledby="sc-label-'+key+' sc-value-'+key+'"><span id="sc-value-'+key+'" data-summary>不限</span>'+chevron+'</summary><div class="sc-options"><input type="search" aria-label="搜索'+label+'" placeholder="搜索'+label+'" data-option-search="'+key+'"><div data-options="'+key+'"></div></div></details></div>';}
  function select(key,label,options){return '<label class="sc-field"><span>'+label+'</span><select data-field="'+key+'">'+options.map(function(item){return '<option value="'+esc(item[0])+'">'+esc(item[1])+'</option>';}).join('')+'</select></label>';}
  function mount(){
    document.body.classList.add('sc-workbench');
    document.getElementById('schoolFilterPanel').remove();
    root=document.createElement('section');root.id='scFilters';root.setAttribute('aria-label','筛选院校');
    root.innerHTML='<div class="sc-filter-heading"><h2>筛选院校</h2><div><button type="button" data-clear>全部清除</button><button type="button" data-fold aria-expanded="true" aria-controls="scFilterBody">收起筛选'+chevron+'</button></div></div>'+
      '<label class="sc-query-label" for="scQuery">学校、专业或选校需求</label><div class="sc-query-row"><div class="sc-query-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" id="scQuery" aria-label="学校、专业或选校需求" placeholder="输入学校 / 专业，或描述需求，如：美国计算机硕士，QS前50，预算30–50万"></div><button type="button" class="sc-btn primary" data-ai>'+spark+'智能匹配</button></div><div class="sc-query-options"><label class="sc-null"><input type="checkbox" id="scIncludeUnknown">包含筛选项无数据的专业</label></div>'+
      '<div id="scFilterBody"><div class="sc-tabs" role="tablist" aria-label="筛选条件分组">'+['地区与学校','专业与课程','申请与预算','就业与合作'].map(function(label,i){return '<button type="button" id="sc-tab-'+i+'" role="tab" data-tab="'+i+'" aria-selected="'+(i===0)+'" aria-controls="sc-panel-'+i+'" tabindex="'+(i===0?'0':'-1')+'">'+label+'</button>';}).join('')+'</div>'+
      '<div class="sc-filter-panel" id="sc-panel-0" role="tabpanel" aria-labelledby="sc-tab-0"><div class="sc-wide">'+pills('continent','大洲',[['','不限'],['亚洲','亚洲'],['欧洲','欧洲'],['北美洲','北美洲'],['南美洲','南美洲'],['大洋洲','大洋洲'],['非洲','非洲']])+'</div><div class="sc-grid two">'+multi('countries','国家 / 地区')+multi('schools','学校')+'</div></div>'+
      '<div class="sc-filter-panel" id="sc-panel-1" role="tabpanel" aria-labelledby="sc-tab-1" hidden><div class="sc-grid two sc-course-level">'+pills('stage','学术阶段',[['','不限'],['本科','本科'],['硕士','硕士']])+pills('duration','学制时长',[['','不限'],['0-1','0–1年'],['1-2','1–2年'],['2-3','2–3年'],['3+','3年以上']])+'</div><div class="sc-grid">'+multi('categories','学科门类')+multi('disciplines','二级学科')+multi('directions','具体方向')+select('board','排名榜单',[['','不限'],['qs','QS排名'],['sh','软科排名']])+select('rank','名次区间',[['','先选择榜单']])+multi('languages','教学语言')+'</div></div>'+
      '<div class="sc-filter-panel" id="sc-panel-2" role="tabpanel" aria-labelledby="sc-tab-2" hidden><div class="sc-grid">'+select('feeType','费用类型',[['firstLife','首年费用＋单年生活费'],['first','首年费用'],['total','全部学制总费用']])+'<div class="sc-field"><span>费用预算（万元）</span><div class="sc-range"><input type="number" min="0" step="0.1" data-field="feeMin" aria-label="最低费用预算" placeholder="最低"><span>—</span><input type="number" min="0" step="0.1" data-field="feeMax" aria-label="最高费用预算" placeholder="最高"></div><small>查询上限按输入金额上浮 10%</small></div><div class="sc-field"><span>可申请时间</span><button type="button" class="sc-period" data-period><span id="scPeriodLabel">不限</span>'+chevron+'</button></div></div><div class="sc-score-heading"><span>成绩要求</span><button type="button" data-add-score>＋ 添加成绩</button></div><div id="scScores"></div></div>'+
      '<div class="sc-filter-panel" id="sc-panel-3" role="tabpanel" aria-labelledby="sc-tab-3" hidden><div class="sc-grid">'+multi('careers','求职领域')+multi('employers','适配雇主')+pills('cooperation','合作商合作',[['','不限'],['有合作','有合作'],['无合作','无合作']])+'<div class="sc-field sc-salary"><span>起薪预期（万元 / 年）</span><div class="sc-range"><input type="number" min="0" max="100" data-field="salaryMin" aria-label="最低起薪"><span>—</span><input type="number" min="0" max="100" data-field="salaryMax" aria-label="最高起薪"></div><div class="sc-salary-sliders"><input type="range" min="0" max="100" data-salary="salaryMin" aria-label="最低起薪滑块"><input type="range" min="0" max="100" data-salary="salaryMax" aria-label="最高起薪滑块"></div></div></div></div></div><p class="sc-error" id="scFilterError" role="alert" hidden></p><p class="sc-match-result" id="scAiResult" role="status" hidden></p>';
    document.getElementById('schoolWorkspace').before(root);
    var title=document.createElement('div');title.className='sc-library-heading';title.innerHTML='<h2>院校列表 <span id="scResultCount"></span></h2><span>点击查看详情</span>';
    document.getElementById('schoolLibraryColumn').prepend(title);
    document.querySelector('#schoolList > p').remove();
    var empty=document.getElementById('school-empty');empty.textContent='暂无匹配结果，可放宽排名、费用或成绩条件后再试';
  }
  function taskHeader(){
    var bar=document.getElementById('schoolTaskContextBar'),heading=bar.firstElementChild,item=window.pbsSelection && window.pbsSelection.find(window.TASK_PROJECT_NO);
    if(!item || !heading || !heading.querySelector('#selectionStatus')) return;
    var back=heading.querySelector('.pbs-detail-back'),actions=heading.querySelector('.selection-task-actions'),status=heading.querySelector('#selectionStatus');
    back.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m14 5-7 7 7 7"/></svg><span>选校列表</span>';
    back.className='sc-back';back.setAttribute('aria-label','返回选校任务列表');
    var info=document.createElement('div');info.className='sc-task-meta';
    info.innerHTML='<strong>'+esc(item.id)+'</strong><span>申请人：<b>'+esc(item.student)+'</b></span><span>申请层次：<b>'+esc(item.level)+'</b></span><span>意向国家：<b>'+esc(item.country)+'</b></span>';
    info.appendChild(status);heading.replaceChildren(back,info,actions);heading.className='sc-task-heading';
    var supplement=actions.querySelector('[onclick="openStudentSupplement()"]');
    if(supplement){supplement.className='sc-supplement';supplement.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linejoin="round" d="M9 4H5v17h14V4h-4M9 2h6v5H9zM12 10v7m-3-3h6"/></svg>补充信息';}
  }
  function candidateRows(key){
    return records.filter(function(r){
      if(key==='countries') return !state.continent || r.continent===state.continent;
      if(key==='schools') return (!state.continent || r.continent===state.continent) && selected(r.country,state.countries);
      if(key==='disciplines') return selected(r.category,state.categories);
      if(key==='directions') return selected(r.category,state.categories) && selected(r.discipline,state.disciplines);
      return true;
    });
  }
  var keys={countries:'country',schools:'id',categories:'category',disciplines:'discipline',directions:'direction',languages:'language',careers:'careers',employers:'employers'};
  function choices(key){
    var map={};candidateRows(key).forEach(function(r){var values=Array.isArray(r[keys[key]])?r[keys[key]]:[r[keys[key]]];values.filter(Boolean).forEach(function(value){if(!map[value]) map[value]={value:value,label:key==='schools'?r.name:value,count:0};map[value].count++;});});return Object.values(map);
  }
  function prune(){['countries','schools','categories','disciplines','directions','languages','careers','employers'].forEach(function(key){var valid=choices(key).map(function(o){return o.value;});state[key]=state[key].filter(function(value){return valid.indexOf(value)>=0;});});}
  function multiFields(){
    var active=document.activeElement,focus=active && active.dataset.multiKey?{key:active.dataset.multiKey,value:active.value}:null;
    Object.keys(keys).forEach(function(key){
      var box=root.querySelector('[data-multi="'+key+'"]'),options=choices(key),summary=box.querySelector('[data-summary]');
      var labels=options.filter(function(o){return state[key].indexOf(o.value)>=0;}).map(function(o){return o.label;});summary.textContent=labels.length?labels.join('、'):'不限';summary.title=summary.textContent;
      box.querySelector('[data-options]').innerHTML=options.length?options.map(function(o){return '<label><input type="checkbox" data-multi-key="'+key+'" value="'+esc(o.value)+'" aria-label="'+esc(o.label)+'" '+(state[key].indexOf(o.value)>=0?'checked':'')+'><span>'+esc(o.label)+'</span><small>'+o.count+'</small></label>';}).join(''):'<p class="sc-options-empty">暂无可选项</p>';
      var query=box.querySelector('[data-option-search]').value.trim().toLowerCase();box.querySelectorAll('[data-options] label').forEach(function(label){label.hidden=!!query && label.textContent.toLowerCase().indexOf(query)<0;});
    });
    if(focus){var checkbox=Array.from(root.querySelectorAll('[data-multi-key="'+focus.key+'"]')).find(function(input){return input.value===focus.value;});if(checkbox) checkbox.focus();}
  }
  function rankOptions(){
    var select=root.querySelector('[data-field="rank"]');select.disabled=!state.board;
    var values=state.board==='qs'?[[0,10],[11,30],[31,50],[51,100],[101,9999]]:[[0,50],[51,100],[101,200],[201,9999]];
    select.innerHTML='<option value="">'+(state.board?'不限':'先选择榜单')+'</option>'+values.map(function(pair){return '<option value="'+pair.join('-')+'">'+(pair[0]===0?'前 '+pair[1]+' 名':pair[1]===9999?(pair[0]-1)+' 名以后':pair[0]+'–'+pair[1]+' 名')+'</option>';}).join('');
    if(state.board && /^0-\d{1,3}$/.test(state.rank) && !Array.from(select.options).some(function(option){return option.value===state.rank;})) select.add(new Option('前 '+state.rank.split('-')[1]+' 名',state.rank));
    select.value=state.rank;
  }
  function scoreRows(){
    document.getElementById('scScores').innerHTML=state.scores.map(function(row,i){return '<div class="sc-score-row"><select data-score-type="'+i+'" aria-label="成绩类型 '+(i+1)+'">'+scoreTypes.map(function(type){return '<option '+(row.type===type?'selected':'')+'>'+type+'</option>';}).join('')+'</select><input data-score-value="'+i+'" aria-label="成绩分数 '+(i+1)+'" type="'+(row.type==='A-Level'?'text':'number')+'" '+(row.type==='A-Level'?'placeholder="如 AAA"':'min="0" step="0.1" placeholder="输入学生成绩"')+' value="'+esc(row.value)+'"><button type="button" data-remove-score="'+i+'" aria-label="移除成绩条件 '+(i+1)+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linecap="round" d="m6 6 12 12M18 6 6 18"/></svg></button></div>';}).join('');
  }
  function paint(){
    root.querySelectorAll('[data-field]').forEach(function(el){el.value=state[el.dataset.field];});rankOptions();multiFields();scoreRows();
    document.getElementById('scQuery').value=state.prompt || state.keyword;document.getElementById('scIncludeUnknown').checked=state.includeUnknown;
    root.querySelectorAll('[data-pick]').forEach(function(button){button.setAttribute('aria-pressed',String(state[button.dataset.pick]===button.dataset.value));});
    root.querySelectorAll('[data-salary]').forEach(function(input){input.value=state[input.dataset.salary];});
    document.getElementById('scPeriodLabel').textContent=state.period?[state.period.start,state.period.end].join(' 至 '):'不限';
  }
  function grade(value){var grades=String(value).toUpperCase().match(/A\*|[ABCDE]/g);return grades?grades.reduce(function(sum,g){return sum+({'A*':6,A:5,B:4,C:3,D:2,E:1}[g] || 0);},0):NaN;}
  function passes(r){
    if(state.keyword && r.keyword.indexOf(state.keyword.toLowerCase())<0) return false;
    if(state.continent && r.continent!==state.continent || !selected(r.country,state.countries) || !selected(r.id,state.schools)) return false;
    if(state.stage && r.stage!==state.stage) return false;
    if(state.duration){var ends=state.duration.split('-').map(Number);if(state.duration==='3+'?r.years<=3:!(r.years<=ends[1] && (ends[0]===0?r.years>=0:r.years>ends[0]))) return false;}
    if(!selected(r.category,state.categories) || !selected(r.discipline,state.disciplines) || !selected(r.direction,state.directions) || !selected(r.language,state.languages)) return false;
    if(state.board && state.rank){var rank=state.board==='qs'?r.rank:r.softRank,range=state.rank.split('-').map(Number);if(!accepts(rank,function(v){return v>=range[0] && v<=range[1];})) return false;}
    if(!state.scores.every(function(row){if(row.value==='') return true;return accepts(r.scores[row.type],function(value){return row.type==='A-Level'?grade(value)<=grade(row.value):parseFloat(value)<=Number(row.value);});})) return false;
    var fee=state.feeType==='firstLife'?r.tuition+r.life:state.feeType==='total'?r.tuition*r.years:r.tuition;
    if((state.feeMin!=='' || state.feeMax!=='') && !accepts(fee,function(v){return (state.feeMin==='' || v>=Number(state.feeMin)) && (state.feeMax==='' || v<=Number(state.feeMax)*1.1);})) return false;
    if(state.period && !accepts(r.start && r.end,function(){return r.start<=periodDate(state.period.end,true) && r.end>=periodDate(state.period.start,false);})) return false;
    if(!any(r.careers,state.careers) || !any(r.employers,state.employers)) return false;
    if((state.salaryMin>0 || state.salaryMax<100) && !accepts(r.salary,function(v){return v>=Number(state.salaryMin) && v<=Number(state.salaryMax);})) return false;
    return !state.cooperation || r.cooperation===state.cooperation;
  }
  function validate(){
    var error='';
    if(state.feeMin!=='' && state.feeMax!=='' && Number(state.feeMin)>Number(state.feeMax)) error='最低费用不能高于最高费用';
    if(Number(state.feeMin)<0 || Number(state.feeMax)<0) error='费用预算不能为负数';
    if(Number(state.salaryMin)>Number(state.salaryMax)) error='最低起薪不能高于最高起薪';
    if(Number(state.salaryMin)<0 || Number(state.salaryMax)>100) error='起薪预期应在 0–100 万元之间';
    var invalid=state.scores.find(function(row){return row.value!=='' && (row.type==='A-Level'?!/^(?:A\*|[ABCDE]){1,5}$/i.test(row.value):Number(row.value)<0);});
    if(invalid) error=invalid.type==='A-Level'?'A-Level 成绩请输入字母等级，如 AAA 或 A*AA':'成绩不能为负数';
    var el=document.getElementById('scFilterError');el.textContent=error;el.hidden=!error;return !error;
  }
  function apply(write){
    clearTimeout(timer);if(!validate()) return;
    var matches=[];records.forEach(function(r){var show=passes(r);r.card.classList.toggle('hidden',!show);if(show) matches.push(r);});
    document.getElementById('scResultCount').textContent=matches.length+' 所';document.getElementById('school-empty').classList.toggle('hidden',matches.length>0);
    var detail=document.getElementById('schoolDetail');
    if(!matches.length){detail.innerHTML='<div class="sc-detail-empty">暂无匹配院校</div>';detail.dataset.empty='true';}
    else if(detail.dataset.empty==='true' || !matches.some(function(r){return r.id===window.currentSchool;})){window.selectSchool(matches.some(function(r){return r.id===window.currentSchool;})?window.currentSchool:matches[0].id);delete detail.dataset.empty;}
    document.querySelectorAll('#schoolDetailColumn button').forEach(function(button){button.disabled=!matches.length;});
    var counts=[Number(!!state.continent)+state.countries.length+state.schools.length,Number(!!state.stage)+Number(!!state.duration)+state.categories.length+state.disciplines.length+state.directions.length+state.languages.length+Number(!!(state.board && state.rank)),state.scores.filter(function(row){return row.value!=='';}).length+Number(state.feeMin!=='' || state.feeMax!=='')+Number(!!state.period),state.careers.length+state.employers.length+Number(state.salaryMin>0 || state.salaryMax<100)+Number(!!state.cooperation)];
    ['地区与学校','专业与课程','申请与预算','就业与合作'].forEach(function(label,index){var tab=document.getElementById('sc-tab-'+index);tab.setAttribute('aria-label',label+(counts[index]?'，已选 '+counts[index]+' 项':''));tab.innerHTML=label+(counts[index]?'<span class="sc-tab-count" aria-hidden="true">'+counts[index]+'</span>':'');});
    if(write){var url=new URL(location.href);if(JSON.stringify(state)===JSON.stringify(defaults())) url.searchParams.delete('filters');else url.searchParams.set('filters',JSON.stringify(state));if(url.href!==location.href) history.pushState(null,'',url);}
  }
  function change(){prune();multiFields();apply(true);}
  function periodDate(value,end){if(value.length===4) return value+(end?'-12-31':'-01-01');if(value.length===7){var p=value.split('-');return value+'-'+(end?new Date(Number(p[0]),Number(p[1]),0).getDate():'01');}return value;}
  function openPeriod(){
    var trigger=document.activeElement,dialog=document.createElement('dialog'),draft=Object.assign({precision:'month',start:'',end:''},state.period || {});dialog.className='sc-period-dialog';dialog.setAttribute('aria-label','可申请时间');
    dialog.innerHTML='<header><h2>可申请时间</h2><button type="button" data-close aria-label="关闭">×</button></header><div class="sc-period-body"><div class="sc-pills">'+[['year','按年'],['month','按月'],['day','按日']].map(function(pair){return '<button type="button" data-precision="'+pair[0]+'">'+pair[1]+'</button>';}).join('')+'</div><div class="sc-grid two"><label class="sc-field"><span>开始时间</span><input id="scPeriodStart" aria-label="开始时间"></label><label class="sc-field"><span>结束时间</span><input id="scPeriodEnd" aria-label="结束时间"></label></div><p class="sc-error" role="alert" hidden></p></div><footer><button type="button" class="sc-btn" data-period-clear>清空</button><div><button type="button" class="sc-btn" data-close>取消</button><button type="button" class="sc-btn primary" data-confirm>确定</button></div></footer>';
    function precision(){dialog.querySelectorAll('[data-precision]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.precision===draft.precision));});['Start','End'].forEach(function(name){var input=dialog.querySelector('#scPeriod'+name),key=name.toLowerCase();input.type=draft.precision==='year'?'number':draft.precision==='month'?'month':'date';if(draft.precision==='year'){input.min=2000;input.max=2100;input.placeholder='如 2026';}else{input.removeAttribute('min');input.removeAttribute('max');input.placeholder='';}input.value=draft[key];});}
    dialog.onclick=function(e){var b=e.target.closest('button');if(e.target===dialog || b && b.hasAttribute('data-close')) dialog.close();if(!b) return;
      if(b.dataset.precision){draft.start=dialog.querySelector('#scPeriodStart').value;draft.end=dialog.querySelector('#scPeriodEnd').value;draft.precision=b.dataset.precision;['start','end'].forEach(function(key){if(draft[key]) draft[key]=draft.precision==='year'?draft[key].slice(0,4):draft.precision==='month'?(draft[key]+'-01').slice(0,7):periodDate(draft[key],key==='end');});precision();}
      if(b.hasAttribute('data-period-clear')){state.period=null;paint();apply(true);dialog.close();}
      if(b.hasAttribute('data-confirm')){var start=dialog.querySelector('#scPeriodStart').value,end=dialog.querySelector('#scPeriodEnd').value,error=dialog.querySelector('.sc-error');if(!start || !end || draft.precision==='year' && (Number(start)<2000 || Number(end)>2100) || periodDate(start,false)>periodDate(end,true)){error.hidden=false;error.textContent='请填写有效的开始和结束时间，结束时间不能早于开始时间';return;}state.period={precision:draft.precision,start:start,end:end};paint();apply(true);dialog.close();}
    };
    dialog.onclose=function(){dialog.remove();trigger.focus();};document.body.appendChild(dialog);precision();dialog.showModal();
  }
  function smartMatch(){
    var text=document.getElementById('scQuery').value.trim();if(!text){state=defaults();paint();apply(true);document.getElementById('scAiResult').hidden=true;return;}
    var t=text.replace(/两/g,'2'),matched=[],next=defaults();next.prompt=text;
    var countries=unique(records.map(function(r){return r.country;})).filter(function(country){return t.indexOf(country)>=0;});if(countries.length){next.countries=countries;matched.push(countries.join('、'));}
    var continent=['亚洲','欧洲','北美洲','南美洲','大洋洲','非洲'].find(function(name){return t.indexOf(name)>=0;});if(continent){next.continent=continent;matched.push(continent);}
    var schools=records.filter(function(r){return t.indexOf(r.name)>=0 || new RegExp('\\b'+r.id+'\\b','i').test(t);});if(schools.length){next.schools=schools.map(function(r){return r.id;});matched.push(schools.map(function(r){return r.name;}).join('、'));}
    if(/硕士/.test(t)){next.stage='硕士';matched.push('硕士');}else if(/本科|学士/.test(t)){next.stage='本科';matched.push('本科');}
    if(/计算机|\bCS\b/i.test(t)){next.disciplines=['计算机科学与技术'];matched.push('计算机');}else if(/数据科学/.test(t)){next.directions=['数据科学'];matched.push('数据科学');}else if(/电子工程/.test(t)){next.disciplines=['电子工程'];matched.push('电子工程');}
    var ranking=t.match(/(?:QS|软科)[^\d]{0,5}(\d{1,3})/i);if(ranking){next.board=/软科/.test(ranking[0])?'sh':'qs';var n=Number(ranking[1]);next.rank='0-'+n;matched.push((next.board==='qs'?'QS':'软科')+'前'+n);}
    var years=t.match(/(?:^|[^\d])(\d(?:\.\d)?)\s*年(?:制|的)?(?:本科|硕士|学制)?/);if(years){var y=Number(years[1]);next.duration=y<=1?'0-1':y<=2?'1-2':y<=3?'2-3':'3+';matched.push(years[1]+'年制');}
    var scoreMatches=[['雅思',/雅思[^\d]{0,4}(\d(?:\.\d)?)/i],['新托福',/托福[^\d]{0,4}(\d{2,3})/i],['GPA',/GPA[^\d]{0,4}(\d(?:\.\d)?)/i],['A-Level',/A[- ]?Level[^A-E]{0,4}((?:A\*|[ABCDE]){2,5})/i]];
    var scores=[];scoreMatches.forEach(function(pair){var m=t.match(pair[1]);if(m){scores.push({type:pair[0],value:m[1]});matched.push(pair[0]+' '+m[1]);}});if(scores.length) next.scores=scores;
    var fee=t.match(/(?:预算|学费|费用)[^\d]{0,6}(\d+)\s*[-–~到至]\s*(\d+)\s*万/);if(fee){next.feeMin=fee[1];next.feeMax=fee[2];next.feeType=/生活/.test(t)?'firstLife':'first';matched.push('预算'+fee[1]+'–'+fee[2]+'万');}else{var upper=t.match(/(?:预算|学费|费用)[^\d]{0,6}(\d+)\s*万(?:以内|以下)?/);if(upper){next.feeMax=upper[1];next.feeType='first';matched.push('预算≤'+upper[1]+'万');}}
    if(/英语/.test(t)){next.languages=['英语'];matched.push('英语');}if(/无合作/.test(t)){next.cooperation='无合作';matched.push('无合作');}else if(/有合作/.test(t)){next.cooperation='有合作';matched.push('有合作');}
    next.careers=choices('careers').map(function(option){return option.value;}).filter(function(name){return t.indexOf(name)>=0 || name==='互联网 / 科技' && /互联网|科技/.test(t);});if(next.careers.length) matched.push(next.careers.join('、'));
    next.employers=choices('employers').map(function(option){return option.value;}).filter(function(name){return t.toLowerCase().indexOf(name.toLowerCase())>=0;});if(next.employers.length) matched.push(next.employers.join('、'));
    if(!matched.length){next.keyword=text;matched.push('关键词“'+text+'”');}
    state=next;prune();paint();
    apply(true);var result=document.getElementById('scAiResult');result.hidden=false;result.textContent=matched.length?'已匹配：'+matched.join(' · '):'未识别到筛选条件，请补充国家、专业、排名或预算';
  }
  function switchTab(index){root.querySelectorAll('[data-tab]').forEach(function(tab){var on=Number(tab.dataset.tab)===index;tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!on;});}
  function bind(){
    root.onclick=function(e){var b=e.target.closest('button');if(!b) return;
      if(b.hasAttribute('data-tab')){switchTab(Number(b.dataset.tab));root.querySelectorAll('details[open]').forEach(function(el){el.open=false;});}
      if(b.hasAttribute('data-fold')){var expanded=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(expanded));document.getElementById('scFilterBody').hidden=!expanded;b.innerHTML=(expanded?'收起筛选':'展开筛选')+chevron;}
      if(b.hasAttribute('data-clear')){state=defaults();root.querySelectorAll('[data-option-search]').forEach(function(input){input.value='';});paint();apply(true);document.getElementById('scAiResult').hidden=true;}
      if(b.dataset.pick){var key=b.dataset.pick;state[key]=state[key]===b.dataset.value?'':b.dataset.value;prune();paint();apply(true);}
      if(b.hasAttribute('data-ai')) smartMatch();
      if(b.hasAttribute('data-period')) openPeriod();
      if(b.hasAttribute('data-add-score')){state.scores.push({type:'雅思',value:''});scoreRows();root.querySelector('[data-score-value="'+(state.scores.length-1)+'"]').focus();}
      if(b.hasAttribute('data-remove-score')){var i=Number(b.dataset.removeScore);if(state.scores.length>1) state.scores.splice(i,1);else state.scores[0]={type:'雅思',value:''};scoreRows();apply(true);}
    };
    root.onchange=function(e){var el=e.target;
      if(el.dataset.multiKey){var key=el.dataset.multiKey;state[key]=el.checked?unique(state[key].concat(el.value)):state[key].filter(function(value){return value!==el.value;});change();}
      if(el.tagName==='SELECT' && el.dataset.field){state[el.dataset.field]=el.value;if(el.dataset.field==='board'){state.rank='';rankOptions();}if(el.dataset.field==='continent'){prune();multiFields();}apply(true);}
      if(el.hasAttribute('data-score-type')){state.scores[Number(el.dataset.scoreType)]={type:el.value,value:''};scoreRows();apply(true);}
      if(el.id==='scIncludeUnknown'){state.includeUnknown=el.checked;apply(true);}
    };
    root.oninput=function(e){var el=e.target;
      if(el.dataset.optionSearch){var q=el.value.toLowerCase();el.parentElement.querySelectorAll('label').forEach(function(label){label.hidden=label.textContent.toLowerCase().indexOf(q)<0;});return;}
      if(el.id==='scQuery') return;
      if(el.dataset.field && el.tagName==='INPUT'){state[el.dataset.field]=el.value;if(el.dataset.field==='salaryMin' || el.dataset.field==='salaryMax') root.querySelector('[data-salary="'+el.dataset.field+'"]').value=el.value;}
      if(el.hasAttribute('data-score-value')) state.scores[Number(el.dataset.scoreValue)].value=el.value;
      if(el.dataset.salary){var key=el.dataset.salary,value=Number(el.value);state[key]=key==='salaryMin'?Math.min(value,Number(state.salaryMax)):Math.max(value,Number(state.salaryMin));el.value=state[key];root.querySelector('[data-field="'+key+'"]').value=state[key];}
      clearTimeout(timer);timer=setTimeout(function(){apply(true);},300);
    };
    root.onkeydown=function(e){if(e.key==='Enter' && !e.shiftKey && e.target.id==='scQuery'){e.preventDefault();smartMatch();}if(e.target.dataset.tab && ['ArrowLeft','ArrowRight'].indexOf(e.key)>=0){e.preventDefault();var index=(Number(e.target.dataset.tab)+(e.key==='ArrowRight'?1:3))%4;switchTab(index);document.getElementById('sc-tab-'+index).focus();}};
    document.addEventListener('click',function(e){root.querySelectorAll('details[open]').forEach(function(el){if(!el.contains(e.target)) el.open=false;});});
    document.addEventListener('keydown',function(e){if(e.key==='Escape') root.querySelectorAll('details[open]').forEach(function(el){el.open=false;el.querySelector('summary').focus();});});
    window.addEventListener('popstate',function(){state=readState();prune();paint();apply(false);});
  }
  document.addEventListener('DOMContentLoaded',function(){records=makeRecords();state=readState();mount();taskHeader();prune();paint();bind();apply(false);});
})();
