(function () {
  'use strict';
  var zones = ['reach','match','safe'], dialog = null, restoreState = null, reasonState = null;
  function section(zone) { return document.querySelector('[data-selection-zone="' + zone + '"]'); }
  function updateToggle() {
    var expanded = zones.every(function(zone) { return !section(zone).classList.contains('is-collapsed'); });
    var button = document.getElementById('selectedSchoolsToggleAll');
    button.textContent = expanded ? '全部收起' : '全部展开';
    button.setAttribute('aria-expanded',String(expanded));
  }
  function setExpanded(zone, expanded) {
    var panel = section(zone);
    panel.classList.toggle('is-collapsed',!expanded);
    panel.querySelector('[data-zone-toggle]').setAttribute('aria-expanded',String(expanded));
    var list = document.getElementById('zone-' + zone);
    list.inert = !expanded;
    updateToggle();
  }
  window.toggleSelectedSchoolZone = function(zone) { setExpanded(zone,section(zone).classList.contains('is-collapsed')); };
  window.toggleAllSelectedSchoolZones = function() {
    var expand = zones.some(function(zone) { return section(zone).classList.contains('is-collapsed'); });
    zones.forEach(function(zone) { setExpanded(zone,expand); });
  };
  window.toggleSelectedSchoolsDialog = function() {
    if (dialog && dialog.open) { dialog.close(); return; }
    var home = document.getElementById('schoolZoneColumn'), board = document.getElementById('selectedSchoolZones'), tools = document.getElementById('selectedSchoolsTools');
    restoreState = zones.map(function(zone) { return !section(zone).classList.contains('is-collapsed'); });
    reasonState = new Map();
    board.querySelectorAll('[data-school-item]').forEach(function(card) { reasonState.set(card,card.classList.contains('is-reason-expanded')); card.classList.add('is-reason-expanded'); var text = card.querySelector('.reason-text'); if (text) text.setAttribute('aria-expanded','true'); });
    dialog = document.createElement('dialog'); dialog.className = 'selection-schools-dialog';
    dialog.setAttribute('aria-labelledby','selectedSchoolsDialogTitle');
    dialog.innerHTML = '<header><h2 id="selectedSchoolsDialogTitle">已选院校</h2><div id="selectedSchoolsDialogTools"></div></header><div class="selection-schools-dialog-body"></div>';
    document.body.appendChild(dialog);
    dialog.querySelector('#selectedSchoolsDialogTools').appendChild(tools);
    dialog.querySelector('.selection-schools-dialog-body').appendChild(board);
    document.getElementById('selectedSchoolsExpandLabel').textContent = '收起';
    document.getElementById('selectedSchoolsExpandButton').setAttribute('aria-expanded','true');
    zones.forEach(function(zone) { setExpanded(zone,true); });
    dialog.addEventListener('click',function(event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close',function() {
      home.querySelector('.selection-zones-toolbar').appendChild(tools); home.appendChild(board);
      document.getElementById('selectedSchoolsExpandLabel').textContent = '展开';
      document.getElementById('selectedSchoolsExpandButton').setAttribute('aria-expanded','false');
      zones.forEach(function(zone,index) { setExpanded(zone,restoreState[index]); });
      board.querySelectorAll('[data-school-item]').forEach(function(card) { var expanded = !!reasonState.get(card); card.classList.toggle('is-reason-expanded',expanded); var text = card.querySelector('.reason-text'); if (text) text.setAttribute('aria-expanded',String(expanded)); });
      dialog.remove(); dialog = null; document.getElementById('selectedSchoolsExpandButton').focus();
    });
    dialog.showModal();
  };
  function refresh() {
    zones.forEach(function(zone) {
      var list = document.getElementById('zone-' + zone), empty = list.querySelector('.selection-zone-empty'), count = list.querySelectorAll('[data-school-item]').length;
      if (!count && !empty) { empty = document.createElement('p'); empty.className = 'selection-zone-empty'; empty.textContent = '拖拽院校至此或点击「加入清单」'; list.appendChild(empty); }
      if (count && empty) empty.remove();
    });
  }
  function init() {
    if (!document.getElementById('selectedSchoolZones')) return;
    var original = window.refreshCounts;
    window.refreshCounts = function() { original(); refresh(); };
    var add = window.addToZone;
    window.addToZone = function(zone,sid) { add(zone,sid); setExpanded(zone,true); };
    var drop = window.dropToZone;
    window.dropToZone = function(event,zone) { drop(event,zone); setExpanded(zone,true); };
    var reason = window.updateCardReasonDisplay;
    window.updateCardReasonDisplay = function(card,sid) {
      reason(card,sid);
      var text = card.querySelector('.reason-text');
      if (text) { text.tabIndex = 0; text.setAttribute('role','button'); text.setAttribute('aria-expanded',String(card.classList.contains('is-reason-expanded'))); }
    };
    document.querySelectorAll('[data-school-item]').forEach(function(card) { updateCardReasonDisplay(card,card.dataset.schoolItem); });
    function toggleReason(event) {
      var text = event.target.closest('.reason-text');
      if (!text || event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
      var card = text.closest('[data-school-item]');
      if (!card || card.querySelector('textarea')) return;
      event.preventDefault(); card.classList.toggle('is-reason-expanded'); text.setAttribute('aria-expanded',String(card.classList.contains('is-reason-expanded')));
    }
    document.addEventListener('click',toggleReason); document.addEventListener('keydown',toggleReason);
    updateToggle(); refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
