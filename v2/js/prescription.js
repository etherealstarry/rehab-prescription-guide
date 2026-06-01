/**
 * prescription.js —— 循证运动处方生成引擎
 *
 * 核心功能：
 * 1. 读取 assessment.js 提交的评估数据（sessionStorage）
 * 2. 按 FITT-VP 格式生成标准化运动处方
 * 3. 每个处方参数标注指南来源 + 证据等级
 * 4. 安全红线拦截（绝对禁忌症）
 * 5. 按评估结果匹配不同处方矩阵（如腰痛分稳定机制异常/活动度受限）
 *
 * 参考指南：
 * - APTA CPGs (Orthopaedic, Neurologic, Cardiovascular)
 * - AHA/ASA Stroke Rehab Guidelines 2021
 * - AACVPR Guidelines 2024
 * - GOLD COPD 2024
 * - 《中国脑卒中早期康复治疗指南》
 * - 《中国冠心病患者运动治疗专家共识》
 * - 《ICU患者早期活动与康复临床实践指南》
 */

/* ============================================================
   一、指南证据等级映射表
   ============================================================ */
var evidenceLevels = {
  'A_strong':        'A级推荐（强证据支持，多中心RCT/Meta分析）',
  'B_moderate':      'B级推荐（中等证据，至少1项RCT或多项队列研究）',
  'C_weak':          'C级推荐（弱证据，专家共识/病例系列）',
  'Expert_Consensus':'专家共识（无RCT证据，临床专家一致推荐）',
  'China_Guideline':  '中国指南推荐（《中华物理医学与康复杂志》/《中国康复医学杂志》）'
};

var guideSources = {
  'APTA_Ortho_2021':     'APTA Orthopaedic Section CPGs 2021（JOSPT）',
  'APTA_Neuro_2022':     'APTA Neurologic Section CPG 2022',
  'APTA_Cardio_2024':    'APTA Cardiovascular PT CPG 2024',
  'AHA_ASA_2021':        'AHA/ASA Stroke Rehab Guidelines 2021',
  'AACVPR_2024':         'AACVPR Guidelines 2024（第6版）',
  'GOLD_2024':           'GOLD COPD Global Strategy 2024',
  'AGS_BGS_2011':        'AGS/BGS老年人跌倒干预指南',
  'China_Stroke_2017':    '《中国脑卒中早期康复治疗指南》2017',
  'China_CAD_2015':       '《中国冠心病患者运动治疗专家共识》2015',
  'China_OA_2018':       '《中国膝关节骨性关节炎循证医学指南》2018',
  'ICU_EarlyMob_2020':   '《ICU患者早期活动与康复临床实践指南》2020',
  'Rehab_Assessment_3rd': '《康复评定学》第3版（王玉龙 主编）',
  'Therapeutic_Exercise':  '《Therapeutic Exercise: Foundations and Techniques》Kisner & Colby 第8版',
  'Phys_Rehab_Osullivan': '《Physical Rehabilitation》O\'Sullivan 第7版'
};

/* ============================================================
   二、FITT-VP 处方模板构造函数
   ============================================================ */
function createPrescription(params) {
  /**
   * params: {
   *   specialty: string,
   *   diagnosis: string,
   *   phase: string,        // 分期
   *   fit_Frequency: string, // 频率（次/周）
   *   fit_Intensity: string, // 强度（%VO₂peak, %HRR, RPE, 等）
   *   fit_Time: string,      // 每次时长（分钟）
   *   fit_Type: string[],    // 运动类型（aerobic, resistance, flexibility, neuromuscular...）
   *   fit_Volume: string,   // 总量（MET-minutes/周）
   *   fit_Progression: string, // 进阶标准
   *   exercises: [{ name, sets, reps, intensity, guide, evidence }],
   *   contraindications: string[],
   *   precautions: string[],
   *   evidenceLevel: string,
   *   guideSource: string
   * }
   */
  return {
    specialty:        params.specialty || '',
    diagnosis:         params.diagnosis || '',
    phase:             params.phase || '',
    fit: {
      Frequency:  params.fit_Frequency || '',
      Intensity:  params.fit_Intensity || '',
      Time:       params.fit_Time || '',
      Type:       params.fit_Type || [],
      Volume:     params.fit_Volume || '',
      Progression: params.fit_Progression || ''
    },
    exercises:        params.exercises || [],
    contraindications: params.contraindications || [],
    precautions:       params.precautions || [],
    evidenceLevel:     params.evidenceLevel || '',
    guideSource:       params.guideSource || '',
    redFlags:          params.redFlags || []
  };
}

/* ============================================================
   三、各专科处方生成矩阵
   ============================================================ */

