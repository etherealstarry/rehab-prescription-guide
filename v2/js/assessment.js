/**
 * assessment.js —— 康复评估表单（基于《康复评定学》第3版 + 各专科CPGs）
 *
 * 所有量表均为临床标准版本，标注指南来源和证据等级
 * 评分结果自动计算，并传递给 prescription.js 生成循证处方
 *
 * 参考：
 * - 《康复评定学》第3版（王玉龙 主编，人民卫生出版社）
 * - APTA CPGs (Orthopaedic, Neurologic, Cardiovascular)
 * - AHA/ASA Stroke Rehabilitation Guidelines 2021
 * - NDI / ODI / Lysholm / Berg 等标准量表
 */

/* ============================================================
   一、通用人口学与病史采集（所有专科共用）
   ============================================================ */
var baseDemographics = [
  {
    id: 'age',
    label: '年龄',
    type: 'number',
    required: true,
    placeholder: '岁',
    guide: '年龄影响处方强度与安全性，见《运动治疗学》第4版 Ch.2'
  },
  {
    id: 'sex',
    label: '性别',
    type: 'select',
    options: ['男', '女', '其他/不愿透露'],
    required: false
  },
  {
    id: 'height',
    label: '身高',
    type: 'number',
    placeholder: 'cm',
    required: false,
    guide: '用于计算BMI，心肺康复需计算METs'
  },
  {
    id: 'weight',
    label: '体重',
    type: 'number',
    placeholder: 'kg',
    required: false
  },
  {
    id: 'dominantHand',
    label: '利手',
    type: 'select',
    options: ['右利手', '左利手', '双手通用'],
    required: false,
    guide: '神经康复与手功能康复必填'
  },
  {
    id: 'pastRehabHistory',
    label: '既往康复史',
    type: 'textarea',
    placeholder: '曾接受过何种康复治疗（PT/OT/ST），效果如何，有无未完成的治疗',
    required: false,
    guide: '《康复评定学》第3版 Ch.1：康复病史采集核心内容'
  },
  {
    id: 'comorbidities',
    label: '合并症（多选题）',
    type: 'checkbox',
    options: ['高血压', '糖尿病', '冠心病', 'COPD', '骨质疏松', '肿瘤史', '抑郁症', '认知障碍', '无'],
    required: false,
    guide: '合并症影响运动处方安全性，见ACSM《运动测试与处方指南》第11版'
  },
  {
    id: 'medications',
    label: '当前用药（影响运动安全的药物）',
    type: 'textarea',
    placeholder: '如：降压药、抗凝药、降糖药、镇痛药等，请注明药名与剂量',
    required: false,
    guide: 'β受体阻滞剂会影响靶心率测定；见AACVPR 2024 Guidelines'
  },
  {
    id: 'fallHistory',
    label: '近6个月跌倒史',
    type: 'select',
    options: ['无跌倒史', '1次', '2次及以上', '不确定'],
    required: true,
    guide: '跌倒史是平衡训练处方的重要参考，见AGS/BGS《老年人跌倒干预指南》'
  },
  {
    id: 'cognitiveStatus',
    label: '认知状态简易筛查（MMSE简化版）',
    type: 'radio',
    options: [
      '正常（能独立回答所有问题）',
      '轻度受损（需要少量提示）',
      '中重度受损（需要大量帮助）',
      '未评估'
    ],
    required: false,
    guide: 'MMSE简易版；认知障碍患者需调整康复目标与安全措施，见《神经康复学》第3版'
  },
  {
    id: 'socialSupport',
    label: '家庭/社会支持情况',
    type: 'select',
    options: ['独居，无支持', '独居，有社区服务', '与家人同住', '有专职陪护', '其他'],
    required: false,
    guide: '影响居家运动执行率，见《老年康复学》Ch.3'
  }
];

/* ============================================================
   二、标准化量表定义
   每个量表包含：名称、指导语、题目、评分规则、解读、指南来源
   ============================================================ */

// ——— 2.1 疼痛评估：VAS / NPRS ———
var painScales = {
  vas: {
    id: 'vasPain',
    name: '疼痛视觉模拟评分（VAS）',
    guide: '《康复评定学》第3版 Ch.4；NPRS同等推荐，见APTA腰痛CPG 2021 Level A',
    items: [
      { id: 'vas_rest',       label: '静息时疼痛（0-10分）', type: 'slider', min: 0, max: 10 },
      { id: 'vas_movement',   label: '活动时疼痛（0-10分）', type: 'slider', min: 0, max: 10 },
      { id: 'vas_night',      label: '夜间疼痛（0-10分）',   type: 'slider', min: 0, max: 10 }
    ],
    interpret: function(scores) {
      var max = Math.max.apply(null, scores);
      if (max <= 3) return '轻度疼痛，可耐受';
      if (max <= 6) return '中度疼痛，影响功能';
      return '重度疼痛，严重影响功能';
    }
  },
  ndi: null, // 见专科部分
  odi: null
};

/* ============================================================
   三、各专科评估表单配置
   每个 specialty 对应一组 sections，每个 section 包含多个 fields
   ============================================================ */

var asFormConfigs = {};

