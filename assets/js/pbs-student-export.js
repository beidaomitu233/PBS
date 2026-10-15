(function () {
  'use strict';
  var encoder = new TextEncoder();
  function safe(value) { return String(value || '文件').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').replace(/^\.+$/, '_'); }
  function readFiles(database) {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(database, 1);
      request.onupgradeneeded = function () { request.result.createObjectStore('files', { keyPath: 'id' }); };
      request.onerror = function () { reject(request.error); };
      request.onsuccess = function () {
        var db = request.result, transaction = db.transaction('files', 'readonly'), query = transaction.objectStore('files').getAll();
        query.onsuccess = function () { resolve(query.result); };
        query.onerror = function () { reject(query.error); };
        transaction.oncomplete = function () { db.close(); };
      };
    });
  }
  function crc32(bytes) {
    var crc = -1;
    for (var i = 0; i < bytes.length; i++) {
      crc ^= bytes[i];
      for (var bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ -1) >>> 0;
  }
  async function zip(entries) {
    var parts = [], central = [], offset = 0, size = 0;
    for (var i = 0; i < entries.length; i++) {
      var name = encoder.encode(entries[i].name), data = new Uint8Array(await entries[i].blob.arrayBuffer()), checksum = crc32(data);
      var local = new Uint8Array(30 + name.length), header = new DataView(local.buffer);
      header.setUint32(0, 0x04034b50, true); header.setUint16(4, 20, true); header.setUint16(6, 0x800, true);
      header.setUint16(12, 33, true); header.setUint32(14, checksum, true); header.setUint32(18, data.length, true); header.setUint32(22, data.length, true); header.setUint16(26, name.length, true); local.set(name, 30);
      var directory = new Uint8Array(46 + name.length), record = new DataView(directory.buffer);
      record.setUint32(0, 0x02014b50, true); record.setUint16(4, 20, true); record.setUint16(6, 20, true); record.setUint16(8, 0x800, true);
      record.setUint16(14, 33, true); record.setUint32(16, checksum, true); record.setUint32(20, data.length, true); record.setUint32(24, data.length, true); record.setUint16(28, name.length, true); record.setUint32(38, entries[i].name.endsWith('/') ? 16 : 0, true); record.setUint32(42, offset, true); directory.set(name, 46);
      parts.push(local, data); central.push(directory); offset += local.length + data.length; size += directory.length;
    }
    var end = new Uint8Array(22), trailer = new DataView(end.buffer);
    trailer.setUint32(0, 0x06054b50, true); trailer.setUint16(8, entries.length, true); trailer.setUint16(10, entries.length, true); trailer.setUint32(12, size, true); trailer.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end]), { type: 'application/zip' });
  }
  function paper() {
    var root = document.createElement('div'); root.className = 'pbs-export-paper';
    var title = document.createElement('h1'); title.textContent = pbsStudents.find(PBS_STUDENT_ID).name + ' · 学生档案'; root.appendChild(title);
    ['customerInfoCard', 'studentInfoCard'].forEach(function (id) { var card = document.getElementById(id); if (card) root.appendChild(card.cloneNode(true)); });
    document.querySelectorAll('#sections > section').forEach(function (section) {
      if (section.id === 'sec-delivered' || section.id === 'sec-asset' || section.id === 'pbsStudentLogs') return;
      var copy = section.cloneNode(true); copy.querySelectorAll('[id^="secbody-"]').forEach(function (body) { body.style.display = 'block'; body.classList.remove('hidden'); }); root.appendChild(copy);
    });
    root.querySelectorAll('[data-field-menu-wrap],.ai-pending,.ai-edit-panel').forEach(function (node) { node.remove(); });
    root.querySelectorAll('input,select,textarea').forEach(function (node) { var value = document.createElement('span'); value.textContent = node.type === 'password' ? '••••••••' : node.tagName === 'SELECT' && node.selectedOptions.length ? node.selectedOptions[0].textContent : node.value; node.replaceWith(value); });
    root.querySelectorAll('button,svg,script,style,[hidden],.hidden').forEach(function (node) { node.remove(); });
    root.querySelectorAll('[data-v]').forEach(function (node) { if (/pwd|password/i.test(node.dataset.v)) node.textContent = '••••••••'; });
    root.querySelectorAll('[id],[contenteditable]').forEach(function (node) { node.removeAttribute('id'); node.removeAttribute('contenteditable'); });
    var logs = pbsStudents.find(PBS_STUDENT_ID).logs.slice().sort(function (a, b) { return String(a.section).localeCompare(String(b.section)) || new Date(b.at) - new Date(a.at); });
    var section = document.createElement('section'), heading = document.createElement('h2'); heading.textContent = '档案变更'; section.appendChild(heading);
    var names = { student:'学生信息',customer:'客户信息',edu:'教育背景',lang:'语言成绩',score:'学业信息',qual:'专业资质',work:'工作经历',practice:'实践经历',honor:'荣誉奖项',pub:'学术发表',apply:'申请记录',selectionBinding:'申请记录',account:'账号管理',asset:'资产文件',delivered:'交付文件' };
    logs.forEach(function (log) {
      var label = document.createElement('h3'); label.textContent = (names[log.section] || log.section) + ' · ' + log.actor + ' · ' + log.role + ' · ' + new Date(log.at).toLocaleString('zh-CN', { timeZone:'Asia/Shanghai',hour12:false }); section.appendChild(label);
      var table = document.createElement('table'); table.innerHTML = '<thead><tr><th>字段</th><th>修改前</th><th>修改后</th></tr></thead>';
      (log.changes || []).forEach(function (change) { var row = table.insertRow(); [change.field,change.before,change.after].forEach(function (value) { row.insertCell().textContent = value == null ? '—' : value; }); }); section.appendChild(table);
    });
    if (!logs.length) { var empty = document.createElement('p'); empty.textContent = '暂无修改记录'; section.appendChild(empty); }
    root.appendChild(section); return root;
  }
  async function pdf(element) {
    return window.html2pdf().set({ margin:12, image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2,backgroundColor:'#ffffff',scrollY:0}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}, pagebreak:{mode:['css','legacy'],avoid:['tr','h2','h3']} }).from(element).toPdf().outputPdf('blob');
  }
  function addInventory(root, heading, rows) {
    var section = document.createElement('section'), title = document.createElement('h2'); title.textContent = heading; section.appendChild(title);
    rows.forEach(function (value) { var line = document.createElement('p'); line.textContent = value; section.appendChild(line); });
    if (!rows.length) { var empty = document.createElement('p'); empty.textContent = '暂无文件'; section.appendChild(empty); } root.insertBefore(section,root.lastElementChild);
  }
  async function exportArchive(button) {
    if (!pbsStudents.canView(PBS_STUDENT_ID) || button.disabled) return;
    button.disabled = true; button.textContent = '正在导出…'; var root;
    try {
      var assets = (await readFiles('pbs_student_assets_v1')).filter(function (file) { return file.owner === PBS_STUDENT_ID; });
      var deliveries = window.PBSDelivery ? PBSDelivery.forStudent(PBS_STUDENT_ID) : [];
      if (!window.PBSDelivery) throw new Error('交付文件正在加载，请稍后重试');
      var binaries = await readFiles('pbs_delivery_files_v1'), entries = [{name:'资产文件/',blob:new Blob([])},{name:'已交付文件/',blob:new Blob([])}], missing = [], used = {};
      function add(folder, name, blob) { var path = folder + '/' + safe(name), key = path, count = 1; while (used[path]) path = key.replace(/(\.[^.]*)?$/, function (extension) { return ' (' + (++count) + ')' + extension; }); used[path] = true; entries.push({name:path,blob:blob}); }
      assets.forEach(function (file) { var extension = file.file && (file.file.name.match(/\.[^.]+$/) || [''])[0], name = file.name; if (extension && !name.toLowerCase().endsWith(extension.toLowerCase())) name += extension; if (file.file) add('资产文件',name,file.file); else missing.push('资产文件/' + name); });
      document.querySelectorAll('#asset-file-list [data-file]:not([data-uploaded-asset])').forEach(function (row) { var name = row.querySelector('p'); if (name) missing.push('资产文件/' + name.textContent.trim()); });
      for (var i = 0; i < deliveries.length; i++) {
        var item = deliveries[i], binary = binaries.find(function (file) { return file.id === item.id; }), name = item.school + '-' + item.name + '-' + item.version;
        if (binary && binary.file) add('已交付文件',name + (item.fileName.match(/\.[^.]+$/) || [''])[0],binary.file);
        else if (item.contentHtml) { var report = document.createElement('div'); report.className = 'pbs-export-paper'; report.innerHTML = item.contentHtml; report.querySelectorAll('script,iframe,object,embed').forEach(function (node) { node.remove(); }); add('已交付文件',name + '.pdf',await pdf(report)); }
        else if (/^data:(?:image\/|application\/pdf)/.test(item.fileData || '')) add('已交付文件',name + (item.fileName.match(/\.[^.]+$/) || [''])[0],await (await fetch(item.fileData)).blob());
        else missing.push('已交付文件/' + item.fileName);
      }
      root = paper();
      addInventory(root,'交付文件',deliveries.map(function (file) { return file.school + ' · ' + file.name + ' · ' + file.version; }));
      addInventory(root,'资产文件',assets.map(function (file) { return file.name; }).concat(missing.filter(function (path) { return path.startsWith('资产文件/'); }).map(function (path) { return path.slice(5); })));
      entries.unshift({name:safe(pbsStudents.find(PBS_STUDENT_ID).name) + '-学生档案.pdf',blob:await pdf(root)});
      if (missing.length) entries.push({name:'附件清单.txt',blob:new Blob(['以下记录仅保存了文件信息，未找到可打包的原文件：\r\n\r\n' + missing.join('\r\n')],{type:'text/plain;charset=utf-8'})});
      var url = URL.createObjectURL(await zip(entries)), link = document.createElement('a'); link.href = url; link.download = safe(pbsStudents.find(PBS_STUDENT_ID).name) + '-学生档案.zip'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
      if (window.showToast) showToast('档案已导出');
    } catch (error) { if (window.showToast) showToast(error.message || '导出失败，请重试'); else window.alert(error.message || '导出失败，请重试'); }
    finally { button.disabled = false; button.textContent = '导出档案'; }
  }
  document.getElementById('exportStudentArchive').addEventListener('click', function () { exportArchive(this); });
})();
