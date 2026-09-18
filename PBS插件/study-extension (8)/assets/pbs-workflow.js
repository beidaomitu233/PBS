export function availableTasks(tasks) {
  return tasks.filter(task => !/待领取|待认领|未领取|待接收|^(UNCLAIMED|PENDING_CLAIM|TO_CLAIM)$/i.test(String(task.status || '').trim()));
}

export function preparedVersions(answers) {
  const versions = new Map();
  answers.forEach((answer, index) => {
    const key = String(answer.templateVersionId || answer.versionId || answer.templateId || 'bound');
    if (!versions.has(key)) versions.set(key, {
      id: key, name: answer.templateName || '当前任务模板',
      version: answer.templateVersion ?? answer.version ?? null,
      pages: new Map()
    });
    const version = versions.get(key);
    const pageKey = answer.pageKey || 'default';
    if (!version.pages.has(pageKey)) version.pages.set(pageKey, {
      id: pageKey, name: answer.pageName || '申请信息', order: answer.pageSortOrder ?? 999, fields: []
    });
    const sensitive = answer.sensitivity === 'HIGH' || /password|national_id|passport_number|密码/i.test(`${answer.canonicalField || ''} ${answer.accessibleName || ''}`);
    const value = sensitive ? '' : String(answer.value ?? '').trim();
    version.pages.get(pageKey).fields.push({
      ...answer, id: answer.templateFieldId || `${pageKey}-${index}`,
      label: answer.accessibleName || answer.label || answer.canonicalField || '未命名字段',
      value, sensitive, order: answer.fieldSortOrder ?? index
    });
  });
  return [...versions.values()].map(version => ({ ...version,
    pages: [...version.pages.values()].sort((a, b) => a.order - b.order).map(page => ({
      ...page, fields: page.fields.sort((a, b) => a.order - b.order)
    }))
  }));
}

export function catalogPreview(fields) {
  return fields.map(field => ({
    localField: field,
    resolution: { scanFieldId: field.clientFieldId, clientFieldId: field.clientFieldId,
      canonicalField: null, status: 'UNSUPPORTED', sensitivity: 'NORMAL', value: null,
      displayValue: null, confidence: 0, guidance: null, plan: null },
    selectable: true, defaultSelected: true, guidance: field.helpText || '', reason: ''
  }));
}