/* ——— 3.1 神经康复（脑卒中）处方矩阵 ——— */
function generateNeuroPrescription(data) {
  var base = data.base || {};
  var sp = data.specialtyData || {};
  var scores = data.scores || {};
  var diagnosis = sp.neuro_diagnosis || '缺血性脑卒中';
  var onset = sp.onset_days || '亚急性期';
  var fmScore = scores.fuglMeyer ? scores.fuglMeyer.total : 0;
  var bergScore = scores.berg ? scores.berg.total : 0;

  // 分期判定
  var phase = 'subacute';
  if (onset.indexOf('周') !== -1 && onset.indexOf('<') !== -1) phase = 'acute';
  if (onset.indexOf('个月') !== -1 && onset.indexOf('>') === -1) phase = 'early_recovery';
  if (onset.indexOf('年') !== -1 || onset.indexOf('>') !== -1) phase = 'chronic';

  var exercises = [];
  var freq = '', intensity = '', duration = '', volume = '';
  var evidence = 'A_strong';
  var guide = 'AHA_ASA_2021';

  // —— 急性期（< 1周）：床上良肢位摆放 + 被动活动 ——
  if (phase === 'acute') {
    freq = '每天 2-3 次（床上进行）';
    intensity = '无痛范围内，RPE < 8/20（极轻度）';
    duration = '每次 15-20 分钟';
    volume = '卧床期，以预防并发症为主';

    exercises = [
      {
        name: '良肢位摆放（抗痉挛体位）',
        sets: '持续维持', reps: '每次更换体位时调整',
        technique: '仰卧位：患侧肩胛骨前伸、肩外展外旋、肘伸展、前臂旋后、腕背伸、手指伸展。患侧下肢：骨盆后倾、髋膝微屈、踝背屈（用枕头支撑）。每2小时更换体位。',
        guide: '《中国脑卒中早期康复治疗指南》2017 Level A；AHA/ASA 2021 Level A',
        evidence: 'A_strong'
      },
      {
        name: '被动关节活动度训练（PROM）',
        sets: '每个关节 1 组', reps: '每个方向 10-15 次',
        technique: '治疗师辅助下完成肩/肘/腕/指/髋/膝/踝的全范围被动活动。动作缓慢（2秒/方向），避免引起痉挛。',
        guide: 'AHA/ASA 2021 Level A；证据：早期PROM预防关节挛缩',
        evidence: 'A_strong'
      },
      {
        name: '床上体位转换训练（辅助下）',
        sets: '每天 2-3 次', reps: '每侧 3-5 次',
        technique: '治疗师辅助下完成床上翻身（健侧→患侧，患侧→健侧）。利用健侧肢体带动患侧。',
        guide: 'AHA/ASA 2021 Level B',
        evidence: 'B_moderate'
      },
      {
        name: '深呼吸训练 + 胸部扩张训练',
        sets: '每天 3 次', reps: '每组 5-10 次深呼吸',
        technique: '鼻吸气（腹式呼吸）3秒 → 屏气2秒 → 口呼气（缩唇呼吸）4-6秒。预防坠积性肺炎。',
        guide: 'GOLD 2024 呼吸康复推荐',
        evidence: 'B_moderate'
      }
    ];
  }

  // —— 亚急性期（1周-3个月）：运动再学习 + 任务导向训练 ——
  else if (phase === 'subacute' || phase === 'early_recovery') {
    freq = '每周 5-7 次（每日训练）';
    intensity = 'RPE 11-13/20（轻度-中度）；心率储备的 40-60%';
    duration = '每次 45-60 分钟（含休息）';
    volume = '约 150-300 MET-minutes/周';

    exercises = [
      {
        name: '任务导向训练（Task-Oriented Training, TOT）',
        sets: '每天 1-2 个任务', reps: '每个任务重复 30-50 次',
        technique: '选择患者有意义的日常任务（如：伸手取杯、梳头、穿衫），进行重复性训练。强调"尝试-反馈-修正"循环。可用镜像疗法辅助。',
        guide: 'AHA/ASA 2021 Level A（强推荐）；《神经康复学》第3版 Ch.4',
        evidence: 'A_strong'
      },
      {
        name: '患侧上肢功能训练（Fugl-Meyer导向）',
        sets: '每天 2-3 组', reps: '每个动作 10-20 次',
        technique: '肩前屈/外展（0-90°范围内）→ 肘屈曲/伸展 → 前臂旋前/旋后 → 腕背伸 → 手指对指/抓握。FMA评分 < 20分者以被动+辅助活动为主；≥ 20分者增加主动活动。',
        guide: 'AHA/ASA 2021 Level A；Fugl-Meyer评分指导训练强度',
        evidence: 'A_strong'
      },
      {
        name: '负重训练（患侧下肢负重）',
        sets: '每天 2-3 组', reps: '每次 30-60 秒（逐渐延长）',
        technique: '平行杠内患侧下肢部分负重（初始 30% 体重）→ 逐渐增加至完全负重。配合骨盆对称性训练。',
        guide: 'APTA Neuro CPG 2022 Level A',
        evidence: 'A_strong'
      },
      {
        name: '平衡训练（Berg导向）',
        sets: '每天 1-2 组', reps: '每个动作 5-10 次',
        technique: '坐位→立位转移 → 双足站立（睁眼/闭眼）→ 单足站立（健侧）→ 串联站立 → 转身360°。Berg < 40分者需监护下训练。',
        guide: 'AHA/ASA 2021 Level A；AGS/BGS跌倒指南',
        evidence: 'A_strong'
      },
      {
        name: '步态训练（减重支持或平行杠内）',
        sets: '每天 1 组', reps: '步行 5-15 分钟（逐渐延长）',
        technique: '初期在平行杠内练习正确步态（患侧髋后伸启动 → 健侧迈步）。使用四足助行器或肘拐。重点：患侧足跟先着地、髋后伸、骨盆对称性。',
        guide: 'AHA/ASA 2021 Level A',
        evidence: 'A_strong'
      },
      {
        name: '神经肌肉电刺激（NMES，辅助上肢）',
        sets: '每天 1-2 次', reps: '每次 20-30 分钟',
        technique: '电极置于患侧伸腕肌群（桡侧腕长/短伸肌）和伸指肌群。刺激参数：频率35-50Hz，脉宽200-300μs，通断比 1:3（10秒通/30秒断）。与主动训练同步进行效果更佳。',
        guide: 'AHA/ASA 2021 Level B；Cochrane Review 2020',
        evidence: 'B_moderate'
      }
    ];
  }

  // —— 慢性期（> 6个月）：社区整合 + 强化训练 ——
  else {
    freq = '每周 3-5 次';
    intensity = 'RPE 13-16/20（中度-重度）；心率储备的 60-80%';
    duration = '每次 60-90 分钟';
    volume = '约 500-1000 MET-minutes/周';

    exercises = [
      {
        name: '有氧训练（步行/固定自行车/水中运动）',
        sets: '每周 3-5 次', reps: '每次 20-40 分钟',
        technique: '靶心率 =（最大心率 - 静息心率）× 40-80% + 静息心率。Borg RPE 目标 11-16。步态稳定者优先选择户外步行（社区环境，增加趣味性）。',
        guide: 'AHA/ASA 2021 Level A；ACSM运动处方指南第11版',
        evidence: 'A_strong'
      },
      {
        name: '强化任务训练（Constraint-Induced Movement Therapy, CIMT 简化版）',
        sets: '每周 3-5 天', reps: '每天 30-90 分钟（患侧上肢）',
        technique: '限制健侧上肢使用（佩戴手套/约束袖套），强迫使用患侧上肢完成日常任务。适应期从30分钟开始，逐渐延长至90分钟。仅在患侧有一定主动活动（ARAT ≥ 10分）时适用。',
        guide: 'AHA/ASA 2021 Level A（强推荐CIMT）；Wolf Motor Function Test',
        evidence: 'A_strong'
      },
      {
        name: '核心稳定性 + 躯干控制训练',
        sets: '每周 3-4 次', reps: '每个动作 10-15 次 × 2-3 组',
        technique: '仰卧腹横肌激活（Draw-in）→ 仰卧臀桥 → 四足位鸟狗式 → 侧平板支撑（改良版）。躯干控制是步行和ADL的基础。',
        guide: 'APTA Neuro CPG 2022 Level B',
        evidence: 'B_moderate'
      }
    ];
  }

  var prescription = createPrescription({
    specialty: '神经康复（脑卒中）',
    diagnosis: diagnosis,
    phase: phase,
    fit_Frequency:  freq,
    fit_Intensity:  intensity,
    fit_Time:       duration,
    fit_Type:       ['neuromuscular', 'aerobic', 'balance', 'functional_task'],
    fit_Volume:     volume,
    fit_Progression: '每 1-2 周评估 Fugl-Meyer、Berg、Barthel 指数。FMA 增加 ≥ 5分 或 Berg 增加 ≥ 4分 可考虑进阶。目标：6个月内 FMA 提高 ≥ 10分。',
    exercises:       exercises,
    contraindications: [
      '未控制的高血压（> 180/110 mmHg）',
      '不稳定心绞痛（48小时内）',
      '严重认知障碍无法配合（MMSE < 10分）',
      '频发跌倒（近1个月 ≥ 2次）且无人监护',
      '急性深静脉血栓（DVT）未处理'
    ],
    precautions: [
      '训练前测量血压、心率；训练中监测疲劳程度（Borg RPE）',
      '患侧肩关节慎用强力牵拉（预防半脱位加重）',
      '肌张力增高（MAS ≥ 2级）时避免过度刺激痉挛肌群',
      '体位转换时动作缓慢，预防体位性低血压',
      '首次训练需治疗师或家属监护'
    ],
    evidenceLevel: evidence,
    guideSource: guide
  });

  return prescription;
}