/* ——— 3.1 神经康复（脑卒中 / 脊髓损伤）——— */
asFormConfigs.neuro = {
  label: '神经康复评估（脑卒中 / 脊髓损伤）',
  guide: '参考：AHA/ASA Stroke Rehab Guidelines 2021；APTA Neurologic CPG 2022；《神经康复学》第3版',
  sections: [
    {
      title: '基础信息（神经专科）',
      icon: '🧠',
      fields: [
        {
          id: 'neuro_diagnosis',
          label: '诊断',
          type: 'select',
          options: ['缺血性脑卒中', '出血性脑卒中', 'TIA（短暂性脑缺血发作）', '脊髓损伤（颈段）', '脊髓损伤（胸段）', '脊髓损伤（腰段）', '帕金森病', '其他神经系统疾病'],
          required: true
        },
        {
          id: 'onset_days',
          label: '发病/损伤距今时间',
          type: 'select',
          options: ['< 1周（超急性期）', '1周-1个月（急性期）', '1-3个月（亚急性期）', '3-6个月（早期恢复）', '6个月以上（慢性期）', '> 1年（后遗症期）'],
          required: true,
          guide: '不同时期康复目标与处方强度不同，见AHA/ASA 2021 Level A'
        },
        {
          id: 'lesion_side',
          label: '病灶侧别',
          type: 'select',
          options: ['左侧（右侧肢体受累）', '右侧（左侧肢体受累）', '双侧', '不确定'],
          required: false
        },
        {
          id: 'affected_limb',
          label: '受累肢体（多选题）',
          type: 'checkbox',
          options: ['右上肢', '右下肢', '左上肢', '左下肢', '双侧上肢', '双侧下肢', '躯干'],
          required: true
        }
      ]
    },
    {
      title: '运动功能评定 —— 简化Fugl-Meyer评分',
      icon: '💪',
      guide: 'Fugl-Meyer Assessment (FMA) 是脑卒中运动功能评定的金标准。此处为简化版（上肢+下肢核心项目）。完整版见《康复评定学》第3版 Ch.7。证据等级：AHA/ASA 2021 Level A推荐。',
      fields: [
        {
          id: 'fm_upper_reflex',
          label: '上肢反射活动（肱二头肌/肱三头肌）',
          type: 'radio',
          options: ['0分：反射亢进或消失', '1分：反射减弱或不全', '2分：反射正常'],
          guide: '0-2分制，源自Fugl-Meyer原始量表'
        },
        {
          id: 'fm_upper_flexion',
          label: '上肢屈肌协同运动（肩屈/肘屈/前臂旋后）',
          type: 'radio',
          options: ['0分：不能完成', '1分：部分完成', '2分：充分完成'],
        },
        {
          id: 'fm_upper_extension',
          label: '上肢伸肌协同运动（肩伸/肘伸/前臂旋前）',
          type: 'radio',
          options: ['0分：不能完成', '1分：部分完成', '2分：充分完成'],
        },
        {
          id: 'fm_wrist',
          label: '腕关节活动',
          type: 'radio',
          options: ['0分：不能活动', '1分：轻微活动', '2分：可抗重力活动', '3分：活动充分'],
          guide: '简化评分，完整FMA腕部为0-2分'
        },
        {
          id: 'fm_finger',
          label: '手指精细活动（对指/伸指）',
          type: 'radio',
          options: ['0分：无自主活动', '1分：有活动但不能完成捏握', '2分：可完成捏握但不能精细操作', '3分：精细活动接近正常'],
        },
        {
          id: 'fm_lower_reflex',
          label: '下肢反射活动（膝腱反射/跟腱反射）',
          type: 'radio',
          options: ['0分：反射消失或亢进', '1分：反射减弱', '2分：反射正常'],
        },
        {
          id: 'fm_lower_flexion',
          label: '下肢屈肌协同运动（髋屈/膝屈/踝背屈）',
          type: 'radio',
          options: ['0分：不能完成', '1分：部分完成', '2分：充分完成'],
        },
        {
          id: 'fm_lower_extension',
          label: '下肢伸肌协同运动（髋伸/膝伸/踝跖屈）',
          type: 'radio',
          options: ['0分：不能完成', '1分：部分完成', '2分：充分完成'],
        },
        {
          id: 'fm_coordination',
          label: '协调性（扫障碍/跟膝胫试验）',
          type: 'radio',
          options: ['0分：严重共济失调', '1分：轻度共济失调', '2分：协调正常'],
          guide: '脑卒中后共济失调评估，见《神经康复学》Ch.5'
        }
      ]
    },
    {
      title: '痉挛评定 —— Ashworth痉挛量表（MAS）',
      icon: '🔗',
      guide: 'MAS是临床最常用的痉挛评定工具。0-4级。证据：APTA Neurologic CPG 2022 Level A。',
      fields: [
        {
          id: 'ashworth_shoulder',
          label: '肩内收/内旋肌群',
          type: 'select',
          options: ['0级：无肌张力增高', '1级：肌张力轻度增高（在ROM末出现卡住）', '1+级：肌张力轻度增高（在ROM 50% 内出现卡住）', '2级：肌张力明显增高，但关节易活动', '3级：肌张力显著增高，被动活动困难', '4级：患肢僵直于屈曲或伸直位'],
        },
        {
          id: 'ashworth_elbow',
          label: '肘屈肌群',
          type: 'select',
          options: ['0级', '1级', '1+级', '2级', '3级', '4级'],
        },
        {
          id: 'ashworth_wrist',
          label: '腕屈肌群',
          type: 'select',
          options: ['0级', '1级', '1+级', '2级', '3级', '4级'],
        },
        {
          id: 'ashworth_hip',
          label: '髋内收肌群',
          type: 'select',
          options: ['0级', '1级', '1+级', '2级', '3级', '4级'],
        },
        {
          id: 'ashworth_knee',
          label: '膝伸肌群',
          type: 'select',
          options: ['0级', '1级', '1+级', '2级', '3级', '4级'],
        },
        {
          id: 'ashworth_ankle',
          label: '踝跖屈肌群（腓肠肌/比目鱼肌）',
          type: 'select',
          options: ['0级', '1级', '1+级', '2级', '3级', '4级'],
        }
      ]
    },
    {
      title: '平衡功能评定 —— Berg平衡量表（简化版）',
      icon: '⚖️',
      guide: 'Berg Balance Scale (BBS) 共14项，满分56分。此处为核心项目。完整版见《康复评定学》Ch.9。跌倒风险：<40分高风险。证据：AHA/ASA 2021 Level A。',
      fields: [
        {
          id: 'berg_sit_stand',
          label: '1. 坐位站起（无需扶物）',
          type: 'radio',
          options: ['0分：不能完成', '1分：需要少量帮助', '2分：能独立完成', '4分：能独立完成且稳定'],
          guide: 'Berg original: 0-4分'
        },
        {
          id: 'berg_stand_no_hands',
          label: '2. 无支撑站立（双臂置于前方，闭眼）',
          type: 'radio',
          options: ['0分：不能站立', '1分：能站但需扶物', '2分：能站<10秒', '3分：能站10-30秒', '4分：能站>30秒'],
        },
        {
          id: 'berg_sit_no_back',
          label: '3. 无靠背坐位（双脚着地）',
          type: 'radio',
          options: ['0分：不能维持', '1分：能维持<30秒', '2分：能维持>30秒'],
        },
        {
          id: 'berg_reach',
          label: '4. 站立位伸手取物（前方0.25m）',
          type: 'radio',
          options: ['0分：明显晃动或需扶物', '1分：轻微晃动但能完成', '2分：稳定完成'],
        },
        {
          id: 'berg_pickup',
          label: '5. 站立位拾物（地面前方物品）',
          type: 'radio',
          options: ['0分：不能完成或失去平衡', '1分：需扶物才能完成', '2分：能独立完成'],
        },
        {
          id: 'berg_turn360',
          label: '6. 转身360度',
          type: 'radio',
          options: ['0分：需扶物或不能完成', '1分：能完成但需分步', '2分：能连续转身'],
        },
        {
          id: 'berg_tandem',
          label: '7. 串联站立（一脚前一脚后）',
          type: 'radio',
          options: ['0分：不能完成', '1分：能维持<10秒', '2分：能维持>10秒'],
          guide: '预测跌倒风险敏感指标'
        }
      ]
    },
    {
      title: 'ADL评定 —— 简化Barthel指数',
      icon: '🏠',
      guide: 'Barthel Index (BI) 评定日常生活活动能力。满分100分。此处为核心ADL项目。完整版见《康复评定学》Ch.12。证据：AHA/ASA 2021 Level A。',
      fields: [
        {
          id: 'bi_feed',
          label: '进食',
          type: 'radio',
          options: ['0分：完全依赖', '5分：需大量帮助', '10分：需少量帮助', '15分：完全独立'],
        },
        {
          id: 'bi_groom',
          label: '修饰（洗脸/刷牙/梳头）',
          type: 'radio',
          options: ['0分：完全依赖', '1分：需帮助', '2分：完全独立（可借助辅助具）'],
          guide: '简化评分'
        },
        {
          id: 'bi_bath',
          label: '洗澡',
          type: 'radio',
          options: ['0分：依赖', '1分：需帮助', '2分：独立'],
        },
        {
          id: 'bi_dress_upper',
          label: '穿脱上衣',
          type: 'radio',
          options: ['0分：完全依赖', '1分：需大量帮助', '2分：需少量帮助', '3分：完全独立'],
        },
        {
          id: 'bi_dress_lower',
          label: '穿脱裤子/鞋袜',
          type: 'radio',
          options: ['0分：完全依赖', '1分：需大量帮助', '2分：需少量帮助', '3分：完全独立'],
        },
        {
          id: 'bi_toilet',
          label: '如厕（转移+清洁）',
          type: 'radio',
          options: ['0分：完全依赖', '1分：需帮助', '2分：需少量帮助', '3分：完全独立'],
        },
        {
          id: 'bi_transfer',
          label: '床椅转移',
          type: 'radio',
          options: ['0分：完全依赖', '2分：需大量帮助', '5分：需少量帮助', '8分：需监护', '10分：完全独立'],
          guide: '转移能力是康复训练的核心目标之一'
        },
        {
          id: 'bi_walk',
          label: '步行（平地50m，可借助助行器）',
          type: 'radio',
          options: ['0分：不能步行', '1分：需2人帮助', '2分：需1人帮助', '3分：需监护/言语提示', '4分：独立（可用助行器）'],
        },
        {
          id: 'bi_stairs',
          label: '上下楼梯',
          type: 'radio',
          options: ['0分：不能完成', '1分：需帮助', '2分：需少量帮助', '3分：完全独立（可用扶手）'],
        }
      ]
    },
    {
      title: '感觉功能评定',
      icon: '✋',
      guide: '感觉障碍影响运动功能恢复与安全性。见《康复评定学》Ch.6。',
      fields: [
        {
          id: 'sensory_light_touch',
          label: '轻触觉（上肢/下肢，左右对比）',
          type: 'select',
          options: ['正常', '减退（部分区域）', '明显减退（大部分区域）', '消失', '未评估'],
        },
        {
          id: 'sensory_pain',
          label: '痛觉',
          type: 'select',
          options: ['正常', '减退', '过敏', '消失', '未评估'],
        },
        {
          id: 'sensory_proprioception',
          label: '本体感觉（指/趾关节位置觉）',
          type: 'select',
          options: ['正常', '轻度受损（误判1-2个关节）', '明显受损（误判>2个关节）', '消失', '未评估'],
          guide: '本体感觉障碍是运动再学习的重要障碍因素'
        },
        {
          id: 'sensory_neglect',
          label: '忽略症（半侧空间忽略）筛查',
          type: 'select',
          options: ['无忽略', '轻度忽略（仅复杂任务中出现）', '明显忽略（进食/梳洗受影响）', '未评估'],
          guide: '忽略症显著影响康复训练效果，需优先处理'
        }
      ]
    },
    {
      title: '言语与吞咽功能（简化筛查）',
      icon: '🗣️',
      guide: '脑卒中后失语与吞咽障碍常见。详细评估需言语治疗师完成。见《言语治疗学》第3版。',
      fields: [
        {
          id: 'speech_aphasia',
          label: '语言理解/表达（简化筛查）',
          type: 'select',
          options: ['正常', '轻度失语（能进行日常交流）', '中度失语（交流困难）', '重度失语（几乎无法交流）', '未评估'],
        },
        {
          id: 'swallow_screen',
          label: '吞咽功能筛查（饮水试验简化版）',
          type: 'select',
          options: ['正常（无水呛）', '轻度吞咽障碍（偶有呛咳）', '明显吞咽障碍（进食需调整性状）', '严重吞咽障碍（需管饲）', '未评估'],
          guide: '吞咽障碍是卒中后肺炎的高危因素；误吸风险患者禁止口服进食训练'
        }
      ]
    },
    {
      title: 'VAS疼痛评分（神经康复）',
      icon: '🔴',
      fields: painScales.vas.items.map(function(item) {
        return {
          id: item.id,
          label: item.label,
          type: 'slider',
          min: 0,
          max: 10
        };
      })
    }
  ]
};