export function createWorkflow(React) {
  const h = React.createElement;
  const { useState, useMemo, useEffect } = React;
  const button = (text, onClick, primary = false, disabled = false, extra = {}) => h('button', {
    type: 'button', className: primary ? 'primary-button' : 'secondary-button', onClick, disabled, ...extra
  }, text);
  const card = (...children) => h('section', { className: 'card flow-card' }, ...children);
  const title = (text, action) => h('div', { className: 'flow-title' }, h('h2', null, text), action);

  function Nav({ step, navigate, canVisit, busy, onHome }) {
    const steps = [['scan', '扫描页面'], ['fields', '字段采集'], ['materials', '材料要求'], ['confirm', '保存模板']];
    const current = step === 'result' ? 3 : steps.findIndex(([id]) => id === step);
    return h('div', { className: 'flow-navigation' },
      h('div', { className: 'flow-nav-heading' }, button('‹ 当前任务', onHome), h('strong', null, '采集模板')),
      h('nav', { className: 'flow-steps', 'aria-label': '模板采集步骤' }, steps.map(([id, label], index) => h('button', {
        key: id, type: 'button', disabled: busy || !canVisit(id), onClick: () => navigate(id),
        'aria-current': index === current ? 'step' : undefined,
        className: index === current ? 'active' : index < current ? 'complete' : ''
      }, h('span', null, index < current ? '✓' : index + 1), label)))
    );
  }

  function Home({ mode, user, onMode, onHome, onResume, hasDraft, taskPicker,
    task, answers, materials, loading, error, notice, onRefresh, Copy, onDownload, onOpen, onTrace }) {
    const [draftPrompt, setDraftPrompt] = useState(false);
    const portalAccount = task?.applyAccount ?? task?.applicationAccount ?? task?.portalAccount ?? task?.loginAccount ?? task?.websiteAccount ?? task?.credentials?.account ?? task?.credentials?.username ?? task?.account ?? '';
    const portalPassword = task?.applyPassword ?? task?.applicationPassword ?? task?.portalPassword ?? task?.loginPassword ?? task?.websitePassword ?? task?.credentials?.password ?? task?.password ?? '';
    const latestVersion = preparedVersions(answers)[0];
    const latestTemplate = task?.latestTemplate ?? task?.template ?? {};
    const latestTemplateName = task?.latestTemplateName ?? latestTemplate.name ?? latestVersion?.name ?? '';
    const latestTemplateMajor = task?.latestTemplateMajor ?? latestTemplate.major ?? task?.major ?? '';
    const latestTemplateTime = task?.latestTemplateCollectedAt ?? task?.latestTemplateTime ?? task?.templateCollectedAt ?? latestTemplate.collectedAt ??
      answers.map(answer => answer.collectedAt ?? answer.templateUpdatedAt ?? answer.templateCreatedAt ?? answer.updatedAt ?? answer.updateTime ?? answer.createdAt ?? answer.createTime).filter(Boolean).sort().at(-1) ?? '';
    const displayTime = latestTemplateTime ? String(latestTemplateTime).replace('T', ' ').replace(/\.\d+Z?$/, '').slice(0, 16) : '暂无记录';
    const taskValue = (label, value, copyValue) => h('div', { className: 'flow-task-field' }, h('dt', null, label),
      h('dd', null, h('span', null, value || '未配置'), copyValue && h(Copy, { text: copyValue, ariaLabel: `复制${label}` })));
    useEffect(() => setDraftPrompt(false), [task?.taskId]);
    return h(React.Fragment, null,
      mode && h('div', { className: 'flow-nav-heading' }, button('‹ 当前任务', onHome), h('strong', null, mode === 'capture' ? '采集模板' : '网申信息')),
      !mode ? h(React.Fragment, null,
        card(title('选择网申任务'), taskPicker),
        task && h('section', { className: 'card flow-card flow-task-card' },
          h('section', { className: 'flow-task-info', 'aria-label': '当前网申任务信息' },
            h('h3', null, '网申信息'),
            h('dl', null,
              taskValue('学生姓名', task.studentName),
              taskValue('院校名称', task.school),
              taskValue('申请专业', task.major),
              taskValue('申请官网', task.applyUrl),
              taskValue('网申账号', portalAccount, portalAccount),
              taskValue('网申密码', portalPassword ? '••••••••' : '', portalPassword)),
            task.applyUrl && h('div', { className: 'flow-website-action' }, button('打开申请官网', () => onOpen(task.applyUrl))),
            h('section', { className: `flow-template-summary ${latestTemplateName ? '' : 'is-empty'}` },
              h('div', { className: 'flow-template-summary-head' }, h('span', { 'aria-hidden': true }, '▤'), h('strong', null, '最近采集模板')),
              latestTemplateName ? h('div', { className: 'flow-template-summary-grid' },
                h('div', null, h('span', null, '模板名称'), h('strong', null, latestTemplateName)),
                h('div', null, h('span', null, '专业'), h('strong', null, latestTemplateMajor || '未填写')),
                h('div', null, h('span', null, '采集时间'), h('strong', null, displayTime))) :
                h('p', null, '暂无历史模板'))),
          h('div', { className: 'flow-task-actions' },
            button('查看网申信息', () => onMode('reuse'), true),
            button('采集模板', () => hasDraft ? setDraftPrompt(true) : onMode('capture')))),
        draftPrompt && h('div', { className: 'flow-modal-backdrop', role: 'presentation', onMouseDown: event => {
          if (event.target === event.currentTarget) setDraftPrompt(false);
        } }, h('section', { className: 'flow-draft-dialog', role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'draft-dialog-title' },
          h('div', { className: 'flow-draft-dialog-head' },
            h('h2', { id: 'draft-dialog-title' }, '该任务有未完成的采集'),
            h('button', { type: 'button', 'aria-label': '关闭', onClick: () => setDraftPrompt(false) }, '×')),
          h('p', null, '请选择本次采集方式'),
          h('div', { className: 'flow-draft-dialog-actions' },
            button('继续采集', () => { setDraftPrompt(false); onResume(); }, true),
            button('重新采集', () => { setDraftPrompt(false); onMode('capture', 'restart'); }))))
      ) : mode === 'reuse' ? h(Reuse, { key: task?.taskId || 'unselected', task, answers, materials, loading, error,
        notice, onRefresh, Copy, onDownload, onOpen, onTrace })
        : null
    );
  }

  function Reuse({ task, answers, materials, loading, error, notice, onRefresh, Copy, onDownload, onOpen, onTrace }) {
    const [selected, setSelected] = useState(null);
    const [view, setView] = useState('templates');
    const [tab, setTab] = useState('fields');
    const [query, setQuery] = useState('');
    const [checked, setChecked] = useState(new Set());
    const [missingOnly, setMissingOnly] = useState(false);
    const versions = useMemo(() => preparedVersions(answers), [answers]);
    const version = versions.find(item => item.id === selected);
    const fields = version?.pages.flatMap(page => page.fields) || [];
    const pending = fields.filter(field => !field.value).length;
    function toggle(id) { setChecked(previous => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; }); }
    return h(React.Fragment, null,
      task && view === 'templates' && card(
        title('选择填写模板', button(loading ? '读取中…' : '刷新', onRefresh, false, loading, { className: 'flow-text-button' })),
        loading ? h('p', { className: 'flow-empty', role: 'status' }, '正在读取任务模板…') : error ? h('p', { className: 'flow-error', role: 'alert' }, error) : !versions.length ?
          h('div', { className: 'flow-empty' }, h('strong', null, '暂无可用的填写清单'), h('p', null, '请先在 PBS 为该任务绑定模板并保存填写信息。')) :
          h('div', { className: 'flow-version-list', role: 'radiogroup', 'aria-label': '填写模板版本' }, versions.map(item => {
            const values = item.pages.flatMap(page => page.fields);
            return h('button', { type: 'button', key: item.id, className: `flow-version ${selected === item.id ? 'selected' : ''}`,
              onClick: () => setSelected(item.id), role: 'radio', 'aria-checked': selected === item.id },
              h('span', { className: 'flow-radio', 'aria-hidden': true }, selected === item.id ? '●' : '○'),
              h('div', null, h('strong', null, item.name, item.version != null ? ` · v${item.version}` : ''),
                h('p', null, `${item.pages.length} 页 · ${values.length} 项 · ${values.filter(field => !!field.value).length} 项有值`)));
          })),
        versions.length > 0 && h('div', { className: 'flow-actions' }, button('查看网申信息', () => setView('list'), true, !version || loading))
      ),
      task && view === 'list' && version && card(
        title(task.studentName, button('更换模板', () => setView('templates'), false, false, { className: 'flow-text-button' })),
        h('p', { className: 'flow-task-target' }, [task.school, task.major].filter(Boolean).join(' · ')),
        h('div', { className: 'flow-list-toolbar' }, h('span', null, version.name, version.version != null ? ` · v${version.version}` : ''),
          task.applyUrl && button('打开官网', () => onOpen(task.applyUrl), false, false, { className: 'flow-text-button' })),
        h('div', { className: 'flow-tabs', role: 'tablist' }, ['fields', 'materials'].map(id => h('button', {
          type: 'button', key: id, role: 'tab', 'aria-selected': tab === id, className: tab === id ? 'active' : '', onClick: () => setTab(id)
        }, id === 'fields' ? '填写信息' : '申请材料'))),
        tab === 'fields' ? h(React.Fragment, null,
          h('input', { className: 'flow-search', type: 'search', placeholder: '搜索字段或内容', 'aria-label': '搜索填写清单', value: query, onChange: event => setQuery(event.target.value) }),
          h('div', { className: 'flow-list-toolbar' }, h('span', null, `已核对 ${fields.filter(field => checked.has(field.id)).length} / ${fields.length}`),
            h('label', null, h('input', { type: 'checkbox', checked: missingOnly, onChange: event => setMissingOnly(event.target.checked) }), `仅看待补充 ${pending}`)),
          ...version.pages.map(page => {
            const visible = page.fields.filter(field => (!missingOnly || !field.value) && `${field.label} ${field.value}`.toLowerCase().includes(query.toLowerCase()));
            return visible.length ? h('details', { className: 'flow-page', key: page.id, open: true },
              h('summary', null, page.name, h('span', null, visible.length)),
              ...visible.map(field => h('div', { className: 'flow-answer', key: field.id },
                h('label', { className: 'flow-answer-label' }, h('input', { type: 'checkbox', checked: checked.has(field.id), onChange: () => toggle(field.id) }), field.label),
                h('div', { className: `flow-answer-value ${!field.value ? 'missing' : ''}` }, h('span', null, field.sensitive ? '请在 PBS 查看' : field.value || '待补充'),
                  field.value && h(Copy, { text: field.value, ariaLabel: `复制${field.label}` })),
                field.value && field.canonicalField && h('button', { type: 'button', className: 'flow-locate', onClick: () => onTrace({ ...field, rowKey: field.id, pageKey: page.id }) }, '定位字段')
              ))) : null;
          }),
          !fields.some(field => (!missingOnly || !field.value) && `${field.label} ${field.value}`.toLowerCase().includes(query.toLowerCase())) && h('p', { className: 'flow-empty' }, '没有匹配的字段')
        ) : materials.length ? h('div', { className: 'flow-material-list' }, materials.map(item => h('div', { key: item.id, className: 'flow-material' },
          h('div', null, h('strong', null, item.name), h('p', null, item.fileName || (item.status === 'READY' ? '已绑定档案' : '待绑定档案'))),
          item.fileUrl && item.status === 'READY' ? button('下载', () => onDownload(item), false, false, { className: 'flow-text-button' }) : h('span', { className: 'flow-muted' }, '待补充')
        ))) : h('p', { className: 'flow-empty' }, '该任务暂无材料'),
        notice && h('p', { className: 'flow-muted', role: 'status' }, notice),
        h('div', { className: 'flow-actions' }, button('返回模板列表', () => setView('templates')))
      )
    );
  }

  function Materials({ items, rules, onEdit, onRemove, onAdd, onBack, onNext, editable }) {
    return card(title('材料要求', button('+ 添加材料', onAdd, false, !editable, { className: 'flow-text-button' })),
      items.length ? h('div', { className: 'flow-material-list' }, items.map(item => h('div', { className: 'flow-material-editor', key: item.id },
        h('label', null, '材料名称', h('input', { value: item.name, disabled: !editable, placeholder: '请输入材料名称', onChange: event => onEdit(item.id, { name: event.target.value }) })),
        h('div', { className: 'flow-list-toolbar' }, h('label', null, h('input', { type: 'checkbox', checked: item.required, disabled: !editable, onChange: event => onEdit(item.id, { required: event.target.checked }) }), '必传'),
          button('删除', () => onRemove(item.id), false, !editable, { className: 'flow-text-button' })))
      )) : h('p', { className: 'flow-empty' }, '本页暂无材料要求，可直接继续。'),
      rules?.bullets?.length > 0 && h('details', { className: 'flow-rules' }, h('summary', null, '院校上传规则'), h('ul', null, rules.bullets.map((rule, index) => h('li', { key: index }, rule)))),
      h('div', { className: 'flow-actions' }, button('‹ 字段', onBack), button('下一步', onNext, true, items.some(item => !item.name.trim()))));
  }

  function Save({ pages, saving, message, onBack, onSave, onHome, completed, task,
    capturedSchool, capturedMajor, evSchools, evSchool, onEvSchoolChange }) {
    const evSchoolMatched = evSchools.some(school => school.name === evSchool);
    return card(title(completed ? '模板已保存' : '保存模板'),
      h('div', { className: 'flow-save-context' },
        h('strong', null, task?.studentName || '当前网申任务'),
        h('span', null, [task?.school, capturedMajor || task?.major].filter(Boolean).join(' · '))),
      completed ? h('div', { className: 'flow-saved' }, h('span', { className: 'flow-saved-check', 'aria-hidden': true }, '✓'), h('p', null, message)) :
        h('div', { className: 'flow-save-pages' }, pages.map(page => h('div', { key: page.pageKey }, h('strong', null, page.pageLabel),
          h('span', null, `${page.fieldCount} 字段 · ${page.materialCount} 材料`)))),
      completed ? h('div', { className: 'flow-binding-result' }, h('span', null, '已绑定 EV 院校'), h('strong', null, evSchool)) :
        h('section', { className: 'flow-school-bind', 'aria-labelledby': 'school-bind-title' },
          h('h3', { id: 'school-bind-title' }, '确认院校绑定'),
          h('div', { className: 'flow-school-compare' },
            h('div', null, h('span', null, '采集到的学校'), h('strong', null, capturedSchool || '待识别')),
            h('label', null, h('span', null, 'EV 系统学校'),
              h('input', { type: 'search', list: 'pbs-ev-school-options', value: evSchool,
                placeholder: '搜索或选择学校', onChange: event => onEvSchoolChange(event.target.value), 'aria-invalid': evSchool && !evSchoolMatched }),
              h('datalist', { id: 'pbs-ev-school-options' }, evSchools.map(school => h('option', { key: school.id, value: school.name }))))),
          evSchool && !evSchoolMatched && h('p', { className: 'flow-error', role: 'alert' }, '请选择 EV 系统中的学校')),
      !completed && message && h('p', { className: 'flow-muted', role: 'status' }, message),
      completed ? h('div', { className: 'flow-actions' }, button('返回主页', onHome, true)) :
        h('div', { className: 'flow-actions flow-save-actions' }, button('‹ 材料', onBack, false, saving),
          button(saving ? '保存中…' : '确认绑定并保存', onSave, true, saving || !pages.length || !evSchoolMatched))
    );
  }
  return { Nav, Home, Materials, Save };
}