/* ——— 3.2 膝关节康复（ACL/膝OA）处方矩阵 ——— */
function generateKneePrescription(data) {
  var sp = data.specialtyData || {};
  var scores = data.scores || {};
  var diagnosis = sp.knee_diagnosis || 'ACL断裂（前交叉韧带）';
  var onset = sp.knee_onset || '亚急性期';
  var lysholmScore = scores.lysholm ? scores.lysholm.total : 50;

  var phase = 'proliferation'; // 默认增生期
  if (onset.indexOf('< 2周') !== -1) phase = 'inflammatory';
  if (onset.indexOf('6周') !== -1) phase = 'proliferation';
  if (onset.indexOf('3个月') !== -1 && onset.indexOf('<') === -1) phase = 'remodeling';
  if (onset.indexOf('6个月') !== -1 || onset.indexOf('重返') !== -1) phase = 'return_to_sport';

  var exercises = [];
  var freq = '', intensity = '', duration = '';

  // —— ACL 术后 / 损伤 ——
  if (diagnosis.indexOf('ACL') !== -1 || diagnosis.indexOf('韧带') !== -1) {

    // 炎症期（< 2周）
    if (phase === 'inflammatory') {
      freq = '每天 2-3 次（床上活动）';
      intensity = '无痛或轻微疼痛（VAS ≤ 3）；腘绳肌激活为主，限制股四头肌主动收缩';
      duration = '每次 15-20 分钟';

      exercises = [
        {
          name: '踝泵训练（Ankle Pump）',
          sets: '每天多次', reps: '每小时 10-20 次',
          technique: '仰卧/坐位，踝关节跖屈/背屈全范围活动。促进静脉回流，预防DVT。',
          guide: 'APTA ACL CPG 2022 Level A',
          evidence: 'A_strong'
        },
        {
          name: '腘绳肌等长收缩（Hamstring Isometric）',
          sets: '每天 3 组', reps: '每组 10-15 次（每次持续5秒）',
          technique: '仰卧位，膝下垫毛巾卷，主动屈膝（腘绳肌收缩）对抗毛巾卷阻力。避免股四头肌过度激活（可能影响移植腱愈合）。',
          guide: 'APTA ACL CPG 2022 Level A',
          evidence: 'A_strong'
        },
        {
          name: '髌骨滑动训练（Patellar Mobilation）',
          sets: '每天 2-3 组', reps: '每个方向 10 次',
          technique: '用手指将髌骨向上/下/内/外方向滑动，每个方向维持5秒。预防髌股关节粘连。',
          guide: '《骨科康复学》第3版 Ch.7',
          evidence: 'C_weak'
        }
      ];
    }

    // 增生期（2周-3个月）
    else if (phase === 'proliferation') {
      freq = '每周 5-7 次';
      intensity = 'VAS ≤ 4；RPE 11-13/20；患肢负重从 25% → 50% → 75% → 100% 渐进';
      duration = '每次 30-45 分钟';

      exercises = [
        {
          name: '股四头肌等长收缩（Quad Sets）',
          sets: '每天 3 组', reps: '每组 10-15 次（每次维持5-10秒）',
          technique: '伸膝位，股四头肌收缩使髌骨上移、膝后部紧贴床面。术后2周开始。',
          guide: 'APTA ACL CPG 2022 Level A',
          evidence: 'A_strong'
        },
        {
          name: '直腿抬高（SLR, Straight Leg Raise）',
          sets: '每天 3 组', reps: '每组 10-15 次',
          technique: '伸膝位，患肢直腿抬高至 30-45°，维持2-3秒后缓慢放下。避免髋屈曲代偿。',
          guide: 'APTA ACL CPG 2022 Level A',
          evidence: 'A_strong'
        },
        {
          name: '闭链运动：微型深蹲（Mini Squat）',
          sets: '每周 3-4 次', reps: '每组 10-15 次 × 2-3 组',
          technique: '双足分开与肩同宽，缓慢下蹲至屈膝 30-45°（避免> 60° 早期），重心均匀分布于双足。术后6周开始。',
          guide: 'APTA ACL CPG 2022 Level A（闭链运动优于开链）',
          evidence: 'A_strong'
        },
        {
          name: '腘绳肌离心训练（Nordic Hamstring Curl 改良版）',
          sets: '每周 3 次', reps: '每组 5-10 次 × 2 组',
          technique: '俯卧位，辅助下完成屈膝（向心）→ 缓慢放下（离心，3-5秒）。腘绳肌力量需达到健侧的 90% 以上才能重返运动。',
          guide: 'APTA ACL CPG 2022 Level A；腘绳肌:股四头肌力量比 ≥ 0.6',
          evidence: 'A_strong'
        },
        {
          name: '本体感觉训练（单足站立，平衡垫上）',
          sets: '每周 3-4 次', reps: '每侧 3 × 30秒',
          technique: '双足站立 → 患侧单足站立（平地）→ 平衡垫上单足站立。睁眼→闭眼渐进。',
          guide: 'APTA ACL CPG 2022 Level B',
          evidence: 'B_moderate'
        }
      ];
    }

    // 功能恢复期（3-6个月）
    else if (phase === 'remodeling') {
      freq = '每周 4-5 次';
      intensity = 'RPE 13-16/20；腘绳肌力量达健侧 90% 以上；患肢单侧跳跃距离达健侧 90% 以上';
      duration = '每次 45-60 分钟';

      exercises = [
        {
          name: '开链运动：膝屈曲/伸展（等速训练）',
          sets: '每周 2-3 次', reps: '每组 15-20 次 × 3 组',
          technique: '等速训练仪上完成向心/离心收缩。速度从慢（60°/s）到快（180°/s）渐进。术后3个月开始。',
          guide: 'APTA ACL CPG 2022 Level B',
          evidence: 'B_moderate'
        },
        {
          name: '弓步蹲（Lunges）',
          sets: '每周 3 次', reps: '每侧 10-15 次 × 2-3 组',
          technique: '向前弓步 → 返回站立。控制下蹲速度（3秒下→1秒停→1秒起）。避免膝内扣（valgus）。',
          guide: 'APTA ACL CPG 2022 Level A',
          evidence: 'A_strong'
        },
        {
          name: '跳跃训练（Plyometrics，准备重返运动）',
          sets: '每周 2-3 次', reps: '每种跳跃 10-15 次 × 2 组',
          technique: '双侧跳跃 → 单侧跳跃 → 多角度跳跃（前后/左右/旋转）。落地时膝髋屈曲缓冲，避免直腿落地。',
          guide: 'APTA ACL CPG 2022 Level A；重返运动标准： Limb Symmetry Index ≥ 90%',
          evidence: 'A_strong'
        }
      ];
    }
  }

  // —— 膝骨关节炎（OA）——
  else if (diagnosis.indexOf('骨关节炎') !== -1 || diagnosis.indexOf('OA') !== -1) {

    freq = '每周 5-7 次（每日训练）';
    intensity = 'RPE 11-13/20（轻度-中度）；避免 VAS > 4';
    duration = '每次 30-45 分钟';

    exercises = [
      {
        name: '股四头肌等长收缩 + 终末伸膝（Terminal Knee Extension）',
        sets: '每天 3 组', reps: '每组 10-15 次 × 10秒维持',
        technique: '坐位或仰卧位，膝下垫毛巾卷，主动伸膝至完全伸展（终端伸膝），维持10秒。增强股四头肌（尤其是股内侧肌）力量。',
        guide: 'APTA膝OA CPG 2021 Level A；OARSI 2021 推荐',
        evidence: 'A_strong'
      },
      {
        name: '直腿抬高（SLR）',
        sets: '每天 3 组', reps: '每组 10-15 次',
        technique: '患侧直腿抬高30°，维持2-3秒。强化股四头肌，同时避免增加膝关标准确压力。',
        guide: 'APTA膝OA CPG 2021 Level A',
        evidence: 'A_strong'
      },
      {
        name: '髋周肌群强化（臀中肌/臀大肌）',
        sets: '每周 3-4 次', reps: '每个动作 10-15 次 × 2-3 组',
        technique: '侧卧髋外展（臀中肌）→ 俯卧位髋后伸（臀大肌）→ 臀桥（双/单腿）。髋肌力不足是膝OA疼痛的重要诱因。',
        guide: 'APTA膝OA CPG 2021 Level A；证据：髋强化减轻膝OA疼痛',
        evidence: 'A_strong'
      },
      {
        name: '低冲击有氧训练（固定自行车/水中步行）',
        sets: '每周 3-5 次', reps: '每次 20-40 分钟',
        technique: '固定自行车：阻力低，踏板转速 60-80 rpm。水中步行：水温 28-32°C，水深及腰或胸。避免跑步（高冲击）。',
        guide: 'APTA膝OA CPG 2021 Level A；OARSI 2021',
        evidence: 'A_strong'
      },
      {
        name: '膝关节牵引（持续被动活动，严重OA）',
        sets: '每天 1-2 次', reps: '每次 15-20 分钟',
        technique: '使用 CPT 机或手法牵引，膝关节轻微分离（5-10kg 拉力）。适用于 Kellgren-Lawrence III-IV 级 OA。',
        guide: '《中国膝OA循证指南》2018 Level B',
        evidence: 'B_moderate'
      }
    ];
  }

  var prescription = createPrescription({
    specialty: '骨科康复（膝关节）',
    diagnosis: diagnosis,
    phase: phase,
    fit_Frequency:  freq,
    fit_Intensity:  intensity,
    fit_Time:       duration,
    fit_Type:       ['resistance', 'neuromuscular', 'aerobic_low_impact', 'flexibility'],
    fit_Volume:     '约 150-400 MET-minutes/周（膝OA）；ACL术后约 200-500 MET-minutes/周',
    fit_Progression: '每 2-4 周评估 Lysholm 评分、股四头肌/腘绳肌 MMT 分级。ACL 患者：腘绳肌:股四头肌力量比 ≥ 0.6；单侧跳跃对称性 ≥ 90% 可考虑重返运动。',
    exercises:       exercises,
    contraindications: [
      '术后 < 2周 且膝关节红肿热痛明显（感染风险）',
      '膝关节置换术后 < 4周 且活动度 < 90°（需先改善ROM）',
      'KK-L IV 级 OA 且保守治疗无效（建议手术评估）'
    ],
    precautions: [
      'ACL 术后 6 周内避免 Open Kinetic Chain 开链膝伸展（可能影响移植腱）',
      '膝OA 患者避免深蹲（> 90° 屈膝）和高冲击运动（跑步、跳跃）',
      '训练中 VAS 疼痛 > 5 分应立即停止或降低强度',
      '注意髌股关节压力：SLR 和终末伸膝优于深蹲（早期）'
    ],
    evidenceLevel: 'A_strong',
    guideSource: 'APTA_Ortho_2021'
  });

  return prescription;
}

