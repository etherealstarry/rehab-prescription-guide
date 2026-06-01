// diagnosis-tree.js — 症状匹配 + 决策树
const DiagnosisTree = {
  // 症状关键词 → 专科方向映射
  symptomMap: {
    '手麻':      { specialty:'neurologic',  diagnosis:'stroke',      label:'手麻/一侧肢体麻木', icon:'🧠' },
    '一侧肢体无力': { specialty:'neurologic',  diagnosis:'stroke',      label:'一侧肢体无力',       icon:'🧠' },
    '口角歪斜':   { specialty:'neurologic',  diagnosis:'stroke',      label:'口角歪斜',           icon:'🧠' },
    '言语不清':   { specialty:'neurologic',  diagnosis:'stroke',      label:'言语不清',           icon:'🧠' },
    '脑卒中':     { specialty:'neurologic',  diagnosis:'stroke',      label:'脑卒中',             icon:'🧠' },
    '中风':       { specialty:'neurologic',  diagnosis:'stroke',      label:'脑卒中（中风）',     icon:'🧠' },
    '脊髓损伤':   { specialty:'neurologic',  diagnosis:'sci',         label:'脊髓损伤',           icon:'🧠' },
    '帕金森':     { specialty:'neurologic',  diagnosis:'parkinson',   label:'帕金森病',           icon:'🧠' },
    '手抖':       { specialty:'neurologic',  diagnosis:'parkinson',   label:'手抖/动作缓慢',     icon:'🧠' },
    '动作缓慢':   { specialty:'neurologic',  diagnosis:'parkinson',   label:'动作缓慢',           icon:'🧠' },
    '周围神经病变': { specialty:'neurologic', diagnosis:'peripheral',  label:'周围神经病变',       icon:'🧠' },

    '膝关节疼痛': { specialty:'orthopedic', diagnosis:'acl',          label:'膝关节问题',         icon:'🦴' },
    '膝盖疼痛':   { specialty:'orthopedic', diagnosis:'acl',          label:'膝关节问题',         icon:'🦴' },
    '打软腿':     { specialty:'orthopedic', diagnosis:'acl',          label:'膝关节问题（打软腿）', icon:'🦴' },
    '前交叉韧带': { specialty:'orthopedic', diagnosis:'acl',          label:'前交叉韧带重建术后', icon:'🦴' },
    'ACL':        { specialty:'orthopedic', diagnosis:'acl',          label:'前交叉韧带重建术后', icon:'🦴' },
    '半月板':     { specialty:'orthopedic', diagnosis:'meniscus',     label:'半月板损伤/术后',   icon:'🦴' },
    '肩关节疼痛': { specialty:'orthopedic', diagnosis:'rotator',     label:'肩关节问题',         icon:'🦴' },
    '抬臂困难':   { specialty:'orthopedic', diagnosis:'rotator',     label:'肩袖损伤/术后',     icon:'🦴' },
    '髋关节置换': { specialty:'orthopedic', diagnosis:'thr',          label:'全髋关节置换术后',   icon:'🦴' },
    '膝关节置换': { specialty:'orthopedic', diagnosis:'tkr',          label:'全膝关节置换术后',   icon:'🦴' },

    '气喘':       { specialty:'cardiopulmonary', diagnosis:'copd',  label:'气喘/呼吸困难',     icon:'🫀' },
    '呼吸困难':   { specialty:'cardiopulmonary', diagnosis:'copd',  label:'呼吸困难',           icon:'🫀' },
    '慢阻肺':     { specialty:'cardiopulmonary', diagnosis:'copd',  label:'慢性阻塞性肺病',     icon:'🫀' },
    'COPD':       { specialty:'cardiopulmonary', diagnosis:'copd',  label:'慢性阻塞性肺病',     icon:'🫀' },
    '急性心肌梗死': { specialty:'cardiopulmonary', diagnosis:'mi',    label:'急性心肌梗死',       icon:'🫀' },
    '心梗':       { specialty:'cardiopulmonary', diagnosis:'mi',    label:'急性心肌梗死',       icon:'🫀' },
    '心力衰竭':   { specialty:'cardiopulmonary', diagnosis:'heartFailure', label:'心力衰竭',     icon:'🫀' },
    '心衰':       { specialty:'cardiopulmonary', diagnosis:'heartFailure', label:'心力衰竭',     icon:'🫀' },
    '冠脉搭桥':   { specialty:'cardiopulmonary', diagnosis:'cabg',  label:'冠脉搭桥术后',       icon:'🫀' },
    'CABG':      { specialty:'cardiopulmonary', diagnosis:'cabg',  label:'冠脉搭桥术后',       icon:'🫀' },
    '新冠后':     { specialty:'cardiopulmonary', diagnosis:'postCovid', label:'新冠后康复',     icon:'🫀' },
    'Long COVID': { specialty:'cardiopulmonary', diagnosis:'postCovid', label:'新冠后康复',     icon:'🫀' },
  },

  matchSymptoms: function(keyword) {
    if (!keyword) return [];
    var k = keyword.toLowerCase();
    var matched = [];
    var seen = {};
    for (var key in this.symptomMap) {
      if (k.indexOf(key.toLowerCase()) !== -1) {
        var m = this.symptomMap[key];
        var id = m.specialty + '-' + m.diagnosis;
        if (!seen[id]) {
          seen[id] = true;
          matched.push({
            specialty: m.specialty,
            diagnosis: m.diagnosis,
            label: m.label,
            icon: m.icon,
            evidenceLevel: m.specialty === 'neurologic' ? 'A' : 'B',
            description: this._description(m.specialty, m.diagnosis)
          });
        }
      }
    }
    return matched;
  },

  _description: function(specialty, diagnosis) {
    var desc = {
      'stroke':      '脑卒中后运动功能障碍的康复处方，基于《中国脑卒中早期康复治疗指南》',
      'sci':         '脊髓损伤后运动功能重建，基于 ASIA 康复指南',
      'parkinson':   '帕金森病运动症状管理，基于 MDS 临床实践指南',
      'peripheral':  '周围神经病变感觉运动训练，基于 APTA 临床指南',
      'acl':         '前交叉韧带重建术后康复，基于 ACSM 运动处方指南',
      'meniscus':    '半月板损伤修复术后康复，基于 AAOS 临床实践指南',
      'rotator':     '肩袖修复术后康复，基于 AAOS/ASCO 指南',
      'thr':         '全髋关节置换术后康复，基于 AAOS/HCOA 指南',
      'tkr':         '全膝关节置换术后康复，基于 AAOS/HCOA 指南',
      'copd':        '慢性阻塞性肺病运动康复，基于 GOLD 指南 & ATS/ACCP 声明',
      'mi':          '急性心肌梗死后心脏康复，基于 AACVPR 核心组件',
      'heartFailure': '心力衰竭运动康复，基于 AHA/ACC/HFSA 心衰指南',
      'cabg':        '冠脉搭桥术后康复，基于 AACVPR 核心组件',
      'postCovid':   '新冠后功能障碍康复，基于 WHO 新冠康复指导',
    };
    return desc[diagnosis] || '标准化康复评估与处方生成';
  }
};
