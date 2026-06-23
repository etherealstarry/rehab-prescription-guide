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
    '肩胛痛': ['肩胛痛', '肩胛缝疼', '肩胛缝痛', '肩胛骨内侧疼', '肩胛骨内侧痛', '肩胛区疼痛', '肩胛骨疼', '后背疼', '后背痛', '肩胛背疼', '肩膀后面疼', '肩膀后面痛'],
    '髋痛': ['髋痛', '胯痛', '胯骨痛', '腹股沟痛', '大腿根痛', '髋关节痛', '髋部疼痛', '屁股前面痛', '走路髋痛', '髋部僵硬'],
    '膝痛': ['膝痛', '膝盖痛', '膝关节痛', '膝部疼痛', '膝盖疼痛', '膝关节炎', '膝部不适', '膝盖不适', '膝关节不适'],
    '踝痛': ['踝痛', '脚踝痛', '踝关节痛', '踝部疼痛', '崴脚痛', '崴脚后痛', '踝外侧痛', '踝内侧痛', '足背痛'],
    '足痛': ['足痛', '脚痛', '足底痛', '脚底痛', '足跟痛', '脚跟痛', '脚后跟痛', '走路足痛', '久站足痛'],
    '肘痛': ['肘痛', '胳膊肘痛', '手肘痛', '肘关节痛', '肘部疼痛', '拧毛巾痛', '端东西肘痛', '肘外侧痛', '肘内侧痛'],
    '腕痛': ['腕痛', '手腕痛', '腕部疼痛', '手腕酸痛', '腕关节痛', '长时间用手腕痛', '鼠标手痛', '腕部不适'],
    '腰痛': ['腰痛', '腰疼', '腰部疼痛', '腰杆痛', '下腰痛', '腰椎痛', '腰部不适', '腰杆不适', '腰酸'],
    '背痛': ['背痛', '背部痛', '后背痛', '胸椎痛', '背部不适', '后背不适', '背部僵硬', '后背僵硬'],
    '头晕': ['头晕', '眩晕', '头昏', '头沉', '头重', '天旋地转', '头昏沉沉', '眩晕症', '站不稳', '头昏眼花'],
    '头痛': ['头痛', '头疼', '头部疼痛', '偏头痛', '跳痛', '胀痛', '头部不适', '偏头疼'],
    '气短': ['气短', '气喘', '呼吸困难', '胸闷', '喘不上气', '活动后气短', '运动后气短', '呼吸不畅', '喘'],
    '步态异常': ['走路不稳', '跛行', '走路一瘸一拐', '走路腿没劲', '容易绊倒', '走路慢', '小碎步', '慌张步态', '剪刀步态'],
    '跟痛': ['跟痛', '足跟痛', '脚跟痛', '脚后跟痛', '早起下地痛', '足底筋膜炎', '跟腱痛']
  },

  /* =========================================================
     2. 症状 → 标准标签映射（用于语义归一化）
     ========================================================= */
  symptomToStandardTag: {
    '手麻': 'hand_numbness',
    '手痛': 'hand_pain',
    '颈痛': 'neck_pain',
    '肩痛': 'shoulder_pain',
    '肩胛痛': 'scapular_pain',
    '髋痛': 'hip_pain',
    '膝痛': 'knee_pain',
    '踝痛': 'ankle_pain',
    '足痛': 'foot_pain',
    '肘痛': 'elbow_pain',
    '腕痛': 'wrist_pain',
    '腰痛': 'low_back_pain',
    '背痛': 'thoracic_pain',
    '头晕': 'dizziness',
    '头痛': 'headache',
    '气短': 'dyspnea',
    '步态异常': 'gait_disorder'
  },

  /* =========================================================
     3. 标准标签 → 追问树映射（用于规则引擎）
     ========================================================= */
  standardTagToTree: {
    'hand_numbness': 'hand_numb',
    'hand_pain': 'hand_pain',
    'neck_pain': 'neck_pain',
    'shoulder_pain': 'shoulder_pain',
    'scapular_pain': 'scapular_pain',
    'hip_pain': 'hip_pain',
    'knee_pain': 'knee_pain',
    'ankle_pain': 'ankle_pain',
    'foot_pain': 'foot_pain',
    'elbow_pain': 'elbow_pain',
    'wrist_pain': 'wrist_pain',
    'low_back_pain': 'low_back_pain',
    'thoracic_pain': 'thoracic_pain',
    'dizziness': 'dizziness',
    'headache': 'headache',
    'dyspnea': 'dyspnea',
    'gait_disorder': 'gait_disorder'
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
      evidence: 'Cochrane Review 2023; APTA 眩晕CPG 2023'
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
      evidence: 'OARSI 2023; APTA 膝骨关节炎CPG 2020'
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
      evidence: 'ACCP 肺康复指南 2023'
    },
    {
      id: 'DIS_ASTHMA_010',
      name: '支气管哮喘（Bronchial Asthma）',
      standardTags: ['dyspnea'],
      keywords: ['喘息', '胸闷', '咳嗽变异性哮喘', '过敏原诱发', '可逆性气流受限'],
      physicalTests: ['支气管激发试验', '峰流速变异率'],
      prescriptionId: 'prescription_asthma',
      evidence: 'GINA 2023; ACCP 肺康复指南 2023'
    },
    {
      id: 'DIS_TSPINE_011',
      name: '胸椎小关节功能紊乱（Thoracic Facet Joint Dysfunction）',
      standardTags: ['thoracic_pain', 'scapular_pain'],
      keywords: ['上背痛', '肩胛间痛', '胸椎活动受限', '挺胸时痛', '久坐后背痛', '胸椎弹响'],
      physicalTests: ['胸椎棘突按压试验', '胸椎旋转试验'],
      prescriptionId: 'prescription_thoracic_joint',
      evidence: 'APTA 胸椎功能障碍临床实践指南 2022'
    },
    {
      id: 'DIS_RHOMBOID_012',
      name: '菱形肌劳损（Rhomboid Strain）',
      standardTags: ['scapular_pain'],
      keywords: ['肩胛骨内侧痛', '伏案后背痛', '久坐肩胛痛', '菱形肌压痛', '肩胛骨内侧按压痛'],
      physicalTests: ['菱形肌激发试验（手臂前屈抗阻）'],
      prescriptionId: 'prescription_rhomboid_strain',
      evidence: '康复评定学 第3版；肌肉骨骼康复学'
    },
    {
      id: 'DIS_SCAPULOTHORACIC_013',
      name: '肩胛胸壁综合征（Scapulothoracic Syndrome）',
      standardTags: ['scapular_pain'],
      keywords: ['肩胛骨弹响', '肩胛活动时痛', '肩胛骨摩擦音', '推墙痛', '肩胛骨内侧痛'],
      physicalTests: ['肩胛骨夹紧试验', '推墙试验'],
      prescriptionId: 'prescription_scapulothoracic',
      evidence: '骨科康复学 Ch.8；JOSPT 肩胛运动障碍临床指南'
    },
    {
      id: 'DIS_HIP_OA_014',
      name: '髋骨关节炎（Hip Osteoarthritis）',
      standardTags: ['hip_pain'],
      keywords: ['髋痛', '腹股沟痛', '走路髋痛', '髋部僵硬', '屈曲受限', '髋关节炎'],
      physicalTests: ['髋关节活动度测试', 'Trendelenburg试验'],
      prescriptionId: 'prescription_hip_oa',
      evidence: 'APTA 髋膝骨关节炎CPG 2020; OARSI 2021'
    },
    {
      id: 'DIS_HIP_FAI_015',
      name: '股骨髋臼撞击综合征（FAI）',
      standardTags: ['hip_pain'],
      keywords: ['髋前部痛', '屈曲内旋痛', '久坐后站起痛', '运动髋痛', '腹股沟痛'],
      physicalTests: ['FADIR测试（屈曲内旋痛）', 'FABER测试'],
      prescriptionId: 'prescription_hip_fai',
      evidence: 'JOSPT 髋痛临床指南 2018'
    },
    {
      id: 'DIS_ANKLE_SPRAIN_016',
      name: '踝关节扭伤（Ankle Sprain）',
      standardTags: ['ankle_pain'],
      keywords: ['崴脚', '崴脚后痛', '踝外侧痛', '踝部肿胀', '走路不稳', '踝关节扭伤'],
      physicalTests: ['前抽屉试验', '距骨倾斜试验'],
      prescriptionId: 'prescription_ankle_sprain',
      evidence: 'APTA 踝扭伤临床指南 2021'
    },
    {
      id: 'DIS_PLANTAR_017',
      name: '足底筋膜炎（Plantar Fasciitis）',
      standardTags: ['foot_pain'],
      keywords: ['足跟痛', '早起下地痛', '足底痛', '久站足痛', '脚跟痛', '足底筋膜炎'],
      physicalTests: ['足底筋膜压痛', 'Windlass试验'],
      prescriptionId: 'prescription_plantar',
      evidence: 'JOrtho Sports Phys Ther 2014'
    },
    {
      id: 'DIS_TENNIS_ELBOW_018',
      name: '网球肘（外侧上髁炎）',
      standardTags: ['elbow_pain'],
      keywords: ['肘外侧痛', '拧毛巾痛', '端东西肘痛', '肘部酸痛', '网球肘', '外侧上髁炎'],
      physicalTests: ['Cozen试验', 'Mill试验'],
      prescriptionId: 'prescription_tennis_elbow',
      evidence: 'APTA 肘痛临床指南 2019'
    },
    {
      id: 'DIS_GOLFER_ELBOW_019',
      name: '高尔夫球肘（内侧上髁炎）',
      standardTags: ['elbow_pain'],
      keywords: ['肘内侧痛', '握拳无力', '屈腕时肘痛', '高尔夫球肘', '内侧上髁炎'],
      physicalTests: ['屈腕抗阻痛', '内侧上髁压痛'],
      prescriptionId: 'prescription_golfer_elbow',
      evidence: 'APTA 肘痛临床指南 2019'
    },
    {
      id: 'DIS_DEQUERVAIN_020',
      name: '桡骨茎突狭窄性腱鞘炎（De Quervain）',
      standardTags: ['wrist_pain'],
      keywords: ['腕部酸痛', '手腕痛', '握拳腕痛', '抱婴儿手腕痛', '鼠标手痛', '桡骨茎突痛'],
      physicalTests: ['Finkelstein试验'],
      prescriptionId: 'prescription_dequervain',
      evidence: '手外科学会临床指南 2020'
    },
    {
      id: 'DIS_NEUROGENIC_CLAUDICATION_021',
      name: '神经源性跛行（腰椎管狭窄）',
      standardTags: ['gait_disorder', 'low_back_pain'],
      keywords: ['走路腿没劲', '走路后坐下缓解', '弯腰骑车不痛', '间歇性跛行', '腰椎管狭窄'],
      physicalTests: ['直腿抬高试验', '神经张力测试'],
      prescriptionId: 'prescription_neurogenic_claudication',
      evidence: 'APTA 腰椎管狭窄CPG 2021'
    },
    {
      id: 'DIS_PARKINSONS_022',
      name: '帕金森病步态障碍（Parkinsonism）',
      standardTags: ['gait_disorder'],
      keywords: ['小碎步', '慌张步态', '起步困难', '走路慢', '帕金森步态', '冻结步态'],
      physicalTests: ['UPDRS步态评分', 'Timed Up & Go'],
      prescriptionId: 'prescription_parkinsons_gait',
      evidence: 'MDS 帕金森病康复指南 2022'
    },
    {
      id: 'DIS_CERVICAL_SOMATIC_023',
      name: '颈型颈椎病（Cervical Somatic Pain）',
      standardTags: ['neck_pain'],
      keywords: ['颈痛', '脖子僵硬', '低头加重', '久坐颈痛', '颈肩酸痛'],
      physicalTests: ['颈椎活动度测试', '姿势负荷测试'],
      prescriptionId: 'prescription_cervical_somatic',
      evidence: 'APTA 颈痛CPG 2021'
    },
    {
      id: 'DIS_CERVICOGENIC_HA_024',
      name: '颈源性头痛（Cervicogenic Headache）',
      standardTags: ['neck_pain', 'headache'],
      keywords: ['头痛', '后脑勺痛', '颈痛伴头痛', '低头诱发头痛', '枕大神经痛'],
      physicalTests: ['颈椎诱发试验', '枕大神经压痛'],
      prescriptionId: 'prescription_cervicogenic_headache',
      evidence: 'ICHD-3; APTA 颈痛CPG 2021'
    },
    {
      id: 'DIS_RA_HAND_025',
      name: '类风湿关节炎（Rheumatoid Arthritis）',
      standardTags: ['hand_pain'],
      keywords: ['手指晨僵', '多关节对称痛', '手指关节肿胀', '类风湿因子阳性', '手部尺侧偏'],
      physicalTests: ['关节肿胀指数', '握力测试'],
      prescriptionId: 'prescription_ra_hand',
      evidence: 'ACR 类风湿关节炎诊疗指南 2023'
    },
    {
      id: 'DIS_HAND_OA_026',
      name: '手指骨关节炎（Hand Osteoarthritis）',
      standardTags: ['hand_pain'],
      keywords: ['手指关节疼痛', 'Heberden结节', 'Bouchard结节', '晨僵<30分钟', '手工劳动后加重'],
      physicalTests: ['关节摩擦音检查', '关节活动度测试'],
      prescriptionId: 'prescription_hand_oa',
      evidence: 'ACR 手OA诊疗指南 2021'
    },
    {
      id: 'DIS_ACHILLES_TENDINOPATHY_029',
      name: '跟腱病变（Achilles Tendinopathy）',
      standardTags: ['ankle_pain', 'foot_pain'],
      keywords: ['跟痛', '足跟痛', '早起下地痛', '跟腱区压痛', '蹬地痛', '跟腱病变'],
      physicalTests: ['Royal London Hospital Test', 'Thompson Test'],
      prescriptionId: 'prescription_achilles_tendinopathy',
      evidence: 'APTA 跟腱疼痛CPG 2024'
    },
    {
      id: 'DIS_MIGRAINE_027',
      name: '偏头痛（Migraine）',
      standardTags: ['headache'],
      keywords: ['搏动性头痛', '单侧头痛', '恶心', '怕光', '偏头痛家族史'],
      physicalTests: ['偏头痛问卷', '神经系统查体'],
      prescriptionId: 'prescription_migraine',
      evidence: 'ICHD-3; 中国偏头痛诊疗指南 2023'
    },
    {
      id: 'DIS_TENSION_HA_028',
      name: '紧张性头痛（Tension-Type Headache）',
      standardTags: ['headache'],
      keywords: ['压迫感头痛', '紧箍感', '双侧头痛', '情绪紧张诱发', '睡眠质量差伴头痛'],
      physicalTests: ['头痛日记', '压痛阈测试'],
      prescriptionId: 'prescription_tension_ha',
      evidence: 'ICHD-3; 中国头痛诊疗指南 2023'
    },
    {
      id: 'DIS_SCOLIOSIS_030',
      name: '青少年特发性脊柱侧凸（Adolescent Idiopathic Scoliosis）',
      standardTags: ['thoracic_pain', 'back_pain'],
      keywords: ['脊柱侧弯', '肩膀不等高', '肩胛骨突出', '腰部不对称', '弯腰后背部不对称', 'Adams试验阳性'],
      physicalTests: ['Adams前屈试验', '脊柱X线Cobb角测量'],
      prescriptionId: 'prescription_scoliosis',
      evidence: 'CMA 青少年特发性脊柱侧凸康复诊疗指南 2024'
    },
    {
      id: 'DIS_OP_031',
      name: '骨质疏松症（Osteoporosis）',
      standardTags: ['back_pain', 'thoracic_pain'],
      keywords: ['骨密度降低', '脆性骨折', '腰背酸痛', '身高变矮', 'T值≤-2.5', 'DXA检查'],
      physicalTests: ['骨密度DXA检查', '骨折风险评估（FRAX）'],
      prescriptionId: 'prescription_osteoporosis',
      evidence: 'CMA 骨质疏松症康复治疗指南 2024'
    },
    {
      id: 'DIS_CHD_032',
      name: '冠心病康复治疗（Coronary Heart Disease Rehab）',
      standardTags: ['dyspnea'],
      keywords: ['胸痛', '胸闷', '气短', '运动后诱发', 'PCI术后', 'CABG术后', '心肌梗死后', '冠心病危险因素'],
      physicalTests: ['心肺运动试验（CPET）', '6分钟步行试验', '心电图运动试验'],
      prescriptionId: 'prescription_chd',
      evidence: 'CMA 冠心病康复指南 2024'
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
    },
    'prescription_thoracic_joint': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '胸椎关节松动（Maitland Grade I-II）+ 姿势再训练',
        validity: '急性期（<2周）',
        progression: '疼痛耐受后增加关节松动强度'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（关节松动无疼痛）',
        time: '每次15-20分钟',
        type: '胸椎旋转徒手治疗 + 菱形肌强化 + 姿势矫正训练',
        validity: '亚急性期后开始',
        progression: '关节活动度增大 + 耐力训练'
      }
    },
    'prescription_rhomboid_strain': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '菱形肌拉伸 + 冰敷（前48h）+ 姿势矫正',
        validity: '急性期（<2周）',
        progression: '疼痛减轻后开始等长收缩'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无疼痛）',
        time: '每次15-20分钟',
        type: '菱形肌强化（划船动作）+ 胸椎灵活性训练 + 姿势再训练',
        validity: '亚急性期后开始',
        progression: '阻力逐渐增大 + 重复性动作训练'
      }
    },
    'prescription_scapulothoracic': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '肩胛骨活动度训练 + 冰敷（前48h）+ 姿势矫正',
        validity: '急性期（<2周）',
        progression: '疼痛耐受后增加活动范围'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无疼痛）',
        time: '每次15-20分钟',
        type: '肩胛稳定肌群强化（前锯肌/下斜方肌）+ 胸椎灵活性 + 动作模式再训练',
        validity: '亚急性期后开始',
        progression: '抗阻训练 + 功能性动作整合'
      }
    },
    'prescription_hip_oa': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '髋关节活动度维持 + 非承重肌力训练（仰卧/侧卧）',
        validity: '急性期（<2周，疼痛明显时）',
        progression: '疼痛减轻后增加承重训练'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（疼痛VAS <3/10）',
        time: '每次20-30分钟',
        type: '髋周肌群强化（臀中肌/臀大肌）+ 有氧（固定单车/游泳）+ 体重管理',
        validity: '亚急性期后开始，长期维持',
        progression: '从非承重 → 部分承重 → 全承重抗阻'
      }
    },
    'prescription_hip_fai': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '髋关节活动度维持（避免终末端）+ 核心稳定性',
        validity: '急性期（<2周，屈曲内旋痛明显）',
        progression: '疼痛耐受后增加髋周肌力'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无疼痛）',
        time: '每次20-30分钟',
        type: '髋外展/外旋肌群强化 + 动态稳定性训练 + 运动专项动作模式训练',
        validity: '疼痛消失后开始',
        progression: '从基础肌力 → 功能性动作 → 运动回归'
      }
    },
    'prescription_ankle_sprain': {
      acute: {
        frequency: '每日2-3次（负重训练除外）',
        intensity: '低（疼痛VAS <3/10）',
        time: '每次10-15分钟',
        type: 'POLICE原则（保护/最佳负荷/冰敷/加压/抬高）+ 早期活动度',
        validity: '急性期（<72小时）',
        progression: '肿胀消退后开始负重训练'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无疼痛/不稳感）',
        time: '每次20-30分钟',
        type: '本体感觉训练 + 动态稳定性 + 向心/离心肌力训练 + 运动专项训练',
        validity: '可单腿站立30秒后开始',
        progression: '从稳定平面 → 不稳定平面 → 跳跃/变向训练'
      }
    },
    'prescription_plantar': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '足底筋膜拉伸（Windlass试验阴性）+ 冰敷（前48h）+ 足弓支撑',
        validity: '急性期（晨起痛明显）',
        progression: '疼痛减轻后增加负荷'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无晨起痛）',
        time: '每次15-20分钟',
        type: '足底筋膜拉伸 + 小腿三头肌离心训练 + 足内在肌强化 + 渐进性负重',
        validity: '疼痛消失后开始',
        progression: '从被动拉伸 → 主动强化 → 功能性负重'
      }
    },
    'prescription_tennis_elbow': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '外侧上髁冰敷（前48h）+ 腕关节中立位保护 + 离心训练（无痛范围内）',
        validity: '急性期（<2周）',
        progression: '疼痛耐受后增加离心负荷'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无疼痛）',
        time: '每次15-20分钟',
        type: '腕伸肌离心训练 + 前臂肌力强化 + 渐进性抗阻训练 + 动作模式再训练',
        validity: '疼痛消失后开始',
        progression: '从离心训练 → 向心训练 → 功能性动作整合'
      }
    },
    'prescription_golfer_elbow': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '内侧上髁冰敷（前48h）+ 腕关节保护 + 无痛范围内活动度训练',
        validity: '急性期（<2周）',
        progression: '疼痛减轻后开始离心训练'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无疼痛）',
        time: '每次15-20分钟',
        type: '腕屈肌离心训练 + 前臂肌力强化 + 渐进性抗阻训练 + 手部抓握力训练',
        validity: '疼痛消失后开始',
        progression: '从离心训练 → 向心训练 → 功能性动作整合'
      }
    },
    'prescription_dequervain': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '桡骨茎突冰敷（前48h）+ 拇指外展位制动（短石膏/支具）+ 无痛活动度',
        validity: '急性期（<2周）',
        progression: '炎症消退后开始活动度训练'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无疼痛）',
        time: '每次15-20分钟',
        type: '拇指外展/对掌肌群强化 + 桡侧腕伸肌离心训练 + 渐进性抗阻训练',
        validity: '疼痛消失后开始',
        progression: '从 isometric 收缩 → 动态抗阻 → 功能性动作'
      }
    },
    'prescription_neurogenic_claudication': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '腰椎屈曲位训练（骑车/俯卧撑）+ 核心稳定性（避免伸展动作）',
        validity: '急性期（跛行明显时）',
        progression: '症状缓解后增加步行距离'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无痛性跛行）',
        time: '每次20-30分钟',
        type: '步行训练（分段式，症状出现前停止）+ 核心稳定性 + 有氧（固定单车/游泳）',
        validity: '症状稳定后开始',
        progression: '从分段步行 → 连续步行 → 增加步行速度/距离'
      }
    },
    'prescription_parkinsons_gait': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疲劳度VAS <4/10）',
        time: '每次10-15分钟',
        type: '床上/坐位平衡训练 + 转移训练（坐-站）+ 辅助下步行训练',
        validity: '急性期（"关"期/运动波动明显时）',
        progression: '疲劳耐受后增加训练强度'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无过度疲劳）',
        time: '每次20-30分钟',
        type: 'L-dopa药物治疗时机匹配训练 + 外部提示步行训练（节拍器/地面标记）+ 平衡/防跌倒训练 + 有氧运动',
        validity: '"开"期进行，长期坚持',
        progression: '从辅助步行 → 独立步行 → 复杂地形步行'
      }
    },

    'prescription_cervical_somatic': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '颈椎关节松动（Maitland Grade I-II）+ 姿势再训练',
        validity: '急性期（<2周）',
        progression: '疼痛耐受后增加关节松动强度'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（关节松动无疼痛）',
        time: '每次15-20分钟',
        type: '颈椎稳定性训练 + 颈深屈肌强化 + 姿势矫正训练',
        validity: '亚急性期后开始',
        progression: '从 isometric 收缩 → 动态抗阻 → 功能性动作整合'
      }
    },
    'prescription_cervicogenic_headache': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '颈椎手法治疗（上颈段）+ 枕下肌群拉伸',
        validity: '头痛急性期',
        progression: '疼痛减轻后增加颈椎稳定性训练'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无疼痛）',
        time: '每次15-20分钟',
        type: '颈椎稳定性 + 枕下肌群强化 + 姿势矫正 + 有氧运动',
        validity: '疼痛消失后开始',
        progression: '从徒手治疗 → 主动训练 → 家庭自我管理'
      }
    },
    'prescription_ra_hand': {
      acute: {
        frequency: '每日1-2次（炎症期减量）',
        intensity: '低（疼痛VAS <5/10，避免关节红肿时训练）',
        time: '每次5-10分钟',
        type: '关节保护性活动度训练 + 冷疗（红肿时）',
        validity: '炎症活动期',
        progression: '炎症控制后增加训练强度'
      },
      chronic: {
        frequency: '每日2-3次',
        intensity: '中（无红肿热痛）',
        time: '每次15-20分钟',
        type: '手部小关节活动度 + 握力训练 + 能量节省技术训练',
        validity: '慢性炎症控制后',
        progression: '从被动活动 → 主动辅助 → 抗阻训练'
      }
    },
    'prescription_hand_oa': {
      acute: {
        frequency: '每日2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '手指关节活动度维持 + 冷疗（急性痛时）',
        validity: '急性期（疼痛明显时）',
        progression: '疼痛减轻后增加功能性活动训练'
      },
      chronic: {
        frequency: '每日3-5次',
        intensity: '中（无疼痛）',
        time: '每次15-20分钟',
        type: '手部精细动作训练 + 握力/捏力训练 + 关节保护技术',
        validity: '疼痛消失后开始',
        progression: '从基础抓握 → 精细操作 → 工具使用'
      }
    },
    'prescription_achilles_tendinopathy': {
      acute: {
        frequency: '每周2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '跟腱保护 + 冰敷（前48h）+ 离心训练（无痛范围内）',
        validity: '急性期（<2周）',
        progression: '疼痛耐受后增加离心负荷'
      },
      chronic: {
        frequency: '每周3-5次',
        intensity: '中（无疼痛）',
        time: '每次15-20分钟',
        type: '跟腱离心训练（Hémidand et al. 2024方案）+ 渐进性负荷训练 + 运动专项训练',
        validity: '疼痛消失后开始',
        progression: '从离心训练 → 能量储存训练 → 运动回归'
      }
    },
    'prescription_tension_ha': {
      acute: {
        frequency: '每周2-3次',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '放松训练（渐进性肌肉放松）+ 颈肩手法放松',
        validity: '头痛急性期',
        progression: '疼痛减轻后增加主动训练'
      },
      chronic: {
        frequency: '每周3-5次',
        intensity: '中（无疼痛）',
        time: '每次15-20分钟',
        type: '有氧运动 + 压力管理 + 睡眠质量改善训练 + 颈肩姿势矫正',
        validity: '头痛控制稳定后',
        progression: '从放松训练 → 规律运动 → 心理干预整合'
      }
    },
    'prescription_scoliosis': {
      acute: {
        frequency: '每周2-3次（医师指导）',
        intensity: '低（Cobb角<20°）',
        time: '每次20-30分钟',
        type: '脊柱侧弯特定运动训练（PSSE）+ 呼吸训练',
        validity: 'Cobb角10-20°（轻度）',
        progression: '姿势控制改善后增加训练强度'
      },
      chronic: {
        frequency: '每周3-5次',
        intensity: '中（Cobb角20-40°）',
        time: '每次30-45分钟',
        type: 'PSSE + 支具治疗（如适用）+ 核心稳定性训练 + 有氧运动',
        validity: 'Cobb角20-40°（中度，生长潜力仍存在）',
        progression: '从基础训练 → 功能性训练 → 运动专项训练'
      }
    },
    'prescription_osteoporosis': {
      acute: {
        frequency: '每周2-3次（骨折后）',
        intensity: '低（疼痛VAS <4/10）',
        time: '每次10-15分钟',
        type: '骨折后保护 + 早期活动（避免跌倒）+ 疼痛管理',
        validity: '骨折急性期',
        progression: '骨折愈合后增加负重训练'
      },
      chronic: {
        frequency: '每周3-5次',
        intensity: '中（无骨折风险）',
        time: '每次30-45分钟',
        type: '负重运动（步行/慢跑）+ 抗阻训练（渐进性）+ 平衡训练（防跌倒）+ 钙/维生素D补充',
        validity: '骨折愈合后，长期维持',
        progression: '从低冲击负重 → 高冲击负重 → 抗阻训练'
      }
    },
    'prescription_chd': {
      acute: {
        frequency: '每周2-3次（医师指导）',
        intensity: '低（RPE <3/10，心率<100次/分）',
        time: '每次10-15分钟',
        type: '急性期保护 + 床边活动（避免跌倒）+ 疼痛管理',
        validity: 'AMI后24-48h或PCI/CABG术后',
        progression: '病情稳定后增加活动强度'
      },
      chronic: {
        frequency: '每周3-5次',
        intensity: '中（RPE 3-6/10，心率储备40-59%）',
        time: '每次30-60分钟',
        type: '有氧运动（步行/固定单车）+ 抗阻训练（渐进性）+ 心脏危险因素管理 + 心理支持',
        validity: '病情稳定后，长期维持',
        progression: '从低强度有氧 → 中等强度有氧 → 抗阻训练 + 运动回归'
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
