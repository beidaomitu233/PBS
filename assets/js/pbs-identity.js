(function () {
  'use strict';
  var config = {
    '中国大陆居民': ['居民身份证'],
    '港澳台居民': ['港澳居民来往内地通行证', '台湾居民来往大陆通行证', '港澳台居民居住证'],
    '外籍人士': ['护照'],
    '中国大陆居民（持海外永居）': ['居民身份证', '海外永居证明'],
    '其他': ['其他']
  };
  function esc(value) { return String(value || '').replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function normalize(student) {
    var value = Object.assign({}, student || {});
    value.identity = ({'大陆籍':'中国大陆居民','港澳台':'港澳台居民','外籍':'外籍人士'})[value.identity] || value.identity || '';
    if (!config[value.identity]) value.identity = '';
    var types = config[value.identity] || [];
    value.documents = Array.isArray(value.documents) ? value.documents.map(function(doc) { return Object.assign({}, doc); }) : [];
    if (!value.documents.length && value.idcard && value.idcard !== '—') value.documents.push({ type: types.length === 1 ? types[0] : value.identity === '中国大陆居民（持海外永居）' ? '居民身份证' : '', number: value.idcard });
    value.idcard = value.documents.length ? value.documents[0].number || '' : '';
    return value;
  }
  var cls = 'w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500';
  function field(label, control) { return '<label class="block text-xs text-gray-500">' + label + control + '</label>'; }
  function number(doc, index) { return field('证件号码（选填）', '<input data-document-number="' + index + '" value="' + esc(doc.number) + '" class="' + cls + ' mt-1" placeholder="证件号码">'); }
  function render(host, identity, documents, readonly) {
    var types = config[identity] || [], dual = identity === '中国大陆居民（持海外永居）';
    documents = documents || [];
    if (!types.length) { host.innerHTML = documents.length && documents[0].number ? '<div class="mt-3">' + number(documents[0],0) + '</div>' : ''; host.querySelectorAll('input').forEach(function(input){input.disabled=true;}); return; }
    var rows = dual ? types.map(function(type) { return Object.assign({type:type}, documents.find(function(doc) { return doc.type === type; }) || {}); }) : [documents[0] || {type:types.length === 1 ? types[0] : ''}];
    host.innerHTML = rows.map(function(doc, index) {
      var options = dual ? [types[index]] : types;
      var select = '<select data-document-type="' + index + '" class="' + cls + ' mt-1">' + (options.length > 1 || !doc.type ? '<option value="">请选择证件类型</option>' : '') + options.map(function(type) { return '<option' + (doc.type === type ? ' selected' : '') + '>' + esc(type) + '</option>'; }).join('') + '</select>';
      return '<div class="grid grid-cols-2 gap-3 mt-3">' + field('证件类型', select) + number(doc, index) + (doc.type === '海外永居证明' ? field('永居国家（选填）', '<input data-document-country="' + index + '" class="' + cls + ' mt-1" value="' + esc(doc.country) + '">') : '') + (identity === '其他' ? field('证件说明', '<input data-document-desc="' + index + '" class="' + cls + ' mt-1" value="' + esc(doc.desc) + '" placeholder="填写证件名称">') : '') + '</div>';
    }).join('');
    host.querySelectorAll('input,select').forEach(function(input) { input.disabled = !!readonly; });
  }
  function collect(host) {
    return Array.from(host.querySelectorAll('[data-document-type]')).map(function(input) {
      var index = input.dataset.documentType;
      function value(name) { var node = host.querySelector('[data-document-' + name + '="' + index + '"]'); return node ? node.value.trim() : ''; }
      var doc = {type:input.value, number:value('number')};
      if (doc.type === '海外永居证明') doc.country = value('country');
      if (doc.type === '其他') doc.desc = value('desc');
      return doc;
    });
  }
  function validate(host) {
    var invalid = null;
    host.querySelectorAll('[data-document-type], [data-document-desc], [data-document-number]').forEach(function(input) {
      input.classList.remove('border-red-500');
      var doc = input.dataset.documentNumber !== undefined && host.querySelector('[data-document-type="' + input.dataset.documentNumber + '"]');
      var bad = input.hasAttribute('data-document-type') || input.hasAttribute('data-document-desc') ? !input.value.trim() : doc && /居民身份证|港澳台居民居住证/.test(doc.value) && input.value.trim() && !/^\d{17}[\dXx]$/.test(input.value.trim());
      if (bad) { input.classList.add('border-red-500'); if (!invalid) invalid = input; }
    });
    if (invalid) { invalid.focus(); return '请补全证件类型、证件说明，居民身份证及居住证号码应为18位'; }
    return '';
  }
  function summary(documents) { return (documents || []).map(function(doc) { return (doc.type === '其他' ? doc.desc || '其他' : doc.type || '证件类型待补充') + '：' + (doc.number || '—') + (doc.country ? '（' + doc.country + '）' : ''); }).join('\n') || '—'; }
  window.pbsIdentity = { config:config, normalize:normalize, render:render, collect:collect, validate:validate, summary:summary };
})();