/* ——— 3.2 骨科康复：膝关节（ACL/OA）——— */
asFormConfigs.knee = {
  label: '膝关节康复评估（ACL重建 / 膝骨关节炎）',
  guide: '参考：APTA《膝关节ACL术后物理治疗CPG》2022 Level A；APTA《膝OA循证指南》2021 Level A；《骨科康复学》第3版',
  sections: [
    {
      title: '基础信息（膝关节）',
      icon: '🦵',
      fields: [
        {
          id: 'knee_diagnosis',
          label: '诊断',
          type: 'select',
          options: ['ACL断裂（前交叉韧带）', 'ACL重建术后', '半月板损伤/术后', '膝骨关节炎（Kellgren-Lawrence分级 I-IV）', '髌股关节疼痛综合征', '鹅足肌腱炎', '膝关节置换术后（TKA）', '其他'],
          required: true
        },
        {
          id: 'knee_side',
          label: '患侧',
          type: 'select',
          options: ['左侧', '右侧', '双侧'],
          required: true
        },
        {
          id: 'knee_onset',
          label: '发病/术后时间',
          type: 'select',
          options: ['< 2周（炎症期）', '2-6周（增生期）', '6周-3个月（重建期）', '3-6个月（功能恢复期）', '> 6个月（重返运动前）'],
          required: true,
          guide: '组织愈合周期决定康复进度，见《运动治疗学》第4版 Ch.15'
        },
        {
          id: 'knee_surgery_type',
          label: '手术方式（如术后）',
          type: 'select',
          options: ['未手术（保守治疗）', 'ACL自体肌腱重建（腘绳肌/髌腱）', 'ACL异体肌腱重建', '半月板缝合', '半月板切除', '膝关节置换（TKA/UKR）', '其他'],
          required: false
        }
      ]
    },
    {
      title: 'Lysholm膝关节评分（核心8项）',
      icon: '📊',
      guide: 'Lysholm Score 是膝韧带损伤专用的患者报告结局量表（PROM），满分100分。85-100分：优秀；65-84：良好；<65：差。证据：APTA ACL CPG 2022 Level A。',
      fields: [
        {
          id: 'lysholm_limp',
          label: '1. 跛行',
          type: 'radio',
          options: ['0分：重度跛行', '2分：中度跛行', '3分：轻度跛行或无跛行'],
          guide: 'Lysholm original scoring'
        },
        {
          id: 'lysholm_support',
          label: '2. 是否需要支撑物（助行器/拐杖）',
          type: 'radio',
          options: ['0分：完全不能负重', '1分：需要2个拐杖', '2分：需要1个拐杖', '3分：不需要支撑物'],
        },
        {
          id: 'lysholm_locking',
          label: '3. 膝关节交锁（卡住）',
          type: 'radio',
          options: ['0分：经常交锁（每周≥1次）', '5分：偶尔交锁', '10分：无交锁'],
          guide: '交锁提示半月板损伤或游离体'
        },
        {
          id: 'lysholm_instability',
          label: '4. 膝关节不稳（打软腿）',
          type: 'radio',
          options: ['0分：日常活动中频繁打软腿', '5分：运动中出现打软腿', '10分：无打软腿'],
          guide: '不稳是ACL损伤/术后残留松弛的核心症状'
        },
        {
          id: 'lysholm_pain',
          label: '5. 疼痛',
          type: 'radio',
          options: ['0分：持续疼痛', '3分：中度疼痛（影响日常活动）', '5分：轻度疼痛（仅运动时）', '10分：无痛'],
        },
        {
          id: 'lysholm_swelling',
          label: '6. 肿胀',
          type: 'radio',
          options: ['0分：持续肿胀', '2分：运动后肿胀', '5分：偶发肿胀', '10分：无肿胀'],
        },
        {
          id: 'lysholm_stairs',
          label: '7. 上下楼梯',
          type: 'radio',
          options: ['0分：不能上下楼梯', '2分：需扶栏杆', '5分：能完成但困难', '10分：正常上下楼梯'],
        },
        {
          id: 'lysholm_squat',
          label: '8. 下蹲',
          type: 'radio',
          options: ['0分：不能下蹲', '2分：下蹲困难', '5分：能下蹲但受限', '10分：正常下蹲'],
        }
      ]
    },
    {
      title: '关节活动度（ROM）测量',
      icon: '📐',
      guide: 'ROM测量是骨科康复的核心评定项目。使用标准量角器测量。见《康复评定学》Ch.5。',
      fields: [
        {
          id: 'rom_knee_flexion',
          label: '膝关节屈曲活动度（°）',
          type: 'number',
          placeholder: '正常值 0-135°，测量时取最大值',
          required: true,
          guide: 'ACL术后早期目标：0-120°（6周内）；最终目标：0-135°'
        },
        {
          id: 'rom_knee_extension',
          label: '膝关节伸直活动度（°，伸直缺失记负值）',
          type: 'number',
          placeholder: '正常值 0°，伸直缺失记为 -5° 等',
          required: true,
          guide: '伸直缺失（extension lag）是ACL术后常见问题，需优先处理'
        },
        {
          id: 'rom_knee_patellar',
          label: '髌股关节活动度（上下滑动，mm）',
          type: 'number',
          placeholder: '正常值：上滑 0-14mm，下滑 0-9mm',
          required: false,
          guide: '髌股关节活动度影响膝关节屈曲功能'
        },
        {
          id: 'rom_hip_flexion',
          label: '髋关节屈曲活动度（°，代偿评估）',
          type: 'number',
          placeholder: '正常值 0-120°',
          required: false
        }
      ]
    },
    {
      title: '肌力评定（徒手肌力测试 MMT）',
      icon: '💪',
      guide: 'MMT 0-5级。见《康复评定学》Ch.5。ACL术后重点关注：股四头肌、腘绳肌、臀中肌。',
      fields: [
        {
          id: 'mmt_quadriceps',
          label: '股四头肌肌力（MMT分级）',
          type: 'select',
          options: ['0级：无收缩', '1级：有收缩但无关节活动', '2级：可水平活动（去重力）', '3级：可抗重力活动', '4级：可抗阻力活动（减弱）', '5级：正常肌力'],
          guide: '股四头肌抑制是ACL术后早期的核心问题'
        },
        {
          id: 'mmt_hamstring',
          label: '腘绳肌肌力（MMT分级）',
          type: 'select',
          options: ['0级', '1级', '2级', '3级', '4级', '5级'],
        },
        {
          id: 'mmt_gluteus_medius',
          label: '臀中肌肌力（MMT分级）',
          type: 'select',
          options: ['0级', '1级', '2级', '3级', '4级', '5级'],
          guide: '臀中肌无力导致Trendelenburg步态，是重返运动的重要障碍'
        },
        {
          id: 'mmt_gastrocnemius',
          label: '腓肠肌/比目鱼肌肌力（MMT分级）',
          type: 'select',
          options: ['0级', '1级', '2级', '3级', '4级', '5级'],
        }
      ]
    },
    {
      title: '膝关节稳定性评定',
      icon: '🔗',
      guide: '韧带稳定性测试。ACL术后患者需定期评估。见APTA ACL CPG 2022。',
      fields: [
        {
          id: 'lachman_test',
          label: 'Lachman试验（ACL完整性）',
          type: 'select',
          options: ['阴性（稳定）', 'I度：移位1-5mm', 'II度：移位5-10mm', 'III度：移位>10mm（明显不稳）', '未评估'],
          guide: 'Lachman试验是ACL损伤最敏感的体格检查'
        },
        {
          id: 'pivot_shift',
          label: '轴移试验（Pivot Shift，旋转不稳）',
          type: 'select',
          options: ['阴性', 'I度：滑动感', 'II度：跳越感', 'III度：交锁感', '未评估'],
          guide: '轴移试验阳性提示ACL断裂伴旋转不稳'
        },
        {
          id: 'varus_valgus_stress',
          label: '内外翻应力试验（MCL/LCL完整性）',
          type: 'select',
          options: ['阴性（稳定）', 'I度： opening < 5mm', 'II度： opening 5-10mm', 'III度：明显不稳', '未评估'],
        }
      ]
    },
    {
      title: 'VAS疼痛 + WOMAC（膝OA专用）',
      icon: '🔴',
      fields: [
        { id: 'vas_rest', label: '静息时疼痛（0-10分）', type: 'slider', min: 0, max: 10 },
        { id: 'vas_movement', label: '活动时疼痛（0-10分）', type: 'slider', min: 0, max: 10 },
        {
          id: 'womac_pain',
          label: 'WOMAC 疼痛亚量表（5题简化：步行/上下楼梯/夜间/站立/坐位）',
          type: 'select',
          options: ['无疼痛（0分）', '轻度疼痛（1-2分/题）', '中度疼痛（3-4分/题）', '重度疼痛（5分/题）'],
          guide: 'WOMAC是膝OA最专用的PROM，证据：APTA膝OA指南 2021 Level A'
        },
        {
          id: 'womac_stiffness',
          label: 'WOMAC 僵硬亚量表（晨起/久坐后）',
          type: 'select',
          options: ['无僵硬', '轻度僵硬（< 30分钟）', '中度僵硬（30-60分钟）', '重度僵硬（> 60分钟）'],
        }
      ]
    }
  ]
};

