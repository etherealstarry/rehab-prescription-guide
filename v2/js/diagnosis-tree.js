// diagnosis-tree.js — 症状/疾病名匹配 + 决策树
const DiagnosisTree = {
  // 症状/疾病关键词 → 专科方向映射
  symptomMap: {
    // ===== 神经康复 =====
    '手麻':           { specialty:'neurologic', diagnosis:'stroke',      label:'手麻/一侧肢体麻木',   icon:'🧠' },
    '一侧肢体无力':   { specialty:'neurologic', diagnosis:'stroke',      label:'一侧肢体无力',         icon:'🧠' },
    '口角歪斜':       { specialty:'neurologic', diagnosis:'stroke',      label:'口角歪斜',             icon:'🧠' },
    '言语不清':       { specialty:'neurologic', diagnosis:'stroke',      label:'言语不清',             icon:'🧠' },
    '脑卒中':         { specialty:'neurologic', diagnosis:'stroke',      label:'脑卒中',               icon:'🧠' },
    '中风':           { specialty:'neurologic', diagnosis:'stroke',      label:'脑卒中（中风）',       icon:'🧠' },
    '脑梗死':         { specialty:'neurologic', diagnosis:'stroke',      label:'脑卒中（脑梗死）',     icon:'🧠' },
    '脑出血':         { specialty:'neurologic', diagnosis:'stroke',      label:'脑卒中（脑出血）',     icon:'🧠' },
    '卒中':           { specialty:'neurologic', diagnosis:'stroke',      label:'脑卒中（卒中）',       icon:'🧠' },
    '偏瘫':           { specialty:'neurologic', diagnosis:'stroke',      label:'脑卒中后偏瘫',         icon:'🧠' },
    '半身不遂':       { specialty:'neurologic', diagnosis:'stroke',      label:'脑卒中后偏瘫',         icon:'🧠' },
    '脊髓损伤':       { specialty:'neurologic', diagnosis:'sci',         label:'脊髓损伤',             icon:'🧠' },
    '截瘫':           { specialty:'neurologic', diagnosis:'sci',         label:'脊髓损伤（截瘫）',     icon:'🧠' },
    '四肢瘫':         { specialty:'neurologic', diagnosis:'sci',         label:'脊髓损伤（四肢瘫）',   icon:'🧠' },
    '帕金森':         { specialty:'neurologic', diagnosis:'parkinson',   label:'帕金森病',             icon:'🧠' },
    '手抖':           { specialty:'neurologic', diagnosis:'parkinson',   label:'手抖/动作缓慢',       icon:'🧠' },
    '动作缓慢':       { specialty:'neurologic', diagnosis:'parkinson',   label:'动作缓慢',             icon:'🧠' },
    '步履小碎':       { specialty:'neurologic', diagnosis:'parkinson',   label:'帕金森步态异常',       icon:'🧠' },
    '周围神经病变':     { specialty:'neurologic', diagnosis:'peripheral',  label:'周围神经病变',         icon:'🧠' },
    '面瘫':           { specialty:'neurologic', diagnosis:'peripheral',  label:'面瘫/周围神经病变',   icon:'🧠' },
    '糖尿病足':       { specialty:'neurologic', diagnosis:'peripheral',  label:'周围神经病变',         icon:'🧠' },

    // ===== 骨科康复 =====
    '膝关节疼痛':     { specialty:'orthopedic', diagnosis:'acl',        label:'膝关节问题',           icon:'🦴' },
    '膝盖疼痛':       { specialty:'orthopedic', diagnosis:'acl',        label:'膝关节问题',           icon:'🦴' },
    '打软腿':         { specialty:'orthopedic', diagnosis:'acl',        label:'膝关节问题（打软腿）', icon:'🦴' },
    '前交叉韧带':     { specialty:'orthopedic', diagnosis:'acl',        label:'前交叉韧带重建术后',   icon:'🦴' },
    '前交叉韧带重建':   { specialty:'orthopedic', diagnosis:'acl',        label:'前交叉韧带重建术后',   icon:'🦴' },
    'ACL':            { specialty:'orthopedic', diagnosis:'acl',        label:'前交叉韧带重建术后',   icon:'🦴' },
    '膝关节术后':     { specialty:'orthopedic', diagnosis:'acl',        label:'膝关节术后康复',       icon:'🦴' },
    '膝盖手术后':     { specialty:'orthopedic', diagnosis:'acl',        label:'膝关节术后康复',       icon:'🦴' },
    '膝关节手术':     { specialty:'orthopedic', diagnosis:'acl',        label:'膝关节术后康复',       icon:'🦴' },
    '半月板':         { specialty:'orthopedic', diagnosis:'meniscus',   label:'半月板损伤/术后',     icon:'🦴' },
    '半月板手术':     { specialty:'orthopedic', diagnosis:'meniscus',   label:'半月板术后康复',       icon:'🦴' },
    '半月板缝合':     { specialty:'orthopedic', diagnosis:'meniscus',   label:'半月板术后康复',       icon:'🦴' },
    '肩关节疼痛':     { specialty:'orthopedic', diagnosis:'rotator',     label:'肩关节问题',           icon:'🦴' },
    '肩痛':           { specialty:'orthopedic', diagnosis:'rotator',     label:'肩关节问题',           icon:'🦴' },
    '抬臂困难':       { specialty:'orthopedic', diagnosis:'rotator',     label:'肩袖损伤/术后',       icon:'🦴' },
    '肩周炎':         { specialty:'orthopedic', diagnosis:'rotator',     label:'肩关节问题',           icon:'🦴' },
    '肩袖手术':       { specialty:'orthopedic', diagnosis:'rotator',     label:'肩袖术后康复',         icon:'🦴' },
    '肩袖修复':       { specialty:'orthopedic', diagnosis:'rotator',     label:'肩袖术后康复',         icon:'🦴' },
    '肩关节术后':     { specialty:'orthopedic', diagnosis:'rotator',     label:'肩关节术后康复',       icon:'🦴' },
    '髋关节置换':     { specialty:'orthopedic', diagnosis:'thr',        label:'全髋关节置换术后',     icon:'🦴' },
    '人工髋关节':     { specialty:'orthopedic', diagnosis:'thr',        label:'全髋关节置换术后',     icon:'🦴' },
    '髋关节术后':     { specialty:'orthopedic', diagnosis:'thr',        label:'髋关节置换术后',       icon:'🦴' },
    '髋关节手术':     { specialty:'orthopedic', diagnosis:'thr',        label:'髋关节置换术后',       icon:'🦴' },
    '膝关节置换':     { specialty:'orthopedic', diagnosis:'tkr',        label:'全膝关节置换术后',     icon:'🦴' },
    '人工膝关节':     { specialty:'orthopedic', diagnosis:'tkr',        label:'全膝关节置换术后',     icon:'🦴' },
    '膝关节置换术后':   { specialty:'orthopedic', diagnosis:'tkr',        label:'全膝关节置换术后',     icon:'🦴' },
    '换膝盖':         { specialty:'orthopedic', diagnosis:'tkr',        label:'全膝关节置换术后',     icon:'🦴' },
    '换关节':         { specialty:'orthopedic', diagnosis:'tkr',        label:'关节置换术后',         icon:'🦴' },

    // ===== 心肺康复 =====
    '气喘':           { specialty:'cardiopulmonary', diagnosis:'copd',  label:'气喘/呼吸困难',       icon:'🫀' },
    '呼吸困难':       { specialty:'cardiopulmonary', diagnosis:'copd',  label:'呼吸困难',             icon:'🫀' },
    '慢阻肺':         { specialty:'cardiopulmonary', diagnosis:'copd',  label:'慢性阻塞性肺病',       icon:'🫀' },
    'COPD':           { specialty:'cardiopulmonary', diagnosis:'copd',  label:'慢性阻塞性肺病',       icon:'🫀' },
    '慢性支气管炎':     { specialty:'cardiopulmonary', diagnosis:'copd',  label:'慢性阻塞性肺病',       icon:'🫀' },
    '肺气肿':         { specialty:'cardiopulmonary', diagnosis:'copd',  label:'慢性阻塞性肺病',       icon:'🫀' },
    '急性心肌梗死':     { specialty:'cardiopulmonary', diagnosis:'mi',    label:'急性心肌梗死',         icon:'🫀' },
    '心梗':           { specialty:'cardiopulmonary', diagnosis:'mi',    label:'急性心肌梗死',         icon:'🫀' },
    '心力衰竭':       { specialty:'cardiopulmonary', diagnosis:'heartFailure', label:'心力衰竭',   icon:'🫀' },
    '心衰':           { specialty:'cardiopulmonary', diagnosis:'heartFailure', label:'心力衰竭',   icon:'🫀' },
    '冠脉搭桥':       { specialty:'cardiopulmonary', diagnosis:'cabg',  label:'冠脉搭桥术后',         icon:'🫀' },
    'CABG':          { specialty:'cardiopulmonary', diagnosis:'cabg',  label:'冠脉搭桥术后',         icon:'🫀' },
    '心脏搭桥':       { specialty:'cardiopulmonary', diagnosis:'cabg',  label:'冠脉搭桥术后',         icon:'🫀' },
    '心脏手术':       { specialty:'cardiopulmonary', diagnosis:'cabg',  label:'心脏术后康复',         icon:'🫀' },
    '新冠后':         { specialty:'cardiopulmonary', diagnosis:'postCovid', label:'新冠后康复',   icon:'🫀' },
    'Long COVID':     { specialty:'cardiopulmonary', diagnosis:'postCovid', label:'新冠后康复',   icon:'🫀' },
    '新冠后遗症':     { specialty:'cardiopulmonary', diagnosis:'postCovid', label:'新冠后康复',   icon:'🫀' },
  },

  // 最长公共子串长度（用于模糊匹配）
  _lcs: function(a, b) {
    var m = a.length, n = b.length;
    if (m === 0 || n === 0) return 0;
    var dp = [];
    var max = 0;
    for (var i = 0; i <= m; i++) dp[i] = [];
    for (var i = 0; i <= m; i++) {
      for (var j = 0; j <= n; j++) {
        if (i === 0 || j === 0) { dp[i][j] = 0; }
        else if (a[i-1] === b[j-1]) {
          dp[i][j] = dp[i-1][j-1] + 1;
          if (dp[i][j] > max) max = dp[i][j];
        } else {
          dp[i][j] = 0;
        }
      }
    }
    return max;
  },

  matchSymptoms: function(keyword) {
    if (!keyword) return [];
    var k = keyword.toLowerCase();
    var matched = [];
    var seen = {};

    // 分词：按空格、标点、常见中文分隔符拆分
    var tokens = k.split(/[\s,，。、;；!！?？、]+/).filter(function(t) { return t.length > 0; });

    for (var key in this.symptomMap) {
      if (!this.symptomMap.hasOwnProperty(key)) continue;
      var keyLower = key.toLowerCase();
      var isMatch = false;

      // 方式1：搜索词包含 key（如搜"膝关节术后疼痛"含"膝关节术后"）
      if (k.indexOf(keyLower) !== -1) isMatch = true;

      // 方式2：key 包含搜索词任一分词（如 key="膝关节术后" 含分词"膝关节"）
      if (!isMatch) {
        for (var i = 0; i < tokens.length; i++) {
          if (keyLower.indexOf(tokens[i]) !== -1 && tokens[i].length >= 2) {
            isMatch = true;
            break;
          }
        }
      }

      // 方式3：搜索词分词后，任一词包含 key（如分词"术后"含key"术后"）
      if (!isMatch) {
        for (var i = 0; i < tokens.length; i++) {
          if (tokens[i].indexOf(keyLower) !== -1 && keyLower.length >= 2) {
            isMatch = true;
            break;
          }
        }
      }

      // 方式4：模糊匹配——最长公共子串 ≥ 2（如"关节术后"和"膝关节术后"）
      if (!isMatch) {
        if (this._lcs(k, keyLower) >= 2) isMatch = true;
      }

      if (isMatch) {
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
      'rotator':     '肩袖修复术后康复，基于 AAOS/ASES 指南',
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
