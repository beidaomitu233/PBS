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
    document.querySelectorAll('#selectedSchoolZones [data-school-item]').forEach(function(card){
      card.draggable=true;
      if(card.querySelector('.selection-drag-handle'))return;
      var handle=document.createElement('span');handle.className='selection-drag-handle';handle.title='拖拽调整分区';
      handle.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="8" cy="5" r="1.6"/><circle cx="16" cy="5" r="1.6"/><circle cx="8" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/><circle cx="8" cy="19" r="1.6"/><circle cx="16" cy="19" r="1.6"/></svg>';
      card.firstElementChild.prepend(handle);
    });
  }
  function enableZoneDragging(){
    var board=document.getElementById('selectedSchoolZones');
    function clear(){board.classList.remove('is-dragging');board.querySelectorAll('.is-drop-target,.is-dragged').forEach(function(element){element.classList.remove('is-drop-target','is-dragged');});}
    board.addEventListener('dragstart',function(event){
      var card=event.target.closest('[data-school-item]');if(!card)return;
      if(event.target.closest('button,input,textarea,a')){event.preventDefault();return;}
      event.dataTransfer.setData('text/plain',card.dataset.schoolItem);event.dataTransfer.effectAllowed='move';board.classList.add('is-dragging');card.classList.add('is-dragged');
    });
    board.addEventListener('dragover',function(event){
      var target=event.target.closest('[data-selection-zone]');if(!target)return;
      event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect='move';
      board.querySelectorAll('.is-drop-target').forEach(function(element){if(element!==target)element.classList.remove('is-drop-target');});
      target.classList.add('is-drop-target');
      var zone=target.dataset.selectionZone;if(target.classList.contains('is-collapsed'))setExpanded(zone,true);
      var list=document.getElementById('zone-'+zone),rect=list.getBoundingClientRect();
      if(event.clientY<rect.top+45)list.scrollTop-=16;else if(event.clientY>rect.bottom-45)list.scrollTop+=16;
    },true);
    board.addEventListener('dragleave',function(event){var target=event.target.closest('[data-selection-zone]');if(target && !target.contains(event.relatedTarget))target.classList.remove('is-drop-target');});
    board.addEventListener('drop',function(event){
      var target=event.target.closest('[data-selection-zone]');if(!target)return;
      event.preventDefault();event.stopPropagation();var id=event.dataTransfer.getData('text/plain');
      if(window.SCHOOL_INFO[id])window.addToZone(target.dataset.selectionZone,id);
      clear();
    },true);
    board.addEventListener('dragend',clear);
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
    enableZoneDragging();updateToggle(); refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