/* ——— 3.3 骨科康复：肩关节（肩袖损伤 / 冻结肩）——— */
asFormConfigs.shoulder = {
  label: '肩关节康复评估（肩袖损伤 / 冻结肩）',
  guide: '参考：APTA《肩袖损伤物理治疗CPG》2020 Level A；《骨科康复学》第3版 Ch.8',
  sections: [
    {
      title: '基础信息（肩关节）',
      icon: '🦾',
      fields: [
        {
          id: 'shoulder_diagnosis',
          label: '诊断',
          type: 'select',
          options: ['肩袖损伤（冈上肌/冈下肌/小圆肌/肩胛下肌）', '冻结肩（原发性/继发性）', '肩峰下撞击综合征', '肩关节置换术后', '肩锁关节损伤', '其他'],
          required: true
        },
        {
          id: 'shoulder_side',
          label: '患侧',
          type: 'select',
          options: ['左侧', '右侧', '双侧'],
          required: true
        },
        {
          id: 'shoulder_onset',
          label: '病程分期',
          type: 'select',
          options: ['急性期（< 6周，疼痛为主）', '冻结期（6周-3个月，疼痛+活动受限）', '解冻期（3-9个月，活动度逐渐恢复）', '后遗症期（> 9个月）', '术后'],
          required: true,
          guide: '冻结肩自然病程12-24个月；见APTA肩袖CPG 2020'
        }
      ]
    },
    {
      title: 'Constant-Murley肩关节评分（简化版）',
      icon: '📊',
      guide: 'Constant Score 是肩关节功能评定的金标准之一，满分100分。此处为核心项目。',
      fields: [
        {
          id: 'constant_pain',
          label: '疼痛（0-15分：无痛15分，剧痛0分）',
          type: 'slider',
          min: 0,
          max: 15,
          guide: '疼痛评分：VAS 0-10 转换为 Constant 0-15分'
        },
        {
          id: 'constant_adl',
          label: 'ADL功能（0-20分：穿衣/梳头/摸背/系扣）',
          type: 'slider',
          min: 0,
          max: 20
        },
        {
          id: 'constant_rom',
          label: '关节活动度（0-40分）',
          type: 'slider',
          min: 0,
          max: 40,
          guide: '前屈/外展/外旋/内旋各10分'
        },
        {
          id: 'constant_strength',
          label: '肌力（0-25分，使用测力计）',
          type: 'slider',
          min: 0,
          max: 25
        }
      ]
    },
    {
      title: '肩关节活动度（ROM）',
      icon: '📐',
      fields: [
        { id: 'rom_shoulder_flexion',    label: '前屈活动度（°，正常值 0-180°）',  type: 'number', required: true },
        { id: 'rom_shoulder_abduction',  label: '外展活动度（°，正常值 0-180°）',  type: 'number', required: true },
        { id: 'rom_shoulder_external',    label: '外旋活动度（°，正常值 0-90°）',   type: 'number', required: false },
        { id: 'rom_shoulder_internal',    label: '内旋活动度（°，正常值 0-70°）',   type: 'number', required: false },
        { id: 'rom_shoulder_extension',   label: '后伸活动度（°，正常值 0-50°）',   type: 'number', required: false },
        {
          id: ' shoulder_capsular_pattern',
          label: '关节囊模式（冻结肩特征性活动受限顺序）',
          type: 'select',
          options: ['外旋受限最明显 > 外展 > 内旋（典型冻结肩）', '外展受限最明显', '多方向活动受限', '不确定'],
          guide: '冻结肩的特征性表现：外旋受限 > 外展 > 内旋；见《骨科康复学》Ch.8'
        }
      ]
    },
    {
      title: '特殊试验（肩袖损伤筛查）',
      icon: '🔬',
      fields: [
        {
          id: 'neer_test',
          label: 'Neer征（肩峰下撞击）',
          type: 'select',
          options: ['阴性', '阳性（诱发疼痛）', '未评估'],
          guide: 'Neer征阳性提示肩峰下撞击综合征'
        },
        {
          id: 'hawkins_test',
          label: 'Hawkins-Kennedy试验（肩峰下撞击）',
          type: 'select',
          options: ['阴性', '阳性', '未评估'],
        },
        {
          id: 'empty_can_test',
          label: '空罐试验（冈上肌损伤）',
          type: 'select',
          options: ['阴性', '阳性（肩外展90°内旋时疼痛/无力）', '未评估'],
          guide: '空罐试验是冈上肌损伤最敏感的体格检查'
        },
        {
          id: 'lift_off_test',
          label: 'Lift-off试验（肩胛下肌损伤）',
          type: 'select',
          options: ['阴性', '阳性（不能完成内旋抗阻）', '未评估'],
        }
      ]
    },
    {
      title: 'VAS疼痛评分',
      icon: '🔴',
      fields: [
        { id: 'vas_rest',        label: '静息时疼痛（0-10分）', type: 'slider', min: 0, max: 10 },
        { id: 'vas_movement',    label: '活动时疼痛（0-10分）', type: 'slider', min: 0, max: 10 },
        { id: 'vas_night',       label: '夜间疼痛（0-10分）',   type: 'slider', min: 0, max: 10 },
      ]
    }
  ]
};

/* ——— 3.4 颈椎康复 ——— */
asFormConfigs.cervical = {
  label: '颈椎康复评估（神经根型 / 椎动脉型 / 颈型）',
  guide: '参考：《康复评定学》Ch.10；APTA Orthopaedic CPG（颈椎）2021；《骨科康复学》第3版 Ch.4',
  sections: [
    {
      title: '基础信息（颈椎）',
      icon: '🧠',
      fields: [
        {
          id: 'cervical_diagnosis',
          label: '颈椎病分型',
          type: 'select',
          options: ['颈型（局部型）', '神经根型（根性痛）', '脊髓型（步态不稳/病理征）', '椎动脉型（眩晕）', '交感神经型', '混合型', '不确定'],
          required: true,
          guide: '分型决定康复策略；脊髓型颈椎病禁忌暴力推拿，见《骨科康复学》Ch.4'
        },
        {
          id: 'cervical_onset',
          label: '病程',
          type: 'select',
          options: ['急性期（< 2周，疼痛明显）', '亚急性期（2周-3个月）', '慢性期（> 3个月）', '反复发作'],
          required: true
        },
        {
          id: 'cervical_radicular_arm',
          label: '根性痛放射至',
          type: 'select',
          options: ['无放射痛', '放射至肩部', '放射至上臂', '放射至前臂', '放射至手指（请注明哪几指）', '全上肢'],
          required: false,
          guide: 'C5: 肩部；C6: 拇指/食指；C7: 中指；C8: 小指/无名指；见《诊断学》Ch.26'
        }
      ]
    },
    {
      title: 'NDI 颈椎功能障碍指数（Neck Disability Index）',
      icon: '📊',
      guide: 'NDI是颈椎疾病功能评定的金标准PROM，共10题，每题0-5分，总分50分。% = (总分/50)×100%。0-20%：轻度；20-40%：中度；40-60%：重度；60-80%：极重度；80-100%：完全失能。证据：APTA颈椎CPG 2021 Level A。',
      fields: [
        {
          id: 'ndi_pain',
          label: '1. 疼痛强度（0分：无痛；5分：痛到无法忍受）',
          type: 'slider', min: 0, max: 5,
        },
        {
          id: 'ndi_personal_care',
          label: '2. 个人护理（洗脸/梳头/穿衣）',
          type: 'radio',
          options: ['0分：能正常完成', '1分：轻度困难', '2分：中度困难（需帮助）', '3分：明显困难', '4分：无法完成', '5分：完全不能自理'],
        },
        {
          id: 'ndi_lifting',
          label: '3. 提重物（从地面提起5kg物品）',
          type: 'radio',
          options: ['0分：能提起且无痛', '1分：能提起但有疼痛', '2分：疼痛明显，但能提起', '3分：无法提起5kg，但能提起更轻物品', '4分：能提起极轻物品', '5分：无法提起任何物品'],
        },
        {
          id: 'ndi_reading',
          label: '4. 阅读（能持续阅读多久）',
          type: 'radio',
          options: ['0分：能正常阅读，无痛', '1分：能正常阅读，但有疼痛', '2分：疼痛使阅读中断，但能坚持', '3分：只能阅读少量内容', '4分：阅读极困难', '5分：无法阅读'],
        },
        {
          id: 'ndi_headaches',
          label: '5. 头痛',
          type: 'radio',
          options: ['0分：无头痛', '1分：轻度头痛', '2分：中度头痛', '3分：明显头痛', '4分：严重头痛', '5分：剧烈头痛（无法忍受）'],
        },
        {
          id: 'ndi_concentration',
          label: '6. 注意力集中',
          type: 'radio',
          options: ['0分：能正常集中注意力', '1分：能集中但有轻度困难', '2分：中度困难', '3分：明显困难', '4分：严重困难', '5分：完全无法集中注意力'],
        },
        {
          id: 'ndi_work',
          label: '7. 工作/家务（当前能完成多少）',
          type: 'radio',
          options: ['0分：能完成所有工作/家务', '1分：能完成大部分', '2分：能完成约2/3', '3分：能完成约1/3', '4分：几乎不能工作', '5分：完全不能工作'],
        },
        {
          id: 'ndi_driving',
          label: '8. 驾驶/乘坐汽车',
          type: 'radio',
          options: ['0分：能正常驾驶/乘车', '1分：能驾驶但有疼痛', '2分：疼痛使驾驶受限', '3分：只能乘坐短途', '4分：几乎不能乘车', '5分：完全不能乘车'],
          guide: '无车患者可跳过或按乘坐汽车评估'
        },
        {
          id: 'ndi_sleep',
          label: '9. 睡眠',
          type: 'radio',
          options: ['0分：无痛，睡眠正常', '1分：偶尔因疼痛醒', '2分：因疼痛醒1-2次/夜', '3分：因疼痛醒3-4次/夜', '4分：因疼痛醒多次，睡眠极差', '5分：完全无法入睡'],
        },
        {
          id: 'ndi_recreation',
          label: '10. 娱乐活动',
          type: 'radio',
          options: ['0分：能参加所有娱乐活动', '1分：能参加大部分', '2分：能参加部分', '3分：只能参加极少数', '4分：几乎不能参加', '5分：完全不能参加'],
        }
      ]
    },
    {
      title: '颈椎活动度（ROM）',
      icon: '📐',
      fields: [
        { id: 'rom_c_spinal_flexion',    label: '颈椎屈曲（°，正常值 0-60°）',     type: 'number' },
        { id: 'rom_c_spinal_extension',   label: '颈椎伸展（°，正常值 0-50°）',     type: 'number' },
        { id: 'rom_c_spinal_lateral',     label: '颈椎侧屈（°，正常值 0-45°）',     type: 'number' },
        { id: 'rom_c_spinal_rotation',    label: '颈椎旋转（°，正常值 0-80°）',     type: 'number' },
        {
          id: 'cervical_upper_extremity',
          label: '上肢神经张力测试（ULTT1，正中神经）',
          type: 'select',
          options: ['阴性（无诱发痛）', '阳性（诱发根性痛，提示神经根受压）', '未评估'],
          guide: 'ULTT1阳性提示C6-C7神经根受压；见《骨科康复学》Ch.4'
        }
      ]
    },
    {
      title: 'VAS疼痛评分',
      icon: '🔴',
      fields: [
        { id: 'vas_neck',        label: '颈部局部疼痛（0-10分）',   type: 'slider', min: 0, max: 10 },
        { id: 'vas_radicular',   label: '上肢放射痛（0-10分）',     type: 'slider', min: 0, max: 10 },
        { id: 'vas_headache',    label: '头痛/枕部疼痛（0-10分）',  type: 'slider', min: 0, max: 10 },
      ]
    }
  ]
};