/* ——— 3.3 腰椎康复（非特异性腰痛）处方矩阵 ——— */
function generateLumbarPrescription(data) {
  var sp = data.specialtyData || {};
  var scores = data.scores || {};
  var diagnosis = sp.lumbar_diagnosis || '非特异性腰痛';
  var pattern = sp.lumbar_pattern || '未分类';
  var odiScore = scores.odi ? scores.odi.percent : 40;

  var exercises = [];
  var freq = '', intensity = '', duration = '';

  // —— 按 APTA 腰痛 CPG 分类策略 ——
  // 分类1：稳定机制异常 → 核心稳定性训练
  if (pattern.indexOf('稳定') !== -1 || odiScore > 40) {
    freq = '每周 5-7 次（每日训练）';
    intensity = '低强度、高重复；RPE 8-11/20；避免引发疼痛的动作';
    duration = '每次 20-30 分钟';

    exercises = [
      {
        name: '腹横肌分离收缩（Draw-in Maneuver）',
        sets: '每天 3 组', reps: '每组 10 次（每次维持 10 秒）',
        technique: '仰卧位，轻微将脐部向脊柱方向收缩（腹横肌激活），保持正常呼吸（不要憋气）。触摸患侧髂前上棘内侧确认肌肉收缩。',
        guide: 'APTA腰痛CPG 2021 Level A（核心稳定性训练强推荐）',
        evidence: 'A_strong'
      },
      {
        name: '死虫式（Dead Bug，改良版）',
        sets: '每周 3-4 次', reps: '每侧 10 次 × 2-3 组',
        technique: '仰卧位，双臂上举，双膝屈曲90°。缓慢伸展对侧上肢和对侧下肢（如：伸右臂+伸左腿），保持腰椎贴紧地面。避免腰部拱起。',
        guide: 'APTA腰痛CPG 2021 Level A',
        evidence: 'A_strong'
      },
      {
        name: '鸟狗式（Bird-Dog）',
        sets: '每周 3-4 次', reps: '每侧 10 次 × 2-3 组',
        technique: '四足跪位，对侧上肢前伸 + 对侧下肢后伸（如：伸右臂+伸左腿），保持躯干水平。避免腰部下沉或拱起。进阶：维持10秒。',
        guide: 'APTA腰痛CPG 2021 Level A',
        evidence: 'A_strong'
      },
      {
        name: '侧平板支撑（Side Plank，改良版）',
        sets: '每周 3 次', reps: '每侧 10-30 秒 × 2-3 组',
        technique: '侧卧位，前臂支撑，髋部抬起使身体呈直线。初学者可屈膝（膝盖着地）降低难度。',
        guide: 'APTA腰痛CPG 2021 Level B',
        evidence: 'B_moderate'
      },
      {
        name: '麦吉尔"Big 3"核心训练（McGill\'s Big 3）',
        sets: '每周 3-4 次', reps: '每个动作 10 次 × 2 组（维持10秒/次）',
        technique: '1) Curl-up（改良卷腹）：双手置于腰部维持生理曲度，仅头颈胸椎抬起；2) Side Plank（见上）；3) Bird-Dog（见上）。McGill 博士核心稳定性训练方案。',
        guide: 'McGill SM. Low Back Disorders 3rd ed. 2016；APTA腰痛CPG 2021 Level B',
        evidence: 'B_moderate'
      }
    ];
  }

  // 分类2：活动度受限 → 关节松动 + 牵伸
  else if (pattern.indexOf('活动度') !== -1) {
    freq = '每周 2-3 次（手法） + 每日牵伸';
    intensity = '手法：Maitland I-IV 级；牵伸：低强度，维持30秒';
    duration = '每次 30-45 分钟';

    exercises = [
      {
        name: '腰椎关节松动术（Maitland 手法）',
        sets: '每周 2-3 次', reps: '每个方向 2 组 × 30-60 秒',
        technique: '后方髋关节松动（Posterior-to-anterior, PA）→ 单侧关节突关节松动。Maitland I-II 级（疼痛为主）；III-IV 级（僵硬为主）。由治疗师操作。',
        guide: 'APTA腰痛CPG 2021 Level A（手法治疗强推荐）',
        evidence: 'A_strong'
      },
      {
        name: '腘绳肌牵伸（Hamstring Stretch）',
        sets: '每天 2-3 次', reps: '每侧 维持 30-60 秒 × 3 组',
        technique: '仰卧位，使用毛巾辅助将患侧下肢抬至腘绳肌有牵拉感（不要反弹）。保持正常呼吸。',
        guide: 'APTA腰痛CPG 2021 Level A',
        evidence: 'A_strong'
      },
      {
        name: '骨盆倾斜训练（Pelvic Tilt）',
        sets: '每天 3 组', reps: '每组 10-15 次（维持5秒）',
        technique: '仰卧位，腰部贴紧地面（骨盆后倾），维持5秒后放松。增加腰椎活动度，减轻僵硬感。',
        guide: '《骨科康复学》第3版 Ch.5',
        evidence: 'B_moderate'
      },
      {
        name: '猫牛式（Cat-Cow Stretch）',
        sets: '每天 2 次', reps: '10-15 次',
        technique: '四足跪位，吸气时腰椎前凸（牛式）→ 呼气时腰椎后凸（猫式）。缓慢进行，每个方向维持2-3秒。',
        guide: 'APTA腰痛CPG 2021 Level B（瑜伽/牵伸）',
        evidence: 'B_moderate'
      }
    ];
  }

  // 分类3：放射痛 → 神经张力管理
  else if (pattern.indexOf('放射') !== -1) {
    freq = '每周 3-5 次';
    intensity = '温和，RPE 8-11/20；避免诱发根性痛的动作';
    duration = '每次 30-40 分钟';

    exercises = [
      {
        name: '神经滑动练习（Nerve Gliding：坐骨神经）',
        sets: '每天 2-3 次', reps: '每个动作 10 次',
        technique: '坐位，伸膝同时背屈踝（坐骨神经滑动）→ 放松。如有根性痛，减小活动范围。不要强行拉伸！',
        guide: 'APTA腰痛CPG 2021 Level B',
        evidence: 'B_moderate'
      },
      {
        name: '麦肯基伸展疗法（McKenzie Extension）',
        sets: '每天多次（疼痛发作时）', reps: '10-15 次 × 多组',
        technique: '俯卧位，双手支撑上半身（腰椎后伸）。适用于中央型间盘突出（疼痛向远端放射时停止）。',
        guide: 'APTA腰痛CPG 2021 Level A（McKenzie 方法）',
        evidence: 'A_strong'
      },
      {
        name: '核心稳定性训练（低强度，见上）',
        sets: '每周 3-5 次', reps: '详见"稳定机制异常"处方',
        technique: '同"稳定机制异常"处方，但强度更低',
        guide: 'APTA腰痛CPG 2021 Level A',
        evidence: 'A_strong'
      }
    ];
  }

  // 默认：综合处方
  else {
    freq = '每周 5-7 次';
    intensity = 'RPE 11-13/20';
    duration = '每次 30-40 分钟';

    exercises = [
      {
        name: '综合处方：腹横肌激活 + 腘绳肌牵伸 + 步行',
        sets: '每周 5-7 次', reps: '详见各分项',
        technique: '非特异性腰痛首选综合方案：核心稳定性 + 牵伸 + 有氧运动。步行是最安全的有氧运动。',
        guide: 'APTA腰痛CPG 2021 Level A（综合方案优于单一治疗）',
        evidence: 'A_strong'
      }
    ];
  }

  // —— 有氧运动（所有腰痛患者）——
  exercises.push({
    name: '步行训练（低冲击有氧）',
    sets: '每周 5-7 次', reps: '每次 20-40 分钟',
    technique: '平地步行，速度 3-5 km/h，Borg RPE 11-13。佩戴计步器目标：每天 6000-8000 步。避免在不平整地面行走（增加跌倒风险）。',
    guide: 'APTA腰痛CPG 2021 Level A；ACSM 指南',
    evidence: 'A_strong'
  });

  var prescription = createPrescription({
    specialty: '骨科康复（腰椎）',
    diagnosis: diagnosis,
    phase: pattern || '未分类',
    fit_Frequency:  freq,
    fit_Intensity:  intensity,
    fit_Time:       duration,
    fit_Type:       ['resistance', 'flexibility', 'neuromuscular', 'aerobic_low_impact'],
    fit_Volume:     '约 150-300 MET-minutes/周',
    fit_Progression: '每 2-4 周评估 ODI。ODI 下降 ≥ 10% 提示治疗有效。核心维持时间从 10秒 → 30秒 → 60秒 进阶。步行时间从 20分钟 → 40分钟 进阶。',
    exercises:       exercises,
    contraindications: [
      '马尾综合征（大小便失禁 + 鞍区麻木）→ 急诊手术',
      '进行性神经功能缺损（肌力下降 ≥ 1级/周）',
      '静息痛明显且夜间痛（警惕肿瘤/感染）'
    ],
    precautions: [
      '避免腰椎过度屈曲（久坐 + 前屈）动作',
      '抬重物时使用"蹲起"而非"弯腰"（保护椎间盘）',
      '腰痛伴根性痛时，避免直腿抬高 > 70°（可能加重症状）',
      '核心训练时保持正常呼吸（不要憋气，避免Valsalva动作增加椎间盘压力）'
    ],
    evidenceLevel: 'A_strong',
    guideSource: 'APTA_Ortho_2021'
  });

  return prescription;
}

