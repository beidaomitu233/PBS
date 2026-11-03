# -*- coding: utf-8 -*-
import io, re
p = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)\模板库列表 - 文书交付系统.html'
s = io.open(p, encoding='utf-8', newline='').read()

def sub1(pat, repl, name, flags=re.S):
    global s
    r = re.compile(pat, flags)
    ms = r.findall(s)
    print(name, 'matches:', len(ms))
    if len(ms) != 1: raise SystemExit('ABORT: ' + name)
    s = r.sub(repl, s, count=1)

# 1) head 引入
sub1(r'<link rel="stylesheet" href="\./assets/css/pbs-theme\.css\?v=6\.1">',
     '<link rel="stylesheet" href="./assets/css/pbs-theme.css?v=6.1">\r\n  <link rel="stylesheet" href="./assets/css/pbs-filter.css?v=6.4">\r\n  <script src="./assets/js/pbs-filter.js?v=6.4"></script>',
     'theme', 0)

# 2) 整个筛选区重写
new_section = """      <!-- 筛选区 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div class="flex items-center gap-6 flex-wrap">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">模板名称/关键词</label>
            <input id="template-keyword-filter" type="text" placeholder="搜索模板名称..." class="h-10 w-56 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
          </div>
        </div>
        <!-- 结构化筛选区（复选框组） -->
        <div id="pbsFilterRoot" class="mt-4"></div>
      </div>

"""
sub1(r'      <!-- 筛选区 -->.*?(?=      <!-- 统计信息 -->)', new_section.replace('\\', '\\\\'), 'filter-section')

# 3) 替换筛选 JS（495-525 行区块）
start = s.find("      var orgFilter = document.getElementById('template-org-filter');")
end = s.find("      filterTemplateCards();", start)
print('js block:', start, end)
if not (start > 0 and end > start): raise SystemExit('ABORT js')

new_js = """      var keywordFilter = document.getElementById('template-keyword-filter');
      function filterTemplateCards() {
        var keyword = keywordFilter.value.trim().toLowerCase();
        var st = window.PBSFilter ? PBSFilter.getState() : {};
        var visible = 0;
        templateCards.forEach(function(card) {
          var text = card.textContent.toLowerCase();
          var ok = card.dataset.scopeHidden !== '1' && (!keyword || text.indexOf(keyword) >= 0);
          if (ok && st.org && st.org.length && st.org.indexOf(card.dataset.org) < 0) ok = false;
          if (ok && st.type && st.type.length) {
            var badgeEl = card.querySelector('span.rounded-full');
            var badge = badgeEl ? badgeEl.textContent.trim() : '';
            if (st.type.indexOf(badge) < 0) ok = false;
          }
          if (ok && st.stage && st.stage.length) {
            var hit = false;
            st.stage.forEach(function (sg) { if (text.indexOf(sg.replace('申请', '')) >= 0) hit = true; });
            if (!hit) ok = false;
          }
          card.classList.toggle('hidden', !ok);
          if (ok) visible += 1;
        });
        document.getElementById('template-visible-count').textContent = visible;
      }
      /* 初始化结构化筛选：文书类型·申请层次·所属机构复选框组 */
      var tplGroups = [
        { key: 'type', title: '文书类型（可多选）', type: 'checks', options: ['CV', 'PS', 'RP', 'RL', 'CL'] },
        { key: 'stage', title: '申请层次（可多选）', type: 'checks', options: ['本科申请', '硕士申请', '博士申请', '本硕连读申请'] }
      ];
      if (isPlatformScope) {
        tplGroups.push({ key: 'org', title: '所属机构（可多选）', type: 'checks', options: ['PBS留学总部', '上海启明留学', '北京知行教育'] });
      } else {
        /* 机构角色仅查看本机构模板 */
        templateCards.forEach(function (card) { if (card.dataset.org !== normalizedOwnOrg()) card.dataset.scopeHidden = '1'; });
      }
      if (window.PBSFilter) {
        PBSFilter.init({ container: '#pbsFilterRoot', onChange: filterTemplateCards, groups: tplGroups });
      }
      keywordFilter.addEventListener('input', filterTemplateCards);
"""
s = s[:start] + new_js + s[end:]
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('WRITE OK')