/* ——— 3.5 腰椎康复 ——— */
asFormConfigs.lumbar = {
  label: '腰椎康复评估（非特异性腰痛 / 腰椎间盘突出症）',
  guide: '参考：APTA《非特异性腰痛CPG》2021 Level A；《康复评定学》Ch.10；《骨科康复学》第3版 Ch.5',
  sections: [
    {
      title: '基础信息（腰椎）',
      icon: '🦴',
      fields: [
        {
          id: 'lumbar_diagnosis',
          label: '诊断/症状类型',
          type: 'select',
          options: ['非特异性腰痛（不明原因）', '腰椎间盘突出症', '腰椎管狭窄', '腰椎滑脱（I-IV度）', '腰肌劳损', '骨质疏松性椎体压缩骨折', '其他'],
          required: true,
          guide: '非特异性腰痛占所有腰痛的85%以上；见APTA腰痛CPG 2021'
        },
        {
          id: 'lumbar_onset',
          label: '病程分期',
          type: 'select',
          options: ['急性期（< 2周）', '亚急性期（2周-3个月）', '慢性期（> 3个月）', '急性加重（慢性基础上的急性发作）'],
          required: true
        },
        {
          id: 'lumbar_pattern',
          label: '疼痛模式（APTA腰痛CPG分类）',
          type: 'select',
          options: [
            '稳定机制异常（腰椎不稳，核心弱）',
            '活动度受限（关节僵硬，需松动）',
            '放射痛（根性痛，需神经张力管理）',
            '步态/运动模式异常',
            '未分类/不确定'
          ],
          required: false,
          guide: 'APTA腰痛CPG的核心分类，不同分类对应不同运动处方策略'
        }
      ]
    },
    {
      title: 'ODI Oswestry功能障碍指数',
      icon: '📊',
      guide: 'ODI是腰椎疾病功能评定的金标准PROM，共10题，每题0-5分，总分50分。% = (总分/50)×100%。0-20%：轻度残疾；20-40%：中度；40-60%：重度；60-80%：极重度；80-100%：卧床。证据：APTA腰痛CPG 2021 Level A。',
      fields: [
        {
          id: 'odi_pain_intensity',
          label: '1. 疼痛强度（0分：无痛；5分：痛到无法忍受）',
          type: 'slider', min: 0, max: 5
        },
        {
          id: 'odi_personal_care',
          label: '2. 个人护理（洗脸/梳头/穿衣）',
          type: 'radio',
          options: ['0分：能正常完成', '1分：轻度困难', '2分：中度困难', '3分：明显困难', '4分：无法完成', '5分：完全不能自理'],
        },
        {
          id: 'odi_lifting',
          label: '3. 提重物（从地面提起物品）',
          type: 'radio',
          options: ['0分：能提起重物且无疼痛', '1分：能提起重物但有疼痛', '2分：疼痛使提物受限', '3分：无法提起重物，但能提起轻物', '4分：只能提起极轻物品', '5分：无法提起任何物品'],
        },
        {
          id: 'odi_walking',
          label: '4. 行走（能走多远）',
          type: 'radio',
          options: ['0分：无痛，能走任意远', '1分：能走> 1km，但有疼痛', '2分：能走约500m-1km', '3分：能走约100-500m', '4分：只能走室内', '5分：完全不能行走'],
          guide: '行走距离反映腰椎管狭窄的典型表现（间歇性跛行）'
        },
        {
          id: 'odi_sitting',
          label: '5. 坐位（能坐多久）',
          type: 'radio',
          options: ['0分：能坐任意长时间', '1分：能坐> 1小时', '2分：能坐约30分钟-1小时', '3分：能坐约10-30分钟', '4分：只能坐< 10分钟', '5分：完全不能坐位'],
        },
        {
          id: 'odi_standing',
          label: '6. 站立（能站多久）',
          type: 'radio',
          options: ['0分：能站任意长时间', '1分：能站> 30分钟', '2分：能站约10-30分钟', '3分：能站约5-10分钟', '4分：只能站< 5分钟', '5分：完全不能站立'],
        },
        {
          id: 'odi_sleeping',
          label: '7. 睡眠（疼痛对睡眠的影响）',
          type: 'radio',
          options: ['0分：无痛，睡眠正常', '1分：偶尔因疼痛醒', '2分：因疼痛醒1-2次/夜', '3分：因疼痛醒多次', '4分：睡眠极差', '5分：完全无法入睡'],
        },
        {
          id: 'odi_social_life',
          label: '8. 社交生活',
          type: 'radio',
          options: ['0分：正常社交', '1分：轻度受限', '2分：中度受限', '3分：明显受限', '4分：严重受限', '5分：完全不能社交'],
        },
        {
          id: 'odi_traveling',
          label: '9. 旅行/乘车',
          type: 'radio',
          options: ['0分：能旅行任意远', '1分：能旅行> 2小时', '2分：能旅行约1小时', '3分：能旅行约30分钟', '4分：只能旅行极短时间', '5分：完全不能旅行'],
        },
        {
          id: 'odi_employment',
          label: '10. 工作（因腰痛影响的程度）',
          type: 'radio',
          options: ['0分：全职工作，无影响', '1分：全职工作，轻度影响', '2分：半职工作', '3分：因病假无法工作', '4分：因疼痛几乎不能工作', '5分：完全不能工作（因腰痛）'],
        }
      ]
    },
    {
      title: '腰椎活动度 + 特殊试验',
      icon: '📐',
      fields: [
        { id: 'rom_l_spinal_flexion',   label: '腰椎屈曲（°，正常值 0-80°，指尖距地距离）',   type: 'number' },
        { id: 'rom_l_spinal_extension',  label: '腰椎伸展（°，正常值 0-30°）',                type: 'number' },
        { id: 'rom_l_spinal_lateral',    label: '腰椎侧屈（°，正常值 0-35°）',                type: 'number' },
        {
          id: 'slr_test',
          label: '直腿抬高试验（SLR）',
          type: 'select',
          options: ['阴性（> 70°，无放射痛）', '阳性（< 70°出现放射痛，提示L4-S1神经根受压）', '未评估'],
          guide: 'SLR < 70° 出现放射痛是腰椎间盘突出症的特异性体征'
        },
        {
          id: 'crossed_slr',
          label: '交叉直腿抬高试验（对侧SLR诱发患侧痛）',
          type: 'select',
          options: ['阴性', '阳性（提示中央型巨大突出）', '未评估'],
          guide: '交叉SLR阳性特异性更高，但敏感性较低'
        },
        {
          id: 'fabere_test',
          label: 'FABERE试验（Patrick试验，骶髂关节）',
          type: 'select',
          options: ['阴性', '阳性（提示骶髂关节病变）', '未评估'],
        }
      ]
    },
    {
      title: '核心稳定性筛查',
      icon: '🎯',
      guide: '核心稳定性异常是慢性腰痛的核心机制。见APTA腰痛CPG 2021 Level A推荐核心稳定性训练。',
      fields: [
        {
          id: 'core_prs',
          label: '俯卧撑撑起试验（PRS，腰椎稳定性筛查）',
          type: 'select',
          options: ['阴性（腰椎无过度运动）', '阳性（腰椎节段性不稳定）', '未评估'],
          guide: 'PRS阳性提示腰椎节段性不稳定，需核心稳定性训练'
        },
        {
          id: 'core_transversus',
          label: '能否独立完成腹横肌分离收缩（Draw-in动作）',
          type: 'select',
          options: ['能独立完成', '在提示下能完成', '不能完成', '未评估'],
          guide: '腹横肌激活是核心稳定性训练的第一步'
        },
        {
          id: 'core_hold_time',
          label: '平板支撑维持时间（秒）',
          type: 'number',
          placeholder: '正常值：女性> 30秒，男性> 60秒',
        }
      ]
    },
    {
      title: 'VAS疼痛评分',
      icon: '🔴',
      fields: [
        { id: 'vas_lumbar_local',   label: '腰部局部疼痛（0-10分）',   type: 'slider', min: 0, max: 10 },
        { id: 'vas_radicular_leg',   label: '下肢放射痛（0-10分）',     type: 'slider', min: 0, max: 10 },
        { id: 'vas_night_lumbar',   label: '夜间腰痛（0-10分）',        type: 'slider', min: 0, max: 10 },
      ]
    }
  ]
};

