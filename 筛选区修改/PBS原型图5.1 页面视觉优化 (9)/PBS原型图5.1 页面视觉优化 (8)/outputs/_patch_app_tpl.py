# -*- coding: utf-8 -*-
import io, re
base = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)'

# ---------- HTML ----------
p = base + r'\网申模板库 - 留学申请管理系统.html'
s = io.open(p, encoding='utf-8', newline='').read()

theme = '<link rel="stylesheet" href="./assets/css/pbs-theme.css?v=6.1">'
assert s.count(theme) == 1
s = s.replace(theme, theme + '\r\n  <link rel="stylesheet" href="./assets/css/pbs-filter.css?v=6.4">\r\n  <script src="./assets/js/pbs-filter.js?v=6.4"></script>')

org_block = re.compile(r'[ \t]*<div><label class="block text-sm text-gray-600 mb-2">所属机构</label><select id="templateOrganization".*?</select></div>')
ms = org_block.findall(s)
print('org block:', len(ms))
assert len(ms) == 1
s = org_block.sub('<input type="hidden" id="templateOrganization">', s, count=1)

# 在 flex 行结束后、section 结束前插入 pbsFilterRoot
anchor = '<button class="btn" onclick="resetTemplateFilter()">重置</button>\r\n        </div>\r\n      </section>'
assert s.count(anchor) == 1
s = s.replace(anchor, '<button class="btn" onclick="resetTemplateFilter()">重置</button>\r\n        </div>\r\n        <!-- 结构化筛选区（复选框组，可收缩） -->\r\n        <div id="pbsFilterRoot" class="w-full mt-4"></div>\r\n      </section>')

# 底部加初始化脚本（在外部 js 之后）
ext = '<script src="./网申模板库 - 留学申请管理系统.js"></script>'
assert s.count(ext) == 1
init_script = ext + '''
  <script>
    /* 所属机构复选框组（可多选，可收缩），与外部模板库脚本联动 */
    document.addEventListener('DOMContentLoaded', function () {
      var orgInput = document.getElementById('templateOrganization');
      var session = window.pbsGetSession ? window.pbsGetSession() : { role: '超级管理员', org: 'PBS留学总部' };
      var isPlatformScope = session.role === '超级管理员' || session.role === '平台运维人员';
      if (!window.PBSFilter) return;
      if (!isPlatformScope) {
        /* 机构角色仅查看本机构网申模板（org 值已由外部脚本固定并禁用） */
        return;
      }
      PBSFilter.init({
        container: '#pbsFilterRoot',
        showReset: false,
        collapseKey: 'apply_template_lib',
        groups: [
          { key: 'org', title: '所属机构（可多选）', type: 'checks', options: ['PBS留学总部', '上海启明留学', '北京知行教育'] }
        ],
        onChange: function (st) {
          var sel = st.org || [];
          if (orgInput) orgInput.setAttribute('data-selected', sel.join('|'));
          if (window.filterTemplates) window.filterTemplates();
        }
      });
    });
  </script>'''
s = s.replace(ext, init_script)
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('HTML OK')

# ---------- 外部 JS ----------
pj = base + r'\网申模板库 - 留学申请管理系统.js'
j = io.open(pj, encoding='utf-8', newline='').read()

old1 = "      org: document.getElementById('templateOrganization').value"
assert j.count(old1) == 1
j = j.replace(old1, "      org: document.getElementById('templateOrganization').getAttribute('data-selected') || document.getElementById('templateOrganization').value")

old2 = "&& (!filters.org || item.org === filters.org);"
assert j.count(old2) == 1
j = j.replace(old2, "&& (!filters.org || filters.org.split('|').indexOf(item.org) >= 0);")

old3 = "    if (!orgFilter.disabled) orgFilter.value = '';"
assert j.count(old3) == 1
j = j.replace(old3, "    if (!orgFilter.disabled) orgFilter.value = '';\n    orgFilter.setAttribute('data-selected', orgFilter.value || '');\n    if (window.PBSFilter) PBSFilter.reset();")

old4 = "      orgFilter.value = organizations.indexOf(session.org) >= 0 ? session.org : 'PBS留学总部';"
assert j.count(old4) == 1
j = j.replace(old4, old4 + "\n      orgFilter.setAttribute('data-selected', orgFilter.value);")

io.open(pj, 'w', encoding='utf-8', newline='').write(j)
print('JS OK')