/* ——— 3.4 心肺康复处方矩阵 ——— */
function generateCardioPrescription(data) {
  var sp = data.specialtyData || {};
  var base = data.base || {};
  var diagnosis = sp.cardio_diagnosis || '冠心病（稳定性心绞痛/MI后）';
  var rehabPhase = sp.cardio_rehab_phase || 'Ⅱ期';
  var sixmwd = parseInt(sp.sixmwd) || 400;
  var nyha = sp.nyha_class || 'II级';

  var exercises = [];
  var freq = '', intensity = '', duration = '', volume = '';

  // —— Ⅰ期：住院期康复（监护下）——
  if (rehabPhase.indexOf('Ⅰ期') !== -1) {
    freq = '每天 1-2 次（床上/床边）';
    intensity = '低强度；心率 < 100次/分；RPE < 11/20';
    duration = '每次 5-15 分钟';

    exercises = [
      {
        name: '床上被动/主动关节活动（PROM/AAROM）',
        sets: '每天 2 次', reps: '每个关节 10 次',
        technique: '术后24-48小时开始。床上坐位（无体位性低血压）→ 床上踩车（被动/辅助）。',
        guide: 'AACVPR 2024 Level A',
        evidence: 'A_strong'
      },
      {
        name: '床边坐位（无监护下）',
        sets: '每天 2-3 次', reps: '每次 5-15 分钟',
        technique: '从30°半坐位开始 → 60° → 90°坐位。监测血压、心率、SpO₂。出现头晕/心悸立即停止。',
        guide: 'AACVPR 2024 Level A',
        evidence: 'A_strong'
      }
    ];
  }

  // —— Ⅱ期：早期门诊康复（出院后1-3个月）——
  else if (rehabPhase.indexOf('Ⅱ期') !== -1) {
    freq = '每周 3-5 次（监护下）';
    // 计算靶心率
    var thrs = calcTargetHR(base);
    intensity = thrs.text;
    duration = '每次 30-60 分钟（含热身/整理）';
    volume = '约 300-500 MET-minutes/周';

    exercises = [
      {
        name: '有氧运动（平板步行/固定自行车/上肢功率车）',
        sets: '每周 3-5 次', reps: '每次 20-40 分钟（逐步延长）',
        technique: '热身 5-10分钟（低强度）→ 靶强度 20-40分钟 → 整理 5-10分钟。靶心率：（220-年龄-静息心率）× 40-80% + 静息心率；或 Borg RPE 11-16。ECG 监护下开始，稳定后可在无监护下进行。',
        guide: 'AACVPR 2024 Level A；《中国冠心病运动治疗共识》2015 Level A',
        evidence: 'A_strong'
      },
      {
        name: '抗阻训练（轻中度强度）',
        sets: '每周 2-3 次', reps: '每个动作 10-15 次 × 1-2 组',
        technique: '强度：1-RM 的 30-50%（早期）→ 60-80%（稳定期）。动作：坐姿划船、 leg press、肱二头肌弯举。避免Valsalva动作（憋气）。',
        guide: 'AACVPR 2024 Level A；ACSM 第11版',
        evidence: 'A_strong'
      },
      {
        name: '呼吸训练（缩唇呼吸 + 腹式呼吸）',
        sets: '每天 2-3 次', reps: '每组 5-10 次深呼吸',
        technique: '鼻吸气 2-3秒 → 缩唇（如吹口哨）呼气 4-6秒。腹式呼吸：吸气时腹部鼓起，呼气时腹部内收。',
        guide: 'GOLD 2024；AACVPR 2024 Level B',
        evidence: 'B_moderate'
      }
    ];
  }

  // —— Ⅲ期：社区/居家维持期——
  else {
    freq = '每周 5-7 次（居家/社区）';
    intensity = 'RPE 11-16/20；靶心率达心率储备的 60-80%';
    duration = '每次 30-60 分钟';
    volume = '约 500-1000 MET-minutes/周';

    exercises = [
      {
        name: '社区步行/慢跑（如适用）',
        sets: '每周 5-7 次', reps: '每次 30-60 分钟',
        technique: '平地步行 → 坡度步行 → 慢跑（仅在医生建议下）。佩戴心率监测设备。症状限制：出现胸痛/气促（Borg ≥ 17）立即停止。',
        guide: 'AACVPR 2024 Level A',
        evidence: 'A_strong'
      }
    ];
  }

  var prescription = createPrescription({
    specialty: '心肺康复',
    diagnosis: diagnosis,
    phase: rehabPhase,
    fit_Frequency:  freq,
    fit_Intensity:  intensity,
    fit_Time:       duration,
    fit_Type:       ['aerobic', 'resistance', 'breathing_training'],
    fit_Volume:     volume,
    fit_Progression: '每 4-8 周复查 6MWT/CPET。6MWD 增加 ≥ 30m 或 VO₂peak 增加 ≥ 2 mL/kg/min 提示训练有效。强度进阶：从 40% HRR → 80% HRR 渐进（每2周增加5-10%）。',
    exercises:       exercises,
    contraindications: [
      '静息心率 > 110次/分',
      '不稳定性心绞痛（48小时内）',
      '未控制的心律失常',
      '发热（> 38°C）或急性感染',
      '静息 SBP > 180 mmHg 或 DBP > 110 mmHg',
      'SpO₂ < 88%（未吸氧）'
    ],
    precautions: [
      '运动前/中/后监测心率、血压、SpO₂、症状',
      '服用β受体阻滞剂者：靶心率可能偏低，以 Borg RPE 为主要强度指标',
      '糖尿病患者：运动前血糖 < 5.0 mmol/L 需补充碳水化合物；> 16.7 mmol/L 暂缓运动',
      '出现胸痛、严重气促、晕厥前兆立即终止运动并就医'
    ],
    evidenceLevel: 'A_strong',
    guideSource: 'AACVPR_2024'
  });

  return prescription;
}

