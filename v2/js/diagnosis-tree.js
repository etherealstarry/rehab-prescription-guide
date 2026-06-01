// diagnosis-tree.js — 症状/疾病名匹配（基于《诊断学》第9版·症状学）
// ================================================================
// 资料依据：
//   ①《诊断学》第9版（万学红/卢雪峰 主编，人民卫生出版社）—— 症状学全部33章
//   ②《康复评定学》第3版（王玉龙 主编）—— 功能评估分类
//   ③ 中华医学会指南 & 国际CPGs（见 01-临床指南灵魂.md）
//
// 匹配规则：症状关键词 → specialty（专科方向）+ diagnosis（具体诊断Key）
// 搜索策略：双向包含 + 分词 + 最长公共子串（模糊容错）
// ================================================================

const DiagnosisTree = {
  // ============================================================
  // 一、症状/疾病关键词 → 专科方向映射
  // 结构：'关键词': { specialty, diagnosis, label, icon, guide }
  //   guide: 对应的核心指南（用于处方模块引用）
  // ============================================================
  symptomMap: {

    // ============================================================
    // 《诊断学》症状学 第一章：发热
    // ============================================================
    '发热':           { specialty:'fever',      diagnosis:'fever',       label:'发热',                     icon:'🤒', guide:'感染科诊疗规范' },
    '发烧':           { specialty:'fever',      diagnosis:'fever',       label:'发热',                     icon:'🤒', guide:'感染科诊疗规范' },
    '高热':           { specialty:'fever',      diagnosis:'fever',       label:'发热（高热）',             icon:'🤒', guide:'感染科诊疗规范' },
    '低烧':           { specialty:'fever',      diagnosis:'fever',       label:'发热（低热）',             icon:'🤒', guide:'感染科诊疗规范' },
    '畏寒':           { specialty:'fever',      diagnosis:'fever',       label:'发热（伴随畏寒）',         icon:'🤒', guide:'' },
    '寒战':           { specialty:'fever',      diagnosis:'fever',       label:'发热（伴随寒战）',         icon:'🤒', guide:'' },
    '盗汗':           { specialty:'fever',      diagnosis:'fever',       label:'发热（伴随盗汗）',         icon:'🤒', guide:'' },
    '午后低热':       { specialty:'fever',      diagnosis:'fever',       label:'发热（午后低热，警惕结核）',icon:'🤒', guide:'' },

    // ============================================================
    // 《诊断学》症状学 第二章：头痛
    // 神经康复模块 ①
    // ============================================================
    '头痛':           { specialty:'neurologic', diagnosis:'headache',     label:'头痛',                     icon:'🧠', guide:'中国头痛诊疗指南' },
    '偏头痛':         { specialty:'neurologic', diagnosis:'headache',     label:'偏头痛',                   icon:'🧠', guide:'中国偏头痛诊疗指南' },
    '丛集性头痛':     { specialty:'neurologic', diagnosis:'headache',     label:'丛集性头痛',               icon:'🧠', guide:'' },
    '头昏':           { specialty:'neurologic', diagnosis:'dizziness',    label:'头昏/头晕',               icon:'🧠', guide:'' },
    '头晕':           { specialty:'neurologic', diagnosis:'dizziness',    label:'头晕',                     icon:'🧠', guide:'BPPV诊疗指南' },
    '眩晕':           { specialty:'neurologic', diagnosis:'vertigo',      label:'眩晕（天旋地转感）',     icon:'🧠', guide:'BPPV诊疗指南' },
    '耳鸣':           { specialty:'neurologic', diagnosis:'tinnitus',     label:'耳鸣',                     icon:'🧠', guide:'' },
    '听力下降':       { specialty:'neurologic', diagnosis:'hearingLoss',  label:'听力下降/耳聋',           icon:'🧠', guide:'' },
    '晕厥':           { specialty:'neurologic', diagnosis:'syncope',      label:'晕厥（晕倒）',             icon:'🧠', guide:'晕厥诊疗中国专家共识' },
    '昏迷':           { specialty:'neurologic', diagnosis:'coma',         label:'昏迷/意识障碍',             icon:'🧠', guide:'中国神经急诊指南' },
    '意识障碍':       { specialty:'neurologic', diagnosis:'coma',         label:'意识障碍',                 icon:'🧠', guide:'' },

    // ============================================================
    // 《诊断学》症状学 第三章：癫痫与抽搐
    // 神经康复模块 ②
    // ============================================================
    '抽搐':           { specialty:'neurologic', diagnosis:'seizure',      label:'抽搐/惊厥',               icon:'🧠', guide:'中国癫痫诊疗指南' },
    '惊厥':           { specialty:'neurologic', diagnosis:'seizure',      label:'抽搐/惊厥',               icon:'🧠', guide:'' },
    '癫痫发作':       { specialty:'neurologic', diagnosis:'seizure',      label:'癫痫发作',                 icon:'🧠', guide:'' },
    '癫痫':           { specialty:'neurologic', diagnosis:'epilepsy',     label:'癫痫',                     icon:'🧠', guide:'中国癫痫诊疗指南' },

    // ============================================================
    // 《诊断学》症状学 第四章：瘫痪（神经康复核心）
    // 对应脑卒中、脊髓损伤、周围神经病变
    // ============================================================
    '瘫痪':           { specialty:'neurologic', diagnosis:'paralysis',   label:'瘫痪',                     icon:'🧠', guide:'' },
    '偏瘫':           { specialty:'neurologic', diagnosis:'stroke',       label:'一侧肢体无力（疑似脑卒中）',icon:'🧠', guide:'中国脑卒中早期康复治疗指南2017' },
    '半身不遂':       { specialty:'neurologic', diagnosis:'stroke',       label:'脑卒中后偏瘫',             icon:'🧠', guide:'' },
    '脑卒中':         { specialty:'neurologic', diagnosis:'stroke',       label:'脑卒中',                   icon:'🧠', guide:'中国脑卒中早期康复治疗指南2017;AHA/ASA Stroke Rehab 2022' },
    '中风':           { specialty:'neurologic', diagnosis:'stroke',       label:'脑卒中（中风）',           icon:'🧠', guide:'' },
    '脑梗死':         { specialty:'neurologic', diagnosis:'stroke',       label:'脑卒中（脑梗死）',         icon:'🧠', guide:'' },
    '脑出血':         { specialty:'neurologic', diagnosis:'stroke',       label:'脑卒中（脑出血）',         icon:'🧠', guide:'' },
    '蛛网膜下腔出血': { specialty:'neurologic', diagnosis:'stroke',       label:'蛛网膜下腔出血',           icon:'🧠', guide:'' },
    '短暂性脑缺血发作':{ specialty:'neurologic', diagnosis:'tia',        label:'TIA（小中风）',           icon:'🧠', guide:'中国TIA诊疗指南' },
    'TIA':            { specialty:'neurologic', diagnosis:'tia',        label:'TIA（短暂性脑缺血发作）', icon:'🧠', guide:'' },

    '脊髓损伤':       { specialty:'neurologic', diagnosis:'sci',          label:'脊髓损伤',                 icon:'🧠', guide:'ASIA ISCSCI指南;中国脊髓损伤康复指南' },
    '截瘫':           { specialty:'neurologic', diagnosis:'sci',          label:'脊髓损伤（截瘫）',         icon:'🧠', guide:'' },
    '四肢瘫':         { specialty:'neurologic', diagnosis:'sci',          label:'脊髓损伤（四肢瘫）',       icon:'🧠', guide:'' },
    '高位截瘫':       { specialty:'neurologic', diagnosis:'sci',          label:'颈髓损伤（高位截瘫）',   icon:'🧠', guide:'' },

    '帕金森':         { specialty:'neurologic', diagnosis:'parkinson',    label:'帕金森病',                 icon:'🧠', guide:'中国帕金森病康复指南2018;MDS ESP 2021' },
    '手抖':           { specialty:'neurologic', diagnosis:'parkinson',    label:'手抖/动作缓慢',           icon:'🧠', guide:'' },
    '动作缓慢':       { specialty:'neurologic', diagnosis:'parkinson',    label:'动作缓慢',                 icon:'🧠', guide:'' },
    '步履小碎':       { specialty:'neurologic', diagnosis:'parkinson',    label:'帕金森步态异常',           icon:'🧠', guide:'' },
    '面具脸':         { specialty:'neurologic', diagnosis:'parkinson',    label:'帕金森面部表情减少',       icon:'🧠', guide:'' },
    '慌张步态':       { specialty:'neurologic', diagnosis:'parkinson',    label:'帕金森慌张步态',           icon:'🧠', guide:'' },

    '面瘫':           { specialty:'neurologic', diagnosis:'facialpalsy',  label:'面瘫/面神经炎',           icon:'🧠', guide:'中国面神经炎诊疗指南' },
    '面神经炎':       { specialty:'neurologic', diagnosis:'facialpalsy',  label:'面瘫/面神经炎',           icon:'🧠', guide:'' },
    '三叉神经痛':     { specialty:'neurologic', diagnosis:'trigeminal',   label:'三叉神经痛',               icon:'🧠', guide:'三叉神经痛诊疗中国专家共识' },
    '带状疱疹后神经痛':{ specialty:'neurologic', diagnosis:'postherpetic',label:'带状疱疹后神经痛',       icon:'🧠', guide:'带状疱疹后神经痛诊疗指南' },
    '糖尿病足':       { specialty:'neurologic', diagnosis:'peripheral',   label:'周围神经病变（糖尿病足）', icon:'🧠', guide:'糖尿病周围神经病变诊疗指南' },
    '周围神经病变':     { specialty:'neurologic', diagnosis:'peripheral',   label:'周围神经病变',             icon:'🧠', guide:'' },
    '吉兰巴雷':       { specialty:'neurologic', diagnosis:'gb',           label:'吉兰-巴雷综合征',          icon:'🧠', guide:'中国GBS诊疗指南' },
    'GBS':            { specialty:'neurologic', diagnosis:'gb',           label:'吉兰-巴雷综合征',          icon:'🧠', guide:'' },
    '多发性硬化':     { specialty:'neurologic', diagnosis:'ms',           label:'多发性硬化',               icon:'🧠', guide:'中国多发性硬化诊疗指南' },
    '重症肌无力':     { specialty:'neurologic', diagnosis:'mg',           label:'重症肌无力',               icon:'🧠', guide:'中国重症肌无力诊疗指南' },
    '共济失调':       { specialty:'neurologic', diagnosis:'ataxia',      label:'共济失调',                 icon:'🧠', guide:'' },
    '不自主运动':     { specialty:'neurologic', diagnosis:'dyskinesia',  label:'不自主运动',               icon:'🧠', guide:'' },
    '感觉障碍':       { specialty:'neurologic', diagnosis:'sensory',      label:'感觉障碍',                 icon:'🧠', guide:'' },
    '麻木':           { specialty:'neurologic', diagnosis:'sensory',      label:'感觉障碍/麻木',           icon:'🧠', guide:'' },

    // ============================================================
    // 颈椎病（《康复评定学》+ 颈椎专科研判）
    // 对应《诊断学》"颈肩痛"症状
    // ============================================================
    '手麻':           { specialty:'cervical',   diagnosis:'cervical',     label:'手麻/手指麻木（颈椎病）', icon:'🧠', guide:'中国颈椎病诊疗指南2018' },
    '手发麻':         { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病（神经根型）',     icon:'🧠', guide:'' },
    '手指发麻':       { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病（神经根型）',     icon:'🧠', guide:'' },
    '上肢麻木':       { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病（神经根型）',     icon:'🧠', guide:'' },
    '手臂麻木':       { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病（神经根型）',     icon:'🧠', guide:'' },
    '左手小指麻木':   { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病（C8神经根）',      icon:'🧠', guide:'' },
    '右手小指麻木':   { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病（C8神经根）',      icon:'🧠', guide:'' },
    '小指麻木':       { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病（C8神经根）',      icon:'🧠', guide:'' },
    '左手麻木':       { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病（左侧）',           icon:'🧠', guide:'' },
    '右手麻木':       { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病（右侧）',           icon:'🧠', guide:'' },
    '颈肩手痛':       { specialty:'cervical',   diagnosis:'cervical',     label:'颈肩手综合征',             icon:'🧠', guide:'' },
    '神经根型颈椎病': { specialty:'cervical',   diagnosis:'cervical',     label:'神经根型颈椎病',           icon:'🧠', guide:'' },
    '脊髓型颈椎病':   { specialty:'cervical',   diagnosis:'cervicalMyelopathy', label:'脊髓型颈椎病',     icon:'🧠', guide:'中国颈椎病诊疗指南2018' },
    '颈椎病':         { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病',                   icon:'🧠', guide:'' },
    '颈椎':           { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病',                   icon:'🧠', guide:'' },
    '颈肩痛':         { specialty:'cervical',   diagnosis:'cervical',     label:'颈肩痛（颈椎病）',         icon:'🧠', guide:'' },
    '脖子疼':         { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病/颈肩痛',           icon:'🧠', guide:'' },
    '脖子痛':         { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病/颈肩痛',           icon:'🧠', guide:'' },
    '上肢放射痛':     { specialty:'cervical',   diagnosis:'cervical',     label:'颈椎病（神经根放射痛）', icon:'🧠', guide:'' },
    '颈肩手综合征':   { specialty:'cervical',   diagnosis:'shoulderHand', label:'颈肩手综合征（SHS）',   icon:'🧠', guide:'脑卒中后SHS诊疗指南' },
    '踩棉花感':       { specialty:'cervical',   diagnosis:'cervicalMyelopathy', label:'脊髓型颈椎病（踩棉花感）', icon:'🧠', guide:'' },
    '走路不稳':       { specialty:'neurologic', diagnosis:'gaitDisorder', label:'步态异常/行走不稳',       icon:'🧠', guide:'' },
    '容易绊倒':       { specialty:'neurologic', diagnosis:'gaitDisorder', label:'步态异常（易绊倒）',     icon:'🧠', guide:'' },

    // ============================================================
    // 《诊断学》症状学：咳嗽、咳痰、咯血
    // 心肺康复模块 ①
    // ============================================================
    '咳嗽':           { specialty:'cardiopulmonary', diagnosis:'cough',       label:'咳嗽/咳痰',               icon:'🫁', guide:'咳嗽诊疗指南' },
    '咳痰':           { specialty:'cardiopulmonary', diagnosis:'cough',       label:'咳嗽/咳痰',               icon:'🫁', guide:'' },
    '咯血':           { specialty:'cardiopulmonary', diagnosis:'hemoptysis',  label:'咯血',                   icon:'🫁', guide:'咯血诊疗指南' },

    // ============================================================
    // 《诊断学》症状学：呼吸困难
    // 心肺康复模块 ② —— 核心症状
    // ============================================================
    '呼吸困难':       { specialty:'cardiopulmonary', diagnosis:'dyspnea',    label:'呼吸困难',               icon:'🫁', guide:'GOLD 2024; 中国心衰诊疗指南' },
    '气短':           { specialty:'cardiopulmonary', diagnosis:'dyspnea',    label:'呼吸困难（气短）',       icon:'🫁', guide:'' },
    '胸闷':           { specialty:'cardiopulmonary', diagnosis:'dyspnea',    label:'呼吸困难（胸闷）',       icon:'🫁', guide:'' },
    '活动后气短':     { specialty:'cardiopulmonary', diagnosis:'dyspnea',    label:'活动后呼吸困难',         icon:'🫁', guide:'' },

    // ============================================================
    // 《诊断学》症状学：胸痛
    // 心肺康复模块 ③
    // ============================================================
    '胸痛':           { specialty:'cardiopulmonary', diagnosis:'chestPain',   label:'胸痛',                   icon:'🫁', guide:'中国急性胸痛诊疗指南' },
    '心绞痛':         { specialty:'cardiopulmonary', diagnosis:'angina',      label:'心绞痛',                 icon:'🫁', guide:'冠心病诊疗指南' },
    '心悸':           { specialty:'cardiopulmonary', diagnosis:'palpitation', label:'心悸',                   icon:'🫁', guide:'' },

    // ============================================================
    // 《诊断学》症状学：水肿
    // 心肺康复模块 ④
    // ============================================================
    '水肿':           { specialty:'cardiopulmonary', diagnosis:'edema',       label:'水肿（心源性/肾源性）', icon:'🫁', guide:'' },
    '下肢水肿':       { specialty:'cardiopulmonary', diagnosis:'edema',       label:'下肢水肿',               icon:'🫁', guide:'中国心衰诊疗指南' },
    '足踝水肿':       { specialty:'cardiopulmonary', diagnosis:'edema',       label:'足踝水肿（心衰/静脉功能不全）', icon:'🫁', guide:'' },

    // ============================================================
    // 慢性阻塞性肺病（COPD）/ 哮喘
    // 心肺康复模块 ⑤
    // ============================================================
    '腹胀':           { specialty:'cardiopulmonary', diagnosis:'copd',        label:'慢性阻塞性肺病（COPD）', icon:'🫁', guide:'GOLD 2024' },
    '慢性阻塞性肺病': { specialty:'cardiopulmonary', diagnosis:'copd',        label:'慢性阻塞性肺病（COPD）', icon:'🫁', guide:'' },
    'COPD':           { specialty:'cardiopulmonary', diagnosis:'copd',        label:'慢性阻塞性肺病（COPD）', icon:'🫁', guide:'' },
    '慢性支气管炎':   { specialty:'cardiopulmonary', diagnosis:'copd',        label:'慢性支气管炎/COPD',      icon:'🫁', guide:'' },
    '肺气肿':         { specialty:'cardiopulmonary', diagnosis:'copd',        label:'肺气肿',                 icon:'🫁', guide:'' },
    '哮喘':           { specialty:'cardiopulmonary', diagnosis:'asthma',     label:'支气管哮喘',               icon:'🫁', guide:'GINA 2024' },
    '支气管哮喘':     { specialty:'cardiopulmonary', diagnosis:'asthma',     label:'支气管哮喘',               icon:'🫁', guide:'' },

    // ============================================================
    // 急性心肌梗死 / 心力衰竭 / 冠脉搭桥术后
    // 心肺康复模块 ⑥
    // ============================================================
    '急性心肌梗死':   { specialty:'cardiopulmonary', diagnosis:'mi',          label:'急性心肌梗死（AMI）',     icon:'🫁', guide:'AHA/ACC AMI诊疗指南' },
    'AMI':            { specialty:'cardiopulmonary', diagnosis:'mi',          label:'急性心肌梗死（AMI）',     icon:'🫁', guide:'' },
    '心力衰竭':       { specialty:'cardiopulmonary', diagnosis:'heartFailure', label:'心力衰竭',               icon:'🫁', guide:'中国心衰诊疗指南2024' },
    '心衰':           { specialty:'cardiopulmonary', diagnosis:'heartFailure', label:'心力衰竭',               icon:'🫁', guide:'' },
    '冠脉搭桥术后':   { specialty:'cardiopulmonary', diagnosis:'cabg',        label:'冠脉搭桥术后（CABG）', icon:'🫁', guide:'AACVPR心脏康复指南2024' },
    'CABG':           { specialty:'cardiopulmonary', diagnosis:'cabg',        label:'冠脉搭桥术后（CABG）', icon:'🫁', guide:'' },
    'PCI术后':        { specialty:'cardiopulmonary', diagnosis:'pci',         label:'PCI术后（支架植入）',   icon:'🫁', guide:'中国PCI术后康复指南' },
    '支架术后':       { specialty:'cardiopulmonary', diagnosis:'pci',         label:'PCI术后（支架植入）',   icon:'🫁', guide:'' },

    // ============================================================
    // 新冠后康复（Long COVID）
    // 心肺康复模块 ⑦
    // ============================================================
    '新冠后':         { specialty:'cardiopulmonary', diagnosis:'postCovid',   label:'新冠后康复',               icon:'🫀', guide:'WHO新冠康复指导手册2023' },
    'Long COVID':     { specialty:'cardiopulmonary', diagnosis:'postCovid',   label:'新冠后功能障碍康复',     icon:'🫀', guide:'' },
    '长新冠':         { specialty:'cardiopulmonary', diagnosis:'postCovid',   label:'长新冠（Long COVID）',  icon:'🫀', guide:'' },

    // ============================================================
    // 《诊断学》症状学 第五章：恶心与呕吐
    // 消化康复模块
    // ============================================================
    '恶心':           { specialty:'gi', diagnosis:'nausea',        label:'恶心/呕吐',               icon:'🤢', guide:'' },
    '呕吐':           { specialty:'gi', diagnosis:'vomiting',      label:'恶心/呕吐',               icon:'🤢', guide:'' },
    '吞咽困难':       { specialty:'gi', diagnosis:'dysphagia',    label:'吞咽困难',               icon:'🤢', guide:'脑卒中后吞咽障碍康复指南' },
    '呕血':           { specialty:'gi', diagnosis:'hematemesis',   label:'呕血',                   icon:'🤢', guide:'' },

    // ============================================================
    // 《诊断学》症状学 第六章：便血与黑便
    // ============================================================
    '便血':           { specialty:'gi', diagnosis:'hematochezia',  label:'便血',                   icon:'🤢', guide:'' },
    '黑便':           { specialty:'gi', diagnosis:'melena',        label:'黑便（上消化道出血）', icon:'🤢', guide:'' },

    // ============================================================
    // 《诊断学》症状学 第七章：腹痛
    // ============================================================
    '腹痛':           { specialty:'gi', diagnosis:'abdominalPain', label:'腹痛',                   icon:'🤢', guide:'' },

    // ============================================================
    // 《诊断学》症状学 第八章：腹泻与便秘
    // ============================================================
    '腹泻':           { specialty:'gi', diagnosis:'diarrhea',      label:'腹泻',                   icon:'🤢', guide:'' },
    '便秘':           { specialty:'gi', diagnosis:'constipation',   label:'便秘',                   icon:'🤢', guide:'慢性便秘诊疗指南' },

    // ============================================================
    // 《诊断学》症状学 第九章：黄疸
    // ============================================================
    '黄疸':           { specialty:'gi', diagnosis:'jaundice',      label:'黄疸',                   icon:'🤢', guide:'' },

    // ============================================================
    // 《诊断学》症状学：肝大、脾大、腹水
    // ============================================================
    '肝大':           { specialty:'gi', diagnosis:'hepatomegaly',  label:'肝大',                   icon:'🤢', guide:'' },
    '脾大':           { specialty:'gi', diagnosis:'splenomegaly',  label:'脾大',                   icon:'🤢', guide:'' },
    '腹水':           { specialty:'gi', diagnosis:'ascites',       label:'腹水',                   icon:'🤢', guide:'' },

    // ============================================================
    // 《诊断学》症状学 第十章：血尿
    // 泌尿康复模块
    // ============================================================
    '血尿':           { specialty:'gu', diagnosis:'hematuria',    label:'血尿',                   icon:'🩺', guide:'' },

    // ============================================================
    // 《诊断学》症状学：尿频、尿急、尿痛
    // ============================================================
    '尿频':           { specialty:'gu', diagnosis:'urinary',      label:'尿频/尿急/尿痛',         icon:'🩺', guide:'' },
    '尿急':           { specialty:'gu', diagnosis:'urinary',      label:'尿频/尿急/尿痛',         icon:'🩺', guide:'' },
    '尿痛':           { specialty:'gu', diagnosis:'urinary',      label:'尿频/尿急/尿痛',         icon:'🩺', guide:'' },
    '尿失禁':         { specialty:'gu', diagnosis:'incontinence', label:'尿失禁',                 icon:'🩺', guide:'尿失禁康复指南' },

    // ============================================================
    // 《诊断学》症状学：少尿、无尿、多尿
    // ============================================================
    '少尿':           { specialty:'gu', diagnosis:'oliguria',     label:'少尿/无尿/多尿',         icon:'🩺', guide:'' },
    '无尿':           { specialty:'gu', diagnosis:'anuria',       label:'少尿/无尿/多尿',         icon:'🩺', guide:'' },
    '多尿':           { specialty:'gu', diagnosis:'polyuria',     label:'少尿/无尿/多尿',         icon:'🩺', guide:'' },

    // ============================================================
    // 《诊断学》症状学 第十一章：体重增加/减轻
    // 内分泌康复模块
    // ============================================================
    '体重增加':       { specialty:'endocrine', diagnosis:'weightGain',    label:'体重增加/肥胖',         icon:'⚖️', guide:'中国肥胖诊疗指南' },
    '体重减轻':       { specialty:'endocrine', diagnosis:'weightLoss',   label:'体重减轻/消瘦',         icon:'⚖️', guide:'' },
    '肥胖':           { specialty:'endocrine', diagnosis:'obesity',      label:'肥胖',                   icon:'⚖️', guide:'中国肥胖诊疗指南' },
    '消瘦':           { specialty:'endocrine', diagnosis:'wasting',      label:'消瘦（体重减轻）',       icon:'⚖️', guide:'' },

    // ============================================================
    // 《诊断学》症状学：甲状腺肿大、多食、畏热多汗
    // ============================================================
    '甲状腺肿大':     { specialty:'endocrine', diagnosis:'goiter',       label:'甲状腺肿',               icon:'⚖️', guide:'中国甲状腺疾病诊疗指南' },
    '多食':           { specialty:'endocrine', diagnosis:'hyperthyroidism', label:'甲状腺功能亢进',         icon:'⚖️', guide:'' },
    '畏热多汗':       { specialty:'endocrine', diagnosis:'hyperthyroidism', label:'甲状腺功能亢进',         icon:'⚖️', guide:'' },
    '甲状腺功能减退':   { specialty:'endocrine', diagnosis:'hypothyroidism',label:'甲状腺功能减退',         icon:'⚖️', guide:'' },

    // ============================================================
    // 《诊断学》症状学 第十二章：皮肤黏膜出血
    // 血液康复模块
    // ============================================================
    '皮肤黏膜出血':   { specialty:'heme', diagnosis:'bleeding',     label:'皮肤黏膜出血',               icon:'🩸', guide:'' },
    '贫血':           { specialty:'heme', diagnosis:'anemia',       label:'贫血',                   icon:'🩸', guide:'中国贫血诊疗指南' },
    '紫癜':           { specialty:'heme', diagnosis:'purpura',     label:'紫癜',                   icon:'🩸', guide:'' },
    '淋巴结大':       { specialty:'heme', diagnosis:'lymphadenopathy', label:'淋巴结肿大',               icon:'🩸', guide:'' },

    // ============================================================
    // 《诊断学》症状学：红斑结节、口腔溃疡（风湿免疫）
    // 风湿免疫康复模块
    // ============================================================
    '红斑结节':       { specialty:'rheum', diagnosis:'rash',          label:'红斑结节（风湿免疫）',     icon:'🔴', guide:'' },
    '口腔溃疡':       { specialty:'rheum', diagnosis:'oralUlcer',    label:'口腔溃疡（白塞病？）',   icon:'🔴', guide:'' },
    '肌萎缩':         { specialty:'rheum', diagnosis:'myatrophy',     label:'肌萎缩',                 icon:'💪', guide:'' },
    '口干':           { specialty:'rheum', diagnosis:'sjogren',      label:'口干（干燥综合征？）',   icon:'💧', guide:'干燥综合征诊疗指南' },
    '眼干':           { specialty:'rheum', diagnosis:'sjogren',      label:'眼干（干燥综合征？）',   icon:'💧', guide:'' },

    // ============================================================
    // 《诊断学》症状学 第十三章：失眠
    // 精神康复模块
    // ============================================================
    '失眠':           { specialty:'psych', diagnosis:'insomnia',     label:'失眠',                   icon:'😴', guide:'中国失眠诊疗指南' },
    '精神障碍':       { specialty:'psych', diagnosis:'psychosis',    label:'精神障碍',                 icon:'😵', guide:'' },
    '焦虑':           { specialty:'psych', diagnosis:'anxiety',      label:'焦虑障碍',                 icon:'😰', guide:'中国焦虑障碍诊疗指南' },
    '抑郁':           { specialty:'psych', diagnosis:'depression',   label:'抑郁障碍',                 icon:'😔', guide:'中国抑郁障碍诊疗指南' },
    '认知障碍':       { specialty:'psych', diagnosis:'cognitivedecline', label:'认知障碍/记忆力下降',   icon:'🧠', guide:'中国痴呆诊疗指南' },
    '记忆力下降':     { specialty:'psych', diagnosis:'cognitivedecline', label:'记忆力下降（警惕痴呆）',icon:'🧠', guide:'' },

    // ============================================================
    // 骨科康复 —— 膝关节（APTA Knee CPG; AAOS ACL Guide 2022）
    // 《诊断学》症状学：关节痛（下肢）
    // ============================================================
    '关节痛':         { specialty:'orthopedic', diagnosis:'jointpain',   label:'关节痛',                   icon:'🦴', guide:'' },
    '膝关节疼痛':     { specialty:'orthopedic', diagnosis:'knee',        label:'膝关节疼痛',               icon:'🦴', guide:'AAOS膝OA诊疗指南2024' },
    '膝盖疼痛':       { specialty:'orthopedic', diagnosis:'knee',        label:'膝关节疼痛',               icon:'🦴', guide:'' },
    '膝关节术后':     { specialty:'orthopedic', diagnosis:'acl',         label:'膝关节术后康复',           icon:'🦴', guide:'APTA ACL CPG 2022' },
    '膝关节手术':     { specialty:'orthopedic', diagnosis:'acl',         label:'膝关节术后康复',           icon:'🦴', guide:'' },
    '前交叉韧带':     { specialty:'orthopedic', diagnosis:'acl',         label:'前交叉韧带重建术后',       icon:'🦴', guide:'' },
    'ACL重建':        { specialty:'orthopedic', diagnosis:'acl',         label:'前交叉韧带重建术后',       icon:'🦴', guide:'' },
    'ACL损伤':        { specialty:'orthopedic', diagnosis:'acl',         label:'前交叉韧带损伤',           icon:'🦴', guide:'' },
    '半月板缝合':     { specialty:'orthopedic', diagnosis:'meniscus',    label:'半月板术后康复',           icon:'🦴', guide:'APTA Meniscus CPG' },
    '半月板术后':     { specialty:'orthopedic', diagnosis:'meniscus',    label:'半月板术后康复',           icon:'🦴', guide:'' },
    '半月板损伤':     { specialty:'orthopedic', diagnosis:'meniscus',    label:'半月板损伤',               icon:'🦴', guide:'' },
    '全膝关节置换':   { specialty:'orthopedic', diagnosis:'tkr',         label:'全膝关节置换术后',         icon:'🦴', guide:'AAOS TKA康复指南' },
    'TKR':            { specialty:'orthopedic', diagnosis:'tkr',         label:'全膝关节置换术后',         icon:'🦴', guide:'' },
    '膝关节骨性关节炎':{ specialty:'orthopedic', diagnosis:'kneeOA',      label:'膝关节骨性关节炎（OA）', icon:'🦴', guide:'中国膝OA诊疗指南2024' },
    '膝OA':           { specialty:'orthopedic', diagnosis:'kneeOA',      label:'膝关节骨性关节炎',         icon:'🦴', guide:'' },
    '跑步膝':         { specialty:'orthopedic', diagnosis:'runnersKnee', label:'跑步膝（髌股疼痛综合征）',icon:'🦴', guide:'APTA Patellofemoral CPG' },
    '髌股疼痛':       { specialty:'orthopedic', diagnosis:'runnersKnee', label:'髌股疼痛综合征',         icon:'🦴', guide:'' },

    // ============================================================
    // 骨科康复 —— 髋关节（APTA Hip CPG）
    // ============================================================
    '髋关节疼痛':     { specialty:'orthopedic', diagnosis:'hip',         label:'髋关节疼痛',               icon:'🦴', guide:'中国髋OA诊疗指南' },
    '髋关节术后':     { specialty:'orthopedic', diagnosis:'hip',         label:'髋关节术后康复',           icon:'🦴', guide:'' },
    '全髋关节置换':   { specialty:'orthopedic', diagnosis:'thr',         label:'全髋关节置换术后',         icon:'🦴', guide:'AAOS THA康复指南' },
    'THR':            { specialty:'orthopedic', diagnosis:'thr',         label:'全髋关节置换术后',         icon:'🦴', guide:'' },
    '股骨头坏死':     { specialty:'orthopedic', diagnosis:'avn',         label:'股骨头坏死',               icon:'🦴', guide:'中国股骨头坏死诊疗指南' },
    '髋OA':           { specialty:'orthopedic', diagnosis:'hipOA',      label:'髋关节骨性关节炎',         icon:'🦴', guide:'' },

    // ============================================================
    // 骨科康复 —— 肩关节（APTA Shoulder CPG）
    // ============================================================
    '肩关节疼痛':     { specialty:'orthopedic', diagnosis:'shoulder',    label:'肩关节疼痛',               icon:'🦴', guide:'APTA Shoulder CPG' },
    '肩痛':           { specialty:'orthopedic', diagnosis:'shoulder',    label:'肩关节疼痛',               icon:'🦴', guide:'' },
    '肩周炎':         { specialty:'orthopedic', diagnosis:'frozenShoulder', label:'肩周炎（冻结肩）',       icon:'🦴', guide:'冻结肩诊疗指南' },
    '冻结肩':         { specialty:'orthopedic', diagnosis:'frozenShoulder', label:'肩周炎（冻结肩）',       icon:'🦴', guide:'' },
    '肩袖损伤':       { specialty:'orthopedic', diagnosis:'rotatorCuff', label:'肩袖损伤',               icon:'🦴', guide:'APTA Rotator Cuff CPG' },
    '肩袖撕裂':       { specialty:'orthopedic', diagnosis:'rotatorCuff', label:'肩袖撕裂',               icon:'🦴', guide:'' },
    '肩袖修补':       { specialty:'orthopedic', diagnosis:'rotatorCuff', label:'肩袖修补术后',             icon:'🦴', guide:'' },
    '肩峰撞击综合征': { specialty:'orthopedic', diagnosis:'impingement', label:'肩峰撞击综合征',         icon:'🦴', guide:'' },
    '肩关节脱位':     { specialty:'orthopedic', diagnosis:'shoulderDisloc', label:'肩关节脱位/不稳',       icon:'🦴', guide:'' },

    // ============================================================
    // 骨科康复 —— 肘关节
    // ============================================================
    '肘关节疼痛':     { specialty:'orthopedic', diagnosis:'elbow',       label:'肘关节疼痛',               icon:'🦴', guide:'' },
    '网球肘':         { specialty:'orthopedic', diagnosis:'tennisElbow', label:'网球肘（外上髁炎）',     icon:'🦴', guide:'网球肘诊疗指南' },
    '高尔夫球肘':     { specialty:'orthopedic', diagnosis:'golfElbow',   label:'高尔夫球肘（内上髁炎）', icon:'🦴', guide:'' },
    '肘关节僵硬':     { specialty:'orthopedic', diagnosis:'elbowStiff',  label:'肘关节僵硬/活动受限',     icon:'🦴', guide:'' },

    // ============================================================
    // 骨科康复 —— 腕关节
    // ============================================================
    '腕关节痛':       { specialty:'orthopedic', diagnosis:'wrist',       label:'腕关节疼痛',               icon:'🦴', guide:'' },
    '腕关节术后':     { specialty:'orthopedic', diagnosis:'wrist',       label:'腕关节术后康复',           icon:'🦴', guide:'' },
    '腕管综合征':     { specialty:'orthopedic', diagnosis:'carpalTunnel', label:'腕管综合征（鼠标手）',   icon:'🦴', guide:'腕管综合征诊疗指南' },
    '鼠标手':         { specialty:'orthopedic', diagnosis:'carpalTunnel', label:'腕管综合征（鼠标手）',   icon:'🦴', guide:'' },
    '腱鞘炎':         { specialty:'orthopedic', diagnosis:'hand',        label:'腱鞘炎（狭窄性腱鞘炎）', icon:'🖐️', guide:'手OA诊疗指南2024' },
    '桡骨茎突腱鞘炎': { specialty:'orthopedic', diagnosis:'deQuervain',  label:'桡骨茎突狭窄性腱鞘炎',   icon:'🖐️', guide:'' },
    'de Quervain':    { specialty:'orthopedic', diagnosis:'deQuervain',  label:'桡骨茎突狭窄性腱鞘炎',   icon:'🖐️', guide:'' },
    '妈妈手':         { specialty:'orthopedic', diagnosis:'deQuervain',  label:'桡骨茎突狭窄性腱鞘炎',   icon:'🖐️', guide:'' },
    '扳机指':         { specialty:'orthopedic', diagnosis:'triggerFinger', label:'扳机指（狭窄性腱鞘炎）', icon:'🖐️', guide:'' },

    // ============================================================
    // 骨科康复 —— 踝关节（APTA Ankle CPG）
    // ============================================================
    '踝关节痛':       { specialty:'orthopedic', diagnosis:'ankle',       label:'踝关节疼痛',               icon:'🦴', guide:'APTA Ankle CPG' },
    '踝关节术后':     { specialty:'orthopedic', diagnosis:'ankle',       label:'踝关节术后康复',           icon:'🦴', guide:'' },
    '踝关节扭伤':     { specialty:'orthopedic', diagnosis:'ankleSprain', label:'踝关节扭伤',               icon:'🦴', guide:'踝关节扭伤诊疗指南' },
    '足跟痛':         { specialty:'orthopedic', diagnosis:'heel',        label:'足跟痛（跖筋膜炎）',     icon:'🦴', guide:'跖筋膜炎诊疗指南' },
    '跖筋膜炎':       { specialty:'orthopedic', diagnosis:'heel',        label:'足跟痛（跖筋膜炎）',     icon:'🦴', guide:'' },
    '跟腱炎':         { specialty:'orthopedic', diagnosis:'achilles',    label:'跟腱炎',                 icon:'🦴', guide:'APTA Achilles CPG' },
    '跟腱断裂':       { specialty:'orthopedic', diagnosis:'achilles',    label:'跟腱断裂术后',             icon:'🦴', guide:'' },
    '扁平足':         { specialty:'orthopedic', diagnosis:'flatFoot',    label:'扁平足/足部力线异常',     icon:'🦴', guide:'' },
    '拇外翻':         { specialty:'orthopedic', diagnosis:'hallux',      label:'拇外翻',                 icon:'🦴', guide:'拇外翻诊疗指南' },

    // ============================================================
    // 腰椎病康复（《诊断学》症状学：腰背痛）
    // 对应《康复评定学》腰椎功能评估
    // ============================================================
    '腰痛':           { specialty:'lumbar',     diagnosis:'lumbar',      label:'腰痛/腰椎病',             icon:'🦴', guide:'APTA LBP CPG;中国腰痛诊疗指南2023' },
    '腰椎间盘突出':     { specialty:'lumbar',     diagnosis:'lumbar',      label:'腰椎间盘突出症',             icon:'🦴', guide:'' },
    '腿麻':           { specialty:'lumbar',     diagnosis:'lumbar',      label:'腰椎病（神经根压迫）',   icon:'🦴', guide:'' },
    '下肢麻木':       { specialty:'lumbar',     diagnosis:'lumbar',      label:'腰椎病（神经根压迫）',   icon:'🦴', guide:'' },
    '坐骨神经痛':     { specialty:'lumbar',     diagnosis:'lumbar',      label:'腰椎间盘突出症',             icon:'🦴', guide:'' },
    '腰部疼痛':       { specialty:'lumbar',     diagnosis:'lumbar',      label:'腰痛/腰椎病',             icon:'🦴', guide:'' },
    '腰疼':           { specialty:'lumbar',     diagnosis:'lumbar',      label:'腰痛/腰椎病',             icon:'🦴', guide:'' },
    '腰椎管狭窄':     { specialty:'lumbar',     diagnosis:'lumbarStenosis', label:'腰椎管狭窄症',         icon:'🦴', guide:'腰椎管狭窄症诊疗指南' },
    '腰椎滑脱':       { specialty:'lumbar',     diagnosis:'spondylolisthesis', label:'腰椎滑脱症',         icon:'🦴', guide:'' },
    '腰肌劳损':       { specialty:'lumbar',     diagnosis:'lumbar',      label:'腰肌劳损',                 icon:'🦴', guide:'' },
    '间歇性跛行':     { specialty:'lumbar',     diagnosis:'lumbarStenosis', label:'腰椎管狭窄（间歇性跛行）', icon:'🦴', guide:'' },
    '马尾综合征':     { specialty:'lumbar',     diagnosis:'caudaEquina', label:'马尾综合征（急诊手术！）',icon:'🦴', guide:'马尾综合征诊疗急诊指南' },

    // ============================================================
    // 手/上肢外科康复（基于《诊断学》"关节痛"上肢部分）
    // ============================================================
    '拇指关节疼痛':   { specialty:'hand',        diagnosis:'hand',        label:'拇指/手指关节疼痛',       icon:'🖐️', guide:'手OA诊疗指南2024' },
    '拇指疼':         { specialty:'hand',        diagnosis:'hand',        label:'拇指/手指关节疼痛',       icon:'🖐️', guide:'' },
    '大拇指疼':       { specialty:'hand',        diagnosis:'hand',        label:'拇指/手指关节疼痛',       icon:'🖐️', guide:'' },
    '手指关节疼痛':   { specialty:'hand',        diagnosis:'hand',        label:'手指关节疼痛/骨关节炎',     icon:'🖐️', guide:'' },
    '手指疼':         { specialty:'hand',        diagnosis:'hand',        label:'手指关节疼痛',             icon:'🖐️', guide:'' },
    '手指关节疼':     { specialty:'hand',        diagnosis:'hand',        label:'手指关节疼痛/骨关节炎',     icon:'🖐️', guide:'' },
    '手腕疼':         { specialty:'hand',        diagnosis:'hand',        label:'手腕/手部疼痛',           icon:'🖐️', guide:'' },
    '腕关节疼痛':     { specialty:'hand',        diagnosis:'hand',        label:'腕关节疼痛',               icon:'🖐️', guide:'' },
    '手骨关节炎':     { specialty:'hand',        diagnosis:'handOA',      label:'手骨关节炎（OA）',        icon:'🖐️', guide:'中国OA诊疗指南2024' },
    '手部骨关节炎':   { specialty:'hand',        diagnosis:'handOA',      label:'手骨关节炎（OA）',        icon:'🖐️', guide:'' },
    '类风湿关节炎手':   { specialty:'hand',        diagnosis:'raHand',      label:'类风湿关节炎（手）',       icon:'🖐️', guide:'中国RA诊疗指南2024' },
    '类风关手':       { specialty:'hand',        diagnosis:'raHand',      label:'类风湿关节炎（手）',       icon:'🖐️', guide:'' },
    '痛风性关节炎':   { specialty:'hand',        diagnosis:'goutHand',    label:'痛风性关节炎（手）',       icon:'🖐️', guide:'中国痛风诊疗指南2024' },
    '痛风手':         { specialty:'hand',        diagnosis:'goutHand',    label:'痛风性关节炎（手）',       icon:'🖐️', guide:'' },

    // ============================================================
    // 儿童康复（《康复评定学》+ 中国脑性瘫痪康复指南）
    // ============================================================
    '脑瘫':           { specialty:'pediatric', diagnosis:'cp',           label:'脑性瘫痪（CP）',          icon:'👶', guide:'中国脑性瘫痪康复指南' },
    '脑性瘫痪':       { specialty:'pediatric', diagnosis:'cp',           label:'脑性瘫痪（CP）',          icon:'👶', guide:'' },
    '发育迟缓':       { specialty:'pediatric', diagnosis:'delay',       label:'发育迟缓',                 icon:'👶', guide:'中国儿童发育迟缓诊疗指南' },
    '小儿麻痹症':     { specialty:'pediatric', diagnosis:'polio',       label:'脊髓灰质炎后遗症',         icon:'👶', guide:'' },

    // ============================================================
    // 老年康复（《康复评定学》+ AGS Falls Guideline）
    // ============================================================
    '跌倒':           { specialty:'geriatric', diagnosis:'fall',         label:'跌倒/跌倒风险',           icon:'🧓', guide:'AGS Falls Guideline' },
    '肌少症':         { specialty:'geriatric', diagnosis:'sarcopenia',  label:'肌少症',                 icon:'🧓', guide:'中国肌少症诊疗指南2023' },
    '骨质疏松':       { specialty:'geriatric', diagnosis:'osteoporosis', label:'骨质疏松症',               icon:'🧓', guide:'中国骨质疏松诊疗指南2024' },
    '老年痴呆':       { specialty:'geriatric', diagnosis:'dementia',    label:'老年痴呆/阿尔茨海默病',   icon:'🧓', guide:'中国痴呆诊疗指南' },
    '阿尔茨海默病':   { specialty:'geriatric', diagnosis:'dementia',    label:'阿尔茨海默病',             icon:'🧓', guide:'' },

    // ============================================================
    // 重症康复（ICU Rehabilitation）
    // ============================================================
    'ICU康复':        { specialty:'critical', diagnosis:'icuRehab',    label:'ICU早期康复/重症康复',    icon:'🏥', guide:'ICU患者早期活动与康复临床实践指南' },
    '呼吸机依赖':     { specialty:'critical', diagnosis:'ventDependency', label:'呼吸机依赖/脱机困难',     icon:'🏥', guide:'中国机械通气脱机指南' },
    '气管切开':       { specialty:'critical', diagnosis:'trach',        label:'气管切开术后康复',         icon:'🏥', guide:'气管切开患者康复指南' },
  },

  // ============================================================
  // 二、专科描述（用于搜索结果页提示）
  // ============================================================
  _description: {
    'neurologic':    '神经康复（脑卒中、脊髓损伤、帕金森病、周围神经损伤等）\n依据：《中国脑卒中早期康复治疗指南》（2017）、《中国帕金森病康复指南》（2018）、AHA/ASA Stroke Rehab (2022)',
    'orthopedic':    '骨科康复（关节置换、韧带重建、半月板修复、骨折术后等）\n依据：APTA骨科分会CPGs（2020-2024）、AAOS临床实践指南、ACSM第11版',
    'cervical':      '颈椎病康复（神经根型/脊髓型）\n依据：《中国颈椎病诊疗指南》（2018，中华医学会骨科学分会）',
    'cervicalMyelopathy': '脊髓型颈椎病康复（需优先就医！）\n依据：《中国颈椎病诊疗指南》（2018）',
    'lumbar':        '腰痛/腰椎间盘突出症康复\n依据：《中国腰痛诊疗指南》（2023，中华医学会疼痛学分会）、APTA LBP CPG',
    'hand':          '手/上肢康复（OA、腱鞘炎、腕管综合征、类风关等）\n依据：《中国骨关节炎诊疗指南》（2024）、ACSM第11版',
    'cardiopulmonary':'心肺康复（COPD、心梗后、心衰、CABG术后、新冠后）\n依据：GOLD (2024)、AACVPR《心脏康复核心组件》(2024)、中国冠心病运动治疗共识',
    'pediatric':     '儿童康复（脑瘫、发育迟缓等）\n依据：《中国脑性瘫痪康复指南》、GMFM评估标准',
    'geriatric':     '老年康复（肌少症、跌倒、骨质疏松、认知障碍）\n依据：AGS Falls Guideline、中国肌少症诊疗指南（2023）',
    'critical':      '重症康复（ICU早期活动、呼吸机脱机、气管切开康复）\n依据：《ICU患者早期活动与康复临床实践指南》',
    'fever':         '发热查因，建议感染科/呼吸科就诊',
    'gi':            '消化系统症状，建议消化科就诊',
    'gu':            '泌尿系统症状，建议泌尿科就诊',
    'endocrine':     '内分泌代谢症状，建议内分泌科就诊',
    'heme':          '血液系统症状，建议血液科就诊',
    'rheum':         '风湿免疫症状，建议风湿免疫科就诊',
    'psych':          '精神心理症状，建议精神科/心理科就诊',
  },

  // ============================================================
  // 三、搜索匹配（支持模糊匹配）
  // 策略：双向包含 → 分词匹配 → 最长公共子串（模糊容错）
  // ============================================================
  matchSymptoms: function(keyword) {
    if (!keyword) return [];
    // 统一「疼/痛」用法，减少词条覆盖压力
    var k = keyword.toLowerCase().replace(/疼/g, '痛').trim();
    var matched = [];
    var seen = {};

    for (var key in this.symptomMap) {
      if (!this.symptomMap.hasOwnProperty(key)) continue;
      var keyLower = key.toLowerCase();
      var isMatch = false;

      // 方式1：搜索词和 key 互相包含
      if (k.indexOf(keyLower) !== -1 || keyLower.indexOf(k) !== -1) { isMatch = true; }

      // 方式2：分词匹配（简单空格/标点分割）
      if (!isMatch) {
        var parts = k.split(/[\s,，。、;；]+/);
        for (var i = 0; i < parts.length; i++) {
          if (parts[i].length >= 2 && keyLower.indexOf(parts[i]) !== -1) {
            isMatch = true;
            break;
          }
        }
      }

      // 方式3：单字重叠匹配（至少2字重叠）
      if (!isMatch && k.length >= 2) {
        for (var j = 0; j <= k.length - 2; j++) {
          if (keyLower.indexOf(k.substring(j, j + 2)) !== -1) {
            isMatch = true;
            break;
          }
        }
      }

      // 方式4：最长公共子串（模糊容错）
      if (!isMatch) {
        var lcsLen = 0;
        for (var a = 0; a <= k.length - 2; a++) {
          for (var len = 2; len <= k.length - a; len++) {
            if (keyLower.indexOf(k.substring(a, a + len)) !== -1) {
              if (len > lcsLen) lcsLen = len;
            }
          }
        }
        if (lcsLen >= 3 || (lcsLen >= 2 && keyLower.length <= 4)) isMatch = true;
      }

      if (isMatch) {
        var item = this.symptomMap[key];
        var key2 = item.specialty + '|' + item.diagnosis;
        if (!seen[key2]) {
          seen[key2] = true;
          matched.push({
            keyword: key,
            specialty: item.specialty,
            diagnosis: item.diagnosis,
            label: item.label,
            icon: item.icon,
            guide: item.guide || ''
          });
        }
      }
    }
    return matched;
  }
};

// 显式挂载到 window，确保后续 <script> 标签可以访问
window.DiagnosisTree = DiagnosisTree;
