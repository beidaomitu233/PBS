/**
 * PBS 筛选区共享组件库（原型图 5.1）
 * 提供三种控件：复选框组 checks / 单选按钮组 radios / 可搜索多选下拉 dropdown / 双滑块 range
 * 用法：
 *   PBSFilter.init({
 *     container: '#filterRoot',        // 筛选区挂载点（HTMLElement 或选择器）
 *     groups: [                        // 分组配置，按顺序渲染
 *       { key:'level', title:'申请层次', type:'checks', options:['本科申请','硕士申请'] },
 *       { key:'status', title:'结项状态', type:'radios', options:['全部','已结项','已归档'] },
 *       { key:'customer', title:'客户姓名', type:'dropdown', options:[...], placeholder:'全部' },
 *       { key:'targets', title:'院校目标数', type:'range', min:0, max:10, unit:'所' }
 *     ],
 *     onChange: function(state){ }     // state = { key: [选中值数组] | {min,max} }
 *   });
 *   var state = PBSFilter.getState();  // 获取当前筛选状态
 *   PBSFilter.reset();                 // 重置全部
 */
(function (global) {
  'use strict';

  var _config = null;
  var _state = {};

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fireChange() {
    if (_config && typeof _config.onChange === 'function') _config.onChange(getState());
  }

  /* ---------- 复选框组 / 单选按钮组 ---------- */
  function buildChecks(group, isRadio) {
    var wrap = el('div', 'pbs-filter-group');
    wrap.appendChild(el('div', 'pbs-filter-group-title', esc(group.title)));
    var row = el('div', 'pbs-filter-checks');
    _state[group.key] = [];
    (group.options || []).forEach(function (opt) {
      var label = el('label', 'pbs-filter-check');
      var input = document.createElement('input');
      input.type = isRadio ? 'radio' : 'checkbox';
      input.name = 'pbsf-' + group.key;
      input.value = opt;
      input.addEventListener('change', function () {
        if (isRadio) {
          _state[group.key] = input.checked ? [opt] : [];
          row.querySelectorAll('.pbs-filter-check').forEach(function (l) { l.classList.remove('checked'); });
          if (input.checked) label.classList.add('checked');
        } else {
          label.classList.toggle('checked', input.checked);
          var arr = _state[group.key];
          if (input.checked && arr.indexOf(opt) < 0) arr.push(opt);
          if (!input.checked) _state[group.key] = arr.filter(function (v) { return v !== opt; });
        }
        fireChange();
      });
      label.appendChild(input);
      label.appendChild(el('span', 'dot'));
      label.appendChild(el('span', null, esc(opt)));
      row.appendChild(label);
    });
    wrap.appendChild(row);
    return wrap;
  }

  /* ---------- 可搜索多选下拉 ---------- */
  function buildDropdown(group) {
    _state[group.key] = [];
    var field = el('div', 'pbs-filter-dd-field');
    field.appendChild(el('label', null, esc(group.title)));

    var dd = el('div', 'pbs-filter-dd');
    var btn = el('button', 'pbs-filter-dd-btn');
    btn.type = 'button';
    var selText = el('span', 'sel-text', esc(group.placeholder || '全部'));
    btn.appendChild(selText);
    btn.appendChild(el('span', 'caret', '▼'));

    var panel = el('div', 'pbs-filter-dd-panel');
    var search = el('input', 'pbs-filter-dd-search');
    search.type = 'text';
    search.placeholder = '模糊搜索...';

    var actions = el('div', 'pbs-filter-dd-actions');
    var allA = el('a', null, '全选');
    var noneA = el('a', null, '清空');
    actions.appendChild(allA);
    actions.appendChild(noneA);

    var list = el('div', 'pbs-filter-dd-list');
    var emptyTip = el('div', 'pbs-filter-dd-empty', '无匹配项');
    emptyTip.style.display = 'none';

    var opts = (group.options || []).slice();
    function renderList(kw) {
      list.innerHTML = '';
      var shown = 0;
      opts.forEach(function (opt) {
        if (kw && String(opt).toLowerCase().indexOf(kw.toLowerCase()) < 0) return;
        shown++;
        var item = el('label', 'pbs-filter-dd-item');
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = _state[group.key].indexOf(opt) >= 0;
        cb.addEventListener('change', function () {
          var arr = _state[group.key];
          if (cb.checked && arr.indexOf(opt) < 0) arr.push(opt);
          if (!cb.checked) _state[group.key] = arr.filter(function (v) { return v !== opt; });
          updateBtn();
          fireChange();
        });
        item.appendChild(cb);
        item.appendChild(el('span', null, esc(opt)));
        list.appendChild(item);
      });
      emptyTip.style.display = shown ? 'none' : 'block';
    }

    function updateBtn() {
      var sel = _state[group.key];
      if (sel.length === 0) {
        selText.textContent = group.placeholder || '全部';
        btn.classList.remove('has-selection');
      } else if (sel.length === 1) {
        selText.textContent = sel[0];
        btn.classList.add('has-selection');
      } else {
        selText.textContent = '已选 ' + sel.length + ' 项';
        btn.classList.add('has-selection');
      }
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !dd.classList.contains('open');
      document.querySelectorAll('.pbs-filter-dd.open').forEach(function (d) { d.classList.remove('open'); });
      if (willOpen) { dd.classList.add('open'); search.value = ''; renderList(''); search.focus(); }
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { dd.classList.remove('open'); });
    search.addEventListener('input', function () { renderList(search.value.trim()); });
    allA.addEventListener('click', function () {
      var kw = search.value.trim();
      opts.forEach(function (opt) {
        if (kw && String(opt).toLowerCase().indexOf(kw.toLowerCase()) < 0) return;
        if (_state[group.key].indexOf(opt) < 0) _state[group.key].push(opt);
      });
      renderList(kw); updateBtn(); fireChange();
    });
    noneA.addEventListener('click', function () {
      _state[group.key] = [];
      renderList(search.value.trim()); updateBtn(); fireChange();
    });

    renderList('');
    panel.appendChild(search);
    panel.appendChild(actions);
    panel.appendChild(list);
    panel.appendChild(emptyTip);
    dd.appendChild(btn);
    dd.appendChild(panel);
    field.appendChild(dd);
    return field;
  }

  /* ---------- 双滑块 ---------- */
  function buildRange(group) {
    var min = group.min != null ? group.min : 0;
    var max = group.max != null ? group.max : 100;
    var unit = group.unit || '';
    _state[group.key] = { min: min, max: max };

    var field = el('div', 'pbs-filter-dd-field pbs-filter-range');
    field.appendChild(el('label', null, esc(group.title)));
    var box = el('div');
    var values = el('div', 'pbs-filter-range-values', min + ' ' + unit + ' - ' + max + ' ' + unit);
    var track = el('div', 'pbs-filter-range-track');
    var fill = el('div', 'pbs-filter-range-fill');
    var lo = document.createElement('input');
    var hi = document.createElement('input');
    lo.type = hi.type = 'range';
    lo.min = hi.min = min;
    lo.max = hi.max = max;
    lo.value = min;
    hi.value = max;
    lo.step = hi.step = group.step || 1;

    function update() {
      var a = parseInt(lo.value, 10), b = parseInt(hi.value, 10);
      if (a > b) { var t = a; a = b; b = t; }
      _state[group.key] = { min: a, max: b };
      values.textContent = a + ' ' + unit + ' - ' + b + ' ' + unit;
      var span = max - min || 1;
      fill.style.left = ((a - min) / span * 100) + '%';
      fill.style.right = (100 - (b - min) / span * 100) + '%';
    }
    lo.addEventListener('input', function () { update(); fireChange(); });
    hi.addEventListener('input', function () { update(); fireChange(); });
    update();

    track.appendChild(fill);
    track.appendChild(lo);
    track.appendChild(hi);
    box.appendChild(values);
    box.appendChild(track);
    box.appendChild(el('div', 'pbs-filter-range-scale',
      '<span>' + esc(min + unit) + '</span><span>' + esc(max + unit) + '</span>'));
    field.appendChild(box);
    return field;
  }

  /* ---------- 初始化 ---------- */
  function init(config) {
    _config = config;
    _state = {};
    var container = typeof config.container === 'string'
      ? document.querySelector(config.container)
      : config.container;
    if (!container) return;
    container.innerHTML = '';
    container.classList.add('pbs-filter-bar');

    /* 可收缩：折叠状态按页面记忆（sessionStorage），默认展开 */
    var storeKey = 'pbs_filter_collapsed_' + (config.collapseKey || location.pathname);
    var collapsed = false;
    try { collapsed = sessionStorage.getItem(storeKey) === '1'; } catch (e) {}

    var head = el('div', 'pbs-filter-collapse-bar');
    head.appendChild(el('span', 'pbs-filter-collapse-label', '筛选条件'));
    var toggle = el('button', 'pbs-filter-collapse-btn');
    toggle.type = 'button';
    head.appendChild(toggle);
    container.appendChild(head);

    var body = el('div', 'pbs-filter-body');

    var groups = config.groups || [];
    var i = 0;
    while (i < groups.length) {
      var g = groups[i];
      if (g.type === 'dropdown' || g.type === 'range') {
        // 连续的 dropdown/range 组收进同一行卡片
        var wrap = el('div', 'pbs-filter-group');
        var row = el('div', 'pbs-filter-dd-row');
        var j = i;
        while (j < groups.length && (groups[j].type === 'dropdown' || groups[j].type === 'range')) {
          row.appendChild(groups[j].type === 'dropdown' ? buildDropdown(groups[j]) : buildRange(groups[j]));
          j++;
        }
        wrap.appendChild(row);
        body.appendChild(wrap);
        i = j;
      } else {
        body.appendChild(buildChecks(g, g.type === 'radios'));
        i++;
      }
    }

    if (config.showReset !== false) {
      var resetBtn = el('button', 'pbs-filter-reset', '重置筛选');
      resetBtn.type = 'button';
      resetBtn.addEventListener('click', function () { init(_config); fireChange(); });
      body.appendChild(resetBtn);
    }

    container.appendChild(body);

    function renderToggle() {
      body.style.display = collapsed ? 'none' : '';
      toggle.innerHTML = collapsed ? '展开筛选 <i>▾</i>' : '收起筛选 <i>▴</i>';
    }
    toggle.addEventListener('click', function () {
      collapsed = !collapsed;
      try { sessionStorage.setItem(storeKey, collapsed ? '1' : '0'); } catch (e) {}
      renderToggle();
    });
    renderToggle();
  }

  function getState() {
    var copy = {};
    Object.keys(_state).forEach(function (k) {
      var v = _state[k];
      copy[k] = Array.isArray(v) ? v.slice() : (v && typeof v === 'object' ? { min: v.min, max: v.max } : v);
    });
    return copy;
  }

  function reset() { if (_config) init(_config); }

  global.PBSFilter = { init: init, getState: getState, reset: reset };
})(window);