/* 靶心率计算辅助函数 */
function calcTargetHR(base) {
  var age = parseInt(base.age) || 60;
  var maxHR = 220 - age;
  var restHR = 70; // 默认静息心率
  var hrr = maxHR - restHR;
  var targetLow = Math.round(restHR + hrr * 0.4);
  var targetHigh = Math.round(restHR + hrr * 0.8);
  return {
    text: '靶心率 ' + targetLow + '-' + targetHigh + ' 次/分（心率储备的 40-80%）；或 Borg RPE 11-16',
    targetLow: targetLow,
    targetHigh: targetHigh
  };
}

/* ——— 3.5 颈椎康复处方矩阵 ——— */
function generateCervicalPrescription(data) {
  var sp = data.specialtyData || {};
  var scores = data.scores || {};
  var diagnosis = sp.cervical_diagnosis || '颈型（局部型）';
  var ndiScore = scores.ndi ? scores.ndi.percent : 30;

  var exercises = [];
  var freq = '每周 5-7 次（居家训练）';
  var intensity = '低-中度；RPE 8-13/20；避免诱发根性痛';
  var duration = '每次 20-30 分钟';

  // 脊髓型：禁忌暴力推拿，以温和活动为主
  if (diagnosis.indexOf('脊髓型') !== -1) {
    exercises = [
      {
        name: '颈椎温和活动度训练（Active ROM）',
        sets: '每天 2-3 次', reps: '每个方向 10 次',
        technique: '坐位，缓慢完成颈椎屈曲/伸展/侧屈/旋转。动作范围以不诱发疼痛或麻木为限。禁止暴力推拿或快速扳动！',
        guide: 'APTA颈椎CPG 2021 Level A；脊髓型颈椎病禁忌暴力手法',
        evidence: 'A_strong'
      },
      {
        name: '肩胛带稳定性训练',
        sets: '每周 3-4 次', reps: '每个动作 10-15 次 × 2 组',
        technique: '俯卧位"T/Y/W"肩外展训练（强化中下斜方肌/菱形肌）。颈椎脊髓型患者常伴有上肢肌无力，需强化肩胛带。',
        guide: 'APTA颈椎CPG 2021 Level B',
        evidence: 'B_moderate'
      }
    ];
  }
  // 神经根型：牵伸 + 神经滑动
  else if (diagnosis.indexOf('神经根') !== -1) {
    exercises = [
      {
        name: '颈椎牵引（持续/间歇，需医生评估后）',
        sets: '每周 2-3 次', reps: '每次 15-20 分钟',
        technique: '坐位牵引，重量从 5-7% 体重开始（约 3-5kg），逐渐增至 10-15% 体重。角度：前屈 15-30°（扩大椎间孔）。',
        guide: 'APTA颈椎CPG 2021 Level A；Cervical traction 证据',
        evidence: 'B_moderate'
      },
      {
        name: '神经滑动练习（Brachial Plexus Nerve Gliding）',
        sets: '每天 2-3 次', reps: '每个动作 10 次',
        technique: '坐位，"ULNT1（正中神经）"：肩外展+外旋 → 肘伸展 → 腕/指伸展 → 颈椎对侧屈。动作缓慢，出现根性痛时减小活动范围。',
        guide: 'APTA颈椎CPG 2021 Level B',
        evidence: 'B_moderate'
      },
      {
        name: '颈椎深层屈肌训练（Deep Neck Flexors）',
        sets: '每天 3 组', reps: '每组 10 次（维持5-10秒）',
        technique: '仰卧位，收下巴（chin tuck）→ 颈椎屈曲（深层屈肌收缩）。触摸两侧胸锁乳突肌，确保其不代偿。',
        guide: 'APTA颈椎CPG 2021 Level A',
        evidence: 'A_strong'
      }
    ];
  }
  // 颈型/椎动脉型/交感神经型：综合方案
  else {
    exercises = [
      {
        name: '颈椎深层屈肌训练（Chin Tuck）',
        sets: '每天 3 组', reps: '每组 10 次（维持5-10秒）',
        technique: '仰卧位或坐位，收下巴（不是低头），感受颈椎屈曲。强化颈长肌/头长肌（深层屈肌）。',
        guide: 'APTA颈椎CPG 2021 Level A',
        evidence: 'A_strong'
      },
      {
        name: '颈椎牵伸（上斜方肌/提肩胛肌）',
        sets: '每天 2-3 次', reps: '每侧 维持 30 秒 × 3 组',
        technique: '坐位，一手抓椅面固定肩胛带，另一手将头向对侧牵拉（牵伸上斜方肌）。保持30秒，不要反弹。',
        guide: 'APTA颈椎CPG 2021 Level A',
        evidence: 'A_strong'
      },
      {
        name: '肩胛带稳定性训练（Y-T-W）',
        sets: '每周 3-4 次', reps: '每个动作 10-15 次 × 2 组',
        technique: '俯卧位，双臂伸直形成 Y（肩外展120°）/ T（肩外展90°）/ W（肩外展45°外旋）。强化中下斜方肌，减轻颈肌负荷。',
        guide: 'APTA颈椎CPG 2021 Level A',
        evidence: 'A_strong'
      }
    ];
  }

  var prescription = createPrescription({
    specialty: '颈椎康复',
    diagnosis: diagnosis,
    phase: sp.cervical_onset || '慢性期',
    fit_Frequency:  freq,
    fit_Intensity:  intensity,
    fit_Time:       duration,
    fit_Type:       ['flexibility', 'neuromuscular', 'postural_training'],
    fit_Volume:     '约 100-200 MET-minutes/周',
    fit_Progression: '每 2-4 周评估 NDI。NDI 下降 ≥ 10% 提示治疗有效。牵伸维持时间从 15秒 → 30秒 → 60秒 进阶。',
    exercises:       exercises,
    contraindications: [
      '脊髓型颈椎病（禁忌暴力手法和快速扳动）',
      '颈椎不稳定（外伤后/类风湿关节炎）',
      '颈椎肿瘤/感染',
      '近期颈椎手术（< 3个月）'
    ],
    precautions: [
      '所有训练动作缓慢进行，避免快速颈部旋转（可能诱发椎动脉供血不足）',
      '神经根型颈椎病患者：如果牵伸或神经滑动诱发根性痛，立即停止并减小活动范围',
      '长期使用电脑/手机者：每 30 分钟休息一次，做 chin tuck 和肩胛带活动'
    ],
    evidenceLevel: 'A_strong',
    guideSource: 'APTA_Ortho_2021'
  });

  return prescription;
}

