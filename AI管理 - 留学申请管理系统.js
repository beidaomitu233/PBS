/* PBS AI 管理原型：配置保存在本地，API Key 仅记录末四位。 */
(function () {
  'use strict';

  var AI_STORAGE_KEY = 'pbs_ai_management_v6';
  var LEGACY_AI_STORAGE_KEYS = ['pbs_ai_management_v5', 'pbs_ai_management_v4', 'pbs_ai_management_v3', 'pbs_ai_management_v2'];
  var OPERATION_LOG_KEY = 'pbs_operation_logs_v1';
  var AI_TABS = ['models', 'monitor', 'prompts'];
  var activePrompt = 0;
  var currentReportId = '';
  var customDatasetCount = 0;
  var autoSaveTimers = {};
  var evalTimer = null;
  var activeKeyPoolModelId = '';

  var PROVIDER_PRESETS = {
    qwen: { name: 'Qwen', short: 'QW', color: '#7c6aed' },
    deepseek: { name: 'DeepSeek', short: 'DS', color: '#2563eb' },
    kimi: { name: 'Kimi', short: 'KM', color: '#111827' },
    seed: { name: 'Seed', short: 'SE', color: '#0f766e' },
    glm: { name: 'GLM', short: 'GLM', color: '#1d4ed8' },
    openai_compatible: { name: 'OpenAI 兼容服务', short: 'OA', color: '#475569' }
  };

  var DEFAULT_MODEL_PARAMS = { temperature: 0.5, timeout: 60, retry: 1, stream: true };

  function defaultModel(id, name, providerType, modelId) {
    return { id: id, name: name, providerType: providerType, modelId: modelId, hasKey: false, keyLast4: '', context: 131072, params: Object.assign({}, DEFAULT_MODEL_PARAMS) };
  }

  var DEFAULT_MODELS = [
    defaultModel('m-qwen', 'Qwen 通用模型', 'qwen', 'qwen-plus'),
    defaultModel('m-qwen-long', 'Qwen 长文本模型', 'qwen', 'qwen-long'),
    defaultModel('m-deepseek', 'DeepSeek 通用模型', 'deepseek', 'deepseek-v4-flash'),
    defaultModel('m-kimi', 'Kimi 长文本模型', 'kimi', 'kimi-k2.6'),
    defaultModel('m-seed', 'Seed 通用模型', 'seed', 'doubao-seed-2-0-lite-260215'),
    defaultModel('m-glm', 'GLM 通用模型', 'glm', 'glm-5.2')
  ];

  var DEFAULT_KEYS = [
    { id: 'key-qwen-01', alias: 'qwen-prod-01', providerType: 'qwen', modelIds: ['m-qwen', 'm-qwen-long'], quotaGroup: '阿里云生产账号 A', last4: '8H2K', enabled: true, health: 'healthy', load: 36, quotaRemaining: 68, latency: 642, priority: 1, weight: 70, checkedAt: '2026-08-22 09:58:12' },
    { id: 'key-qwen-02', alias: 'qwen-prod-02', providerType: 'qwen', modelIds: ['m-qwen'], quotaGroup: '阿里云生产账号 A', last4: 'P7M4', enabled: true, health: 'cooling', load: 92, quotaRemaining: 68, latency: 1280, priority: 2, weight: 30, checkedAt: '2026-08-22 09:57:46' },
    { id: 'key-deepseek-01', alias: 'deepseek-prod-01', providerType: 'deepseek', modelIds: ['m-deepseek'], quotaGroup: 'DeepSeek 企业账号', last4: 'D4S9', enabled: true, health: 'healthy', load: 28, quotaRemaining: 81, latency: 718, priority: 1, weight: 100, checkedAt: '2026-08-22 09:58:05' },
    { id: 'key-kimi-01', alias: 'kimi-longtext-01', providerType: 'kimi', modelIds: ['m-kimi'], quotaGroup: '月之暗面生产账号', last4: 'K2L6', enabled: true, health: 'warning', load: 78, quotaRemaining: 42, latency: 906, priority: 2, weight: 100, checkedAt: '2026-08-22 09:57:32' },
    { id: 'key-seed-01', alias: 'seed-backup-01', providerType: 'seed', modelIds: ['m-seed'], quotaGroup: '火山引擎备用账号', last4: 'S5E1', enabled: false, health: 'disabled', load: 0, quotaRemaining: 100, latency: 0, priority: 3, weight: 100, checkedAt: '2026-08-21 18:20:00' },
    { id: 'key-glm-01', alias: 'glm-prod-01', providerType: 'glm', modelIds: ['m-glm'], quotaGroup: '智谱生产账号', last4: 'G8M3', enabled: true, health: 'healthy', load: 41, quotaRemaining: 73, latency: 754, priority: 2, weight: 100, checkedAt: '2026-08-22 09:57:58' }
  ];

  var DEFAULT_CALL_LOGS = [
    { id: 'call-01', time: '2026-08-22 09:58:12', org: '北岛留学', scene: '文书编辑', modelId: 'm-qwen', keyId: 'key-qwen-01', latency: 642, result: 'success', detail: '主模型命中' },
    { id: 'call-02', time: '2026-08-22 09:57:46', org: '远航教育', scene: '材料解析', modelId: 'm-qwen', keyId: 'key-qwen-02', latency: 1280, result: 'failed', detail: '429 限流，Key 已进入冷却' },
    { id: 'call-03', time: '2026-08-22 09:57:31', org: '新知留学', scene: '选校推荐', modelId: 'm-deepseek', keyId: 'key-deepseek-01', latency: 718, result: 'success', detail: '备用模型命中' },
    { id: 'call-04', time: '2026-08-22 09:56:58', org: '青藤国际', scene: '网申提交', modelId: 'm-kimi', keyId: 'key-kimi-01', latency: 0, result: 'queued', detail: '机构并发已满，队列位置 3' },
    { id: 'call-05', time: '2026-08-22 09:56:21', org: '北岛留学', scene: '文书审核', modelId: 'm-glm', keyId: 'key-glm-01', latency: 754, result: 'success', detail: '按低负载策略命中' }
  ];

  var LEGACY_BASE_PROMPTS = [
    { id: 'asset', module: '学生档案', title: '资产文件 AI 解析', version: 'v1.2.0', vars: ['file_text', 'file_type', 'student_id', 'field_dictionary'], system: '你是留学申请材料结构化专家。仅依据文件内容提取信息，不得补全或猜测。每个字段必须返回原文证据、页码和置信度；敏感信息只标记存在，不输出原值。无法确定时返回 null。', user: '请按字段字典解析 {{file_type}} 文件。\n学生标识：{{student_id}}\n字段字典：{{field_dictionary}}\nOCR 文本：{{file_text}}', schema: '{"document_type":"string","fields":[{"name":"string","value":"string|null","evidence":"string","page":0,"confidence":0.0}],"warnings":["string"]}', metric: '字段 Exact Match、证据定位准确率、缺失字段召回率', threshold: 'Exact Match ≥95%；证据准确率 ≥98%；幻觉率 ≤0.5%' },
    { id: 'editor', module: '文书交付', title: '编辑框 AI 助手', version: 'v1.1.0', vars: ['selected_text', 'instruction', 'student_profile', 'school_prompt', 'word_limit'], system: '你是留学文书协作编辑。保持学生事实与个人声音，只对用户选中文本执行明确指令。禁止虚构经历、成绩、奖项或院校信息；事实不足时先提出澄清问题。', user: '院校题目：{{school_prompt}}\n字数限制：{{word_limit}}\n学生资料：{{student_profile}}\n选中文本：{{selected_text}}\n编辑指令：{{instruction}}', schema: '{"revised_text":"string","changes":[{"type":"string","reason":"string"}],"fact_risks":["string"],"questions":["string"]}', metric: '人工采纳率、事实一致性、风格保持率', threshold: '采纳率 ≥45%；事实错误率 ≤1%；越权改写率 ≤2%' },
    { id: 'suggest', module: '文书交付', title: '右侧 AI 建议', version: 'v1.0.3', vars: ['student_profile', 'draft', 'school_prompt', 'rubric'], system: '你是留学文书教练。基于学生资料、院校题目和当前草稿给出最多 5 条可执行建议。每条建议指出证据位置、问题、改进动作和优先级。', user: '学生资料：{{student_profile}}\n院校题目：{{school_prompt}}\n评价规则：{{rubric}}\n当前草稿：{{draft}}', schema: '{"suggestions":[{"priority":"P0|P1|P2","location":"string","issue":"string","action":"string","evidence":"string"}],"missing_facts":["string"]}', metric: '建议相关性、可执行性、重复率、人工采纳率', threshold: '专家相关性 ≥4.2/5；采纳率 ≥40%；重复率 ≤5%' },
    { id: 'case', module: '文书交付', title: '案例包 AI 解析', version: 'v1.4.0', vars: [], system: '', user: '', schema: '', metric: '字段完整率、证据定位准确率、结构一致性', threshold: '字段完整率 ≥95%；证据准确率 ≥98%；结构一致性 100%' },
    { id: 'review', module: '文书审核', title: 'AI 整体评价', version: 'v2.0.0', vars: ['draft', 'school_prompt', 'student_profile', 'rubric', 'word_limit'], system: '你是留学文书质量审核助手。依据院校题目和 PBS 评分规则进行辅助评价，不替代人工终审。所有事实判断必须与学生档案对照，并列出扣分证据。', user: '院校题目：{{school_prompt}}\n字数限制：{{word_limit}}\n学生资料：{{student_profile}}\n评分规则：{{rubric}}\n文书全文：{{draft}}', schema: '{"overall_score":0,"dimension_scores":{"relevance":0,"logic":0,"evidence":0,"language":0,"voice":0,"compliance":0},"strengths":[{"text":"string","evidence":"string"}],"improvements":[{"text":"string","evidence":"string","priority":"P0|P1|P2"}],"overall_comment":"string","fact_risks":["string"]}', metric: '与人工评分相关性、MAE、维度一致性', threshold: 'Spearman ≥0.75；MAE ≤6；事实错误率 ≤1%' },
    { id: 'classify', module: '监控管理', title: '邮件/页面 AI 分类', version: 'v1.4.0', vars: ['subject', 'sender', 'body', 'attachments', 'school', 'application_id'], system: '你是留学申请通知分类器。结合发件域名、标题、正文和附件完成分类，必须输出证据关键词、置信度和建议状态；不确定时选择 UNKNOWN。', user: '申请：{{application_id}} / {{school}}\n发件人：{{sender}}\n标题：{{subject}}\n正文：{{body}}\n附件：{{attachments}}', schema: '{"category":"OFFER|REJECTION|WAITLIST|INTERVIEW|MISSING_MATERIAL|ACTION_REQUIRED|STATUS_UPDATE|SCHOLARSHIP|NOISE|UNKNOWN","confidence":0.0,"keywords":["string"],"evidence":"string","suggested_status":"string|null","manual_review":true}', metric: 'Macro-F1、关键类别召回率、误更新率', threshold: 'Macro-F1 ≥0.90；关键类别召回 ≥0.95；误更新率 ≤0.2%' },
    { id: 'school', module: '选校管理', title: 'AI 选校推荐说明', version: 'v1.2.0', vars: ['student_profile', 'school_candidates', 'requirements', 'preferences', 'historical_cases', 'data_date'], system: '你是选校决策辅助顾问。先校验硬性条件，再对候选学校分层。每项推荐必须引用院校要求及数据日期，明确不确定性，不得承诺录取概率。', user: '学生资料：{{student_profile}}\n偏好：{{preferences}}\n候选学校：{{school_candidates}}\n院校要求：{{requirements}}\n历史案例：{{historical_cases}}\n数据日期：{{data_date}}', schema: '{"recommendations":[{"school":"string","program":"string","tier":"REACH|MATCH|SAFETY","reasons":["string"],"risks":["string"],"actions":["string"],"source_refs":["string"],"confidence":0.0}],"hard_constraint_violations":["string"],"disclaimer":"string"}', metric: '硬条件违规率、专家 Top-K 接受率、证据覆盖率', threshold: '硬条件违规率 0%；专家接受率 ≥80%；证据覆盖率 100%' }
  ];

  var BASE_PROMPTS = [
    {
      id: 'suggest', module: '文书编辑', title: 'AI 建议',
      content: String.raw`你是一名专业留学文书顾问。请根据系统提供的学生资料、申请信息、资产文件解析结果、当前文书内容，针对当前文书类型 {{current_document_type}} 生成填写建议。

系统会动态传入当前文书类型：CV / PS / RL / RP / 套磁信。

【核心要求】
1. 只基于学生真实资料给建议，不得编造经历、成绩、论文、奖项、导师或研究成果。
2. 建议重点回答：这一部分写什么、使用哪段学生经历、突出什么、还缺什么信息。
3. 不直接代写完整文书，不输出大段正文。
4. 根据申请层次（本科/硕士/博士/本硕连读）调整建议重点。
5. 优先使用与目标院校、专业、研究方向相关度最高的资料。
6. 学生资料不足时明确提示“建议补充”，不得自行推测。

【CV】
推荐结构：个人信息 → 教育背景 → 经历 → 荣誉奖项 → 技能与语言。所有经历按时间倒序；本科重点为竞赛、活动、志愿服务、标化成绩；硕士重点为科研、课程项目或实习工作经历，突出“角色 + 方法/职责 + 成果”；博士重点为科研经历、论文、项目、导师、研究方法及成果；奖项尽量体现排名或获奖比例；默认不建议写照片、性别、出生日期、婚姻状况。

【PS】
推荐结构：个人经历 → 研究兴趣 → 学术背景 → 为什么选择学校和专业 → 未来规划 → 结语。用具体经历解释申请动机和成长过程；研究兴趣体现“经历 → 问题 → 兴趣方向”；本科突出学习潜力和成长；硕士突出专业基础、课程、科研/实习与申请方向的关系；博士突出科研经历、研究方法、学术成果及与导师方向的匹配；避免空泛表达。

【RP】
推荐结构：题目 → 摘要 → 研究背景 → 研究问题 → 文献综述 → 研究方法 → 预期成果 → 时间安排 → 参考文献。研究问题必须明确、具体、可研究；研究方法说明数据、对象、方法、技术路线和验证方式；预期成果区分学术贡献和实际产出；时间安排拆解为可执行阶段并预留风险调整空间；博士可增加资源需求。

【RL】
推荐结构：推荐人介绍 → 学生情况 → 结语 → 落款。始终从推荐人视角提出建议；本科突出学习潜力、课堂表现、领导力和协作能力；硕士突出知识基础、学习能力、科研能力和个人素质；博士突出科研能力、治学态度、学术规范和培养潜力；所有评价尽量用真实具体事件支撑；推荐人信息缺失时明确提示补充。

【套磁信】
推荐结构：邮件主题 → 首段 → 第二段 → 第三段 → 尾段。语言极度克制、逻辑严密、开门见山、专业且自信，禁止华而不实的客套话。首段说明来意与身份，写明教授姓氏；第二段结合教授具体论文或近期研究方向说明匹配点；第三段用 GPA 排名、论文发表、核心技能栈等事实证明科研能力；尾段说明附件并请求 15—30 分钟线上会议，提供可选时间；总字数严格控制在 150—200 个英文单词以内。`,
      output: String.raw`最终只输出 JSON，不输出分析过程或其他说明：
{
  "section": "对应章节",
  "suggestion": "结合学生现有资料说明该部分应该写什么、重点突出什么",
  "missing_information": ["需要补充的信息"]
}
输出 3—6 条最重要建议。`,
      context: [
        ['当前文书类型', 'current_document_type', '当前文书任务'],
        ['完整学生档案', 'student_profile', '学生档案及关联教育、成绩、经历、奖项、技能数据'],
        ['申请信息', 'application_context', '院校目标、专业、申请层次及官方要求'],
        ['资产解析结果', 'asset_parse_results', '学生资产文件及 AI 结构化解析结果'],
        ['当前文书', 'current_document', '当前文书全文、章节及字数信息']
      ]
    },
    {
      id: 'assistant', module: '文书编辑', title: 'AI 写作助手',
      content: String.raw`你是资深留学文书顾问，熟悉香港、美国、英国、澳洲、欧洲主流院校对申请文书的评审标准。你的任务是协助文书老师完成留学申请文书的撰写、改写与润色。

【文书结构标准】
CV：个人信息 → 教育背景 → 经历段（按层次适配）→ 荣誉奖项 → 技能与语言。所有含时间的条目按时间倒序。个人信息默认不放照片、性别、出生日期、婚姻状况；教育背景包含院校、学位、院系、就读年份、GPA 或排名；经历按本科、硕士研究型/授课型、博士层次分别突出活动、实习、科研、论文与成果。

PS：个人经历陈述 → 研究兴趣陈述 → 学术背景陈述 → 为什么选择目标学校和专业 → 未来规划 → 结语。用具体经历说明成长、研究问题与申请动机；博士层次必须说明目标导师研究成果与个人研究规划的关系。

RP：题目 → 摘要 → 研究背景 → 研究问题 → 文献综述 → 研究方法/研究计划 → 预期成果和贡献 → 时间安排（博士层次加资源需求）→ 参考文献。研究方法需写清数据、对象、分析框架、方法论、技术路线和验证方式。

RL：自我介绍 → 学生情况陈述 → 结语 → 落款。始终从推荐人视角写作，所有评价以真实具体事件支撑；按本科、硕士、博士、本硕连读层次调整评价重点。

套磁信：邮件主题 → 首段 → 第二段 → 第三段 → 尾段。提供 3 个简短主题；结合教授具体论文或项目说明匹配；用论文、GPA 排名、技能栈等事实证明科研能力；请求 15—30 分钟线上会议；总字数严格控制在 150—200 个英文单词以内。

【硬性约束】
1. 不得编造学生经历、数据、奖项或成果，所有内容必须基于输入资料。
2. 改写时保留学生原意与个人风格，每一处改动需在 change_log 中说明位置与理由。
3. 如院校有官方字数或格式规定，以院校规定为准并在建议中提醒。
4. 确保文本原创，无语法、单词和语病错误，避免模板化表达。
5. 院校若发布官方模板或填写建议，应提醒文书老师按官网格式调整。
6. 输入中的隐私信息已脱敏，输出时保留占位符，不得还原或猜测真实信息。`,
      output: String.raw`按当前操作返回文书内容，并返回 change_log：
{
  "content": "生成或修改后的内容",
  "change_log": [{"location":"修改位置","reason":"修改理由"}],
  "missing_information": ["仍需补充的信息"],
  "compliance_notes": ["字数、格式或事实风险提示"]
}`,
      context: [
        ['操作指令', 'writing_instruction', '编辑器当前输入的生成、改写或润色指令'],
        ['选中文本', 'selected_text', '编辑器当前选区；未选中时为空'],
        ['当前文书', 'current_document', '文书类型、全文、章节、字数及历史修改'],
        ['完整学生档案', 'student_profile', '学生档案及关联教育、成绩、经历、奖项、技能数据'],
        ['申请信息', 'application_context', '目标院校、专业、申请层次、题目及官方格式要求'],
        ['资产解析结果', 'asset_parse_results', '学生资产文件的结构化解析结果']
      ]
    },
    {
      id: 'case', module: '模板库编辑', title: '案例包 AI 解析',
      content: String.raw`你是留学文书案例分析专家。你的任务是把历史优秀文书案例解析为可复用的结构化知识，供模板库使用。

【解析标准】
依据文书结构标准（CV / PS / RP / RL 四类，按申请层次适配）识别案例的段落结构：
1. structure：按顺序输出案例的段落清单，每段给出 section_title（对齐标准结构命名）与 summary（该段写什么、怎么写）。
2. highlights：摘录可借鉴的亮点句，原文照录，注明所属段落与亮点原因。
3. reusable_expressions：提取可复用的表达方式或句式框架，抽象为不含个人信息的通用句式。
4. variables：识别文中可变量化的位置，如学校名、专业名、成绩、经历，输出变量名与示例值。

【硬性约束】
1. 输入案例已脱敏，输出中不得还原或猜测真实个人信息。
2. reusable_expressions 必须去除个人信息，不得包含任何可识别个人的内容。
3. 只做结构化解析，不改写、不评价案例优劣。`,
      output: String.raw`仅输出结构化 JSON：
{
  "structure": [{"section_title":"章节名称","summary":"内容与写法摘要"}],
  "highlights": [{"section_title":"所属章节","quote":"原文亮点句","reason":"亮点原因"}],
  "reusable_expressions": ["已去除个人信息的句式框架"],
  "variables": [{"name":"变量名","example":"脱敏示例值"}]
}`,
      context: [
        ['案例文书', 'case_document', '当前上传案例文件、OCR 文本及页码信息'],
        ['文书类型', 'current_document_type', '案例所属 CV、PS、RP 或 RL 类型'],
        ['申请层次', 'application_level', '本科、硕士、博士或本硕连读'],
        ['结构标准', 'document_standard', '系统内置的对应文书类型结构标准']
      ]
    },
    {
      id: 'school', module: '选校方案详情', title: '选校说明',
      content: String.raw`你是留学选校顾问。你的任务是为“选校方案分享页面”生成选校说明，向学生与家长解释推荐该校该专业的理由。

【生成要求】
1. 基于学生条件（成绩、背景）与院校要求（语言、GPA 等）逐项比对，给出匹配度理由。
2. 结合梯度档位（冲刺/匹配/保底）说明该院校在整体方案中的定位。
3. 如实提示风险，如某单项成绩未达标、竞争激烈、轮次紧张等。
4. 全文 300 字以内，语言平实，面向学生与家长可读。

【硬性约束】
1. 不得承诺或暗示录取结果。
2. 不得贬低任何院校。
3. 所有判断必须基于输入数据，不得编造院校要求或学生条件。
4. 输入中学生隐私信息已脱敏，输出保留占位符。`,
      output: '输出 300 字以内的选校说明正文，不输出分析过程。',
      context: [
        ['完整学生档案', 'student_profile', '成绩、语言、教育背景、科研、实习及其他申请条件'],
        ['院校与专业', 'school_program', '当前院校目标及专业信息'],
        ['录取要求', 'admission_requirements', '院校专业的语言、GPA、材料、轮次等要求'],
        ['方案梯度', 'plan_tier', '当前目标在方案中的冲刺、匹配或保底定位']
      ]
    },
    {
      id: 'review', module: '文书审核', title: 'AI 整体评价',
      content: String.raw`你是留学文书评审专家。你的任务是对提交的文书进行整体评价，输出维度评分、亮点、待改进点与总体评语，供人工审核参考。

【评价维度与权重】（1—5 分，0.5 步进）
1. 内容与针对性（30%）：是否回应院校题目要求，内容是否贴合文书类型的结构标准。
2. 结构与逻辑（25%）：段落组织是否符合该文书类型与申请层次的标准结构，论证是否连贯。
3. 语言与表达（20%）：语法、用词、句式质量，须达到可通过 plagiarism-detection 审查的原创度。
4. 个性化与亮点（15%）：是否体现学生独特经历与特质，避免模板化。
5. 合规与事实准确性（10%）：字数是否合规、格式是否符合院校要求；事实性错误一票否决，直接判定打回。

【结构标准】
按文书类型与申请层次套用对应结构：CV 为个人信息、教育背景、经历、荣誉奖项、技能与语言；PS 为个人经历、研究兴趣、学术背景、选校与专业原因、未来规划、结语；RP 为题目、摘要、研究背景、研究问题、文献综述、研究方法、预期成果、时间安排、参考文献；RL 为推荐人介绍、学生情况、结语、落款。

【硬性约束】
1. 评价必须引用文书原文作为依据，不得泛泛而谈。
2. 不得修改文书，只做评价。
3. 总分为各维度得分乘以权重后加总；总分 ≥3.5 为可提交，3.0—3.5 为需修改，低于 3.0 为重写。
4. 输入中的学生隐私信息已脱敏，评语中保留占位符。`,
      output: String.raw`仅输出结构化 JSON：
{
  "dimension_scores": [{"dimension":"评价维度","score":0,"evidence":"文书原文依据"}],
  "total_score": 0,
  "decision": "可提交|需修改|重写|事实错误打回",
  "strengths": [{"text":"亮点","evidence":"原文依据"}],
  "improvements": [{"text":"待改进点","evidence":"原文依据"}],
  "overall_comment": "总体评语",
  "fact_risks": ["事实或合规风险"]
}`,
      context: [
        ['待审核文书', 'current_document', '文书全文、类型、字数及版本内容'],
        ['完整学生档案', 'student_profile', '用于核对文书中的经历、成绩、奖项与成果事实'],
        ['申请信息', 'application_context', '申请层次、目标院校专业、文书题目及官方要求'],
        ['结构标准', 'document_standard', '对应文书类型及申请层次的结构规则'],
        ['参考文件', 'reference_documents', '院校官方模板或审核所需参考材料；无文件时为空数组']
      ]
    }
  ];

  var RESTORED_PROMPT_CONTEXTS = {
    asset: [
      ['待解析文件', 'source_document', '学生档案当前上传文件、OCR 文本及页码信息'],
      ['文件类型', 'file_type', '当前资产文件类型'],
      ['学生标识', 'student_id', '当前学生档案 ID'],
      ['档案字段字典', 'field_dictionary', '学生档案可写入字段及结构定义']
    ],
    classify: [
      ['邮件或页面内容', 'message_content', '监控任务抓取的标题、正文、发件人、附件及页面信息'],
      ['申请信息', 'application_context', '当前学生、院校目标、专业及申请账号信息'],
      ['分类规则', 'classification_rules', '系统内置通知分类及状态映射规则']
    ]
  };

  var restoredPrompts = ['asset', 'classify'].map(function (id) {
    var source = LEGACY_BASE_PROMPTS.find(function (prompt) { return prompt.id === id; });
    return Object.assign({}, source, { context: RESTORED_PROMPT_CONTEXTS[id] });
  });
  BASE_PROMPTS = [restoredPrompts[0]].concat(BASE_PROMPTS, restoredPrompts.slice(1));

  var CASE_TEMPLATES = [
    { id: 'cv-undergraduate', material: 'CV', stage: '本科', focus: '突出课程基础、竞赛、社团活动、志愿服务与领导力。', fields: ['基本信息', '教育经历', '核心课程', '竞赛与奖项', '活动与领导力', '志愿服务', '技能与语言'] },
    { id: 'cv-master', material: 'CV', stage: '硕士', focus: '突出专业准备、科研项目、实习成果与量化技能。', fields: ['基本信息', '教育经历', '专业课程', '科研项目', '实习经历', '奖项成果', '技能与语言'] },
    { id: 'cv-doctor', material: 'CV', stage: '博士', focus: '突出研究轨迹、论文成果、方法能力与学术影响。', fields: ['基本信息', '教育经历', '研究经历', '论文与出版', '会议与报告', '教学经历', '方法与工具'] },
    { id: 'ps-undergraduate', material: 'PS', stage: '本科', focus: '识别兴趣起点、成长经历、学术潜力与校园贡献。', fields: ['兴趣起点', '关键成长经历', '学术兴趣', '课外活动', '个人品质', '学习目标', '院校匹配'] },
    { id: 'ps-master', material: 'PS', stage: '硕士', focus: '识别学术准备、相关经历、申请动机与职业目标。', fields: ['申请动机', '学术准备', '项目经历', '实习经历', '能力证据', '职业目标', '项目匹配'] },
    { id: 'ps-doctor', material: 'PS', stage: '博士', focus: '识别研究问题、既往研究、方法能力与导师匹配。', fields: ['研究兴趣', '问题来源', '研究经历', '方法能力', '研究成果', '博士目标', '导师与项目匹配'] },
    { id: 'letter-undergraduate', material: '推荐信', stage: '本科', focus: '识别推荐关系、学术表现、品格与成长潜力。', fields: ['推荐人信息', '认识关系', '学术能力', '课堂表现', '活动表现', '品格证据', '综合评价'] },
    { id: 'letter-master', material: '推荐信', stage: '硕士', focus: '识别专业能力、项目贡献、比较排名与深造准备。', fields: ['推荐人信息', '认识关系', '专业能力', '项目贡献', '协作表现', '比较评价', '深造潜力'] },
    { id: 'letter-doctor', material: '推荐信', stage: '博士', focus: '识别研究独立性、原创性、方法能力与学术潜力。', fields: ['推荐人信息', '研究关系', '研究独立性', '原创能力', '方法能力', '学术成果', '博士潜力'] },
    { id: 'plan-undergraduate', material: '研究计划', stage: '本科', focus: '识别研究兴趣、基础问题、可执行方法与学习目标。', fields: ['研究主题', '问题背景', '研究问题', '基础资料', '研究方法', '时间安排', '预期收获'] },
    { id: 'plan-master', material: '研究计划', stage: '硕士', focus: '识别文献缺口、研究问题、方法可行性与预期成果。', fields: ['研究背景', '文献缺口', '研究问题', '理论框架', '研究方法', '可行性', '预期成果'] },
    { id: 'plan-doctor', material: '研究计划', stage: '博士', focus: '识别原创问题、假设、方法设计、学术贡献与风险控制。', fields: ['研究背景', '文献缺口', '核心问题', '研究假设', '方法设计', '原创贡献', '伦理与风险', '时间计划'] }
  ];

  var BASE_EVALS = [
    { id: 'asset', name: '资产文件 AI 解析', metric: '字段 Exact Match', threshold: '≥95%', result: '96.8%', samples: 240, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'editor', name: '编辑框 AI 助手', metric: '采纳率 / 事实错误', threshold: '≥45% / ≤1%', result: '48.2% / 0.6%', samples: 180, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'suggest', name: '右侧 AI 建议', metric: '专家相关性', threshold: '≥4.2/5', result: '4.4/5', samples: 160, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'case', name: '案例包 AI 解析', metric: '结构一致性', threshold: '100%', result: '100%', samples: 120, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'review', name: '文书审核 AI 评价', metric: 'Spearman / MAE', threshold: '≥0.75 / ≤6', result: '0.79 / 5.2', samples: 200, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'classify', name: '监控 AI 分类', metric: 'Macro-F1', threshold: '≥0.90', result: '0.93', samples: 220, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'school', name: 'AI 选校推荐', metric: '硬条件违规 / 接受率', threshold: '0% / ≥80%', result: '0% / 83%', samples: 76, status: 'pass', updated: '2026-08-11 18:30' }
  ];

  function cloneJson(value) { return JSON.parse(JSON.stringify(value)); }
  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]; }); }
  function plainText(value) { return String(value == null ? '' : value).replace(/[<>]/g, '').trim(); }
  function nowText() {
    var d = new Date();
    function pad(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function defaultAiState() {
    return {
      models: cloneJson(DEFAULT_MODELS),
      globalRoute: { primary: 'm-qwen', backup: 'm-deepseek' },
      keys: cloneJson(DEFAULT_KEYS),
      callLogs: cloneJson(DEFAULT_CALL_LOGS),
      promptOverrides: {},
      caseTemplateOverrides: {},
      selectedCaseTemplate: 'cv-undergraduate',
      evalResults: {}
    };
  }

  function loadAiState() {
    var state = defaultAiState();
    var saved = null;
    var loadedFromLegacy = false;
    try { saved = JSON.parse(localStorage.getItem(AI_STORAGE_KEY) || 'null'); } catch (e) { saved = null; }
    if (!saved) {
      LEGACY_AI_STORAGE_KEYS.some(function (key) {
        try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e2) { saved = null; }
        if (saved) loadedFromLegacy = true;
        return !!saved;
      });
    }
    if (saved && typeof saved === 'object') {
      ['models', 'globalRoute', 'keys', 'callLogs', 'promptOverrides', 'caseTemplateOverrides', 'selectedCaseTemplate', 'evalResults', 'customPrompts'].forEach(function (key) {
        if (saved[key] !== undefined) state[key] = saved[key];
      });
      if (loadedFromLegacy) {
        state.promptOverrides = {};
        state.caseTemplateOverrides = {};
      }
    }
    if (!Array.isArray(state.models)) state.models = cloneJson(DEFAULT_MODELS);
    state.models.forEach(function (model) {
      var legacyProvider = saved && Array.isArray(saved.providers) ? saved.providers.find(function (provider) { return provider.id === model.providerId; }) : null;
      var providerType = model.providerType || (legacyProvider && legacyProvider.type) || model.providerId || 'openai_compatible';
      if (!PROVIDER_PRESETS[providerType]) providerType = 'openai_compatible';
      model.providerType = providerType;
      model.hasKey = model.hasKey !== undefined ? !!model.hasKey : !!(legacyProvider && legacyProvider.hasKey);
      model.keyLast4 = model.keyLast4 || (legacyProvider && legacyProvider.keyLast4) || '';
      model.context = 131072;
      var savedParams = Object.assign({}, saved && saved.paramsGlobal ? saved.paramsGlobal : {}, model.params || {});
      model.params = {
        temperature: Number(savedParams.temperature == null ? DEFAULT_MODEL_PARAMS.temperature : savedParams.temperature),
        timeout: Number(savedParams.timeout == null ? DEFAULT_MODEL_PARAMS.timeout : savedParams.timeout),
        retry: Number(savedParams.retry == null ? DEFAULT_MODEL_PARAMS.retry : savedParams.retry),
        stream: true
      };
      if (/^m-(qwen|qwen-long|deepseek|kimi|seed|glm)$/.test(model.id) && model.params.temperature === 0.2) model.params.temperature = 0.5;
      delete model.params.thinking;
      delete model.providerId;
      delete model.maxOutput;
      model.endpoint = model.endpoint || '';
      model.name = model.name.replace(/主模型|次模型|备用模型/g, '通用模型');
      delete model.connectionStatus;
      delete model.latency;
      delete model.auth;
      delete model.header;
      delete model.inputPrice;
      delete model.outputPrice;
      model.enabled = model.enabled !== false;
      delete model.capabilities;
      delete model.thinking;
    });
    if (!Array.isArray(state.keys)) state.keys = cloneJson(DEFAULT_KEYS);
    state.keys = state.keys.map(function (key, index) {
      var enabled = key.enabled !== false;
      var modelIds = Array.isArray(key.modelIds) ? key.modelIds.slice() : key.modelId ? [key.modelId] : [];
      modelIds = modelIds.filter(function (id, modelIndex, ids) { return ids.indexOf(id) === modelIndex && state.models.some(function (model) { return model.id === id; }); });
      var firstModel = state.models.find(function (model) { return model.id === modelIds[0]; });
      var providerType = key.providerType || (firstModel && firstModel.providerType) || 'openai_compatible';
      if (key.id === 'key-qwen-01' && modelIds.indexOf('m-qwen') >= 0 && modelIds.indexOf('m-qwen-long') < 0) modelIds.push('m-qwen-long');
      return {
        id: key.id || 'key_' + Date.now() + '_' + index,
        alias: plainText(key.alias) || '未命名 Key',
        providerType: PROVIDER_PRESETS[providerType] ? providerType : 'openai_compatible',
        modelIds: modelIds,
        quotaGroup: plainText(key.quotaGroup) || '未设置配额组',
        last4: plainText(key.last4 || key.keyLast4).slice(-4) || '****',
        enabled: enabled,
        health: enabled ? (['healthy', 'warning', 'cooling'].indexOf(key.health) >= 0 ? key.health : 'healthy') : 'disabled',
        load: Math.max(0, Math.min(100, Number(key.load == null ? 0 : key.load))),
        quotaRemaining: Math.max(0, Math.min(100, Number(key.quotaRemaining == null ? 100 : key.quotaRemaining))),
        latency: Math.max(0, Number(key.latency || 0)),
        priority: Math.max(1, Math.min(3, Number(key.priority || 2))),
        weight: Math.max(1, Math.min(100, Number(key.weight || 100))),
        checkedAt: key.checkedAt || nowText()
      };
    });
    if (!state.keys.length) state.keys = cloneJson(DEFAULT_KEYS);
    if (saved && !Array.isArray(saved.keys)) {
      state.models.forEach(function (model) {
        if (!model.hasKey || state.keys.some(function (key) { return key.modelIds.indexOf(model.id) >= 0; })) return;
        state.keys.push({ id: 'key-legacy-' + model.id, alias: model.name + '-legacy', providerType: model.providerType, modelIds: [model.id], quotaGroup: modelProviderPreset(model).name + ' 默认账号', last4: model.keyLast4 || '****', enabled: true, health: 'healthy', load: 0, quotaRemaining: 100, latency: 0, priority: 2, weight: 100, checkedAt: nowText() });
      });
    }
    if (!Array.isArray(state.callLogs)) state.callLogs = cloneJson(DEFAULT_CALL_LOGS);
    if (!state.promptOverrides || typeof state.promptOverrides !== 'object') state.promptOverrides = {};
    if (!state.caseTemplateOverrides || typeof state.caseTemplateOverrides !== 'object') state.caseTemplateOverrides = {};
    if (!state.evalResults || typeof state.evalResults !== 'object') state.evalResults = {};
    if (!CASE_TEMPLATES.some(function (item) { return item.id === state.selectedCaseTemplate; })) state.selectedCaseTemplate = CASE_TEMPLATES[0].id;
    if (!Array.isArray(state.customPrompts)) state.customPrompts = [];
    return state;
  }

  var aiState = loadAiState();

  function saveAiState() { localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(aiState)); }

  function sessionInfo() {
    try {
      var session = JSON.parse(localStorage.getItem('pbs_session_v1') || 'null');
      if (session) return { user: session.name || session.account || '演示管理员', org: session.org || 'PBS留学总部', role: session.role || '' };
    } catch (e) { /* 使用演示身份 */ }
    return { user: '演示管理员', org: 'PBS留学总部', role: '' };
  }

  function currentRole() {
    var preview = '';
    try { preview = localStorage.getItem('pbs_role_preview_v51') || ''; } catch (e) {}
    if (preview && preview !== 'all') return preview;
    return sessionInfo().role || '演示管理员';
  }

  function visiblePrompts() {
    var role = currentRole();
    if (role === '文书机构管理员') {
      return BASE_PROMPTS.concat(aiState.customPrompts).filter(function (p) { return p.module === '文书编辑' || p.module === '模板库编辑' || p.module === '文书审核'; });
    }
    return BASE_PROMPTS.concat(aiState.customPrompts);
  }

  function currentBasePrompt() {
    var list = visiblePrompts();
    if (activePrompt >= list.length) activePrompt = 0;
    return list[activePrompt];
  }

  function logAiAction(action, detail) {
    var logs = [];
    try { logs = JSON.parse(localStorage.getItem(OPERATION_LOG_KEY) || '[]'); } catch (e) { logs = []; }
    if (!Array.isArray(logs)) logs = [];
    var session = sessionInfo();
    logs.unshift({ time: nowText(), user: plainText(session.user), organization: plainText(session.org), type: '修改', content: 'AI 管理：' + plainText(action) + '；' + plainText(detail), ip: '当前会话', result: '成功' });
    localStorage.setItem(OPERATION_LOG_KEY, JSON.stringify(logs.slice(0, 100)));
  }

  function setAutoSaveState(mode, text) {
    var state = byId('autoSaveState');
    if (!state) return;
    state.className = 'auto-save' + (mode ? ' ' + mode : '');
    byId('autoSaveStatus').textContent = text;
  }

  function commitAutoSave(action, detail, key, immediateLog) {
    saveAiState();
    setAutoSaveState('saving', '正在自动保存…');
    clearTimeout(autoSaveTimers.status);
    autoSaveTimers.status = setTimeout(function () { setAutoSaveState('', '已自动保存'); }, 280);
    var logKey = 'log-' + (key || action);
    clearTimeout(autoSaveTimers[logKey]);
    autoSaveTimers[logKey] = setTimeout(function () { logAiAction(action, typeof detail === 'function' ? detail() : detail); }, immediateLog ? 0 : 850);
  }

  function showToast(message) {
    var toast = byId('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.aiToastTimer);
    window.aiToastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }
  window.showToast = showToast;

  function openModal(id) { byId(id).classList.add('show'); }
  function closeModal(id) { byId(id).classList.remove('show'); }
  window.openModal = openModal;
  window.closeModal = closeModal;

  function initializeDialogs() {
    document.querySelectorAll('.modal').forEach(function (modal) {
      modal.addEventListener('click', function (event) { if (event.target === modal) modal.classList.remove('show'); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') document.querySelectorAll('.modal.show').forEach(function (modal) { modal.classList.remove('show'); });
    });
  }

  function activateAiTab(name) {
    if (AI_TABS.indexOf(name) < 0) return;
    document.querySelectorAll('.tabbar .tab').forEach(function (tab) {
      var active = tab.dataset.tab === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll('.tabs .pane').forEach(function (pane) {
      var active = pane.id === 'pane-' + name;
      pane.classList.toggle('active', active);
      pane.hidden = !active;
    });
  }

  function initializeTabs() {
    var tabbar = document.querySelector('.tabbar');
    tabbar.addEventListener('click', function (event) {
      var tab = event.target.closest('.tab');
      if (tab) activateAiTab(tab.dataset.tab);
    });
    tabbar.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      var current = event.target.closest('.tab');
      if (!current) return;
      var index = AI_TABS.indexOf(current.dataset.tab);
      var next = AI_TABS[(index + (event.key === 'ArrowRight' ? 1 : -1) + AI_TABS.length) % AI_TABS.length];
      activateAiTab(next);
      tabbar.querySelector('[data-tab="' + next + '"]').focus();
      event.preventDefault();
    });
    document.querySelectorAll('.tabbar .tab').forEach(function (tab) { tab.setAttribute('aria-controls', 'pane-' + tab.dataset.tab); });
    document.querySelectorAll('.tabs .pane').forEach(function (pane) { pane.setAttribute('role', 'tabpanel'); });
    activateAiTab('models');
  }

  function modelById(id) { return aiState.models.find(function (m) { return m.id === id; }); }
  function modelProviderPreset(model) { return PROVIDER_PRESETS[model.providerType] || PROVIDER_PRESETS.openai_compatible; }


  function renderModels() {
    byId('modelRows').innerHTML = aiState.models.map(function(m, i) {
      return '<tr><td><b>'+escapeHtml(m.name)+'</b><div class="subtle">'+escapeHtml(m.modelId)+'</div></td><td class="mono" style="max-width:260px;overflow-wrap:anywhere">'+escapeHtml(m.endpoint || '待配置 API 地址')+'</td><td>'+ (m.hasKey ? '•••• '+escapeHtml(m.keyLast4) : '未配置')+'</td><td><span class="pill '+(m.enabled ? 'success' : 'disabled')+'">'+(m.enabled ? '启用' : '停用')+'</span></td><td><div class="table-actions"><button class="btn ghost sm" onclick="openModelEditorByIndex('+i+')">编辑接入</button><button class="btn ghost sm" onclick="toggleModel('+i+')">'+(m.enabled ? '停用' : '启用')+'</button><button class="btn ghost sm danger-text" onclick="removeModel('+i+')">删除</button></div></td></tr>';
    }).join('') || '<tr><td colspan="5" style="text-align:center;padding:32px">暂无接入模型，点击「新增 AI 模型」开始配置</td></tr>';
  }
  window.openModelEditorByIndex = function(i) { window.openModelEditor(aiState.models[i].id); };
  window.openModelEditor = function(id) {
    var m = modelById(id);
    byId('modelEditId').value = m ? m.id : '';
    byId('modelModalTitle').textContent = m ? '编辑模型接入' : '新增 AI 模型';
    byId('newModelName').value = m ? m.name : '';
    byId('newModelId').value = m ? m.modelId : '';
    byId('modelEndpoint').value = m ? m.endpoint : '';
    byId('modelApiKey').value = '';
    byId('modelApiKey').placeholder = m && m.hasKey ? '已配置，留空保留原凭证（末四位 '+m.keyLast4+'）' : '输入API Key';
    byId('modelEnabled').checked = m ? m.enabled : true;
    byId('modelFormError').textContent = '';
    openModal('modelModal');
  };
  window.saveModel = function() {
    var m = modelById(byId('modelEditId').value);
    var name = byId('newModelName').value.trim(), modelId = byId('newModelId').value.trim();
    var endpoint = byId('modelEndpoint').value.trim(), key = byId('modelApiKey').value.trim(), error = '';
    try { var url = new URL(endpoint); if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.search || url.hash) error = '请填写不含账号、查询参数的 HTTP(S) 接口地址'; } catch(e) { error = '请填写有效的API 接口地址'; }
    if (!name || !modelId) error = '请填写模型名称和 Model ID';
    if ((!m || !m.hasKey) && !key) error = '请填写API Key';
    if (key && key.length < 8) error = 'API Key 至少需要 8 个字符';
    if (aiState.models.some(function(other) { return other !== m && other.endpoint === endpoint && other.modelId === modelId; })) error = '该地址下的 Model ID 已存在';
    byId('modelFormError').textContent = error;
    if (error) return;
    if (!m) { m = {id:'model_'+Date.now(), providerType:'openai_compatible'}; aiState.models.push(m); }
    Object.assign(m, {name:name, modelId:modelId, endpoint:endpoint, enabled:byId('modelEnabled').checked});
    if (key) { m.hasKey = true; m.keyLast4 = key.slice(-4); }
    byId('modelApiKey').value = '';
    commitAutoSave('保存模型接入', name, 'model-'+m.id, true);
    renderModels(); closeModal('modelModal'); showToast('模型接入配置已保存');
  };
  window.toggleModel = function(i) { var m=aiState.models[i]; m.enabled=!m.enabled; commitAutoSave('切换模型状态',m.name,'model-'+m.id,true); renderModels(); };
  window.removeModel = function(i) { if (!confirm('确认删除模型“'+aiState.models[i].name+'”的接入配置？')) return; aiState.models.splice(i,1); saveAiState(); renderModels(); };

  function keyById(id) { return aiState.keys.find(function (key) { return key.id === id; }); }
  function modelKeys(modelId) { return aiState.keys.filter(function (key) { return key.modelIds.indexOf(modelId) >= 0; }); }
  function uniqueValues(items, field) {
    return items.map(function (item) { return item[field]; }).filter(Boolean).filter(function (value, index, values) { return values.indexOf(value) === index; }).sort();
  }
  function healthMeta(key) {
    if (!key.enabled || key.health === 'disabled') return { value: 'disabled', label: '已停用' };
    if (key.health === 'cooling') return { value: 'cooling', label: '冷却中' };
    if (key.health === 'warning') return { value: 'warning', label: '高负载' };
    return { value: 'healthy', label: '健康' };
  }
  function keyModelNames(key) {
    return key.modelIds.map(function (id) { return (modelById(id) || {}).name; }).filter(Boolean);
  }
  function populateMonitoringFilters() {
    var orgFilter = byId('monitorOrgFilter');
    var sceneFilter = byId('monitorSceneFilter');
    if (!orgFilter || !sceneFilter) return;
    var orgValue = orgFilter.value;
    var sceneValue = sceneFilter.value;
    orgFilter.innerHTML = '<option value="">全部机构</option>' + uniqueValues(aiState.callLogs, 'org').map(function (value) { return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>'; }).join('');
    sceneFilter.innerHTML = '<option value="">全部场景</option>' + uniqueValues(aiState.callLogs, 'scene').map(function (value) { return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>'; }).join('');
    orgFilter.value = orgValue;
    sceneFilter.value = sceneValue;
  }

  window.renderMonitoring = function () {
    if (!byId('callLogRows')) return;
    populateMonitoringFilters();
    var enabled = aiState.keys.filter(function (key) { return key.enabled; });
    byId('monitorEnabledKeys').textContent = String(enabled.length);
    byId('monitorHealthyKeys').textContent = String(enabled.filter(function (key) { return key.health === 'healthy'; }).length);
    var org = byId('monitorOrgFilter').value;
    var scene = byId('monitorSceneFilter').value;
    var resultFilter = byId('monitorResultFilter').value;
    var logs = aiState.callLogs.filter(function (log) { return (!org || log.org === org) && (!scene || log.scene === scene) && (!resultFilter || log.result === resultFilter); });
    var resultMeta = { success: ['success', '成功'], failed: ['failed', '失败'], queued: ['warning', '排队中'] };
    byId('callLogRows').innerHTML = logs.length ? logs.map(function (log) {
      var model = modelById(log.modelId);
      var key = keyById(log.keyId);
      var meta = resultMeta[log.result] || ['disabled', log.result];
      return '<tr><td class="mono">' + escapeHtml(log.time) + '</td><td>' + escapeHtml(log.org) + '</td><td>' + escapeHtml(log.scene) + '</td><td>' + escapeHtml(model ? model.name : '未知模型') + '</td><td>' + escapeHtml(key ? key.alias : '已移除') + '</td><td>' + (log.latency ? log.latency + ' ms' : '—') + '</td><td><span class="pill ' + meta[0] + '">' + meta[1] + '</span></td><td>' + escapeHtml(log.detail) + '</td></tr>';
    }).join('') : '<tr><td colspan="8" class="subtle" style="text-align:center;padding:28px">暂无符合条件的调用记录</td></tr>';
  };

  window.refreshMonitoring = function () {
    renderMonitoring();
    showToast('监控数据已刷新');
  };

  function caseTemplateById(id) { return CASE_TEMPLATES.find(function (item) { return item.id === id; }) || CASE_TEMPLATES[0]; }
  function selectedCaseTemplate() { return caseTemplateById(aiState.selectedCaseTemplate); }
  function caseTemplateFor(material, stage) { return CASE_TEMPLATES.find(function (item) { return item.material === material && item.stage === stage; }) || CASE_TEMPLATES[0]; }

  function buildCasePrompt(template) {
    var schema = {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      additionalProperties: false,
      properties: {
        template_id: { const: template.id },
        material_type: { const: template.material },
        application_stage: { const: template.stage },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: { document_id: { type: 'string' }, source_pages: { type: 'array', items: { type: 'integer', minimum: 1 } } },
            required: ['document_id', 'source_pages']
          }
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              field: { enum: template.fields },
              value: { type: ['string', 'null'] },
              evidence: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: { quote: { type: 'string' }, page: { type: 'integer', minimum: 1 } },
                  required: ['quote', 'page']
                }
              },
              confidence: { type: 'number', minimum: 0, maximum: 1 }
            },
            required: ['field', 'value', 'evidence', 'confidence']
          }
        },
        missing_fields: { type: 'array', items: { type: 'string' } },
        conflicts: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } }
      },
      required: ['template_id', 'material_type', 'application_stage', 'documents', 'sections', 'missing_fields', 'conflicts', 'warnings']
    };
    return {
      id: 'case',
      templateId: template.id,
      module: '文书交付',
      title: '案例包 AI 解析',
      system: '你是留学材料结构化解析专家。必须使用固定模板 ' + template.id + ' 解析，不得改变字段名称或输出层级。材料类型为' + template.material + '，申请阶段为' + template.stage + '。' + template.focus + '每个字段返回值、原文证据、页码与置信度；缺失返回 null，材料冲突单独列出，禁止推测。',
      user: '模板：{{template_id}}\n材料类型：{{material_type}}\n申请阶段：{{application_stage}}\n固定字段：' + template.fields.join('、') + '\n待解析案例包：{{case_documents}}',
      schema: JSON.stringify(schema, null, 2),
      metric: '字段完整率、证据定位准确率、结构一致性',
      threshold: '字段完整率 ≥95%；证据准确率 ≥98%；结构一致性 100%'
    };
  }

  function basePromptWithOverride(base) {
    var prompt = cloneJson(base);
    var override = aiState.promptOverrides[base.id];
    if (override) Object.keys(override).forEach(function (key) { prompt[key] = override[key]; });
    return prompt;
  }

  function selectedCasePrompt() {
    var template = selectedCaseTemplate();
    var prompt = buildCasePrompt(template);
    var override = aiState.caseTemplateOverrides[template.id];
    if (override) Object.keys(override).forEach(function (key) { prompt[key] = override[key]; });
    return prompt;
  }

  function currentPrompt() {
    return basePromptWithOverride(currentBasePrompt());
  }

  function renderPromptList() {
    var list = visiblePrompts();
    if (activePrompt >= list.length) activePrompt = 0;
    byId('promptList').innerHTML = list.map(function (base, index) {
      return '<div class="prompt-item ' + (index === activePrompt ? 'active' : '') + '" onclick="selectPrompt(' + index + ')"><div class="prompt-name">' + (index + 1) + '. ' + escapeHtml(base.title) + '</div><div class="prompt-meta">' + escapeHtml(base.module) + '</div></div>';
    }).join('');
  }

  function promptContent(prompt) {
    if (prompt.content != null) return prompt.content;
    return [prompt.system, prompt.user].filter(Boolean).join('\n\n');
  }

  function promptOutput(prompt) {
    return prompt.output != null ? prompt.output : (prompt.schema || '');
  }

  function renderDetectedVariables() {
    var content = byId('promptContent').value;
    var variables = [];
    content.replace(/\{\{([^{}]+)\}\}/g, function (_, variable) {
      variable = variable.trim();
      if (variable && variables.indexOf(variable) < 0) variables.push(variable);
    });
    byId('detectedVariables').innerHTML = variables.length
      ? '<span class="label">正文动态参数</span>' + variables.map(function (variable) { return '<span class="variable-tag">{{' + escapeHtml(variable) + '}}</span>'; }).join('')
      : '<span class="label">当前正文无动态参数，业务数据仍会按下方配置自动传入</span>';
  }

  function renderPromptContext(prompt) {
    var builtInKeys = availableObjects().map(function (item) { return item[1]; });
    var contexts = Array.isArray(prompt.context) ? prompt.context.filter(function (item) { return builtInKeys.indexOf(item[1]) >= 0; }) : [];
    byId('promptContextCount').textContent = contexts.length + ' 项数据';
    byId('promptContextRows').innerHTML = contexts.map(function (item) {
      return '<tr><td class="context-name"><b>' + escapeHtml(item[0]) + '</b><span>结构化对象</span></td><td><span class="context-key">' + escapeHtml(item[1]) + '</span></td><td>' + escapeHtml(item[2]) + '</td></tr>';
    }).join('') || '<tr><td colspan="3" class="subtle" style="text-align:center;padding:20px">当前提示词尚未勾选数据对象</td></tr>';
  }

  function loadPrompt() {
    var prompt = currentPrompt();
    byId('promptModule').textContent = prompt.module;
    byId('promptTitle').textContent = prompt.title;
    byId('promptContent').value = promptContent(prompt);
    byId('promptOutput').value = promptOutput(prompt);
    renderPromptContext(prompt);
    renderDetectedVariables();
  }

  function renderPrompts() { renderPromptList(); loadPrompt(); }

  window.selectPrompt = function (index) {
    activePrompt = index;
    renderPrompts();
  };

  function capturePromptForm(autoSave) {
    var prompt = currentPrompt();
    var saved = {
      content: byId('promptContent').value,
      output: byId('promptOutput').value
    };
    aiState.promptOverrides[prompt.id] = Object.assign({}, aiState.promptOverrides[prompt.id] || {}, saved);
    if (autoSave) {
      renderDetectedVariables();
      commitAutoSave('自动保存提示词', prompt.title, 'prompt-' + prompt.id);
    }
    return Object.assign(prompt, saved);
  }

  function mergedEvalItem(base) { return Object.assign({}, base, aiState.evalResults[base.id] || {}); }
  function evalItemById(id) {
    var base = BASE_EVALS.find(function (item) { return item.id === id; });
    return base ? mergedEvalItem(base) : null;
  }

  function renderEvaluationSummary() {
    var items = BASE_EVALS.map(mergedEvalItem);
    var passed = items.filter(function (item) { return item.status === 'pass'; }).length;
    var pending = items.filter(function (item) { return item.status === 'fail' && !item.reviewed; }).length;
    var latest = items.slice().sort(function (a, b) { return String(b.updated).localeCompare(String(a.updated)); })[0];
    byId('passedCount').textContent = passed + ' / ' + items.length;
    byId('reviewPendingCount').textContent = String(pending);
    byId('lastEvalTime').textContent = latest.updated || '尚未运行';
    var latestValue = byId('latestEvalValue'), latestSummary = byId('latestEvalSummary');
    if (latestValue) latestValue.textContent = passed + ' / ' + items.length;
    if (latestSummary) {
      latestSummary.textContent = pending ? pending + ' 个场景待复核' : '全部场景已通过';
      latestSummary.className = 'metric-sub ' + (pending ? 'warn' : 'good');
    }
  }

  function evalStatusText(item) {
    if (item.status === 'running') return '<span class="status-line warn">运行中</span>';
    if (item.status === 'pass') return '<span class="status-line good">通过</span>';
    return '<span class="status-line bad">未通过</span>';
  }

  function renderEval() {
    byId('evalRows').innerHTML = BASE_EVALS.map(function (base) {
      var item = mergedEvalItem(base);
      return '<tr><td><b>' + escapeHtml(item.name) + '</b><div class="subtle">' + escapeHtml(item.updated || '尚未运行') + '</div></td>' +
        '<td>' + escapeHtml(item.metric) + '</td><td>' + escapeHtml(item.threshold) + '</td>' +
        '<td><b class="' + (item.status === 'pass' ? 'good' : item.status === 'fail' ? 'bad' : '') + '">' + escapeHtml(item.result || '—') + '</b></td>' +
        '<td>' + escapeHtml(item.samples) + '</td><td>' + evalStatusText(item) + '</td>' +
        '<td><button class="btn ghost sm" data-eval-run="' + item.id + '">评测</button><button class="btn ghost sm" data-eval-report="' + item.id + '">报告</button></td></tr>';
    }).join('');
    renderEvaluationSummary();
  }

  function initializeEvalActions() {
    byId('evalRows').addEventListener('click', function (event) {
      var run = event.target.closest('[data-eval-run]');
      var report = event.target.closest('[data-eval-report]');
      if (run) window.openEvaluation(run.dataset.evalRun);
      if (report) window.openEvalReport(report.dataset.evalReport);
    });
  }

  window.openEvaluation = function (sceneId, publishAfter) {
    byId('evalScenario').innerHTML = BASE_EVALS.map(function (item) { return '<option value="' + item.id + '">' + escapeHtml(item.name) + '</option>'; }).join('');
    if (sceneId && evalItemById(sceneId)) byId('evalScenario').value = sceneId;
    byId('evalDataset').value = 'gold';
    byId('evalScope').value = 'quick';
    byId('customDatasetFile').value = '';
    customDatasetCount = 0;
    window.updateEvaluationSetup();
    openModal('evaluationModal');
  };

  window.updateEvaluationSetup = function () {
    var item = evalItemById(byId('evalScenario').value) || mergedEvalItem(BASE_EVALS[0]);
    var dataset = byId('evalDataset').value;
    var full = byId('evalScope').value === 'full';
    var custom = dataset === 'custom';
    byId('customDatasetField').classList.toggle('hidden', !custom);
    var samples = full ? (custom ? customDatasetCount : item.samples) : 20;
    var model = modelById(aiState.globalRoute.primary);
    byId('evalConfigSummary').textContent = '评测指标：' + item.metric + '；上线门槛：' + item.threshold + '；主模型：' + (model ? model.name : '未配置') + '；预计样本：' + (samples || '待上传') + ' 条。';
    byId('startEvalButton').disabled = !model || (custom && !customDatasetCount);
  };

  window.handleCustomDataset = function (input) {
    customDatasetCount = input.files && input.files[0] ? 60 : 0;
    window.updateEvaluationSetup();
    if (customDatasetCount) showToast('已读取自定义评测集：60 条样本');
  };

  window.startEvaluation = function () {
    var item = evalItemById(byId('evalScenario').value);
    var dataset = byId('evalDataset').value;
    var scope = byId('evalScope').value;
    if (!item) return;
    if (!modelById(aiState.globalRoute.primary)) { showToast('请先在模型管理中选择主模型'); return; }
    if (dataset === 'custom' && !customDatasetCount) { showToast('请先上传自定义评测集'); return; }
    var samples = scope === 'quick' ? 20 : (dataset === 'custom' ? customDatasetCount : item.samples);
    var datasetName = dataset === 'gold' ? '发布金标集' : dataset === 'regression' ? '回归问题集' : '自定义评测集';
    aiState.evalResults[item.id] = Object.assign({}, aiState.evalResults[item.id] || {}, { status: 'running', result: '运行中', samples: samples, updated: nowText(), dataset: datasetName, reviewed: false });
    saveAiState();
    closeModal('evaluationModal');
    byId('evalTaskPanel').classList.remove('hidden');
    byId('evalTaskTitle').textContent = item.name + ' · ' + datasetName;
    byId('evalTaskProgress').style.width = '0%';
    byId('evalTaskPercent').textContent = '0%';
    byId('evalTaskDetail').textContent = '正在准备 ' + samples + ' 条评测样本…';
    renderEval();
    clearInterval(evalTimer);
    var steps = [12, 31, 55, 78, 93, 100];
    var index = 0;
    evalTimer = setInterval(function () {
      var value = steps[index++];
      byId('evalTaskProgress').style.width = value + '%';
      byId('evalTaskPercent').textContent = value + '%';
      byId('evalTaskDetail').textContent = value < 55 ? '正在执行模型输出与结构校验…' : value < 100 ? '正在计算指标并整理失败样本…' : '评测完成';
      if (value === 100) {
        clearInterval(evalTimer);
        completeEvaluation(item, samples, datasetName);
      }
    }, 260);
  };

  function completeEvaluation(baseItem, samples, datasetName) {
    var passed = true;
    var result = baseItem.result;
    aiState.evalResults[baseItem.id] = { status: passed ? 'pass' : 'fail', result: result, samples: samples, updated: nowText(), dataset: datasetName, reviewed: false };
    saveAiState();
    logAiAction('运行 AI 效果评测', baseItem.name + '，' + datasetName + ' ' + samples + ' 条，结果' + (passed ? '通过' : '未通过'));
    renderEval();
    setTimeout(function () { byId('evalTaskPanel').classList.add('hidden'); }, 900);
    window.openEvalReport(baseItem.id);
    showToast('评测完成：' + (passed ? '通过' : '需要人工复核'));
  }

  window.openEvalReport = function (id) {
    var item = evalItemById(id);
    if (!item) return;
    currentReportId = id;
    var model = modelById(aiState.globalRoute.primary);
    byId('reportScenarioModule').textContent = '效果评测';
    byId('reportScenarioTitle').textContent = item.name;
    byId('reportMeta').textContent = (item.dataset || '发布金标集') + ' · ' + (model ? model.name : '未配置模型') + ' · ' + item.updated;
    byId('reportStatus').textContent = item.status === 'pass' ? '评测通过' : item.status === 'running' ? '评测中' : '评测未通过';
    byId('reportStatus').className = 'prompt-status' + (item.status === 'pass' ? '' : ' draft');
    byId('reportResult').textContent = item.result || '—';
    byId('reportThreshold').textContent = item.threshold;
    byId('reportSamples').textContent = String(item.samples);
    byId('reportReview').textContent = item.reviewed ? '已复核' : '待复核';
    byId('reportReviewNote').value = item.reviewNote || '';
    var issues = item.status === 'fail' ? [
      ['CASE-019', '未通过', '录取类低置信度样本未进入人工复核', '提高关键风险召回规则权重'],
      ['CASE-047', '未通过', '前两类分差边界判断错误', '补充边界样本后重新评测']
    ] : [
      ['CASE-028', '通过，建议抽查', '证据页码来自 OCR 合并页', '人工确认原始页码映射']
    ];
    byId('reportIssueRows').innerHTML = issues.map(function (row) { return '<tr><td>' + escapeHtml(row[0]) + '</td><td>' + escapeHtml(row[1]) + '</td><td>' + escapeHtml(row[2]) + '</td><td>' + escapeHtml(row[3]) + '</td></tr>'; }).join('');
    openModal('evaluationReportModal');
  };

  window.markEvaluationReviewed = function () {
    var item = evalItemById(currentReportId);
    if (!item) return;
    aiState.evalResults[currentReportId] = Object.assign({}, aiState.evalResults[currentReportId] || {}, { reviewed: true, reviewNote: byId('reportReviewNote').value.trim(), updated: item.updated });
    commitAutoSave('确认 AI 评测复核', item.name + '，复核结论：' + (byId('reportReviewNote').value.trim() || '已确认'), 'eval-review-' + currentReportId, true);
    renderEval();
    byId('reportReview').textContent = '已复核';
    showToast('复核结论已记录');
  };

  function initializeAutoSaveInputs() {
    document.querySelectorAll('.prompt-input').forEach(function (input) {
      input.addEventListener('input', function () { capturePromptForm(true); });
    });
  }

  function availableObjects() {
    var objects = [];
    BASE_PROMPTS.forEach(function(p) { (p.context || []).forEach(function(c) { if (!objects.some(function(o) { return o[1] === c[1]; })) objects.push(c); }); });
    return objects;
  }
  function objectChecks(selected) {
    return availableObjects().map(function(o,i) { return '<label class="scope-option"><input type="checkbox" value="'+i+'" '+(selected.indexOf(o[1]) >= 0 ? 'checked' : '')+'><div><b>'+escapeHtml(o[0])+'</b><span>'+escapeHtml(o[1])+' · '+escapeHtml(o[2])+'</span></div></label>'; }).join('');
  }
  function readObjectChecks(id) {
    var objects=availableObjects();
    return Array.prototype.map.call(byId(id).querySelectorAll('input:checked'),function(input) { return cloneJson(objects[Number(input.value)]); });
  }
  window.openNewPrompt = function() {
    byId('newPromptName').value=''; byId('newPromptModule').value='';
    byId('newPromptChecks').innerHTML=objectChecks([]); byId('newPromptError').textContent=''; openModal('newPromptModal');
  };
  window.createPrompt = function() {
    var name=byId('newPromptName').value.trim(), module=byId('newPromptModule').value.trim();
    if (!name || !module) { byId('newPromptError').textContent='请填写提示词名称和业务模块'; return; }
    if (visiblePrompts().some(function(p) { return p.title===name; })) { byId('newPromptError').textContent='提示词名称已存在'; return; }
    var p={id:'custom_'+Date.now(),title:name,module:module,content:'',output:'',context:readObjectChecks('newPromptChecks')};
    aiState.customPrompts.push(p); saveAiState(); activePrompt=visiblePrompts().findIndex(function(item) { return item.id===p.id; });
    closeModal('newPromptModal'); renderPrompts(); byId('promptContent').focus(); showToast('已新增提示词，可开始编写正文');
  };
  window.openContextPicker = function() {
    var prompt=currentPrompt();
    byId('contextPickerPromptName').textContent='当前提示词：'+prompt.title;
    byId('contextChecks').innerHTML=objectChecks((prompt.context || []).map(function(c) {return c[1];}));
    openModal('contextPickerModal');
  };
  window.saveContextSelection = function() {
    var p=currentPrompt();
    aiState.promptOverrides[p.id]=Object.assign({},aiState.promptOverrides[p.id] || {},{context:readObjectChecks('contextChecks')});
    commitAutoSave('配置提示词数据对象',p.title,'context-'+p.id,true); renderPromptContext(currentPrompt()); closeModal('contextPickerModal'); showToast('当前提示词的数据对象已更新');
  };
  window.restorePromptOutput = function() {
    byId('promptOutput').value=promptOutput(currentBasePrompt()); capturePromptForm(true); showToast('已恢复当前模板默认输出格式');
  };
  function initialize() {
    initializeTabs();
    initializeDialogs();
    initializeEvalActions();
    renderModels();

    renderMonitoring();
    renderPrompts();
    renderEval();
    initializeAutoSaveInputs();
    saveAiState();
  }

  initialize();
})();
