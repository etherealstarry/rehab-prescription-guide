/**
 * diagnosis-tree.js - 诊断决策树引擎（简化版）
 * 根据症状输入，返回匹配的结果
 */

const DiagnosisTree = (function() {
  
  /**
   * 症状 → 可能的疾病映射
   * key: 症状关键词（模糊匹配）
   * value: { specialty, label, icon, evidenceLevel }
   */
  const SYMPTOM_MAP = {
    // 神经康复
    '脑卒中|中风|偏瘫|半身不遂|一侧无力|面瘫|言语不清': {
      specialty: 'neurologic',
      label: '脑卒中',
      icon: '🧠',
      evidenceLevel: 'A'
    },
    '手麻|手指麻|手掌麻|胳膊麻|手臂麻|上肢麻': {
      specialty: 'hand',
      label: '手麻/手指麻木',
      icon: '✋',
      evidenceLevel: 'A'
    },
    '帕金森|手抖|震颤|动作慢|僵硬|小碎步': {
      specialty: 'neurologic',
      label: '帕金森病',
      icon: '🚶',
      evidenceLevel: 'A'
    },
    
    // 骨科康复
    '膝痛|膝盖痛|膝关节痛|膝部疼痛': {
      specialty: 'knee',
      label: '膝痛',
      icon: '🦵',
      evidenceLevel: 'A'
    },
    '肩痛|肩膀痛|肩部疼痛|肩袖|肩周炎': {
      specialty: 'shoulder',
      label: '肩痛',
      icon: '🦾',
      evidenceLevel: 'A'
    },
    '腰痛|腰疼|腰部疼痛|下腰痛': {
      specialty: 'lumbar',
      label: '腰痛',
      icon: '🦴',
      evidenceLevel: 'A'
    },
    '颈痛|脖子痛|颈部疼痛|颈椎病': {
      specialty: 'cervical',
      label: '颈痛',
      icon: '🦴',
      evidenceLevel: 'A'
    },
    '踝痛|脚踝痛|踝关节痛': {
      specialty: 'ankle',
      label: '踝痛',
      icon: '🦶',
      evidenceLevel: 'A'
    },
    '足痛|脚痛|足底痛|脚底痛|足跟痛': {
      specialty: 'foot',
      label: '足痛',
      icon: '🦶',
      evidenceLevel: 'A'
    },
    '肘痛|胳膊肘痛|手肘痛|肘关节痛': {
      specialty: 'elbow',
      label: '肘痛',
      icon: '💪',
      evidenceLevel: 'A'
    },
    '腕痛|手腕痛|腕部疼痛': {
      specialty: 'wrist',
      label: '腕痛',
      icon: '✋',
      evidenceLevel: 'A'
    },
    
    // 心肺康复
    '气短|气喘|呼吸困难|胸闷|喘不上气': {
      specialty: 'cardio',
      label: '呼吸困难',
      icon: '🫁',
      evidenceLevel: 'A'
    },
    '胸痛|胸闷|心悸': {
      specialty: 'cardio',
      label: '胸痛/胸闷',
      icon: '❤️',
      evidenceLevel: 'A'
    },
    
    // 其他
    '头晕|眩晕|头昏|天旋地转': {
      specialty: 'neurologic',
      label: '头晕/眩晕',
      icon: '😵',
      evidenceLevel: 'A'
    },
    '头痛|头疼|头部疼痛': {
      specialty: 'neurologic',
      label: '头痛',
      icon: '🤕',
      evidenceLevel: 'A'
    }
  };

  /**
   * 根据症状文本，匹配可能的结果
   */
  function matchSymptoms(text) {
    if (!text) return [];
    
    const lower = text.toLowerCase();
    const matches = [];

    for (const pattern in SYMPTOM_MAP) {
      const keywords = pattern.split('|');
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          matches.push({
            ...SYMPTOM_MAP[pattern],
            keyword: kw
          });
          break;
        }
      }
    }

    // 如果没有匹配，返回通用分诊
    if (matches.length === 0) {
      matches.push({
        specialty: 'general',
        label: '症状待查',
        icon: '📋',
        evidenceLevel: 'C'
      });
    }

    return matches;
  }

  // 公开 API
  return {
    matchSymptoms: matchSymptoms
  };
})();
