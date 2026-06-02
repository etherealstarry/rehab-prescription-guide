/* ===========================================================
   disease-knowledge-base.js — 核心疾病知识库（结构化）
   用于语义归一化和规则引擎检索
   =========================================================== */

const DiseaseKnowledgeBase = {
  version: '1.0.0',
  lastUpdated: '2026-06-02',
  description: '康复处方指南核心疾病知识库，用于语义归一化和规则引擎检索',

  /* =========================================================
     1. 症状同义词库（用于语义归一化）
     ========================================================= */
  symptomSynonyms: {
    '手麻': ['手麻', '手指麻', '手掌麻', '胳膊麻', '手臂麻', '上肢麻', '手部麻木', '手指麻木', '手掌麻木', '胳膊麻木', '手臂麻木', '上肢麻木', '左手麻', '右手麻', '手指发麻', '手发木', '爪形手', '小指麻', '无名指麻'],
    '手痛': ['手痛', '手指痛', '手掌痛', '胳膊痛', '手臂痛', '上肢痛', '手部疼痛', '手指疼痛', '手掌疼痛', '胳膊疼痛', '手臂疼痛', '上肢疼痛'],
    '颈痛': ['颈痛', '脖子痛', '颈部疼痛', '脖子疼痛', '颈肩痛', '颈椎病', '颈部不适', '脖子不适', '脖子僵硬', '颈部僵硬'],
    '肩痛': ['肩痛', '肩膀痛', '肩部疼痛', '肩膀疼痛', '肩袖损伤', '肩周炎', '肩部不适', '肩膀不适', '抬臂痛'],
    '膝痛': ['膝痛', '膝盖痛', '膝关节痛', '膝部疼痛', '膝盖疼痛', '膝关节炎', '膝部不适', '膝盖不适', '膝关节不适'],
    '腰痛': ['腰痛', '腰疼', '腰部疼痛', '腰杆痛', '下腰痛', '腰椎痛', '腰部不适', '腰杆不适', '腰酸'],
    '头晕': ['头晕', '眩晕', '头昏', '头沉', '头重', '天旋地转', '头昏沉沉', '眩晕症', '站不稳', '头昏眼花'],
    '头痛': ['头痛', '头疼', '头部疼痛', '偏头痛', '跳痛', '胀痛', '头部不适', '偏头疼'],
    '气短': ['气短', '气喘', '呼吸困难', '胸闷', '喘不上气', '活动后气短', '运动后气短', '呼吸不畅', '喘']
  },

  /* =========================================================
     2. 症状 → 标准标签映射（用于语义归一化）
     ========================================================= */
  symptomToStandardTag: {
    '手麻': 'hand_numbness',
    '手痛': 'hand_pain',
    '颈痛': 'neck_pain',
    '肩痛': 'shoulder_pain',
    '膝痛': 'knee_pain',
    '腰痛': 'low_back_pain',
    '头晕': 'dizziness',
    '头痛': 'headache',
    '气短': 'dyspnea'
  },

  /* =========================================================
     3. 标准标签 → 追问树映射（用于规则引擎）
     ========================================================= */
  standardTagToTree: {
    'hand_numbness': 'hand_numb',
    'hand_pain': 'hand_pain',
    'neck_pain': 'neck_pain',
    'shoulder_pain': 'shoulder_pain',
    'knee_pain': 'knee_pain',
    'low_back_pain': 'low_back_pain',
    'dizziness': 'dizziness',
    'headache': 'headache',
    'dyspnea': 'dyspnea'
  },

  /* =========================================================
     4. 疾病库（用于RAG检索增强生成）
     ========================================================= */
  diseases: [
    {
      id: 'DIS_CTS_001',
      name: '腕管综合征（Median Nerve Entrapment）',
      standardTags: ['hand_numbness', 'hand_pain'],
      keywords: ['大拇指麻', '食指麻', '中指麻', '夜间麻醒', '鱼际肌萎缩', '屈腕试验阳性', '叩击试验阳性'],
      physicalTests: ['Phalen Test', 'Tinel Sign'],
      prescriptionId: 'prescription_cts',
      evidence: 'APTA 腕管综合征临床实践指南 2021'
    },
    {
      id: 'DIS_CUBITAL_002',
      name: '肘管综合征（Ulnar Nerve Entrapment at Elbow）',
      standardTags: ['hand_numbness', 'hand_pain'],
      keywords: ['小指麻', '无名指麻', '尺侧一半麻木', '爪形手', 'Froment征阳性', '肘外翻加重'],
      physicalTests: ['Elbow Flexion Test', 'Tinel Sign at Elbow'],
      prescriptionId: 'prescription_cubital',
      evidence: 'APTA 肘管综合征临床实践指南 2020'
    },
    {
      id: 'DIS_CR_003',
      name: '神经根型颈椎病（Cervical Radiculopathy）',
      standardTags: ['neck_pain', 'hand_numbness'],
      keywords: ['颈痛', '上肢放射痛', '手指麻木', 'Spurling试验阳性', '上肢无力'],
      physicalTests: ['Spurling Test', 'ULTT'],
      prescriptionId: 'prescription_cervical_radiculopathy',
      evidence: 'APTA 颈痛CPG 2021 + JOSPT'
    },
    {
      id: 'DIS_BPPV_004',
      name: '良性阵发性位置性眩晕（BPPV）',
      standardTags: ['dizziness'],
      keywords: ['天旋地转', '位置性眩晕', 'Dix-Hallpike阳性', '耳石症'],
      physicalTests: ['Dix-Hallpike Test'],
      prescriptionId: 'prescription_bppv',
      evidence: 'Cochrane Review 2015; APTA 眩晕CPG'
    },
    {
      id: 'DIS_RCT_005',
      name: '肩袖损伤（Rotator Cuff Tear）',
      standardTags: ['shoulder_pain'],
      keywords: ['肩痛', '抬臂痛', '疼痛弧', 'Jobe试验阳性', 'Drop Arm征阳性'],
      physicalTests: ['Painful Arc Test', 'Jobe Test (Empty Can)'],
      prescriptionId: 'prescription_rotator_cuff',
      evidence: 'APTA 肩痛CPG 2019'
    },
    {
      id: 'DIS_ACL_006',
      name: '前交叉韧带重建术后（ACL Reconstruction）',
      standardTags: ['knee_pain'],
      keywords: ['膝关节术后', '伸直受限', '股四头肌萎缩', 'Lachman试验阳性'],
      physicalTests: ['Anterior Drawer Test', 'Lachman Test'],
      prescriptionId: 'prescription_acl_reconstruction',
      evidence: 'APTA 膝骨关节炎CPG 2020'
    },
    {
      id: 'DIS_KOA_007',
      name: '膝骨关节炎（Knee Osteoarthritis）',
      standardTags: ['knee_pain'],
      keywords: ['膝痛', '上下楼梯痛', '晨僵', '骨摩擦音', '膝关节变形'],
      physicalTests: ['McMurray Test', '浮髌试验'],
      prescriptionId: 'prescription_knee_oa',
      evidence: 'APTA 膝骨关节炎CPG 2020; OARSI 2021'
    },
    {
      id: 'DIS_LBP_008',
      name: '非特异性下背痛（Non-specific Low Back Pain）',
      standardTags: ['low_back_pain'],
      keywords: ['腰痛', '腰部僵硬', '活动后缓解', '直腿抬高阴性'],
      physicalTests: ['SLR Test'],
      prescriptionId: 'prescription_low_back_pain',
      evidence: 'APTA 下背痛CPG 2021'
    },
    {
      id: 'DIS_COPD_009',
      name: '慢性阻塞性肺疾病（COPD）',
      standardTags: ['dyspnea'],
      keywords: ['气短', '慢性咳嗽', '咳痰', '吸烟史', 'FEV1/FVC <0.7'],
      physicalTests: ['6MWT'],
      prescriptionId: 'prescription_copd',
      evidence: 'ACCP 肺康复指南 2019'
    },
    {
      id: 'DIS_ASTHMA_010',
      name: '支气管哮喘（Bronchial Asthma）',
      standardTags: ['dyspnea'],
      keywords: ['喘息', '胸闷', '咳嗽变异性哮喘', '过敏原诱发', '可逆性气流受限'],
      physicalTests: ['支气管激发试验', '峰流速变异率'],
      prescriptionId: 'prescription_asthma',
      evidence: 'GINA 2023; ACCP 肺康复指南'
    }
  ],

  /* =========================================================
     5. 物理测试库（用于RAG生成追问）
     ========================================================= */
  physicalTests: {
    'Phalen Test': {
      id: 'TEST_PHALEN',
      name: '屈腕试验',
      description: '坐位，双腕极度屈曲（掌心相对，手背相贴），维持60秒。',
      positiveCriteria: '60秒内出现正中神经支配区（拇指、食指、中指）麻木/刺痛',
      videoLink: '',
      imageLink: ''
    },
    'Spurling Test': {
      id: 'TEST_SPURLING',
      name: '压顶试验',
      description: '坐位，头向患侧侧屈+后伸，检查者向下压头顶。',
      positiveCriteria: '诱发患侧上肢放射性疼痛/麻木',
      videoLink: '',
      imageLink: ''
    },
    'Dix-Hallpike Test': {
      id: 'TEST_DIX_HALLPIKE',
      name: 'Dix-Hallpike试验',
      description: '坐位，头向一侧转45°，快速躺下（头悬垂床沿30°），维持30-60秒。',
      positiveCriteria: '诱发出天旋地转+垂直眼震（持续数秒到1分钟）',
      warning: '⚠️ 此测试可能诱发剧烈眩晕，请在他人陪同下进行！',
      videoLink: '',
      imageLink: ''
    }
  },

  /* =========================================================
     6. 循证处方库（FITT-VP标准化）
     ========================================================= */
  prescriptions: {
    'prescription_cts': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（麻木VAS <3/10）',
        time: '每次10-15分钟',
        type: '神经滑动 + 腕关节中立位保护',
        validity: '急性期（<2周）',
        progression: '麻木耐受后增加神经滑动幅度'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（神经滑动无疼痛）',
        time: '每次15-20分钟',
        type: '正中神经滑动 + 肌内效贴 + 肌耐力训练',
        validity: '亚急性期后开始',
        progression: '滑动幅度逐渐增大 + 抗阻训练'
      }
    },
    'prescription_bppv': {
      acute: {
        frequency: '每周2-3次（医师指导）',
        intensity: '低（复位后24h内避免剧烈头动）',
        time: '每次10-15分钟',
        type: 'Epley复位法 + 家庭前庭康复',
        validity: 'Dix-Hallpike阳性后开始',
        progression: '复位成功后改为家庭训练'
      },
      chronic: {
        frequency: '每日2次',
        intensity: '中（眩晕VAS <3/10）',
        time: '每次15-20分钟',
        type: '前庭康复 + 平衡训练 + 颈椎稳定性',
        validity: '复位后1周开始',
        progression: '头动速度逐渐加快 + 闭眼挑战'
      }
    }
  }
};

/* 暴露接口 */
if (typeof window !== 'undefined') {
  window.DiseaseKnowledgeBase = DiseaseKnowledgeBase;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiseaseKnowledgeBase;
}