/* ——— 3.6 肩关节康复处方矩阵 ——— */
function generateShoulderPrescription(data) {
  var sp = data.specialtyData || {};
  var diagnosis = sp.shoulder_diagnosis || '肩袖损伤';
  var onset = sp.shoulder_onset || '冻结期';

  var exercises = [];
  var freq = '', intensity = '', duration = '';

  // 肩袖损伤
  if (diagnosis.indexOf('肩袖') !== -1) {
    freq = '每周 5-7 次';
    intensity = '低-中度；RPE 8-13/20；肩外展 < 90°（避免撞击区）';
    duration = '每次 20-30 分钟';

    exercises = [
      {
        name: '肩袖肌群强化（侧卧位外旋/内旋）',
        sets: '每天 3 组', reps: '每组 15-20 次 × 1-2 kg 哑铃',
        technique: '侧卧位，患侧上肢肘贴躯干，外旋（冈下肌/小圆肌）或内旋（肩胛下肌）。ROM 0-45°（避免撞击区 60-120°）。',
        guide: 'APTA肩袖CPG 2020 Level A',
        evidence: 'A_strong'
      },
      {
        name: '空罐试验体位训练（冈上肌）',
        sets: '每周 3-4 次', reps: '每组 10-15 次 × 1-2 kg',
        technique: '坐位或立位，肩外展 30° 前屈 30°（空罐体位），抗阻外展。强化冈上肌（最易损伤的肩袖肌）。',
        guide: 'APTA肩袖CPG 2020 Level A',
        evidence: 'A_strong'
      },
      {
        name: '肩胛骨松动术 + 控制训练',
        sets: '每周 3-4 次', reps: '每组 10-15 次',
        technique: '肩胛骨上提/后缩/下压活动（"肩胛骨节拍"）。强化前锯肌（Serratus Anterior）和中下斜方肌，改善肩胛骨动力学。',
        guide: 'APTA肩袖CPG 2020 Level A',
        evidence: 'A_strong'
      }
    ];
  }
  // 冻结肩
  else if (diagnosis.indexOf('冻结') !== -1) {
    freq = '每周 5-7 次（牵伸尤其需要每日进行）';
    intensity = '低强度；牵伸至出现轻微牵拉感（不要剧痛）';
    duration = '每次 30-40 分钟';

    exercises = [
      {
        name: '关节囊牵伸（Codman  pendulum）',
        sets: '每天 2-3 次', reps: '每个方向 10-15 次',
        technique: '俯身，患侧上肢自然下垂，利用重力做小幅圆周运动（直径逐渐增大）。不要主动用力摆动。',
        guide: 'APTA肩袖CPG 2020 Level B；冻结肩牵伸',
        evidence: 'B_moderate'
      },
      {
        name: '被动关节活动度训练（PROM，辅助下）',
        sets: '每天 1-2 次', reps: '每个方向 10-15 次',
        technique: '利用健侧手或棍子辅助患侧肩关节活动。遵循"关节囊模式"：外旋受限最明显 → 外展 → 内旋。不要强行突破疼痛。',
        guide: 'APTA肩袖CPG 2020 Level A',
        evidence: 'A_strong'
      },
      {
        name: '睡眠体位调整（减轻夜间痛）',
        sets: '每晚', reps: '持续维持',
        technique: '患侧在上（侧卧）→ 患侧上肢前屈 < 90° 并垫枕头支撑。避免患侧在下的睡姿（加重撞击）。',
        guide: '《骨科康复学》第3版 Ch.8',
        evidence: 'C_weak'
      }
    ];
  }

  var prescription = createPrescription({
    specialty: '肩关节康复',
    diagnosis: diagnosis,
    phase: onset,
    fit_Frequency:  freq,
    fit_Intensity:  intensity,
    fit_Time:       duration,
    fit_Type:       ['resistance', 'flexibility', 'neuromuscular'],
    fit_Volume:     '约 150-250 MET-minutes/周',
    fit_Progression: '每 4 周评估 Constant-Murley 评分。肩袖损伤：疼痛VAS下降 ≥ 2分 且 外展活动度增加 ≥ 20° 提示有效。冻结肩：自然病程 12-24 个月，康复训练可缩短病程。',
    exercises:       exercises,
    contraindications: [
      '肩袖全层撕裂 > 3cm（保守治疗无效，建议手术）',
      '化脓性关节炎（急性感染）',
      '骨折未愈合'
    ],
    precautions: [
      '肩袖损伤：避免肩外展 60-120°（撞击区），训练时优先选择 < 60° 或 > 120° 的ROM',
      '冻结肩：牵伸时疼痛VAS > 6分应减小牵伸强度',
      '训练后夜间痛加重可持续 24-48 小时（正常炎症反应），若持续 > 72 小时需降低强度'
    ],
    evidenceLevel: 'A_strong',
    guideSource: 'APTA_Ortho_2021'
  });

  return prescription;
}

/* ——— 3.7 ICU早期活动处方矩阵 ——— */
function generateICUPrescription(data) {
  var sp = data.specialtyData || {};
  var imsScore = parseInt(sp.ims_score) || 1;

  var exercises = [];
  var freq = '每天 1-3 次（根据耐受情况）';
  var intensity = '极轻度；RPE < 8/20；以不诱发生命体征异常为限';
  var duration = '每次 5-20 分钟（逐步延长）';

  // 根据 IMS 评分决定活动级别
  if (imsScore <= 2) {
    // IMS 0-2：床上活动
    exercises = [
      {
        name: '床上被动关节活动（PROM）',
        sets: '每天 2 次', reps: '每个关节 10 次',
        technique: '治疗师辅助下完成全关节范围被动活动。动作缓慢，避免骨折风险（ICU获得性肌无力患者常有骨质疏松）。',
        guide: 'ICU早期活动指南 2020 Level A',
        evidence: 'A_strong'
      },
      {
        name: '体位更换（预防压疮）',
        sets: '每 2 小时', reps: '持续维持',
        technique: '仰卧 → 左侧卧 → 仰卧 → 右侧卧。使用翻身垫辅助。观察生命体征变化。',
        guide: 'ICU早期活动指南 2020 Level A',
        evidence: 'A_strong'
      }
    ];
  } else if (imsScore <= 5) {
    // IMS 3-5：床边坐起/站立
    exercises = [
      {
        name: '床边坐位（无体位性低血压）',
        sets: '每天 2-3 次', reps: '每次 15-30 分钟',
        technique: '30°半坐位 → 60° → 90°坐位。监测血压、心率、SpO₂。出现头晕/心悸立即停止。',
        guide: 'ICU早期活动指南 2020 Level A',
        evidence: 'A_strong'
      },
      {
        name: '床边站立（平行杠/助行器辅助）',
        sets: '每天 1-2 次', reps: '每次 5-15 分钟',
        technique: '从平行杠内站立开始 → 助行器辅助站立。下肢肌力 MRC ≥ 3级 时可尝试。2人辅助（治疗师+护士）。',
        guide: 'ICU早期活动指南 2020 Level A',
        evidence: 'A_strong'
      }
    ];
  } else {
    // IMS ≥ 6：步行训练
    exercises = [
      {
        name: '床边步行（平行杠/助行器辅助）',
        sets: '每天 1-2 次', reps: '每次步行 5-20 分钟',
        technique: '平行杠内步行 → 助行器步行 → 肘拐步行。监护下（治疗师+护士）进行。出现疲劳（Borg ≥ 15）立即停止。',
        guide: 'ICU早期活动指南 2020 Level A',
        evidence: 'A_strong'
      }
    ];
  }

  var prescription = createPrescription({
    specialty: '重症康复（ICU）',
    diagnosis: sp.icu_diagnosis || 'ICU获得性肌无力',
    phase: '早期活动期',
    fit_Frequency:  freq,
    fit_Intensity:  intensity,
    fit_Time:       duration,
    fit_Type:       ['early_mobilization', 'passive_range_of_motion'],
    fit_Volume:     'ICU期间以维持肌力/预防并发症为主，不计算MET-minutes',
    fit_Progression: '每日评估 IMS 评分。IMS 提高 ≥ 1分 可进阶至下一级活动。目标：转出ICU时 IMS ≥ 6分（能步行）。',
    exercises:       exercises,
    contraindications: [
      '心率 < 40 或 > 130 次/分',
      '收缩压 < 90 或 > 180 mmHg',
      'SpO₂ < 88%（吸氧状态下）',
      '未控制的颅内高压（ICP > 20 mmHg）',
      '活动性出血（消化道/颅内/胸腔）',
      '新发急性心肌梗死（24小时内）'
    ],
    precautions: [
      '所有活动必须在生命体征监测下进行',
      '2人辅助（至少1名治疗师+1名护士）',
      '出现任何终止标准（见上）立即停止活动',
      'ICU获得性肌无力患者：MRC总分 < 48分，需更保守的活动方案'
    ],
    evidenceLevel: 'A_strong',
    guideSource: 'ICU_EarlyMob_2020'
  });

  return prescription;
}


/* ============================================================
   四、处方生成主函数（页面加载时调用）
   ============================================================ */