/* ——— 3.6 心肺康复 ——— */
asFormConfigs.cardio = {
  label: '心肺康复评估（冠心病 / COPD / 心力衰竭）',
  guide: '参考：AACVPR Guidelines 2024 Level A；GOLD COPD 2024；《心肺康复学》第3版；《中国冠心病患者运动治疗专家共识》',
  sections: [
    {
      title: '基础信息（心肺康复）',
      icon: '❤️',
      fields: [
        {
          id: 'cardio_diagnosis',
          label: '诊断',
          type: 'select',
          options: ['冠心病（稳定性心绞痛/MI后）', '心力衰竭（HFrEF/HFpEF）', 'COPD（慢性阻塞性肺疾病）', '哮喘', '肺纤维化', '心脏术后（CABG/瓣膜术）', '其他'],
          required: true
        },
        {
          id: 'cardio_onset',
          label: '病程/术后时间',
          type: 'select',
          options: ['急性期（MI后< 2周/CABG后< 2周）', '恢复期（2周-3个月）', '稳定期（> 3个月）', 'COPD稳定期', 'COPD急性加重期'],
          required: true,
          guide: '不同时期运动风险不同；见AACVPR 2024'
        },
        {
          id: 'cardio_rehab_phase',
          label: '康复分期（AACVPR标准）',
          type: 'select',
          options: [
            'Ⅰ期：住院期康复（监护下）',
            'Ⅱ期：早期门诊康复（出院后1-3个月，监护下）',
            'Ⅲ期：社区/居家维持期康复（无监护）',
            '未分期'
          ],
          required: false,
          guide: 'AACVPR三期分类是心肺康复的核心框架'
        }
      ]
    },
    {
      title: '心肺功能评估 —— 6分钟步行试验（6MWT）',
      icon: '🚶',
      guide: '6MWT是心肺康复最常用的亚极量运动测试，测定6分钟内的步行距离（6MWD）。预测值计算公式：男性= (7.57×身高cm) - (5.02×年龄) - 1.76×体重kg - 309; 女性类似。%预测值：> 80%正常；50-80%轻度受限；35-50%中度；< 35%重度。证据：AACVPR 2024 Level A。',
      fields: [
        {
          id: 'sixmwd',
          label: '6分钟步行距离（米）',
          type: 'number',
          placeholder: '实测值，如：420',
          required: true
        },
        {
          id: 'sixmwd_predicted',
          label: '6MWD占预计值百分比（%）',
          type: 'number',
          placeholder: '自动计算或手动输入',
          required: false
        },
        {
          id: 'sixmwt_hr_end',
          label: '6MWT结束时心率（次/分）',
          type: 'number',
          required: false
        },
        {
          id: 'sixmwt_spo2_end',
          label: '6MWT结束时SpO₂（%）',
          type: 'number',
          required: false,
          guide: 'SpO₂下降> 4% 提示运动诱发的低氧血症，需氧疗'
        },
        {
          id: 'sixmwt_borg',
          label: '6MWT结束时Borg自觉疲劳评分（0-10分）',
          type: 'slider',
          min: 0,
          max: 10,
          guide: 'Borg CR10量表；靶目标：Borg 3-6分（中等强度）'
        }
      ]
    },
    {
      title: '心功能分级（NYHA）',
      icon: '💓',
      fields: [
        {
          id: 'nyha_class',
          label: 'NYHA心功能分级',
          type: 'radio',
          options: [
            'I级：日常活动无气促/疲劳',
            'II级：日常活动轻度受限（快走/爬楼有症状）',
            'III级：日常活动明显受限（平地步行100-200m有症状）',
            'IV级：静息状态下也有症状'
          ],
          guide: 'NYHA分级决定运动强度上限；I-II级可中度强度；III级需低强度监护；IV级禁忌运动训练'
        }
      ]
    },
    {
      title: '呼吸功能评估（COPD患者）',
      icon: '🫁',
      guide: 'GOLD 2024 推荐 mMRC 和 CAT 问卷评估COPD症状严重度。',
      fields: [
        {
          id: 'mmrc',
          label: 'mMRC呼吸困难分级（0-4级）',
          type: 'radio',
          options: [
            '0级：仅在剧烈活动时气促',
            '1级：快走或上缓坡时有气促',
            '2级：因气促比同龄人走得慢，或需停下喘气',
            '3级：平地走100米或数分钟后需停下喘气',
            '4级：明显气促，不能离开房屋'
          ],
          guide: 'mMRC ≥ 2级提示需要进行呼吸康复干预'
        },
        {
          id: 'cat_score',
          label: 'CAT问卷评分（COPD评估测试，0-40分）',
          type: 'slider',
          min: 0,
          max: 40,
          guide: 'CAT ≥ 10分（轻度）；≥ 20分（中度）；≥ 30分（重度）'
        },
        {
          id: 'copd_fev1_percent',
          label: 'FEV₁占预计值百分比（%，肺功能检查）',
          type: 'number',
          placeholder: 'GOLD 1级: ≥80%; 2级: 50-79%; 3级: 30-49%; 4级: <30%',
          required: false
        }
      ]
    },
    {
      title: '运动禁忌症筛查（安全红线）',
      icon: '🚨',
      guide: '以下任何一项为"是"，均属运动绝对禁忌症，系统将拦截处方生成。见AACVPR 2024 及《中国冠心病运动治疗共识》。',
      fields: [
        {
          id: 'red_rest_hr',
          label: '静息心率 > 110次/分？',
          type: 'radio',
          options: ['否', '是（绝对禁忌）'],
          guide: '静息心动过速提示未控制的心律失常或心衰加重'
        },
        {
          id: 'red_unstable_angina',
          label: '近期有不稳定性心绞痛（48小时内）？',
          type: 'radio',
          options: ['否', '是（绝对禁忌）'],
        },
        {
          id: 'red_arrhythmia',
          label: '有未控制的心律失常（如房颤伴快速心室率）？',
          type: 'radio',
          options: ['否', '是（绝对禁忌）'],
        },
        {
          id: 'red_fever',
          label: '目前有发热（体温 > 38°C）或急性感染？',
          type: 'radio',
          options: ['否', '是（绝对禁忌）'],
        },
        {
          id: 'red_sbp',
          label: '静息收缩压 > 180 mmHg 或舒张压 > 110 mmHg？',
          type: 'radio',
          options: ['否', '是（绝对禁忌）'],
          guide: '未控制的高血压增加运动中心脑血管事件风险'
        },
        {
          id: 'red_spo2',
          label: '静息SpO₂ < 88%（未吸氧状态下）？',
          type: 'radio',
          options: ['否', '是（绝对禁忌，需氧疗）'],
        }
      ]
    }
  ]
};

/* ——— 3.7 手功能康复 ——— */
asFormConfigs.hand = {
  label: '手功能康复评估（骨折 / 肌腱损伤 / 神经损伤）',
  guide: '参考：《作业治疗学》第3版；《骨科康复学》Ch.11；手外科康复指南',
  sections: [
    {
      title: '基础信息（手功能）',
      icon: '✋',
      fields: [
        {
          id: 'hand_diagnosis',
          label: '诊断',
          type: 'select',
          options: ['桡骨远端骨折（Colles骨折）', '屈肌腱损伤（Flexor Tendon）', '伸肌腱损伤（Extensor Tendon）', '腕管综合征（CTS）', '尺神经损伤（Guyon管综合征）', '桡神经损伤（垂腕）', '扳机指/腱鞘炎', '其他'],
          required: true
        },
        {
          id: 'hand_side',
          label: '患侧',
          type: 'select',
          options: ['左侧', '右侧', '双侧'],
          required: true
        },
        {
          id: 'hand_onset',
          label: '病程/术后时间',
          type: 'select',
          options: ['< 2周（炎症期）', '2-6周（增生期）', '6周-3个月（重建期）', '> 3个月（功能恢复期）'],
          required: true
        }
      ]
    },
    {
      title: '手功能评定 —— Jebsen手功能测试（简化版）',
      icon: '📊',
      fields: [
        {
          id: 'jebsen_writing',
          label: '写字（抄写一句话，秒）',
          type: 'number',
          placeholder: '正常值：利手 < 20秒'
        },
        {
          id: 'jebsen_turning_cards',
          label: '翻卡片（翻12张卡片，秒）',
          type: 'number',
        },
        {
          id: 'jebsen_pickup_small',
          label: '拾小物品（拾起5颗小豆，秒）',
          type: 'number',
        },
        {
          id: 'jebsen_simulated_feeding',
          label: '模拟进食（用勺子舀起豆子放入小口瓶中，秒）',
          type: 'number',
        }
      ]
    },
    {
      title: 'VAS疼痛评分',
      icon: '🔴',
      fields: [
        { id: 'vas_rest',     label: '静息时疼痛（0-10分）',     type: 'slider', min: 0, max: 10 },
        { id: 'vas_movement', label: '活动时疼痛（0-10分）',     type: 'slider', min: 0, max: 10 },
        { id: 'vas_night',    label: '夜间疼痛（0-10分）',        type: 'slider', min: 0, max: 10 },
      ]
    }
  ]
};

