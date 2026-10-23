/* PBS 机构主体演示数据：机构管理与机构成员管理页面共用。 */
(function () {
  'use strict';
  window.PBS_ORGANIZATIONS = [
    { id: 'ORG-100001', name: 'PBS留学总部', avatar: './PRD参考文件/导航栏图标参考.jpg', createdAt: '2025-01-08 09:30', members:113, status:'启用' },
    { id: 'ORG-100002', name: '上海启明留学', avatar: './PRD参考文件/导航栏图标参考.jpg', createdAt: '2025-03-18 14:20', members:2, status:'启用' },
    { id: 'ORG-100003', name: '北京知行教育', avatar: './PRD参考文件/导航栏图标参考.jpg', createdAt: '2025-05-06 10:15', members:0, status:'启用' },
    { id: 'ORG-100004', name: '广州远航教育', avatar: './PRD参考文件/导航栏图标参考.jpg', createdAt: '2026-02-12 16:40', members:0, status:'启用' },
    { id: 'ORG-100005', name: '深圳新途教育', avatar: './PRD参考文件/导航栏图标参考.jpg', createdAt: '2026-06-25 11:05', members:0, status:'启用' },
    { id: 'ORG-100006', name: '商户8888', createdAt: '2026-09-04 14:22', members:0, status:'停用' },
    { id: 'ORG-100007', name: '商户01', createdAt: '2026-09-04 16:06', members:0, status:'停用' }
  ];
  var members={2:1,5:3,9:2,12:1,18:4};
  for(var number=2;number<=38;number++) {
    window.PBS_ORGANIZATIONS.push({id:'ORG-'+String(100006+number),name:'商户'+String(number).padStart(2,'0'),createdAt:'2026-09-'+String(number%28+1).padStart(2,'0')+' 10:30',members:members[number] || 0,status:'启用'});
  }
})();