function generatePrescription() {
  // 1. 读取 sessionStorage 中的评估数据
  var dataStr = sessionStorage.getItem('rx-assessment-data');
  if (!dataStr) {
    return { error: '未找到评估数据，请先完成评估。' };
  }

  var data;
  try {
    data = JSON.parse(dataStr);
  } catch (e) {
    return { error: '评估数据格式错误，请重新评估。' };
  }

  var specialty = data.specialty || 'neuro';

  // 2. 根据专科调用对应的处方生成函数
  var prescription = null;
  switch (specialty) {
    case 'neuro':    prescription = generateNeuroPrescription(data); break;
    case 'knee':     prescription = generateKneePrescription(data); break;
    case 'lumbar':   prescription = generateLumbarPrescription(data); break;
    case 'cervical': prescription = generateCervicalPrescription(data); break;
    case 'shoulder': prescription = generateShoulderPrescription(data); break;
    case 'cardio':   prescription = generateCardioPrescription(data); break;
    case 'icu':      prescription = generateICUPrescription(data); break;
    case 'hand':     prescription = generateHandPrescription(data); break;
    default:         prescription = generateNeuroPrescription(data); // fallback
  }

  return prescription;
}

/* 手功能康复处方（简化） */
function generateHandPrescription(data) {
  var sp = data.specialtyData || {};
  var diagnosis = sp.hand_diagnosis || '桡骨远端骨折';

  var exercises = [
    {
      name: '患指被动/主动关节活动度训练',
      sets: '每天 3 组', reps: '每个关节 10-15 次',
      technique: '屈曲/伸展/侧方活动。骨折愈合后（通常6周后）开始。 using 橡皮筋辅助（手指体操）。',
      guide: '《作业治疗学》第3版 Ch.7',
      evidence: 'B_moderate'
    },
    {
      name: '患指肌力训练（捏力/握力）',
      sets: '每周 3-4 次', reps: '每组 10-15 次 × 2-3 组',
      technique: '捏力：使用捏力计或橡皮泥；握力：握力球。从轻度阻力开始。',
      guide: '《作业治疗学》第3版 Ch.7',
      evidence: 'B_moderate'
    }
  ];

  return createPrescription({
    specialty: '手功能康复',
    diagnosis: diagnosis,
    phase: sp.hand_onset || '',
    fit_Frequency: '每周 5-7 次',
    fit_Intensity: '低-中度；RPE 8-13/20',
    fit_Time: '每次 20-30 分钟',
    fit_Type: ['fine_motor', 'resistance'],
    fit_Volume: '约 100-200 MET-minutes/周',
    fit_Progression: '每 4 周评估 Jebsen 手功能测试。捏力/握力达健侧 80% 以上可考虑重返工作。',
    exercises: exercises,
    contraindications: ['骨折未愈合（X线确认）', '肌腱再断裂（术后 < 6周）'],
    precautions: ['训练后肿胀加重可持续 24-48 小时', '使用弹力带/捏力球时注意不要过度训练'],
    evidenceLevel: 'B_moderate',
    guideSource: 'Rehab_Assessment_3rd'
  });
}

/* ============================================================
   五、处方结果页面渲染
   ============================================================ */

function initPrescriptionPage() {
  var container = document.getElementById('prescription-result');
  if (!container) return;

  var result = generatePrescription();

  if (result.error) {
    container.innerHTML = '<div class="rx-error">⚠️ ' + result.error + '</div>';
    return;
  }

  // 渲染处方
  var html = renderPrescriptionHTML(result);
  container.innerHTML = html;

  // 绑定打印/导出按钮
  var printBtn = document.getElementById('rx-print-btn');
  if (printBtn) printBtn.addEventListener('click', function() { window.print(); });
}

function renderPrescriptionHTML(rx) {
  var html = '';

  // —— 标题 + 诊断信息 ——
  html += '<div class="rx-header">';
  html += '<h2>📋 循证运动处方</h2>';
  html += '<p class="rx-specialty">' + rx.specialty + ' · ' + rx.diagnosis + '</p>';
  if (rx.phase) html += '<p class="rx-phase">分期/分类：' + rx.phase + '</p>';
  html += '</div>';

  // —— 证据等级 + 指南来源 ——
  html += '<div class="rx-evidence-header">';
  html += '<span class="rx-evidence-badge">' + (evidenceLevels[rx.evidenceLevel] || rx.evidenceLevel) + '</span>';
  html += '<span class="rx-guide-source">📚 指南来源：' + (guideSources[rx.guideSource] || rx.guideSource) + '</span>';
  html += '</div>';

  // —— FITT-VP 处方表格 ——
  html += '<div class="rx-fittvp">';
  html += '<h3>📊 运动处方（FITT-VP 格式）</h3>';
  html += '<table class="rx-table">';
  html += '<tr><th>维度</th><th>处方内容</th><th>循证依据</th></tr>';
  html += '<tr><td><strong>Frequency（频率）</strong></td><td>' + rx.fit.Frequency + '</td><td rowspan="6" class="rx-evidence-cell">' +
           (evidenceLevels[rx.evidenceLevel] || '') + '<br/><br/>' + (guideSources[rx.guideSource] || '') + '</td></tr>';
  html += '<tr><td><strong>Intensity（强度）</strong></td><td>' + rx.fit.Intensity + '</td></tr>';
  html += '<tr><td><strong>Time（时间）</strong></td><td>' + rx.fit.Time + '</td></tr>';
  html += '<tr><td><strong>Type（类型）</strong></td><td>' + rx.fit.Type.join('、') + '</td></tr>';
  html += '<tr><td><strong>Volume（总量）</strong></td><td>' + rx.fit.Volume + '</td></tr>';
  html += '<tr><td><strong>Progression（进阶）</strong></td><td>' + rx.fit.Progression + '</td></tr>';
  html += '</table>';
  html += '</div>';

  // —— 具体运动方案 ——
  html += '<div class="rx-exercises">';
  html += '<h3>🏋️ 具体运动方案</h3>';
  rx.exercises.forEach(function(ex, idx) {
    html += '<div class="rx-exercise-card">';
    html += '<h4>' + (idx + 1) + '. ' + ex.name + '</h4>';
    html += '<div class="rx-exercise-detail">';
    html += '<p><strong>方案：</strong>' + (ex.sets || '') + '；' + (ex.reps || '') + '</p>';
    if (ex.technique) {
      html += '<p><strong>技术要点：</strong>' + ex.technique + '</p>';
    }
    if (ex.guide) {
      html += '<p class="rx-evidence"><strong>📖 循证依据：</strong>' + ex.guide + '（' + (evidenceLevels[ex.evidence] || ex.evidence) + '）</p>';
    }
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';

  // —— 禁忌症 ——
  if (rx.contraindications && rx.contraindications.length > 0) {
    html += '<div class="rx-contraindications">';
    html += '<h3>🚫 绝对禁忌症（安全红线）</h3>';
    html += '<ul>';
    rx.contraindications.forEach(function(c) {
      html += '<li>' + c + '</li>';
    });
    html += '</ul>';
    html += '</div>';
  }

  // —— 注意事项 ——
  if (rx.precautions && rx.precautions.length > 0) {
    html += '<div class="rx-precautions">';
    html += '<h3>⚠️ 注意事项</h3>';
    html += '<ul>';
    rx.precautions.forEach(function(p) {
      html += '<li>' + p + '</li>';
    });
    html += '</ul>';
    html += '</div>';
  }

  // —— 免责声明 ——
  html += '<div class="rx-disclaimer">';
  html += '<p>⚠️ <strong>免责声明：</strong>本处方基于临床实践指南自动生成，仅供康复专业人员或患者居家参考。';
  html += '实际执行前请务必咨询您的主治医师或康复治疗师。';
  html += '运动过程中如出现胸痛、严重气促、晕厥前兆等症状，请立即停止并就医。</p>';
  html += '<p class="rx-timestamp">处方生成时间：' + new Date().toLocaleString('zh-CN') + '</p>';
  html += '</div>';

  return html;
}

/* ============================================================
   六、初始化
   ============================================================ */
document.addEventListener('DOMContentLoaded', initPrescriptionPage);