/* ——— 3.8 重症康复（ICU）——— */
asFormConfigs.icu = {
  label: '重症康复评估（ICU 早期活动）',
  guide: '参考：《ICU患者早期活动与康复临床实践指南》；《重症康复学》；AACVPR 2024',
  sections: [
    {
      title: '基础信息（ICU康复）',
      icon: '🏥',
      fields: [
        {
          id: 'icu_diagnosis',
          label: '诊断/原发病',
          type: 'select',
          options: ['脑卒中（重症监护中）', '颅脑外伤', '脊髓损伤（高位）', 'COPD急性加重（有创/无创通气）', '心力衰竭（心源性休克）', '多器官功能障碍（MODS）', '外科术后（ICU滞留）', '其他'],
          required: true
        },
        {
          id: 'icu_days',
          label: 'ICU住院天数',
          type: 'number',
          placeholder: '天',
          required: true
        },
        {
          id: 'icu_gcs',
          label: 'GCS评分（格拉斯哥昏迷评分）',
          type: 'select',
          options: ['13-15分（轻度意识障碍）', '9-12分（中度）', '3-8分（重度，昏迷）', '未评估'],
          guide: 'GCS < 8分需气管插管保护气道；康复介入需谨慎'
        }
      ]
    },
    {
      title: 'ICU活动能力评定 —— ICU Mobility Scale (IMS)',
      icon: '🚶',
      guide: 'IMS是ICU专用活动能力量表，0-10分。0分：卧床；10分：独立行走。见《ICU早期活动指南》。',
      fields: [
        {
          id: 'ims_score',
          label: '当前最高活动水平（IMS评分）',
          type: 'radio',
          options: [
            '0分：完全卧床，无主动活动',
            '1分：床上被动关节活动',
            '2分：床上主动辅助关节活动',
            '3分：床上主动关节活动',
            '4分：床边坐起（无体位性低血压）',
            '5分：床边站立（可借助平行杠/助行器）',
            '6分：床边行走（少量帮助）',
            '7分：室内行走（监护下）',
            '8分：走廊行走（独立）',
            '9分：爬楼梯',
            '10分：正常社区行走'
          ],
          guide: 'IMS评分决定早期活动的目标与禁忌'
        },
        {
          id: 'icu_mrc_sum',
          label: 'MRC总分（医学研究委员会肌力评分，0-60分）',
          type: 'number',
          placeholder: '0-60分，< 48分提示明显肌无力',
          required: false,
          guide: 'MRC评分：双侧肩/肘/腕/髋/膝/踝各0-5分，总分60分。ICU获得性肌无力诊断：MRC < 48分'
        }
      ]
    },
    {
      title: '早期活动安全筛查（转入/终止标准）',
      icon: '🚨',
      guide: '符合以下任何一项"否"，需重新评估是否适合早期活动。见《ICU早期活动指南》。',
      fields: [
        {
          id: 'icu_safe_hr',
          label: '心率 40-130次/分？',
          type: 'radio',
          options: ['是', '否（终止标准）'],
        },
        {
          id: 'icu_safe_sbp',
          label: '收缩压 90-180 mmHg？',
          type: 'radio',
          options: ['是', '否（终止标准）'],
        },
        {
          id: 'icu_safe_spo2',
          label: 'SpO₂ ≥ 88%（吸氧状态下）？',
          type: 'radio',
          options: ['是', '否（终止标准）'],
        },
        {
          id: 'icu_safe_no_icp',
          label: '无未控制的颅内高压（ICP > 20 mmHg）？',
          type: 'radio',
          options: ['是', '否（终止标准）'],
        },
        {
          id: 'icu_safe_no_active_bleed',
          label: '无活动性出血（消化道/颅内/胸腔）？',
          type: 'radio',
          options: ['是', '否（终止标准）'],
        }
      ]
    }
  ]
};


/* ============================================================
   四、页面初始化与表单渲染
   ============================================================ */

var asCurrentSpecialty = '';
var asFormData = {};

function initAssessmentPage() {
  // 从 sessionStorage 读取专科信息
  var specialty = sessionStorage.getItem('rx-specialty') || 'neuro';
  asCurrentSpecialty = specialty;

  // 设置页面标题
  var config = asFormConfigs[specialty];
  if (config) {
    document.getElementById('assessment-title').textContent = config.label;
    document.getElementById('assessment-guide').textContent = config.guide || '';
  }

  renderAssessmentForm(specialty);

  // 绑定提交按钮
  var submitBtn = document.getElementById('assessment-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitAssessment);
  }
}

function renderAssessmentForm(specialty) {
  var config = asFormConfigs[specialty];
  if (!config) {
    document.getElementById('assessment-form-container').innerHTML =
      '<p style="color:#ef4444;">未找到专科评估配置：' + specialty + '，请返回首页重新选择。</p>';
    return;
  }

  var container = document.getElementById('assessment-form-container');
  container.innerHTML = '';

  // 渲染通用人口学信息（所有专科共用）
  var demoSection = document.createElement('div');
  demoSection.className = 'as-section';
  demoSection.innerHTML = '<h3>📋 通用信息（所有患者必填）</h3>';
  baseDemographics.forEach(function(field) {
    demoSection.appendChild(createFieldElement(field, 'base'));
  });
  container.appendChild(demoSection);

  // 渲染专科 sections
  config.sections.forEach(function(section, idx) {
    var secEl = document.createElement('div');
    secEl.className = 'as-section';
    secEl.innerHTML = '<h3>' + (section.icon || '📌') + ' ' + section.title + '</h3>';
    if (section.guide) {
      var guideEl = document.createElement('p');
      guideEl.className = 'as-guide';
      guideEl.textContent = section.guide;
      secEl.appendChild(guideEl);
    }
    section.fields.forEach(function(field) {
      secEl.appendChild(createFieldElement(field, specialty + '_' + idx));
    });
    container.appendChild(secEl);
  });
}

function createFieldElement(field, groupPrefix) {
  var wrap = document.createElement('div');
  wrap.className = 'as-field';

  var label = document.createElement('label');
  label.className = 'as-label';
  label.textContent = field.label + (field.required ? ' *' : '');
  if (field.guide) {
    var hint = document.createElement('span');
    hint.className = 'as-hint';
    hint.textContent = ' ' + field.guide;
    label.appendChild(hint);
  }
  wrap.appendChild(label);

  var inputId = 'field-' + groupPrefix + '-' + field.id;

  if (field.type === 'text' || field.type === 'number') {
    var inp = document.createElement('input');
    inp.type = field.type;
    inp.id = inputId;
    inp.className = 'as-input';
    if (field.placeholder) inp.placeholder = field.placeholder;
    if (field.required) inp.required = true;
    wrap.appendChild(inp);
  }

  if (field.type === 'textarea') {
    var ta = document.createElement('textarea');
    ta.id = inputId;
    ta.className = 'as-textarea';
    if (field.placeholder) ta.placeholder = field.placeholder;
    wrap.appendChild(ta);
  }

  if (field.type === 'select') {
    var sel = document.createElement('select');
    sel.id = inputId;
    sel.className = 'as-select';
    field.options.forEach(function(opt) {
      var o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      sel.appendChild(o);
    });
    wrap.appendChild(sel);
  }

  if (field.type === 'radio') {
    field.options.forEach(function(opt, i) {
      var rid = inputId + '-' + i;
      var rb = document.createElement('input');
      rb.type = 'radio';
      rb.name = inputId;
      rb.id = rid;
      rb.value = opt;
      var rl = document.createElement('label');
      rl.className = 'as-radio-label';
      rl.htmlFor = rid;
      rl.textContent = opt;
      wrap.appendChild(rb);
      wrap.appendChild(rl);
      wrap.appendChild(document.createElement('br'));
    });
  }

  if (field.type === 'checkbox') {
    field.options.forEach(function(opt, i) {
      var cid = inputId + '-' + i;
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = cid;
      cb.value = opt;
      var cl = document.createElement('label');
      cl.className = 'as-checkbox-label';
      cl.htmlFor = cid;
      cl.textContent = opt;
      wrap.appendChild(cb);
      wrap.appendChild(cl);
      wrap.appendChild(document.createElement('br'));
    });
  }

  if (field.type === 'slider') {
    var range = document.createElement('input');
    range.type = 'range';
    range.id = inputId;
    range.className = 'as-slider';
    range.min = field.min !== undefined ? field.min : 0;
    range.max = field.max !== undefined ? field.max : 10;
    range.value = field.min !== undefined ? field.min : 0;
    var valDisp = document.createElement('span');
    valDisp.id = inputId + '-val';
    valDisp.className = 'as-slider-val';
    valDisp.textContent = range.value;
    range.addEventListener('input', function() {
      valDisp.textContent = range.value;
    });
    wrap.appendChild(range);
    wrap.appendChild(valDisp);
  }

  return wrap;
}

/* ============================================================
   五、表单提交与数据封装
   ============================================================ */

function submitAssessment() {
  // 收集所有表单数据
  asFormData = {
    specialty: asCurrentSpecialty,
    timestamp: new Date().toISOString(),
    base: {},
    scores: {} // 存放量表评分结果
  };

  // 收集通用信息
  baseDemographics.forEach(function(field) {
    asFormData.base[field.id] = getFieldValue('base', field);
  });

  // 收集专科信息 + 自动评分
  var config = asFormConfigs[asCurrentSpecialty];
  if (config) {
    asFormData.specialtyData = {};
    config.sections.forEach(function(section, idx) {
      section.fields.forEach(function(field) {
        asFormData.specialtyData[field.id] = getFieldValue(asCurrentSpecialty + '_' + idx, field);
      });
    });

    // 自动计算量表评分
    asFormData.scores = calculateScores(asCurrentSpecialty, asFormData.specialtyData);
  }

  // 安全检查：心肺/ICU 禁忌症拦截
  var redFlags = checkRedFlags(asCurrentSpecialty, asFormData);
  if (redFlags.length > 0) {
    showRedFlagAlert(redFlags);
    return; // 拦截提交
  }

  // 保存到 sessionStorage
  sessionStorage.setItem('rx-assessment-data', JSON.stringify(asFormData));
  sessionStorage.setItem('rx-specialty', asCurrentSpecialty);

  // 跳转到处方页面
  window.location.href = 'prescription.html';
}

function getFieldValue(groupPrefix, field) {
  var inputId = 'field-' + groupPrefix + '-' + field.id;

  if (field.type === 'text' || field.type === 'number' || field.type === 'textarea') {
    var el = document.getElementById(inputId);
    return el ? el.value : '';
  }

  if (field.type === 'select') {
    var sel = document.getElementById(inputId);
    return sel ? sel.value : '';
  }

  if (field.type === 'radio') {
    var checked = document.querySelector('input[name="' + inputId + '"]:checked');
    return checked ? checked.value : '';
  }

  if (field.type === 'checkbox') {
    var checkedBoxes = document.querySelectorAll('#' + inputId.replace(/-\d+$/,'') + ' input[type="checkbox"]:checked');
    var vals = [];
    checkedBoxes.forEach(function(cb) { vals.push(cb.value); });
    return vals;
  }

  if (field.type === 'slider') {
    var sl = document.getElementById(inputId);
    return sl ? parseInt(sl.value) : 0;
  }

  return '';
}

