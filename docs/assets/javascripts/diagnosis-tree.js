/**
 * 诊断决策树引擎
 * 根据症状输入，动态生成诊断 + 评估选择题
 */

const DiagnosisTree = (function() {

  /**
   * 症状 → 可能的疾病映射
   * key: 症状关键词（模糊匹配）
   * value: { specialty, possibleDiagnoses, triageQuestions }
   */
  const SYMPTOM_MAP = {
    // 神经康复
    '脑卒中|中风|偏瘫|半身不遂|一侧无力|面瘫|言语不清|吞咽困难': {
      specialty: 'neurologic',
      diagnosis: '脑卒中',
      triage: [
        { q: '发病时间是？', options: ['<24小时（急性期）','24小时-2周（亚急性期）','2周-6个月（恢复期）','>6个月（后遗症期）'], key: 'onsetPhase' },
        { q: '主要症状在哪一侧？', options: ['右侧（左侧大脑病变）','左侧（右侧大脑病变）','双侧','不确定'], key: 'side' },
        { q: '目前能否独立行走？', options: ['可以独立行走','需要辅助下行走','无法行走/卧床'], key: 'mobility' }
      ]
    },
    '手麻|手脚麻木|肢体麻木|感觉异常|刺痛': {
      specialty: 'neurologic',
      diagnosis: '周围神经病变（待鉴别）',
      triage: [
        { q: '麻木范围是？', options: ['单侧肢体','双侧对称（手套-袜套样）','单条神经分布区','全身多处'], key: 'numbnessPattern' },
        { q: '是否伴有疼痛？', options: ['是，刺痛/灼痛','是，酸痛','无疼痛，只有麻木','不确定'], key: 'painWithNumbness' },
        { q: '症状出现时间是？', options: ['突然发生','逐渐加重','波动性的','外伤后'], key: 'onsetPattern' }
      ]
    },
    '帕金森|手抖|震颤|动作慢|僵硬|小步态': {
      specialty: 'neurologic',
      diagnosis: '帕金森病（待鉴别）',
      triage: [
        { q: '主要症状是？', options: ['静止性震颤（手抖）','运动迟缓','肌强直','姿势不稳/小步态'], key: 'mainSymptom' },
        { q: '症状开始侧是？', options: ['一侧先开始','两侧同时','不确定'], key: 'side' },
        { q: '是否有嗅觉减退？', options: ['是','否','不确定'], key: 'olfaction' }
      ]
    },

    // 骨科康复
    '膝关节疼痛|膝盖痛|膝痛|前交叉韧带|ACL|半月板|膝盖肿胀': {
      specialty: 'orthopedic',
      diagnosis: '膝关节疾病（待鉴别）',
      triage: [
        { q: '疼痛时间是？', options: ['外伤后立即疼痛','外伤后数小时-数天','逐渐出现，无明确外伤','运动后加重'], key: 'painOnset' },
        { q: '是否有关节"打软腿"或"卡住"的感觉？', options: ['是，经常打软腿','是，有关节卡住感','否','不确定'], key: 'kneeGiveWay' },
        { q: '目前行走是否受影响？', options: ['无法负重行走','可以行走但跛行','正常行走，上楼梯痛','正常行走'], key: 'walkAffected' }
      ]
    },
    '肩痛|肩膀痛|肩关节|肩袖|肩周炎|抬臂困难': {
      specialty: 'orthopedic',
      diagnosis: '肩关节疾病（待鉴别）',
      triage: [
        { q: '疼痛特点是？', options: ['主动活动痛，被动活动正常（肩袖损伤）','主动被动都痛，夜间加重（肩周炎）','外伤后突发（肩袖撕裂）','疼痛弧 60°-120°'], key: 'painPattern' },
        { q: '能否梳头或摸后背？', options: ['完全不能（严重受限）','部分能，但疼痛','可以，基本正常'], key: 'shoulderROM' },
        { q: '症状持续多久了？', options: ['<3个月','3-6个月','>6个月'], key: 'duration' }
      ]
    },
    '腰痛|腰疼|下腰痛|腰椎间盘突出|坐骨神经痛': {
      specialty: 'orthopedic',
      diagnosis: '腰痛（待鉴别）',
      triage: [
        { q: '疼痛是否放射到腿部？', options: ['是，放射到小腿/足部（坐骨神经痛）','是，只到大腿','否，只在腰部'], key: 'radiculopathy' },
        { q: '咳嗽/打喷嚏时疼痛是否加重？', options: ['是','否','不确定'], key: 'coughPain' },
        { q: '是否有下肢无力或麻木？', options: ['是','否','不确定'], key: 'legWeakness' }
      ]
    },

    // 心肺康复
    '气喘|呼吸困难|气短|喘不上气|COPD|慢阻肺|咳嗽|咳痰': {
      specialty: 'cardiopulmonary',
      diagnosis: '慢性阻塞性肺病（待鉴别）',
      triage: [
        { q: '呼吸困难是在什么情况下出现？', options: ['静息时也有','轻度活动（如走路）','中度活动（如爬楼）','只有剧烈运动'], key: 'dyspneaSeverity' },
        { q: '是否有长期吸烟史？', options: ['是，>10包年','是，<10包年','否','已戒烟'], key: 'smoking' },
        { q: '静息 SpO₂（指脉氧）是？', options: ['<88%','88-92%','93-95%','>95%','不知道'], key: 'spo2' }
      ]
    },
    '胸痛|胸闷|心梗|心脏病|心衰|心悸': {
      specialty: 'cardiopulmonary',
      diagnosis: '心脏疾病（待鉴别）',
      triage: [
        { q: '胸痛性质是？', options: ['压榨样痛，向左肩放射','刺痛，数秒即过','运动后胸痛','静息时胸痛'], key: 'chestPainType' },
        { q: '⚠️ 红旗症状：是否有以下情况？', options: ['胸痛>20分钟不缓解','伴有大汗/濒死感','静息时呼吸困难','以上都没有'], key: 'redFlags', isRedFlag: true }
      ]
    }
  };

  /**
   * 根据症状文本，匹配可能的疾病
   */
  function matchSymptoms(text) {
    const lower = text.toLowerCase();
    const matches = [];

    for (const [pattern, data] of Object.entries(SYMPTOM_MAP)) {
      const keywords = pattern.split('|');
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          matches.push({ pattern: kw, ...data });
          break;
        }
      }
    }

    // 如果没有匹配，返回通用分诊
    if (matches.length === 0) {
      matches.push({
        pattern: 'general',
        specialty: 'neurologic',
        diagnosis: '待评估',
        triage: [
          { q: '请选择最可能的专科方向：', options: ['神经康复（脑卒中/脊髓损伤/帕金森病）','骨科康复（关节疼痛/术后）','心肺康复（呼吸困难/心衰）','儿童康复','老年康复'], key: 'specialtyGuess' }
        ]
      });
    }

    return matches;
  }

  /**
   * 生成完整的评估问卷（诊断确定后）
   */
  function getAssessmentForSpecialty(specialty, diagnosis) {
    const assessments = {
      'neurologic': [
        { title: '基本信息', fields: [
          { name: 'onsetDays', label: '发病/术后天数', type: 'number', placeholder: '天' },
          { name: 'dominantHand', label: '利手', type: 'select', options: ['左','右','不确定'] }
        ]},
        { title: '运动功能', fields: [
          { name: 'fmUpper', label: '上肢 Fugl-Meyer 评分（0–66，如不确定填0）', type: 'number', placeholder: '0-66' },
          { name: 'berg', label: '平衡能力（Berg 评分）', type: 'select', options: [
            {value:'0',label:'0–20分（平衡障碍严重）'},
            {value:'1',label:'21–40分（中等障碍）'},
            {value:'2',label:'41–56分（轻度障碍）'}
          ]}
        ]},
        { title: '肌张力', fields: [
          { name: 'ashworth', label: '患侧上肢肌张力（Ashworth）', type: 'select', options: ['0','1','1+','2','3','4'] }
        ]},
        { title: '安全确认', fields: [
          { name: 'redFlags', label: '是否存在以下红旗症状？（多选，无则填"无"）', type: 'textarea', placeholder: '胸痛、剧烈头痛、静息心率>100次/分、呼吸困难等' }
        ]}
      ],
      'orthopedic': [
        { title: '基本信息', fields: [
          { name: 'postOpWeeks', label: '术后/发病周数', type: 'number', placeholder: '周' }
        ]},
        { title: '关节活动度', fields: [
          { name: 'romFlexion', label: '屈曲 ROM（°）', type: 'number', placeholder: '如：120' },
          { name: 'vas', label: '静息疼痛 VAS（0–10）', type: 'range', min:0, max:10 }
        ]},
        { title: '安全确认', fields: [
          { name: 'redFlags', label: '是否存在以下红旗症状？', type: 'textarea', placeholder: '术侧肢体突发肿胀/发红（疑似 DVT）\n如无请填"无"' }
        ]}
      ],
      'cardiopulmonary': [
        { title: '基本信息', fields: [
          { name: 'restHR', label: '静息心率（次/分）', type: 'number', placeholder: '如：72' },
          { name: 'restBP', label: '静息血压（mmHg）', type: 'text', placeholder: '如：120/80' },
          { name: 'spo2', label: '静息 SpO₂（%）', type: 'number', placeholder: '如：96' }
        ]},
        { title: '运动能力', fields: [
          { name: 'sixMWD', label: '6分钟步行距离（m，如未测填0）', type: 'number', placeholder: '米' },
          { name: 'borg', label: '日常活动 Borg 呼吸困难评分（0–10）', type: 'range', min:0, max:10 }
        ]},
        { title: '安全确认', fields: [
          { name: 'redFlags', label: '是否存在以下红旗症状？', type: 'textarea', placeholder: '静息时胸痛/呼吸困难加重/足踝水肿加重\n如无请填"无"' }
        ]}
      ]
    };
    return assessments[specialty] || assessments['neurologic'];
  }

  return {
    matchSymptoms,
    getAssessmentForSpecialty,
    SYMPTOM_MAP
  };
})();
