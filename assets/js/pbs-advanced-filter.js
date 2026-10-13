(function (global) {
  'use strict';

  function field(label, type, options, extra) {
    var config = { label: label, type: type, options: options || [] };
    Object.keys(extra || {}).forEach(function (key) { config[key] = extra[key]; });
    return config;
  }

  function countdown(label) {
    return field(label, 'countdown', ['剩3天', '剩7天', '剩14天', '其他']);
  }

  var levels = ['本科申请', '硕士申请', '博士申请', '本硕连读申请'];
  var organizations = ['PBS留学总部', '上海启明留学', '北京知行教育'];
  var PAGES = {
    '学生档案列表页 - 留学申请管理系统.html': [field('申请层次', 'checks', levels), field('项目号', 'multi'), field('客户姓名', 'multi'), field('学生姓名', 'multi'), field('院校目标数', 'range', null, { min: 0, max: 10, unit: '所' })],
    '项目池列表页 - 留学申请管理系统.html': [field('项目状态', 'checks', ['待分配', '待接收', '进行中', '已结项']), field('申请层次', 'checks', levels), field('项目号', 'multi'), field('项目经理', 'multi'), field('客户姓名', 'multi'), field('学生姓名', 'multi'), field('商城订单号', 'multi'), field('分配时间', 'date'), field('订单创建时间', 'date')],
    '我的项目列表页 - 留学申请管理系统.html': [field('申请层次', 'checks', levels), field('项目状态', 'checks', ['待分配', '待接收', '进行中', '已结项']), field('项目经理', 'multi'), field('项目号', 'multi'), field('客户姓名', 'multi'), field('学生姓名', 'multi'), field('分配时间', 'date')],
    '任务列表页 - 文书交付系统.html': [field('文书状态', 'checks', ['撰写中', '审核中', '需修改', '已完成', '待分配']), field('文书类型', 'checks', ['PS', 'CV', 'RL', 'RP', 'CL']), countdown('DDL倒计时'), field('文书交付人员', 'multi'), field('客户姓名', 'multi'), field('学生姓名', 'multi'), field('学校', 'multi'), field('专业', 'multi'), field('当前环节滞留时长', 'range', null, { min: 0, max: 30, unit: '天', aliases: ['任务停留时长'] })],
    '模板库列表 - 文书交付系统.html': [field('文书类型', 'checks', ['PS', 'CV', 'RL', 'RP', 'CL']), field('申请层次', 'checks', levels.slice(0, 3)), field('所属机构', 'checks', organizations)],
    '案例库 - 文书交付系统.html': [field('文书类型', 'checks', ['PS', 'CV', 'RL', 'RP', 'CL', '推荐信']), field('申请层次', 'checks', levels.slice(0, 3)), field('解析状态', 'checks', ['已解析', '解析中', '未解析', '解析失败', '已归档']), field('所属机构', 'checks', organizations), field('作者', 'multi', null, { dataKeys: ['uploader', 'author'] }), field('机构', 'multi', null, { dataKeys: ['org'] }), field('申请方向', 'multi', null, { dataKeys: ['direction'] }), field('录取院校', 'multi', null, { dataKeys: ['school'] }), field('来源学生', 'multi', null, { dataKeys: ['student'] }), field('关联模板', 'multi', null, { dataKeys: ['template'] })],
    '文书审核列表页 - 留学申请管理系统.html': [field('文书类型', 'checks', ['PS', 'CV', 'RL', 'RP', 'CL']), field('文书状态', 'checks', ['审核中', '已完成']), countdown('DDL倒计时'), field('客户姓名', 'multi'), field('学生姓名', 'multi'), field('文书审核人员', 'multi'), field('提交人', 'multi')],
    '网申任务列表页 - 留学申请管理系统.html': [field('网申状态', 'checks', ['未开始', '待领取', '进行中', '审核中', '已提交']), field('申请轮次', 'checks', ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', '更多']), countdown('DDL倒计时'), field('客户姓名', 'multi'), field('学生姓名', 'multi'), field('专业', 'multi'), field('学校', 'multi'), field('网申人员', 'multi'), field('当前环节滞留时长', 'range', null, { min: 0, max: 30, unit: '天', aliases: ['任务停留时长'] }), field('材料缺失数量', 'missing', ['<20%', '<40%', '其他'], { aliases: ['材料齐备度'] })],
    '网申模板库 - 留学申请管理系统.html': [field('所属机构', 'checks', organizations)],
    '监控任务列表 - PBS留学CRM.html': [field('客户姓名', 'multi'), field('学生姓名', 'multi'), field('监控频率', 'checks', ['每小时', '每6小时', '每12小时', '每天', '每周']), field('监控状态', 'checks', ['监控中', '已暂停', '异常']), field('上次监控时间', 'date')],
    '结项归档列表 - PBS留学CRM系统.html': [field('项目号', 'multi'), field('客户姓名', 'multi'), field('学生姓名', 'multi'), field('申请层次', 'checks', levels.slice(0, 3)), field('结项状态', 'radios', ['待结项', '已结项'])],
    '选校任务列表页 - 留学申请管理系统.html': [field('项目号', 'multi'), field('销售人员', 'multi'), field('学生姓名', 'multi'), field('意向国家', 'multi'), field('意向专业', 'multi'), field('申请层次', 'checks', levels.slice(0, 3)), field('咨询状态', 'checks', ['咨询中', '已结单'])],
    '机构管理 - PBS留学CRM系统.html': [field('机构名称', 'multi'), field('机构成员', 'range', null, { min: 0, max: 100, unit: '人' }), field('创建时间', 'date')],
    '人员管理 - PBS留学CRM系统.html': [field('姓名', 'multi'), field('所属机构', 'multi'), field('角色', 'checks', ['机构管理员', '项目经理', '文书人员', '网申人员', '文书审核', '销售人员']), field('人员状态', 'checks', ['在职', '离职/停职'])],
    '操作日志审计 - 留学申请管理系统.html': [field('操作时间', 'date'), field('操作人', 'multi'), field('所属机构', 'multi'), field('业务模块', 'checks'), field('操作类型', 'checks'), field('操作结果', 'checks')]
  };

  var DATA_KEYS = {
    '项目号': ['project'], '客户姓名': ['customer', 'name'], '学生姓名': ['student', 'applicant', 'name'],
    '项目经理': ['pm'], '文书交付人员': ['writer'], '学校': ['school'], '专业': ['major'],
    '文书审核人员': ['reviewer'], '提交人': ['person'], '网申人员': ['person'], '销售人员': ['sales'],
    '意向国家': ['country'], '意向专业': ['major'], '所属机构': ['org', 'organization'], '姓名': ['name']
  };

  function text(node) { return (node && (node.innerText || node.textContent) || '').replace(/\s+/g, ' ').trim(); }
  function normalized(value) { return String(value || '').replace(/\s+/g, '').replace(/[（）()]/g, '').toLowerCase(); }
  function rows() {
    var table = document.querySelector('main table') || document.querySelector('table');
    if (table) return Array.prototype.filter.call(table.querySelectorAll('tbody tr'), function (row) {
      return !row.cells || row.cells.length > 1;
    });
    return Array.prototype.slice.call(document.querySelectorAll('#template-card-grid > div'));
  }
  function headers() {
    var table = document.querySelector('main table') || document.querySelector('table');
    var map = {};
    if (table) Array.prototype.forEach.call(table.querySelectorAll('thead th'), function (th, index) { map[normalized(text(th))] = index; });
    return map;
  }
  function columnIndex(config, map) {
    var labels = [config.label].concat(config.aliases || []);
    var keys = Object.keys(map);
    for (var i = 0; i < labels.length; i += 1) {
      var wanted = normalized(labels[i]);
      for (var j = 0; j < keys.length; j += 1) if (keys[j] === wanted || keys[j].indexOf(wanted) >= 0 || wanted.indexOf(keys[j]) >= 0) return map[keys[j]];
    }
    return -1;
  }
  function valueOf(row, config, map) {
    if (global.pbsProjectList) {
      var projectKey = { '项目号': 'project', '商城订单号': 'order', '客户姓名': 'name', '学生姓名': 'student', '项目经理': 'pm', '项目状态': 'status', '申请层次': 'level', '分配时间': 'time', '订单创建时间': 'created' }[config.label];
      if (projectKey) return row.dataset[projectKey] || '';
    }
    var index = columnIndex(config, map);
    if (index >= 0 && row.cells && row.cells[index]) return text(row.cells[index]);
    var dataKeys = (config.dataKeys || []).concat(DATA_KEYS[config.label] || []);
    for (var i = 0; i < dataKeys.length; i += 1) {
      var value = row.getAttribute && row.getAttribute('data-' + dataKeys[i]);
      if (value) return value;
    }
    return text(row);
  }
  function uniqueValues(config, sourceRows, map) {
    var values = (config.options || []).slice();
    if (!values.length) sourceRows.forEach(function (row) {
      var value = valueOf(row, config, map);
      if (value && value.length < 80 && values.indexOf(value) < 0) values.push(value);
    });
    return values;
  }
  function selected(root) {
    return Array.prototype.filter.call(root.querySelectorAll('input[type="checkbox"],input[type="radio"]'), function (input) { return input.checked; }).map(function (input) { return input.value; });
  }
  function multiType(config) { return config.type === 'multi' || config.type === 'checks' || config.type === 'countdown'; }

  function closeInlineSelect(root, restoreFocus) {
    if (!root || !root.classList.contains('pbs-filter-inline-select')) return;
    var button = root.querySelector('.pbs-filter-inline-select-button');
    var panel = root.querySelector('.pbs-filter-inline-select-panel');
    root.classList.remove('is-open', 'opens-up');
    if (button) button.setAttribute('aria-expanded', 'false');
    if (panel) {
      panel.style.removeProperty('top');
      panel.style.removeProperty('left');
      panel.style.removeProperty('width');
      panel.style.removeProperty('max-height');
    }
    if (restoreFocus && button) button.focus();
  }

  function closeAllInlineSelects(except) {
    document.querySelectorAll('.pbs-filter-inline-select.is-open').forEach(function (item) {
      if (item !== except) closeInlineSelect(item, false);
    });
  }

  function positionInlineSelect(root) {
    if (!root || !root.classList.contains('is-open')) return;
    var button = root.querySelector('.pbs-filter-inline-select-button');
    var panel = root.querySelector('.pbs-filter-inline-select-panel');
    if (!button || !panel) return;
    var buttonRect = button.getBoundingClientRect();
    var viewportGap = 12;
    var panelGap = 6;
    var width = Math.min(Math.max(buttonRect.width, 240), Math.max(240, window.innerWidth - viewportGap * 2));
    var left = Math.min(Math.max(viewportGap, buttonRect.left), Math.max(viewportGap, window.innerWidth - width - viewportGap));
    panel.style.width = width + 'px';
    panel.style.left = left + 'px';
    panel.style.maxHeight = '320px';
    var desiredHeight = Math.min(panel.scrollHeight, 320);
    var roomBelow = window.innerHeight - buttonRect.bottom - viewportGap;
    var roomAbove = buttonRect.top - viewportGap;
    var opensUp = roomBelow < Math.min(desiredHeight, 220) && roomAbove > roomBelow;
    var room = Math.max(120, (opensUp ? roomAbove : roomBelow) - panelGap);
    var height = Math.min(desiredHeight, room);
    panel.style.maxHeight = height + 'px';
    panel.style.top = (opensUp ? Math.max(viewportGap, buttonRect.top - height - panelGap) : buttonRect.bottom + panelGap) + 'px';
    root.classList.toggle('opens-up', opensUp);
  }

  function optionControl(config, values) {
    var control = document.createElement('div');
    control.className = 'pbs-filter-inline-options';
    values.forEach(function (value) {
      var label = document.createElement('label');
      label.className = 'pbs-filter-inline-option';
      var input = document.createElement('input');
      input.type = config.type === 'radios' || config.type === 'missing' ? 'radio' : 'checkbox';
      input.name = 'pbs-inline-' + normalized(config.label);
      input.value = value;
      label.appendChild(input);
      label.appendChild(document.createTextNode(value));
      control.appendChild(label);
    });
    return control;
  }

  function multiControl(config, values) {
    var root = document.createElement('div');
    root.className = 'pbs-filter-inline-select';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'pbs-filter-inline-select-button';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span>全部</span><span class="pbs-filter-inline-chevron">⌄</span>';
    var panel = document.createElement('div');
    panel.className = 'pbs-filter-inline-select-panel';
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-multiselectable', 'true');
    var search = document.createElement('input');
    search.type = 'search';
    search.className = 'pbs-filter-inline-search';
    search.placeholder = '搜索' + config.label;
    var list = document.createElement('div');
    list.className = 'pbs-filter-inline-select-list';
    var empty = document.createElement('div');
    empty.className = 'pbs-filter-inline-empty';
    empty.textContent = '无匹配项';
    empty.hidden = true;
    values.forEach(function (value) {
      var item = document.createElement('label');
      item.className = 'pbs-filter-inline-select-item';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.value = value;
      item.appendChild(input);
      item.appendChild(document.createTextNode(value));
      list.appendChild(item);
      input.addEventListener('change', updateButton);
    });
    function updateButton() {
      var valuesSelected = selected(root);
      button.querySelector('span').textContent = valuesSelected.length === 1 ? valuesSelected[0] : (valuesSelected.length ? '已选 ' + valuesSelected.length + ' 项' : '全部');
      button.classList.toggle('has-value', valuesSelected.length > 0);
    }
    function resetSearch() {
      search.value = '';
      Array.prototype.forEach.call(list.children, function (item) { item.hidden = false; });
      empty.hidden = true;
    }
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      if (root.classList.contains('is-open')) {
        closeInlineSelect(root, false);
        return;
      }
      closeAllInlineSelects(root);
      resetSearch();
      root.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      window.requestAnimationFrame(function () {
        positionInlineSelect(root);
        search.focus();
      });
    });
    button.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' && !root.classList.contains('is-open')) {
        event.preventDefault();
        button.click();
      }
    });
    panel.addEventListener('click', function (event) { event.stopPropagation(); });
    panel.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeInlineSelect(root, true);
      }
    });
    search.addEventListener('input', function () {
      var keyword = normalized(search.value);
      var shown = 0;
      Array.prototype.forEach.call(list.children, function (item) {
        var visible = !keyword || normalized(text(item)).indexOf(keyword) >= 0;
        item.hidden = !visible;
        if (visible) shown += 1;
      });
      empty.hidden = shown > 0;
    });
    panel.appendChild(search);
    panel.appendChild(list);
    panel.appendChild(empty);
    root.appendChild(button);
    root.appendChild(panel);
    root.updateButton = updateButton;
    root.resetSearch = resetSearch;
    return root;
  }

  function rangeControl(config) {
    var root = document.createElement('div');
    root.className = 'pbs-filter-inline-range';
    root.dataset.min = config.min;
    root.dataset.max = config.max;
    var values = document.createElement('div');
    values.className = 'pbs-filter-inline-range-values';
    var track = document.createElement('div');
    track.className = 'pbs-filter-inline-range-track';
    var low = document.createElement('input');
    var high = document.createElement('input');
    low.type = high.type = 'range';
    low.min = high.min = config.min;
    low.max = high.max = config.max;
    low.value = config.min;
    high.value = config.max;
    function update() {
      var a = Number(low.value), b = Number(high.value);
      if (a > b) { var swap = a; a = b; b = swap; }
      root.dataset.low = a;
      root.dataset.high = b;
      values.textContent = a + config.unit + ' - ' + b + config.unit;
    }
    low.addEventListener('input', update);
    high.addEventListener('input', update);
    track.appendChild(low);
    track.appendChild(high);
    root.appendChild(values);
    root.appendChild(track);
    root.updateRange = update;
    update();
    return root;
  }

  function dateControl() {
    var root = document.createElement('div');
    root.className = 'pbs-filter-inline-date';
    var start = document.createElement('input');
    var end = document.createElement('input');
    start.type = end.type = 'date';
    start.setAttribute('aria-label', '开始日期');
    end.setAttribute('aria-label', '结束日期');
    root.appendChild(start);
    root.appendChild(end);
    return root;
  }

  function createRow(config, sourceRows, map, extra) {
    var row = document.createElement('div');
    row.className = 'pbs-filter-row pbs-advanced-inline-row' + (extra ? ' pbs-advanced-inline-extra' : '');
    row.dataset.label = config.label;
    row.hidden = extra;
    var label = document.createElement('label');
    label.appendChild(document.createTextNode(config.label));
    if (multiType(config)) {
      var hint = document.createElement('span');
      hint.className = 'pbs-filter-multi-hint';
      hint.textContent = '可多选';
      label.appendChild(hint);
    }
    var control = document.createElement('div');
    control.className = 'pbs-filter-inline-control';
    var values = uniqueValues(config, sourceRows, map);
    if (config.type === 'multi') control.appendChild(multiControl(config, values));
    else if (config.type === 'range') control.appendChild(rangeControl(config));
    else if (config.type === 'date') control.appendChild(dateControl());
    else control.appendChild(optionControl(config, values));
    row.appendChild(label);
    row.appendChild(control);
    return row;
  }

  function numeric(value) {
    var match = String(value || '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }
  function countdownMatch(value, values) {
    var days = numeric(value);
    if (!isFinite(days)) return values.indexOf('其他') >= 0;
    return values.some(function (option) {
      if (option === '剩3天') return days <= 3;
      if (option === '剩7天') return days > 3 && days <= 7;
      if (option === '剩14天') return days > 7 && days <= 14;
      return option === '其他' && days > 14;
    });
  }
  function missingMatch(value, values) {
    var pair = String(value || '').match(/(\d+)\s*\/\s*(\d+)/);
    var percent = pair && Number(pair[2]) ? (Number(pair[2]) - Number(pair[1])) / Number(pair[2]) * 100 : numeric(value);
    if (!isFinite(percent)) return false;
    if (values[0] === '<20%') return percent < 20;
    if (values[0] === '<40%') return percent >= 20 && percent < 40;
    return percent >= 40;
  }

  function activeCount(container) {
    var checked = container.querySelectorAll('.pbs-advanced-inline-row input[type="checkbox"]:checked,.pbs-advanced-inline-row input[type="radio"]:checked').length;
    var dates = Array.prototype.filter.call(container.querySelectorAll('.pbs-advanced-inline-row input[type="date"]'), function (input) { return input.value; }).length;
    var ranges = Array.prototype.filter.call(container.querySelectorAll('.pbs-filter-inline-range'), function (range) { return range.dataset.low !== range.dataset.min || range.dataset.high !== range.dataset.max; }).length;
    return checked + dates + ranges;
  }

  function apply(container, configs, toggle) {
    var sourceRows = rows();
    var map = headers();
    sourceRows.forEach(function (sourceRow) {
      var matches = configs.every(function (config) {
        var row = container.querySelector('.pbs-advanced-inline-row[data-label="' + config.label + '"]');
        var value = valueOf(sourceRow, config, map);
        if (config.type === 'range') {
          var range = row.querySelector('.pbs-filter-inline-range');
          var number = numeric(value);
          return !isFinite(number) || (number >= Number(range.dataset.low) && number <= Number(range.dataset.high));
        }
        if (config.type === 'date') {
          var dateInputs = row.querySelectorAll('input[type="date"]');
          if (!dateInputs[0].value && !dateInputs[1].value) return true;
          var date = String(value || '').match(/\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}/);
          if (!date) return false;
          var current = date[0].replace(/[\/.]/g, '-');
          return (!dateInputs[0].value || current >= dateInputs[0].value) && (!dateInputs[1].value || current <= dateInputs[1].value);
        }
        var values = selected(row);
        if (!values.length) return true;
        if (config.type === 'countdown') return countdownMatch(value, values);
        if (config.type === 'missing') return missingMatch(value, values);
        return values.some(function (selectedValue) { return normalized(value).indexOf(normalized(selectedValue)) >= 0; });
      });
      sourceRow.classList.toggle('pbs-advanced-filter-hidden', !matches);
    });
    var count = activeCount(container);
    var badge = toggle.querySelector('.pbs-filter-inline-count');
    if (count) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'pbs-filter-inline-count';
        toggle.appendChild(badge);
      }
      badge.textContent = count;
    } else if (badge) badge.remove();
    if (global.pbsProjectList) global.pbsProjectList.filterChanged();
  }

  function reset(container, configs, toggle) {
    closeAllInlineSelects();
    container.querySelectorAll('.pbs-advanced-inline-row input[type="checkbox"],.pbs-advanced-inline-row input[type="radio"]').forEach(function (input) { input.checked = false; });
    container.querySelectorAll('.pbs-advanced-inline-row input[type="date"],.pbs-filter-inline-search').forEach(function (input) { input.value = ''; });
    container.querySelectorAll('.pbs-filter-inline-select').forEach(function (select) {
      if (select.updateButton) select.updateButton();
      if (select.resetSearch) select.resetSearch();
    });
    container.querySelectorAll('.pbs-filter-inline-range').forEach(function (range) {
      var inputs = range.querySelectorAll('input');
      inputs[0].value = range.dataset.min;
      inputs[1].value = range.dataset.max;
      range.updateRange();
    });
    apply(container, configs, toggle);
  }

  function mount(options) {
    var configs = PAGES[options.file];
    if (!configs) return;
    var control = document.querySelector('main ' + options.controlSelector) || document.querySelector(options.controlSelector);
    var card = control && control.closest('.pbs-filter-card, .bg-white.rounded-xl, .card, .monitor-filter');
    var container = card && card.querySelector('.pbs-filter-rows');
    if (!card || !container || container.querySelector('.pbs-advanced-inline-row')) return;

    var legacyRows = Array.prototype.slice.call(container.querySelectorAll(':scope > .pbs-filter-row'));
    var searchRow = legacyRows.filter(function (row) {
      var label = row.querySelector('label');
      var input = row.querySelector('input[type="text"],input[type="search"]');
      return input && /关键词|搜索/.test(text(label) + input.placeholder);
    })[0];
    legacyRows.forEach(function (row) { if (row !== searchRow) row.classList.add('pbs-filter-legacy-row'); });

    var sourceRows = rows();
    var map = headers();
    configs.forEach(function (config, index) { container.appendChild(createRow(config, sourceRows, map, index > 0)); });

    var footer = card.querySelector('.pbs-filter-footer');
    if (!footer) return;
    var oldToggle = footer.querySelector('.pbs-filter-toggle');
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'pbs-filter-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span>展开筛选</span><span class="pbs-filter-toggle-icon">⌄</span>';
    if (oldToggle) oldToggle.replaceWith(toggle);
    else footer.insertBefore(toggle, footer.firstChild);
    toggle.addEventListener('click', function () {
      closeAllInlineSelects();
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      toggle.querySelector('span').textContent = expanded ? '展开筛选' : '收起筛选';
      container.querySelectorAll('.pbs-advanced-inline-extra').forEach(function (row) { row.hidden = expanded; });
    });

    global.PBSAdvancedFilter.refresh = function (refreshOptions) {
      if (refreshOptions) {
        closeAllInlineSelects();
        configs.forEach(function(config, index) {
          if (config.type !== 'multi' || config.options.length) return;
          var oldRow = container.querySelector('.pbs-advanced-inline-row[data-label="' + config.label + '"]');
          var values = selected(oldRow);
          var nextRow = createRow(config, rows(), headers(), index > 0);
          nextRow.hidden = oldRow.hidden;
          nextRow.querySelectorAll('input[type="checkbox"]').forEach(function(input) { input.checked = values.indexOf(input.value) >= 0; });
          nextRow.querySelector('.pbs-filter-inline-select').updateButton();
          oldRow.replaceWith(nextRow);
        });
      }
      apply(container, configs, toggle);
    };
    global.PBSAdvancedFilter.reset = function() { reset(container, configs, toggle); };

    container.addEventListener('change', function (event) {
      if (event.target.closest('.pbs-advanced-inline-row')) apply(container, configs, toggle);
    });
    card.querySelectorAll('button').forEach(function (button) {
      if (global.pbsProjectList) return;
      if (/重置/.test(text(button))) button.addEventListener('click', function () { setTimeout(function () { reset(container, configs, toggle); }, 0); });
      if (/搜索|查询/.test(text(button))) button.addEventListener('click', function () { setTimeout(function () { apply(container, configs, toggle); }, 0); });
    });
    document.addEventListener('click', function () { closeAllInlineSelects(); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeAllInlineSelects();
    });
    document.addEventListener('scroll', function (event) {
      if (event.target && event.target.closest && event.target.closest('.pbs-filter-inline-select-panel')) return;
      closeAllInlineSelects();
    }, true);
    window.addEventListener('resize', function () { closeAllInlineSelects(); });
  }

  global.PBSAdvancedFilter = { mount: mount };
})(window);