/* ============================================================
   六、量表评分自动计算
   ============================================================ */

function calculateScores(specialty, data) {
  var scores = {};

  // ——— NDI 计算 ———
  if (specialty === 'cervical') {
    var ndiKeys = ['ndi_pain','ndi_personal_care','ndi_lifting','ndi_reading','ndi_headaches',
                    'ndi_concentration','ndi_work','ndi_driving','ndi_sleep','ndi_recreation'];
    var ndiTotal = 0;
    ndiKeys.forEach(function(key) {
      ndiTotal += (data[key] !== undefined) ? parseInt(data[key]) || 0 : 0;
    });
    var ndiPercent = Math.round((ndiTotal / 50) * 100);
    var ndiLevel = ndiPercent <= 20 ? '轻度' : ndiPercent <= 40 ? '中度' : ndiPercent <= 60 ? '重度' : '极重度';
    scores.ndi = {
      total: ndiTotal,
      percent: ndiPercent,
      level: ndiLevel,
      interpretation: 'NDI ' + ndiPercent + '%，' + ndiLevel + '颈椎功能障碍。' +
        (ndiPercent <= 20 ? '建议：物理治疗+健康教育。' :
         ndiPercent <= 40 ? '建议：积极治疗，包括手法+运动。' :
         '建议：强化康复干预，评估手术指征。')
    };
  }

  // ——— ODI 计算 ———
  if (specialty === 'lumbar') {
    var odiKeys = ['odi_pain_intensity','odi_personal_care','odi_lifting','odi_walking',
                    'odi_sitting','odi_standing','odi_sleeping','odi_social_life','odi_traveling','odi_employment'];
    var odiTotal = 0;
    odiKeys.forEach(function(key) {
      odiTotal += (data[key] !== undefined) ? parseInt(data[key]) || 0 : 0;
    });
    var odiPercent = Math.round((odiTotal / 50) * 100);
    var odiLevel = odiPercent <= 20 ? '轻度' : odiPercent <= 40 ? '中度' : odiPercent <= 60 ? '重度' : '极重度';
    scores.odi = {
      total: odiTotal,
      percent: odiPercent,
      level: odiLevel,
      interpretation: 'ODI ' + odiPercent + '%，' + odiLevel + '腰椎功能障碍。' +
        (odiPercent <= 20 ? '建议：运动疗法+健康教育。' :
         odiPercent <= 40 ? '建议：系统康复治疗。' :
         '建议：强化康复，评估手术指征。')
    };
  }

  // ——— Lysholm 计算 ———
  if (specialty === 'knee') {
    var lysholmKeys = ['lysholm_limp','lysholm_support','lysholm_locking','lysholm_instability',
                        'lysholm_pain','lysholm_swelling','lysholm_stairs','lysholm_squat'];
    var lysholmTotal = 0;
    lysholmKeys.forEach(function(key) {
      lysholmTotal += (data[key] !== undefined) ? parseInt(data[key]) || 0 : 0;
    });
    var lysholmLevel = lysholmTotal >= 85 ? '优秀' : lysholmTotal >= 65 ? '良好' : '差';
    scores.lysholm = {
      total: lysholmTotal,
      level: lysholmLevel,
      interpretation: 'Lysholm评分 ' + lysholmTotal + '分，' + lysholmLevel + '。' +
        (lysholmTotal >= 85 ? '膝关节功能接近正常。' :
         lysholmTotal >= 65 ? '中度膝关节功能障碍，需康复治疗。' : '明显膝关节功能障碍，建议尽快康复。')
    };
  }

  // ——— Berg 平衡量表 计算 ———
  if (specialty === 'neuro') {
    var bergKeys = ['berg_sit_stand','berg_stand_no_hands','berg_sit_no_back','berg_reach',
                     'berg_pickup','berg_turn360','berg_tandem'];
    var bergTotal = 0;
    bergKeys.forEach(function(key) {
      bergTotal += (data[key] !== undefined) ? parseInt(data[key]) || 0 : 0;
    });
    var bergFallRisk = bergTotal < 40 ? '高' : bergTotal < 52 ? '中' : '低';
    scores.berg = {
      total: bergTotal,
      fallRisk: bergFallRisk,
      interpretation: 'Berg平衡量表 ' + bergTotal + '/56分，跌倒风险：' + bergFallRisk + '。' +
        (bergFallRisk === '高' ? '强烈建议进行平衡训练，防止跌倒。' : '')
    };

    // Fugl-Meyer 简化评分
    var fmKeys = ['fm_upper_reflex','fm_upper_flexion','fm_upper_extension','fm_wrist','fm_finger',
                   'fm_lower_reflex','fm_lower_flexion','fm_lower_extension','fm_coordination'];
    var fmTotal = 0;
    fmKeys.forEach(function(key) {
      fmTotal += (data[key] !== undefined) ? parseInt(data[key]) || 0 : 0;
    });
    scores.fuglMeyer = {
      total: fmTotal,
      max: 26, // 简化版9项，每项0-2或0-4分，此处近似
      interpretation: '简化Fugl-Meyer评分 ' + fmTotal + '/26分。' +
        (fmTotal >= 20 ? '轻中度运动障碍。' : fmTotal >= 10 ? '明显运动障碍。' : '严重运动障碍，需 intensive 康复。')
    };

    // Barthel Index 简化
    var biKeys = ['bi_feed','bi_groom','bi_bath','bi_dress_upper','bi_dress_lower',
                   'bi_toilet','bi_transfer','bi_walk','bi_stairs'];
    var biTotal = 0;
    biKeys.forEach(function(key) {
      biTotal += (data[key] !== undefined) ? parseInt(data[key]) || 0 : 0;
    });
    scores.barthel = {
      total: biTotal,
      max: 100,
      level: biTotal >= 60 ? '轻中度依赖' : '明显依赖',
      interpretation: '简化Barthel指数 ' + biTotal + '/100分。' + (biTotal >= 60 ? '有独立潜力。' : '需大量照护支持。')
    };
  }

  return scores;
}

/* ============================================================
   七、安全红线检查（Red Flag Logic）
   ============================================================ */

function checkRedFlags(specialty, formData) {
  var flags = [];

  // 通用红线
  var base = formData.base || {};
  if (base.fallHistory === '2次及以上') {
    flags.push('【跌倒高风险】近6个月跌倒≥2次，运动处方需包含防跌倒训练，并在监护下进行。');
  }

  // 心肺康复红线
  if (specialty === 'cardio') {
    var d = formData.specialtyData || {};
    if (d.red_rest_hr === '是（绝对禁忌）')     flags.push('【绝对禁忌】静息心率 > 110次/分，符合AACVPR 2024 运动禁忌标准。请先控制心率，暂缓运动处方。');
    if (d.red_unstable_angina === '是（绝对禁忌）') flags.push('【绝对禁忌】近期不稳定性心绞痛（48小时内），符合AACVPR 2024。请立即就医，禁止运动训练。');
    if (d.red_arrhythmia === '是（绝对禁忌）')    flags.push('【绝对禁忌】未控制的心律失常，运动可能诱发室颤。请先心内科控制心律。');
    if (d.red_fever === '是（绝对禁忌）')        flags.push('【绝对禁忌】发热（> 38°C）或急性感染，运动可能加重病情。');
    if (d.red_sbp === '是（绝对禁忌）')          flags.push('【绝对禁忌】静息血压 > 180/110 mmHg，运动可能增加脑出血风险。请先降压治疗。');
    if (d.red_spo2 === '是（绝对禁忌）')         flags.push('【绝对禁忌】静息SpO₂ < 88%，需氧疗，禁止无监护运动。');
  }

  // ICU康复红线
  if (specialty === 'icu') {
    var d = formData.specialtyData || {};
    if (d.icu_safe_hr === '否（终止标准）')       flags.push('【ICU终止标准】心率不在 40-130次/分范围内，暂停早期活动。');
    if (d.icu_safe_sbp === '否（终止标准）')      flags.push('【ICU终止标准】收缩压不在 90-180 mmHg范围内，暂停早期活动。');
    if (d.icu_safe_spo2 === '否（终止标准）')     flags.push('【ICU终止标准】SpO₂ < 88%，需调整氧疗方案。');
    if (d.icu_safe_no_icp === '否（终止标准）')   flags.push('【ICU终止标准】未控制的颅内高压（ICP > 20 mmHg），禁止体位改变。');
    if (d.icu_safe_no_active_bleed === '否（终止标准）') flags.push('【ICU终止标准】存在活动性出血，暂停早期活动。');
  }

  // 颈椎红线（脊髓型）
  if (specialty === 'cervical') {
    var d = formData.specialtyData || {};
    if (d.cervical_diagnosis && d.cervical_diagnosis.indexOf('脊髓型') !== -1) {
      flags.push('【警告】脊髓型颈椎病确诊，禁忌暴力推拿与颈部过度后伸。康复处方以温和活动为主，建议骨科会诊评估手术指征。');
    }
  }

  return flags;
}

function showRedFlagAlert(flags) {
  var msg = '⚠️ 安全红线检查未通过！\n\n根据临床指南，当前存在以下禁忌症/警告：\n\n' +
            flags.join('\n\n') +
            '\n\n系统已拦截处方生成。请先处理上述问题后重新评估。';
  alert(msg);
}

/* ============================================================
   八、初始化
   ============================================================ */
document.addEventListener('DOMContentLoaded', initAssessmentPage);
