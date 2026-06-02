/* ============================================================
   differential.js — 交互式鉴别诊断追问引擎（四步通用筛查模型）
   当症状匹配多个可能诊断时，通过连环追问（是非题/动作测试）锁定诊断
   参考：《康复评定学》第3版；《诊断学》第9版 症状鉴别诊断章节
   架构：四步通用筛查模型（Level 1-4）
   ============================================================ */

const DifferentialEngine = {
  /* ——— 追问树定义 ——— */
  trees: {
    /* ============================================================
     * 通用症状追问树（所有症状的入口）
     * 第一题做解剖定位，然后根据定位结果跳转到对应的专科追问树
     * ============================================================ */
    'general_symptom': {
      label: '症状初步筛查',
      icon: '🩺',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤（通用） ========== */
        {
          id: 'redflag_general',
          level: 1,
          question: '您的症状是突然发生的吗？是否伴有以下任何一种危险信号：说话含糊不清、半边脸麻木、胸痛大汗淋漓、大小便失禁？',
          type: 'radio',
          options: [
            { label: '是，有上述危险信号', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，没有这些危险信号', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除急危重症（脑卒中、心梗、马尾综合征等）'
        },
        /* ========== Level 2: 解剖部位精细定位（通用） ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '您的症状主要发生在身体的哪个部位？（可多选）',
          type: 'checkbox',
          options: [
            { label: '颈部、肩膀、上肢（手麻/肩痛/颈痛）', value: 'neck_shoulder_arm', next: 'branch_neck_shoulder_arm' },
            { label: '肩胛区、上背部（肩胛缝疼/后背痛）', value: 'scapular_back', next: 'branch_scapular_back' },
            { label: '腰背部、臀部、下肢（腰痛/腿痛/腿麻）', value: 'back_hip_leg', next: 'branch_back_hip_leg' },
            { label: '膝关节（膝痛/上下楼梯痛）', value: 'knee', next: 'branch_knee' },
            { label: '头部、平衡（头晕/头痛/走路不稳）', value: 'head_dizziness', next: 'branch_head_dizziness' },
            { label: '胸部、呼吸（气喘/胸闷/运动后气短）', value: 'chest_breathing', next: 'branch_chest_breathing' }
          ]
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'general', reason: '' };
        
        // Level 1: 红线检查
        var redflag = answers.redflag_general;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑急危重症风险！请立即就医，勿自行康复。';
          return result;
        }
        
        // Level 2: 解剖定位 → 跳转到对应的专科追问树
        var location = answers.step_2_localization;
        if (location) {
          if (location.indexOf('neck_shoulder_arm') !== -1) {
            result.diagnosis = 'need_further_differential';
            result.specialty = 'hand';  // 临时，实际应该跳转到 hand_numb 或 shoulder_pain 树
            result.label = '需要进一步鉴别诊断（颈部/肩部/上肢）';
            result.reason = '解剖定位：颈部/肩膀/上肢';
            result.nextTree = 'hand_numb';  // 告诉前端跳转到哪个树
            return result;
          }
          if (location.indexOf('scapular_back') !== -1) {
            result.diagnosis = 'need_further_differential';
            result.specialty = 'scapular';
            result.label = '需要进一步鉴别诊断（肩胛区/上背部）';
            result.reason = '解剖定位：肩胛区/上背部';
            result.nextTree = 'scapular_pain';
            return result;
          }
          if (location.indexOf('back_hip_leg') !== -1) {
            result.diagnosis = 'need_further_differential';
            result.specialty = 'lumbar';
            result.label = '需要进一步鉴别诊断（腰背部/臀部/下肢）';
            result.reason = '解剖定位：腰背部/臀部/下肢';
            result.nextTree = 'low_back_pain';
            return result;
          }
          if (location.indexOf('knee') !== -1) {
            result.diagnosis = 'need_further_differential';
            result.specialty = 'knee';
            result.label = '需要进一步鉴别诊断（膝关节）';
            result.reason = '解剖定位：膝关节';
            result.nextTree = 'knee_pain';
            return result;
          }
          if (location.indexOf('head_dizziness') !== -1) {
            result.diagnosis = 'need_further_differential';
            result.specialty = 'neurology';
            result.label = '需要进一步鉴别诊断（头部/平衡）';
            result.reason = '解剖定位：头部/平衡';
            result.nextTree = 'dizziness';  // 未来实现
            return result;
          }
          if (location.indexOf('chest_breathing') !== -1) {
            result.diagnosis = 'need_further_differential';
            result.specialty = 'cardiopulmonary';
            result.label = '需要进一步鉴别诊断（胸部/呼吸）';
            result.reason = '解剖定位：胸部/呼吸';
            result.nextTree = 'dyspnea';  // 未来实现
            return result;
          }
        }
        
        // 默认
        result.diagnosis = 'unknown';
        result.confidence = 60;
        result.specialty = 'general';
        result.label = '症状待查（建议就诊）';
        result.reason = '无法定位，建议进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 手麻 / 手指麻木（四步通用筛查模型）
     * ============================================================ */
    'hand_numb': {
      label: '手麻/手指麻木 鉴别诊断',
      icon: '✋',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_stroke',
          level: 1,
          question: '您的麻木是突然发生的吗？是否同时伴有以下任何一种情况：说话含糊不清、半边脸麻木流涎、或单侧上肢完全抬不起来？',
          type: 'radio',
          options: [
            { label: '是，有上述情况', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，没有这些症状', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除急性脑卒中（中风）风险，见《神经康复学》急诊筛查流程'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您用手指指出麻木的具体位置（可多选）：',
          type: 'checkbox',
          options: [
            { label: '拇指、食指、中指', value: 'median', next: 'step_3_concomitant' },
            { label: '小指 + 无名指尺侧一半', value: 'ulnar', next: 'step_3_concomitant' },
            { label: '整个手掌/全手都麻', value: 'whole_hand', next: 'step_3_concomitant' },
            { label: '只有手指尖麻，手掌不麻', value: 'fingertip', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '除麻木外，是否伴有颈肩痛、脖子不舒服？',
          type: 'radio',
          options: [
            { label: '是，有颈肩痛/脖子不舒服', value: 'neck_yes', next: 'step_3_duration' },
            { label: '否，只有手指麻，颈部正常', value: 'neck_no', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '这种麻木持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '不到2周（急性）', value: 'acute', next: 'step_3_aggravating' },
            { label: '2周-3个月（亚急性）', value: 'subacute', next: 'step_3_aggravating' },
            { label: '超过3个月（慢性）', value: 'chronic', next: 'step_3_aggravating' }
          ]
        },
        {
          id: 'step_3_aggravating',
          level: 3,
          question: '什么时候麻木最明显？（状态轴）',
          type: 'radio',
          options: [
            { label: '夜间或清晨更明显', value: 'night', next: 'step_4_physical' },
            { label: '长时间保持一个姿势后（如用电脑、看手机）', value: 'posture', next: 'step_4_physical' },
            { label: '活动后反而减轻', value: 'activity_relief', next: 'step_4_physical' },
            { label: '没有明显规律', value: 'unknown', next: 'step_4_physical' }
          ]
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试把头向麻木侧后方倾斜并微微后仰（仰头看上方）。此时，您的麻木感是否明显加重，甚至有一股电流感从脖子窜到手指？',
          type: 'radio',
          options: [
            { label: '是，仰头时麻木加重', value: 'cervical_pos', next: 'cervical_result' },
            { label: '否，和仰头无关', value: 'cervical_neg', next: 'elbow_test' }
          ],
          guide: '仰头动作牵拉颈椎神经根，若麻木加重提示神经根型颈椎病，见APTA颈椎CPG 2021'
        },
        {
          id: 'elbow_test',
          level: 4,
          question: '长时间手肘弯曲（如打电话、枕着胳膊睡）时，手指麻木是否比平时更严重？',
          type: 'radio',
          options: [
            { label: '是，手肘弯曲久了更麻', value: 'elbow_pos', next: 'elbow_result' },
            { label: '否，和手肘姿势无关', value: 'elbow_neg', next: 'wrist_test' }
          ],
          guide: '肘管综合征典型诱发姿势：肘屈曲>90°时尺神经受压加重'
        },
        {
          id: 'wrist_test',
          level: 4,
          question: '请尝试用双手手腕做"OK"手势（食指和拇指捏在一起），或者用手指捏起一张纸。是否感觉手指无力、捏不住？',
          type: 'radio',
          options: [
            { label: '是，手指无力/捏不住', value: 'wrist_pos', next: 'wrist_result' },
            { label: '否，手指力量正常', value: 'wrist_neg', next: 'unknown_result' }
          ],
          guide: '正中神经支配拇指对掌肌，若无力提示腕管综合征'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'hand', reason: '' };
        
        // Level 1: 红线检查
        var redflag = answers.redflag_stroke;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑急性脑卒中风险！请立即就医，勿自行康复。';
          return result;
        }
        
        // 分析 Level 2-4 的答案
        var finger = answers.step_2_localization;  // 解剖定位
        var neckCheck = answers.step_3_concomitant;  // 伴随症状
        var duration = answers.step_3_duration;  // 时间轴
        var aggravating = answers.step_3_aggravating;  // 状态轴
        var cervicalTest = answers.step_4_physical;  // 物理测试
        var elbowTest = answers.elbow_test;
        var wristTest = answers.wrist_test;
        
        // Level 4: 物理测试结果判断
        if (cervicalTest && cervicalTest.indexOf('cervical_pos') !== -1) {
          result.diagnosis = 'cervical_radiculopathy';
          result.confidence = 90;
          result.specialty = 'cervical';
          result.label = '神经根型颈椎病';
          result.reason = '仰头时麻木加重 + 颈肩痛，符合颈椎神经根受压（Level 4 物理测试阳性）';
          return result;
        }
        
        if (elbowTest && elbowTest.indexOf('elbow_pos') !== -1) {
          result.diagnosis = 'cubital_tunnel';
          result.confidence = 85;
          result.specialty = 'hand';
          result.label = '肘管综合征（尺神经卡压）';
          result.reason = '肘屈曲诱发加重（Level 4 物理测试阳性），符合肘管综合征';
          return result;
        }
        
        if (wristTest && wristTest.indexOf('wrist_pos') !== -1) {
          // 检查是否是正中神经分布区
          if (finger && finger.indexOf('median') !== -1) {
            result.diagnosis = 'carpal_tunnel';
            result.confidence = 90;
            result.specialty = 'hand';
            result.label = '腕管综合征（正中神经卡压）';
            result.reason = '拇指+食指+中指麻木 + 手指无力（Level 4 物理测试阳性），符合腕管综合征';
            return result;
          } else {
            result.diagnosis = 'carpal_tunnel';
            result.confidence = 80;
            result.specialty = 'hand';
            result.label = '腕管综合征（正中神经卡压）？';
            result.reason = '手指无力（Level 4 物理测试阳性），怀疑腕管综合征，但麻木区域不明确';
            return result;
          }
        }
        
        // Level 2-3: 根据定位和伴随症状判断
        if (finger && finger.indexOf('fingertip') !== -1) {
          result.diagnosis = 'hand_numb_unknown';
          result.confidence = 60;
          result.specialty = 'hand';
          result.label = '手指尖麻木（建议进一步检查）';
          result.reason = '只有手指尖麻木，Level 4 物理测试阴性，建议手外科/神经内科就诊';
          return result;
        }
        
        if (finger && finger.indexOf('whole_hand') !== -1) {
          if (neckCheck && neckCheck.indexOf('neck_yes') !== -1) {
            result.diagnosis = 'cervical_radiculopathy';
            result.confidence = 80;
            result.specialty = 'cervical';
            result.label = '颈椎问题（需进一步明确节段）';
            result.reason = '整个手麻木 + 颈肩痛（Level 2-3 伴随症状），提示颈椎神经根受累';
            return result;
          } else {
            result.diagnosis = 'hand_numb_unknown';
            result.confidence = 60;
            result.specialty = 'hand';
            result.label = '手麻待查（建议手外科/神经内科就诊）';
            result.reason = '整个手麻木，Level 2-4 无法明确，需进一步检查';
            return result;
          }
        }
        
        // 默认：所有测试阴性
        result.diagnosis = 'hand_numb_unknown';
        result.confidence = 60;
        result.specialty = 'hand';
        result.label = '手麻待查（建议手外科/神经内科就诊）';
        result.reason = 'Level 1-4 筛查均为阴性，建议进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 腰痛（四步通用筛查模型）
     * ============================================================ */
    'low_back_pain': {
      label: '腰痛 鉴别诊断',
      icon: '🦴',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_cauda',
          level: 1,
          question: '是否有以下"马尾综合征"危险信号：会阴部（骑跨区）麻木、大小便失禁或潴留、双下肢突然无力？',
          type: 'radio',
          options: [
            { label: '是，有上述症状', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，无大小便问题', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '马尾综合征为神经外科急症，需24小时内手术，见《骨科康复学》Ch.5'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您指出疼痛的最主要位置（可多选）：',
          type: 'checkbox',
          options: [
            { label: '只有腰痛，不痛到腿', value: 'lumbar_only', next: 'step_3_concomitant' },
            { label: '腰痛 + 臀部痛', value: 'lumbar_buttock', next: 'step_3_concomitant' },
            { label: '腰痛 + 腿痛（放射痛）', value: 'radicular', next: 'step_3_concomitant' },
            { label: '只有腿痛，腰不痛', value: 'leg_only', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '除腰痛外，是否伴有下肢无力、麻木或针刺感？',
          type: 'radio',
          options: [
            { label: '是，有下肢无力/麻木', value: 'neuro_yes', next: 'step_3_duration' },
            { label: '否，只有疼痛', value: 'neuro_no', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '这种腰痛持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '不到2周（急性）', value: 'acute', next: 'step_3_aggravating' },
            { label: '2周-3个月（亚急性）', value: 'subacute', next: 'step_3_aggravating' },
            { label: '超过3个月（慢性）', value: 'chronic', next: 'step_3_aggravating' }
          ]
        },
        {
          id: 'step_3_aggravating',
          level: 3,
          question: '什么时候腰痛最明显？（状态轴）',
          type: 'radio',
          options: [
            { label: '翻身/起床时腰僵疼痛，活动后反而减轻（晨僵>30分钟）', value: 'inflammatory', next: 'step_4_physical' },
            { label: '久坐/弯腰时痛，站立/后仰缓解，感觉腰"不稳"', value: 'instability', next: 'step_4_physical' },
            { label: '腰部活动受限明显，某个方向卡住不敢动', value: 'stiffness', next: 'step_4_physical' },
            { label: '腿痛大于腰痛，放射至小腿/足', value: 'radicular', next: 'step_4_physical' }
          ],
          guide: 'APTA腰痛CPG 2021：按疼痛模式分类决定康复策略'
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试平躺在床上，单腿伸直向上抬高（不用抬太高）。是否在60度以内就触发下肢放射痛？（直腿抬高试验）',
          type: 'radio',
          options: [
            { label: '是，60度以内就痛/麻', value: 'slr_pos', next: 'disc_herniation' },
            { label: '否，能抬到60度以上，或只有腰/臀痛', value: 'slr_neg', next: 'stability_test' }
          ],
          guide: '直腿抬高试验（Lasegue Sign）阳性提示腰椎间盘突出症，见《骨科物理检查》'
        },
        {
          id: 'stability_test',
          level: 4,
          question: '请尝试俯卧在床上，让他人用手掌按压您的腰背部。疼痛是否减轻或消失？（俯卧伸展试验）',
          type: 'radio',
          options: [
            { label: '是，俯卧伸展时疼痛减轻', value: 'extension_relief', next: 'disc_related' },
            { label: '否，俯卧伸展时疼痛加重或无变化', value: 'extension_no_relief', next: 'unknown_result' }
          ],
          guide: '俯卧伸展试验阳性提示椎间盘源性腰痛'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'lumbar', reason: '' };
        
        // Level 1: 红线检查
        var redflag = answers.redflag_cauda;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑马尾综合征！请立即前往医院急诊，勿自行康复。';
          return result;
        }
        
        // 分析 Level 2-4 的答案
        var location = answers.step_2_localization;  // 解剖定位
        var neuroCheck = answers.step_3_concomitant;  // 伴随症状
        var duration = answers.step_3_duration;  // 时间轴
        var aggravating = answers.step_3_aggravating;  // 状态轴
        var slrTest = answers.step_4_physical;  // 物理测试
        var stabilityTest = answers.stability_test;
        
        // Level 4: 物理测试结果判断
        if (slrTest && slrTest.indexOf('slr_pos') !== -1) {
          result.diagnosis = 'lumbar_disc_herniation';
          result.confidence = 90;
          result.specialty = 'lumbar';
          result.label = '腰椎间盘突出症';
          result.reason = '直腿抬高试验阳性（Level 4 物理测试阳性），符合根性痛';
          return result;
        }
        
        // Level 3: 根据疼痛模式判断
        if (aggravating && aggravating.indexOf('instability') !== -1) {
          result.diagnosis = 'lumbar_instability';
          result.confidence = 85;
          result.specialty = 'lumbar';
          result.label = '腰椎不稳/非特异性腰痛（稳定机制异常型）';
          result.reason = '疼痛与姿势相关，活动后缓解（Level 3 状态轴），符合稳定机制异常模式';
          return result;
        }
        
        if (aggravating && aggravating.indexOf('stiffness') !== -1) {
          result.diagnosis = 'lumbar_stiffness';
          result.confidence = 80;
          result.specialty = 'lumbar';
          result.label = '腰椎活动度受限';
          result.reason = '活动受限明显（Level 3 状态轴），符合关节源性腰痛';
          return result;
        }
        
        if (aggravating && aggravating.indexOf('inflammatory') !== -1) {
          result.diagnosis = 'inflammatory_back_pain';
          result.confidence = 75;
          result.specialty = 'lumbar';
          result.label = '炎性腰痛（需排查强直性脊柱炎）';
          result.reason = '晨僵>30分钟，活动后减轻（Level 3 状态轴），符合炎性模式';
          return result;
        }
        
        // 默认
        result.diagnosis = 'lumbar_nonspecific';
        result.confidence = 70;
        result.specialty = 'lumbar';
        result.label = '非特异性腰痛';
        result.reason = 'Level 1-4 筛查无法明确分类，按非特异性腰痛处理';
        return result;
      }
    },

    /* ============================================================
     * 肩痛（四步通用筛查模型）
     * ============================================================ */
    'shoulder_pain': {
      label: '肩痛 鉴别诊断',
      icon: '🦾',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_shoulder',
          level: 1,
          question: '是否有以下危险信号：肩部明显红肿热痛、发热、近期有外伤后畸形？',
          type: 'radio',
          options: [
            { label: '是，有上述症状', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，无红肿发热', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除化脓性关节炎、骨折等急症'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您指出疼痛的最主要位置（可多选）：',
          type: 'checkbox',
          options: [
            { label: '肩前痛（锁骨外侧/肱二头肌沟）', value: 'anterior', next: 'step_3_concomitant' },
            { label: '肩外侧痛（三角肌区）', value: 'lateral', next: 'step_3_concomitant' },
            { label: '肩后痛（肩胛骨区）', value: 'posterior', next: 'step_3_concomitant' },
            { label: '整个肩部都痛', value: 'whole_shoulder', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '肩痛是如何开始的？',
          type: 'radio',
          options: [
            { label: '逐渐加重，无明显外伤，夜间痛明显', value: 'gradual', next: 'step_3_duration' },
            { label: '有明确外伤/手术后逐渐活动受限', value: 'trauma', next: 'step_3_duration' },
            { label: '突然剧烈疼痛，完全不能抬起', value: 'acute', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '这种肩痛持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '不到2周（急性）', value: 'acute', next: 'step_3_aggravating' },
            { label: '2周-3个月（亚急性）', value: 'subacute', next: 'step_3_aggravating' },
            { label: '超过3个月（慢性）', value: 'chronic', next: 'step_3_aggravating' }
          ]
        },
        {
          id: 'step_3_aggravating',
          level: 3,
          question: '什么时候肩痛最明显？（状态轴）',
          type: 'radio',
          options: [
            { label: '夜间痛明显，影响睡眠', value: 'night_pain', next: 'step_4_physical' },
            { label: '特定角度疼痛（如抬手60-120度之间）', value: 'pain_arc', next: 'step_4_physical' },
            { label: '活动后加重，休息后减轻', value: 'activity_aggravating', next: 'step_4_physical' },
            { label: '没有明显规律', value: 'unknown', next: 'step_4_physical' }
          ]
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试主动抬起患肩（前屈）。与健侧相比，抬高的幅度是否严重受限（差>50%）？再让别人帮您被动抬高患肩，幅度是否和主动抬高差不多？',
          type: 'radio',
          options: [
            { label: '主动和被动都严重受限，像"冻住"了一样', value: 'frozen', next: 'frozen_shoulder' },
            { label: '主动抬不高，但别人帮我抬能抬得更高', value: 'weakness', next: 'rotator_cuff' },
            { label: '主动被动都还好，但某个角度会痛', value: 'impingement', next: 'impingement' }
          ],
          guide: '主动<被动 → 肩袖损伤（肌力不足）；主动≈被动受限 → 冻结肩（关节囊挛缩）'
        },
        {
          id: 'rotator_cuff',
          level: 4,
          question: '请尝试把胳膊从身体侧面向上举，在60度到120度之间时，疼痛是不是最剧烈，举过120度反而不痛了？（疼痛弧试验）',
          type: 'radio',
          options: [
            { label: '是，60-120度最痛，超过120度反而不痛', value: 'pain_arc_pos', next: 'impingement_syndrome' },
            { label: '否，没有典型的疼痛弧', value: 'pain_arc_neg', next: 'unknown_result' }
          ],
          guide: '疼痛弧（Pain Arc）阳性提示肩峰下撞击综合征'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'shoulder', reason: '' };
        
        // Level 1: 红线检查
        var redflag = answers.redflag_shoulder;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑肩部急症（化脓性关节炎/骨折）！请立即就医。';
          return result;
        }
        
        // 分析 Level 2-4 的答案
        var location = answers.step_2_localization;  // 解剖定位
        var onset = answers.step_3_concomitant;  // 伴随症状
        var duration = answers.step_3_duration;  // 时间轴
        var aggravating = answers.step_3_aggravating;  // 状态轴
        var romTest = answers.step_4_physical;  // 物理测试
        var painArcTest = answers.rotator_cuff;
        
        // Level 4: 物理测试结果判断
        if (romTest && romTest.indexOf('frozen') !== -1) {
          result.diagnosis = 'frozen_shoulder';
          result.confidence = 90;
          result.specialty = 'shoulder';
          result.label = '冻结肩（粘连性关节囊炎）';
          result.reason = '主动+被动活动均严重受限（Level 4 物理测试阳性），符合冻结肩特征';
          return result;
        }
        
        if (romTest && romTest.indexOf('weakness') !== -1) {
          result.diagnosis = 'rotator_cuff_injury';
          result.confidence = 85;
          result.specialty = 'shoulder';
          result.label = '肩袖损伤';
          result.reason = '主动活动<被动活动（Level 4 物理测试阳性），提示肩袖肌力不足';
          return result;
        }
        
        if (painArcTest && painArcTest.indexOf('pain_arc_pos') !== -1) {
          result.diagnosis = 'shoulder_impingement';
          result.confidence = 80;
          result.specialty = 'shoulder';
          result.label = '肩峰下撞击综合征';
          result.reason = '疼痛弧试验阳性（Level 4 物理测试阳性），符合撞击综合征';
          return result;
        }
        
        if (romTest && romTest.indexOf('impingement') !== -1) {
          result.diagnosis = 'shoulder_impingement';
          result.confidence = 80;
          result.specialty = 'shoulder';
          result.label = '肩峰下撞击综合征';
          result.reason = '特定角度疼痛（Level 4 物理测试），活动度尚可，符合撞击综合征';
          return result;
        }
        
        // 默认
        result.diagnosis = 'shoulder_pain_unknown';
        result.confidence = 60;
        result.specialty = 'shoulder';
        result.label = '肩痛待查';
        result.reason = 'Level 1-4 筛查无法明确，建议进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 肩胛痛（四步通用筛查模型）
     * 肩胛骨内侧/周围疼痛 —— 常见原因：胸椎小关节、菱形肌劳损、颈神经根C5-C6、肩胛胸壁综合征
     * ============================================================ */
    'scapular_pain': {
      label: '肩胛痛 鉴别诊断',
      icon: '🧱',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_scapular',
          level: 1,
          question: '是否有以下危险信号：胸痛放射至肩胛、呼吸困难、出汗、近期有外伤后肩胛区畸形？',
          type: 'radio',
          options: [
            { label: '是，有胸痛/呼吸困难/外伤畸形', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，没有这些症状', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除心梗放射痛、气胸、肩胛骨骨折等急症'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您指出疼痛的最准确位置（可多选）：',
          type: 'checkbox',
          options: [
            { label: '肩胛骨内侧缘（靠近脊柱那一侧）', value: 'medial_border', next: 'step_3_concomitant' },
            { label: '肩胛骨外侧/肩袖区（肩膀后面）', value: 'lateral_scapula', next: 'step_3_concomitant' },
            { label: '肩胛骨下角（低头时突出的骨头）', value: 'inferior_angle', next: 'step_3_concomitant' },
            { label: '两个肩胛骨中间（胸椎棘突区）', value: 'thoracic_spine', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '除肩胛痛外，是否伴有颈肩痛、手麻、或抬臂无力？',
          type: 'radio',
          options: [
            { label: '是，有颈肩痛/手麻/抬臂无力', value: 'neck_arm_yes', next: 'step_3_duration' },
            { label: '否，只有肩胛区痛', value: 'neck_arm_no', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '这种疼痛持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '不到2周（急性）', value: 'acute', next: 'step_3_aggravating' },
            { label: '2周-3个月（亚急性）', value: 'subacute', next: 'step_3_aggravating' },
            { label: '超过3个月（慢性）', value: 'chronic', next: 'step_3_aggravating' }
          ]
        },
        {
          id: 'step_3_aggravating',
          level: 3,
          question: '什么姿势或动作会让疼痛加重？（状态轴）',
          type: 'checkbox',
          options: [
            { label: '久坐/伏案/低头时加重，活动后减轻', value: 'posture_aggravating', next: 'step_4_physical' },
            { label: '抬臂过头时加重', value: 'overhead_aggravating', next: 'step_4_physical' },
            { label: '深呼吸/转身时加重', value: 'respiratory_aggravating', next: 'step_4_physical' },
            { label: '没有明显规律', value: 'unknown', next: 'step_4_physical' }
          ]
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试把头向患侧后方倾斜并微微后仰（仰头看上方）。此时，您的肩胛痛是否明显加重，甚至有一股牵涉感从颈部窜到肩胛？',
          type: 'radio',
          options: [
            { label: '是，仰头时肩胛痛加重', value: 'cervical_pos', next: 'cervical_result' },
            { label: '否，和仰头无关', value: 'cervical_neg', next: 'thoracic_test' }
          ],
          guide: '肩胛痛可由颈椎C5-C6神经根放射引起，见APTA颈椎CPG 2021'
        },
        {
          id: 'thoracic_test',
          level: 4,
          question: '请坐姿，双手交叉抱头，主动把双侧肩胛骨向内夹紧（做"挺胸"动作）。此时肩胛内侧是否出现明显疼痛或弹响？',
          type: 'radio',
          options: [
            { label: '是，夹紧时肩胛内侧痛/弹响', value: 'thoracic_pos', next: 'thoracic_result' },
            { label: '否，和肩胛骨活动无关', value: 'thoracic_neg', next: 'muscle_result' }
          ],
          guide: '肩胛胸壁综合征 / 胸椎小关节功能紊乱的典型诱发动作'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'shoulder', reason: '' };

        // Level 1: 红线检查
        var redflag = answers.redflag_scapular;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑心梗放射痛/气胸/骨折！请立即就医，勿自行康复。';
          return result;
        }

        var location = answers.step_2_localization;
        var neckArm = answers.step_3_concomitant;
        var aggravating = answers.step_3_aggravating;
        var cervicalTest = answers.step_4_physical;
        var thoracicTest = answers.thoracic_test;

        // Level 4: 物理测试
        if (cervicalTest && cervicalTest.indexOf('cervical_pos') !== -1) {
          result.diagnosis = 'cervical_radiculopathy_c5c6';
          result.confidence = 90;
          result.specialty = 'cervical';
          result.label = '神经根型颈椎病（C5-C6）';
          result.reason = '仰头时肩胛痛加重（Level 4 物理测试阳性），符合颈椎神经根放射痛';
          return result;
        }

        if (thoracicTest && thoracicTest.indexOf('thoracic_pos') !== -1) {
          result.diagnosis = 'thoracic_dysfunction';
          result.confidence = 85;
          result.specialty = 'thoracic';
          result.label = '胸椎小关节功能紊乱 / 肩胛胸壁综合征';
          result.reason = '肩胛骨夹紧时疼痛/弹响（Level 4 物理测试阳性），符合胸椎/肩胛胸壁问题';
          return result;
        }

        // Level 2-3: 根据定位和伴随症状判断
        if (neckArm && neckArm.indexOf('neck_arm_yes') !== -1) {
          result.diagnosis = 'cervical_radiculopathy_suspected';
          result.confidence = 80;
          result.specialty = 'cervical';
          result.label = '颈椎问题（需进一步明确节段）';
          result.reason = '肩胛痛 + 颈肩痛/手麻（Level 2-3 伴随症状），提示颈椎神经根受累';
          return result;
        }

        if (aggravating && aggravating.indexOf('posture_aggravating') !== -1) {
          result.diagnosis = 'postural_scapular_pain';
          result.confidence = 75;
          result.specialty = 'thoracic';
          result.label = '姿势性肩胛痛（菱形肌劳损/胸椎僵硬）';
          result.reason = '久坐/伏案加重，活动后减轻（Level 3 状态轴），符合姿势性问题';
          return result;
        }

        if (aggravating && aggravating.indexOf('respiratory_aggravating') !== -1) {
          result.diagnosis = 'thoracic_spine_dysfunction';
          result.confidence = 70;
          result.specialty = 'thoracic';
          result.label = '胸椎小关节功能紊乱';
          result.reason = '深呼吸/转身时加重（Level 3 状态轴），符合胸椎问题';
          return result;
        }

        // 默认
        result.diagnosis = 'scapular_pain_unknown';
        result.confidence = 60;
        result.specialty = 'shoulder';
        result.label = '肩胛痛待查（建议骨科/康复科就诊）';
        result.reason = 'Level 1-4 筛查无法明确，建议进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 背痛/胸椎痛（四步通用筛查模型）
     * 胸椎区域疼痛 —— 常见原因：姿势性胸椎僵硬、胸椎小关节、强直性脊柱炎等
     * ============================================================ */
    'thoracic_pain': {
      label: '背痛/胸椎痛 鉴别诊断',
      icon: '🦴',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_thoracic',
          level: 1,
          question: '是否有以下危险信号：胸痛、呼吸困难、近期有外伤后背部畸形、大小便失禁？',
          type: 'radio',
          options: [
            { label: '是，有上述症状', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，无上述症状', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除心梗、气胸、胸椎骨折、马尾综合征等急症'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您指出疼痛的最主要位置（可多选）：',
          type: 'checkbox',
          options: [
            { label: '上背部（肩胛骨之间）', value: 'upper_back', next: 'step_3_concomitant' },
            { label: '整个背部都痛/僵硬', value: 'whole_back', next: 'step_3_concomitant' },
            { label: '背部某一侧痛（偏左或偏右）', value: 'one_side_back', next: 'step_3_concomitant' },
            { label: '背部痛 + 颈部也痛', value: 'back_neck', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '除背痛外，是否伴有以下任何一种情况：晨僵>30分钟、交替性臀痛、虹膜炎/眼红痛？',
          type: 'checkbox',
          options: [
            { label: '是，有晨僵>30分钟 或 虹膜炎/眼红痛', value: 'inflammatory_yes', next: 'step_3_duration' },
            { label: '否，没有这些情况', value: 'inflammatory_no', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '这种背痛持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '不到2周（急性）', value: 'acute', next: 'step_3_aggravating' },
            { label: '2周-3个月（亚急性）', value: 'subacute', next: 'step_3_aggravating' },
            { label: '超过3个月（慢性）', value: 'chronic', next: 'step_3_aggravating' }
          ]
        },
        {
          id: 'step_3_aggravating',
          level: 3,
          question: '什么时候背痛最明显？（状态轴）',
          type: 'radio',
          options: [
            { label: '翻身/起床时背僵疼痛，活动后反而减轻（晨僵>30分钟）', value: 'inflammatory', next: 'step_4_physical' },
            { label: '久坐/伏案/低头时痛，站起活动后缓解', value: 'postural', next: 'step_4_physical' },
            { label: '深呼吸/咳嗽/转身时加重', value: 'respiratory', next: 'step_4_physical' },
            { label: '没有明显规律', value: 'unknown', next: 'step_4_physical' }
          ],
          guide: '炎性背痛模式提示强直性脊柱炎，见ASAS 2010分类标准'
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试坐姿，双手交叉抱头，主动把双侧肩胛骨向内夹紧（做"挺胸"动作）。此时背部是否出现明显疼痛或弹响？',
          type: 'radio',
          options: [
            { label: '是，挺胸时背部痛/弹响', value: 'thoracic_pos', next: 'thoracic_result' },
            { label: '否，和挺胸动作无关', value: 'thoracic_neg', next: 'unknown_result' }
          ],
          guide: '胸椎小关节功能紊乱的典型诱发动作'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'thoracic', reason: '' };

        // Level 1: 红线检查
        var redflag = answers.redflag_thoracic;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑急危重症！请立即就医，勿自行康复。';
          return result;
        }

        var location = answers.step_2_localization;
        var inflammatory = answers.step_3_concomitant;
        var aggravating = answers.step_3_aggravating;
        var thoracicTest = answers.step_4_physical;

        // Level 3: 炎性标志
        if (inflammatory && inflammatory.indexOf('inflammatory_yes') !== -1) {
          result.diagnosis = 'inflammatory_back_pain';
          result.confidence = 85;
          result.specialty = 'thoracic';
          result.label = '炎性背痛（需排查强直性脊柱炎）';
          result.reason = '晨僵>30分钟 或 虹膜炎（Level 3 伴随症状），符合炎性背痛模式';
          return result;
        }

        // Level 4: 物理测试
        if (thoracicTest && thoracicTest.indexOf('thoracic_pos') !== -1) {
          result.diagnosis = 'thoracic_joint_dysfunction';
          result.confidence = 80;
          result.specialty = 'thoracic';
          result.label = '胸椎小关节功能紊乱';
          result.reason = '挺胸时背部痛/弹响（Level 4 物理测试阳性），符合胸椎小关节问题';
          return result;
        }

        // Level 3: 根据疼痛模式判断
        if (aggravating && aggravating.indexOf('postural') !== -1) {
          result.diagnosis = 'postural_thoracic_pain';
          result.confidence = 75;
          result.specialty = 'thoracic';
          result.label = '姿势性胸椎痛（胸椎僵硬/菱形肌劳损）';
          result.reason = '久坐/伏案加重，活动后减轻（Level 3 状态轴），符合姿势性问题';
          return result;
        }

        if (aggravating && aggravating.indexOf('respiratory') !== -1) {
          result.diagnosis = 'thoracic_spine_dysfunction';
          result.confidence = 70;
          result.specialty = 'thoracic';
          result.label = '胸椎小关节功能紊乱';
          result.reason = '深呼吸/转身时加重（Level 3 状态轴），符合胸椎问题';
          return result;
        }

        // 默认
        result.diagnosis = 'thoracic_pain_unknown';
        result.confidence = 60;
        result.specialty = 'thoracic';
        result.label = '背痛待查（建议康复科/骨科就诊）';
        result.reason = 'Level 1-4 筛查无法明确，建议进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 膝关节痛（四步通用筛查模型）
     * ============================================================ */
    'knee_pain': {
      label: '膝关节痛 鉴别诊断',
      icon: '🦵',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_knee',
          level: 1,
          question: '是否有以下危险信号：膝关节明显红肿热痛、发热、外伤后明显畸形或不能负重？',
          type: 'radio',
          options: [
            { label: '是，有上述症状', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，无红肿发热/畸形', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除化脓性关节炎、骨折、深静脉血栓等急症'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您指出疼痛的最主要位置（可多选）：',
          type: 'checkbox',
          options: [
            { label: '膝前痛（髌骨区/髌腱）', value: 'anterior', next: 'step_3_concomitant' },
            { label: '膝内侧痛（鹅足区/内侧关节线）', value: 'medial', next: 'step_3_concomitant' },
            { label: '膝外侧痛（髂胫束区/外侧关节线）', value: 'lateral', next: 'step_3_concomitant' },
            { label: '膝后痛（腘窝区）', value: 'posterior', next: 'step_3_concomitant' },
            { label: '整个膝关节都痛', value: 'whole_knee', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '是否有明确的外伤史（如运动扭伤、摔倒、车祸）？',
          type: 'radio',
          options: [
            { label: '是，有外伤史', value: 'trauma_yes', next: 'step_3_trauma_detail' },
            { label: '否，无外伤，逐渐起病', value: 'trauma_no', next: 'step_3_age_pattern' }
          ]
        },
        {
          id: 'step_3_trauma_detail',
          level: 3,
          question: '外伤时您听到"啪"的一声吗？之后膝关节是否反复"打软腿"（突然跪倒）？',
          type: 'radio',
          options: [
            { label: '是，有弹响+反复打软腿', value: 'acl', next: 'step_4_physical' },
            { label: '无弹响，主要是卡锁/交锁', value: 'meniscus', next: 'step_4_physical' },
            { label: '主要是肿胀+活动受限', value: 'effusion', next: 'step_4_physical' }
          ]
        },
        {
          id: 'step_3_age_pattern',
          level: 3,
          question: '您的年龄和疼痛特点是？',
          type: 'radio',
          options: [
            { label: '年龄>50岁，晨起膝僵<30分钟，活动后减轻但久走又痛', value: 'oa', next: 'step_4_physical' },
            { label: '年龄<40岁，上下楼梯痛明显，跪地/下蹲痛', value: 'patellofemoral', next: 'step_4_physical' },
            { label: '跑步/跳跃后膝前痛，胫骨结节处压痛（青少年）', value: 'osgood', next: 'step_4_physical' }
          ]
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试坐在床边，让他人握住您的小腿并往外掰（外翻应力）。膝关节内侧是否疼痛或松开？（内侧副韧带应力试验）',
          type: 'radio',
          options: [
            { label: '是，内侧疼痛/松开感', value: 'mcl_pos', next: 'mcl_injury' },
            { label: '否，内侧稳定', value: 'mcl_neg', next: 'lachman_test' }
          ],
          guide: '内侧副韧带（MCL）应力试验阳性提示MCL损伤'
        },
        {
          id: 'lachman_test',
          level: 4,
          question: '请尝试平躺，让他人握住您的小腿并向前拉（像抽屉一样）。膝关节是否向前松开？（Lachman试验）',
          type: 'radio',
          options: [
            { label: '是，有明显向前松开感', value: 'acl_pos', next: 'acl_injury' },
            { label: '否，前向稳定', value: 'acl_neg', next: 'mcmurray_test' }
          ],
          guide: 'Lachman试验阳性提示前交叉韧带（ACL）损伤'
        },
        {
          id: 'mcmurray_test',
          level: 4,
          question: '请尝试平躺，让他人握住您的脚踝并把膝关节屈曲到最大，然后旋转小腿。是否有弹响+疼痛？（McMurray试验）',
          type: 'radio',
          options: [
            { label: '是，有弹响+疼痛', value: 'meniscus_pos', next: 'meniscus_injury' },
            { label: '否，没有弹响/疼痛', value: 'meniscus_neg', next: 'unknown_result' }
          ],
          guide: 'McMurray试验阳性提示半月板损伤'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'knee', reason: '' };
        
        // Level 1: 红线检查
        var redflag = answers.redflag_knee;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑膝关节急症（化脓性关节炎/骨折/血栓）！请立即就医。';
          return result;
        }
        
        // 分析 Level 2-4 的答案
        var location = answers.step_2_localization;  // 解剖定位
        var trauma = answers.step_3_concomitant;  // 伴随症状
        var traumaDetail = answers.step_3_trauma_detail;  // 外伤细节
        var agePattern = answers.step_3_age_pattern;  // 年龄模式
        var mclTest = answers.step_4_physical;  // 物理测试
        var lachmanTest = answers.lachman_test;
        var mcmurrayTest = answers.mcmurray_test;
        
        // Level 4: 物理测试结果判断
        if (lachmanTest && lachmanTest.indexOf('acl_pos') !== -1) {
          result.diagnosis = 'acl_injury';
          result.confidence = 90;
          result.specialty = 'knee';
          result.label = '前交叉韧带（ACL）损伤';
          result.reason = 'Lachman试验阳性（Level 4 物理测试阳性），典型ACL损伤表现';
          return result;
        }
        
        if (mcmurrayTest && mcmurrayTest.indexOf('meniscus_pos') !== -1) {
          result.diagnosis = 'meniscus_injury';
          result.confidence = 85;
          result.specialty = 'knee';
          result.label = '半月板损伤';
          result.reason = 'McMurray试验阳性（Level 4 物理测试阳性），提示半月板撕裂';
          return result;
        }
        
        // Level 3: 根据年龄和疼痛特点判断
        if (agePattern && agePattern.indexOf('oa') !== -1) {
          result.diagnosis = 'knee_oa';
          result.confidence = 85;
          result.specialty = 'knee';
          result.label = '膝骨关节炎（KOA）';
          result.reason = '年龄>50岁+活动后痛（Level 3 年龄模式），符合膝OA';
          return result;
        }
        
        if (agePattern && agePattern.indexOf('patellofemoral') !== -1) {
          result.diagnosis = 'patellofemoral_pain';
          result.confidence = 80;
          result.specialty = 'knee';
          result.label = '髌股关节疼痛综合征（PFPS）';
          result.reason = '上下楼梯痛+下蹲痛（Level 3 年龄模式），符合PFPS';
          return result;
        }
        
        // 默认
        result.diagnosis = 'knee_pain_unknown';
        result.confidence = 60;
        result.specialty = 'knee';
        result.label = '膝痛待查';
        result.reason = 'Level 1-4 筛查无法明确，建议进一步检查';
        return result;
      }
    }
  },

  /* ——— 根据症状关键词匹配追问树 ——— */
  /*  匹配规则（按优先级）：
   *  1. 优先匹配具体症状（如"小指麻木"、"腰痛"）→ 直接跳转到对应的追问树
   *  2. 如果无法匹配，返回 general_symptom（通用追问树）→ 做解剖定位
   *  3. 所有症状最终都会经过追问树，不再"面向个案编程"
   */


    /* ============================================================
     * 头晕/头痛/平衡问题（四步通用筛查模型）
     * 参考：《神经康复学》眩晕鉴别诊断；《康复评定学》平衡功能评估
     * ============================================================ */
    'dizziness': {
      label: '头晕/头痛/平衡问题 鉴别诊断',
      icon: '🌀',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_dizziness',
          level: 1,
          question: '您的头晕是否突然发生，并伴有以下任何一种情况：说话含糊不清、半边脸麻木无力、单侧肢体无力、剧烈头痛（一生中最剧烈的头痛）？',
          type: 'radio',
          options: [
            { label: '是，有上述任何一种情况', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，没有这些症状', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除急性脑卒中、蛛网膜下腔出血等急危重症'
        },
        /* ========== Level 2: 解剖定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '您的头晕/头痛属于以下哪种类型？（可多选）',
          type: 'checkbox',
          options: [
            { label: '天旋地转（感觉周围在转），与头部位置变化有关（如翻身、起床）', value: 'vertigo_positional', next: 'step_3_concomitant' },
            { label: '头昏沉沉、像戴了帽子，走路不稳但不会有天旋地转的感觉', value: 'dizziness_gait', next: 'step_3_concomitant' },
            { label: '头痛（单侧跳痛/全头胀痛），怕光怕声', value: 'headache', next: 'step_3_concomitant' },
            { label: '走路不稳、容易摔倒，但坐着或躺着时不晕', value: 'gait_only', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '是否伴有以下任何一种情况？（可多选）',
          type: 'checkbox',
          options: [
            { label: '耳鸣、耳闷、听力下降（一侧或双侧）', value: 'tinnitus', next: 'step_3_duration' },
            { label: '恶心、呕吐（与头晕同时发生）', value: 'nausea', next: 'step_3_duration' },
            { label: '颈部僵硬、后枕部疼痛', value: 'neck_pain', next: 'step_3_duration' },
            { label: '没有上述伴随症状', value: 'none', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '症状持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '突然发生，不到48小时', value: 'acute', next: 'step_4_physical' },
            { label: '反复发作，每次持续数分钟到数小时', value: 'paroxysmal', next: 'step_4_physical' },
            { label: '持续存在，已经超过1个月', value: 'chronic', next: 'step_4_physical' }
          ]
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试快速从坐位站起，然后闭眼单脚站立（扶好椅子防摔倒）。是否感觉天旋地转或站不稳？',
          type: 'radio',
          options: [
            { label: '是，站不稳/天旋地转', value: 'balance_pos', next: 'balance_result' },
            { label: '否，可以站稳', value: 'balance_neg', next: 'dix_hallpike' }
          ],
          guide: '平衡功能测试：阳性提示前庭系统或小脑病变'
        },
        {
          id: 'dix_hallpike',
          level: 4,
          question: '（Dix-Hallpike试验）请坐在床边，头向一侧转45°，然后快速躺下（头悬垂床沿）。是否出现天旋地转+眼球震颤（持续数秒到1分钟）？',
          type: 'radio',
          options: [
            { label: '是，出现短暂眩晕+眼震', value: 'dix_pos', next: 'bppv_result' },
            { label: '否，没有诱发眩晕', value: 'dix_neg', next: 'romberg' }
          ],
          guide: 'Dix-Hallpike试验：阳性提示良性阵发性位置性眩晕（BPPV），见《神经康复学》眩晕鉴别诊断'
        },
        {
          id: 'romberg',
          level: 4,
          question: '（Romberg试验）请双脚并拢站立，闭眼。是否出现身体摇晃或摔倒？',
          type: 'radio',
          options: [
            { label: '是，闭眼后明显摇晃/摔倒', value: 'romberg_pos', next: 'vestibular_result' },
            { label: '否，可以站稳', value: 'romberg_neg', next: 'unknown_result' }
          ],
          guide: 'Romberg试验：阳性提示本体感觉或前庭系统受损'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'neurology', reason: '' };
        
        // Level 1: 红线检查
        var redflag = answers.redflag_dizziness;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑急性脑卒中/蛛网膜下腔出血！请立即就医，勿自行康复。';
          return result;
        }
        
        // Level 4: 物理测试结果判断
        var dixTest = answers.dix_hallpike;
        if (dixTest && dixTest.indexOf('dix_pos') !== -1) {
          result.diagnosis = 'bppv';
          result.confidence = 95;
          result.specialty = 'vestibular';
          result.label = '良性阵发性位置性眩晕（BPPV）';
          result.reason = 'Dix-Hallpike试验阳性（Level 4 物理测试阳性），符合耳石症诊断';
          return result;
        }
        
        var balanceTest = answers.step_4_physical;
        if (balanceTest && balanceTest.indexOf('balance_pos') !== -1) {
          result.diagnosis = 'vestibular_dysfunction';
          result.confidence = 85;
          result.specialty = 'vestibular';
          result.label = '前庭系统功能障碍';
          result.reason = '平衡功能测试阳性（Level 4 物理测试阳性），提示前庭系统受损';
          return result;
        }
        
        var rombergTest = answers.romberg;
        if (rombergTest && rombergTest.indexOf('romberg_pos') !== -1) {
          result.diagnosis = 'proprioceptive_dysfunction';
          result.confidence = 80;
          result.specialty = 'neurology';
          result.label = '本体感觉/前庭功能障碍';
          result.reason = 'Romberg试验阳性（Level 4 物理测试阳性），提示本体感觉或前庭系统受损';
          return result;
        }
        
        // Level 2-3: 根据定位和伴随症状判断
        var localization = answers.step_2_localization;
        
        if (localization && localization.indexOf('headache') !== -1) {
          result.diagnosis = 'migraine';
          result.confidence = 75;
          result.specialty = 'neurology';
          result.label = '偏头痛？';
          result.reason = '头痛（单侧跳痛/全头胀痛）+ 怕光怕声（Level 2 定位），怀疑偏头痛';
          return result;
        }
        
        if (localization && localization.indexOf('gait_only') !== -1) {
          result.diagnosis = 'cerebellar_dysfunction';
          result.confidence = 70;
          result.specialty = 'neurology';
          result.label = '小脑功能障碍？';
          result.reason = '走路不稳、容易摔倒（Level 2 定位），提示小脑或其传导通路受损';
          return result;
        }
        
        if (localization && localization.indexOf('vertigo_positional') !== -1) {
          result.diagnosis = 'bppv_suspected';
          result.confidence = 60;
          result.specialty = 'vestibular';
          result.label = '位置性眩晕（疑似BPPV，建议Dix-Hallpike试验确诊）';
          result.reason = '天旋地转 + 与头部位置变化有关（Level 2 定位），怀疑BPPV但Level 4测试阴性';
          return result;
        }
        
        // 默认
        result.diagnosis = 'dizziness_unknown';
        result.confidence = 50;
        result.specialty = 'neurology';
        result.label = '头晕/平衡问题待查（建议神经内科/耳鼻喉科就诊）';
        result.reason = 'Level 2-4 无法明确，需进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 气喘/胸闷/运动后气短（四步通用筛查模型）
     * 参考：《运动医学》心血管运动测试；《康复评定学》心肺运动试验
     * ============================================================ */
    'dyspnea': {
      label: '气喘/胸闷/运动后气短 鉴别诊断',
      icon: '🫁',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_dyspnea',
          level: 1,
          question: '您是否有以下任何一种危险信号：胸痛放射到左臂/下颌、夜间阵发性呼吸困难（需坐起呼吸）、咳粉红色泡沫痰、或静息状态下就感觉喘不上气？',
          type: 'radio',
          options: [
            { label: '是，有上述任何一种情况', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，没有这些症状', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除急性冠脉综合征、急性心衰等急危重症'
        },
        /* ========== Level 2: 解剖定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '您的症状主要发生在什么时候？（可多选）',
          type: 'checkbox',
          options: [
            { label: '运动时（如快走、跑步、爬楼），停止运动后缓解', value: 'exercise_induced', next: 'step_3_concomitant' },
            { label: '休息时也有，平躺时加重，坐起后缓解', value: 'orthopnea', next: 'step_3_concomitant' },
            { label: '接触冷空气/花粉/粉尘后发作，伴有咳嗽、哮鸣音', value: 'allergic', next: 'step_3_concomitant' },
            { label: '长期吸烟史，日常活动就气短，伴有慢性咳嗽', value: 'smoking_copd', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '请选择您的病史（可多选）：',
          type: 'checkbox',
          options: [
            { label: '有心脏病史（心梗、心衰、心律失常）', value: 'heart_disease', next: 'step_3_duration' },
            { label: '有哮喘/慢性支气管炎/COPD病史', value: 'lung_disease', next: 'step_3_duration' },
            { label: '长期吸烟（>10包年）', value: 'smoking', next: 'step_3_duration' },
            { label: '没有上述病史', value: 'no_history', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '症状持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '突然发生，不到1周', value: 'acute', next: 'step_4_physical' },
            { label: '反复发作，但每次都能缓解', value: 'paroxysmal', next: 'step_4_physical' },
            { label: '持续存在，逐渐加重，超过3个月', value: 'chronic', next: 'step_4_physical' }
          ]
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试爬2层楼梯（或快走6分钟）。是否出现明显气喘、胸闷、或指脉氧下降（如果有指氧仪）？',
          type: 'radio',
          options: [
            { label: '是，爬楼/快走后明显气喘胸闷', value: 'exercise_pos', next: 'step_4_cardiac' },
            { label: '否，日常活动无气短', value: 'exercise_neg', next: 'step_4_lung' }
          ],
          guide: '心肺运动测试简化版：运动诱发气短提示心肺功能受损'
        },
        {
          id: 'step_4_cardiac',
          level: 4,
          question: '您是否有脚踝水肿、夜间阵发性呼吸困难（需坐起呼吸）、或颈静脉怒张？',
          type: 'radio',
          options: [
            { label: '是，有上述任何一种情况', value: 'heart_failure_pos', next: 'heart_failure_result' },
            { label: '否，没有这些症状', value: 'heart_failure_neg', next: 'angina_result' }
          ],
          guide: '心衰体征筛查：脚踝水肿 + 夜间阵发性呼吸困难提示慢性心衰'
        },
        {
          id: 'step_4_lung',
          level: 4,
          question: '您是否有慢性咳嗽、咳痰（每年超过3个月，连续2年以上）？',
          type: 'radio',
          options: [
            { label: '是，有慢性咳嗽咳痰', value: 'copd_pos', next: 'copd_result' },
            { label: '否，没有慢性咳嗽', value: 'copd_neg', next: 'asthma_result' }
          ],
          guide: 'COPD筛查：慢性咳嗽咳痰 >3个月/年 × 2年'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'cardiopulmonary', reason: '' };
        
        // Level 1: 红线检查
        var redflag = answers.redflag_dyspnea;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑急性冠脉综合征/急性心衰！请立即就医，勿自行康复。';
          return result;
        }
        
        // Level 4: 物理测试结果判断
        var heartFailureTest = answers.step_4_cardiac;
        if (heartFailureTest && heartFailureTest.indexOf('heart_failure_pos') !== -1) {
          result.diagnosis = 'heart_failure';
          result.confidence = 95;
          result.specialty = 'cardiopulmonary';
          result.label = '慢性心力衰竭？';
          result.reason = '脚踝水肿 + 夜间阵发性呼吸困难（Level 4 物理测试阳性），符合心衰体征';
          return result;
        }
        
        var copdTest = answers.step_4_lung;
        if (copdTest && copdTest.indexOf('copd_pos') !== -1) {
          result.diagnosis = 'copd';
          result.confidence = 90;
          result.specialty = 'cardiopulmonary';
          result.label = '慢性阻塞性肺疾病（COPD）';
          result.reason = '慢性咳嗽咳痰 >3个月/年 × 2年（Level 4 物理测试阳性），符合COPD诊断';
          return result;
        }
        
        // Level 2-3: 根据定位和病史判断
        var localization = answers.step_2_localization;
        var history = answers.step_3_concomitant;
        
        if (localization && localization.indexOf('exercise_induced') !== -1) {
          if (history && history.indexOf('heart_disease') !== -1) {
            result.diagnosis = 'cardiac_dysfunction';
            result.confidence = 85;
            result.specialty = 'cardiopulmonary';
            result.label = '心脏功能不全？';
            result.reason = '运动诱发气短 + 心脏病史（Level 2-3），怀疑心脏功能不全';
            return result;
          } else {
            result.diagnosis = 'deconditioning';
            result.confidence = 70;
            result.specialty = 'cardiopulmonary';
            result.label = '体能下降（Deconditioning）';
            result.reason = '运动诱发气短，但无心脏病史（Level 2-3），考虑体能下降';
            return result;
          }
        }
        
        if (localization && localization.indexOf('allergic') !== -1) {
          result.diagnosis = 'asthma';
          result.confidence = 80;
          result.specialty = 'cardiopulmonary';
          result.label = '支气管哮喘？';
          result.reason = '接触过敏原后发作 + 咳嗽/哮鸣音（Level 2 定位），怀疑哮喘';
          return result;
        }
        
        if (localization && localization.indexOf('smoking_copd') !== -1) {
          result.diagnosis = 'copd_suspected';
          result.confidence = 75;
          result.specialty = 'cardiopulmonary';
          result.label = '慢性阻塞性肺疾病（COPD）？';
          result.reason = '长期吸烟史 + 日常活动气短（Level 2 定位），怀疑COPD';
          return result;
        }
        
        // 默认
        result.diagnosis = 'dyspnea_unknown';
        result.confidence = 50;
        result.specialty = 'cardiopulmonary';
        result.label = '气短待查（建议心内科/呼吸内科就诊）';
        result.reason = 'Level 2-4 无法明确，需进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 髋痛（四步通用筛查模型）
     * 髋关节疼痛 —— 常见原因：髋骨关节炎、股骨髋臼撞击综合征、髋臼发育不良
     * ============================================================ */
    'hip_pain': {
      label: '髋痛/腹股沟痛 鉴别诊断',
      icon: '🦿',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_hip',
          level: 1,
          question: '是否有以下危险信号：髋关节明显红肿热痛、发热、近期有外伤后畸形或不能负重？',
          type: 'radio',
          options: [
            { label: '是，有上述症状', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，无红肿发热/畸形', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除化脓性关节炎、骨折、股骨颈骨折等急症'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您指出疼痛的最主要位置（可多选）：',
          type: 'checkbox',
          options: [
            { label: '腹股沟区（大腿根部内侧）', value: 'groin', next: 'step_3_concomitant' },
            { label: '髋外侧（大转子区）', value: 'lateral_hip', next: 'step_3_concomitant' },
            { label: '髋后侧（屁股后面）', value: 'posterior_hip', next: 'step_3_concomitant' },
            { label: '整个髋部都痛', value: 'whole_hip', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '髋痛是如何开始的？',
          type: 'radio',
          options: [
            { label: '逐渐加重，无明显外伤，活动后加重', value: 'gradual', next: 'step_3_duration' },
            { label: '有明确外伤/手术后逐渐活动受限', value: 'trauma', next: 'step_3_duration' },
            { label: '突然剧烈疼痛，完全不能负重', value: 'acute', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '这种髋痛持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '不到2周（急性）', value: 'acute', next: 'step_3_aggravating' },
            { label: '2周-3个月（亚急性）', value: 'subacute', next: 'step_3_aggravating' },
            { label: '超过3个月（慢性）', value: 'chronic', next: 'step_3_aggravating' }
          ]
        },
        {
          id: 'step_3_aggravating',
          level: 3,
          question: '什么时候髋痛最明显？（状态轴）',
          type: 'radio',
          options: [
            { label: '晨起僵硬，活动后减轻（晨僵>30分钟）', value: 'inflammatory', next: 'step_4_physical' },
            { label: '久坐后站起时明显痛，行走后缓解', value: 'postural', next: 'step_4_physical' },
            { label: '特定方向（如内旋/屈曲）疼痛明显', value: 'directional', next: 'step_4_physical' },
            { label: '没有明显规律', value: 'unknown', next: 'step_4_physical' }
          ],
          guide: 'FAI典型表现：屈曲内旋痛；髋OA典型表现：晨僵<30分钟，活动后加重'
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试坐姿，将患侧膝盖向外打开（髋外展+外旋，像"4"字姿势）。此时髋部是否出现明显疼痛？',
          type: 'radio',
          options: [
            { label: '是，这个姿势髋部明显痛', value: 'fadir_pos', next: 'fai_result' },
            { label: '否，这个姿势不诱发痛', value: 'fadir_neg', next: 'trendelenburg' }
          ],
          guide: 'FADIR测试（屈曲内旋）阳性提示股骨髋臼撞击综合征（FAI）'
        },
        {
          id: 'trendelenburg',
          level: 4,
          question: '请尝试单腿站立（患侧腿支撑）。是否能稳定站立超过10秒，还是对侧髋部明显下沉？',
          type: 'radio',
          options: [
            { label: '不能，对侧髋部明显下沉/站不稳', value: 'trendelenburg_pos', next: 'hip_oa_result' },
            { label: '能，可以稳定站立10秒以上', value: 'trendelenburg_neg', next: 'unknown_result' }
          ],
          guide: 'Trendelenburg征阳性提示臀中肌无力，常见于髋OA'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'hip', reason: '' };

        // Level 1: 红线检查
        var redflag = answers.redflag_hip;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑急危重症（化脓性关节炎/骨折）！请立即就医，勿自行康复。';
          return result;
        }

        var location = answers.step_2_localization;
        var aggravating = answers.step_3_aggravating;
        var fadirTest = answers.step_4_physical;
        var trendelenburgTest = answers.trendelenburg;

        // Level 4: 物理测试
        if (fadirTest && fadirTest.indexOf('fadir_pos') !== -1) {
          result.diagnosis = 'hip_fai';
          result.confidence = 90;
          result.specialty = 'hip';
          result.label = '股骨髋臼撞击综合征（FAI）';
          result.reason = 'FADIR测试阳性（Level 4 物理测试阳性），符合FAI';
          return result;
        }

        if (trendelenburgTest && trendelenburgTest.indexOf('trendelenburg_pos') !== -1) {
          result.diagnosis = 'hip_oa';
          result.confidence = 85;
          result.specialty = 'hip';
          result.label = '髋骨关节炎（Hip OA）';
          result.reason = 'Trendelenburg征阳性（Level 4 物理测试阳性），符合髋OA伴臀中肌无力';
          return result;
        }

        // Level 3: 根据疼痛模式判断
        if (aggravating && aggravating.indexOf('inflammatory') !== -1) {
          result.diagnosis = 'hip_inflammatory';
          result.confidence = 80;
          result.specialty = 'hip';
          result.label = '炎性髋痛（需排查强直性脊柱炎/感染）';
          result.reason = '晨僵>30分钟（Level 3 状态轴），符合炎性模式';
          return result;
        }

        if (aggravating && aggravating.indexOf('postural') !== -1) {
          result.diagnosis = 'hip_oa_suspected';
          result.confidence = 75;
          result.specialty = 'hip';
          result.label = '髋骨关节炎（可疑）';
          result.reason = '久坐后站起痛，行走后缓解（Level 3 状态轴），符合髋OA典型表现';
          return result;
        }

        // 默认
        result.diagnosis = 'hip_pain_unknown';
        result.confidence = 60;
        result.specialty = 'hip';
        result.label = '髋痛待查（建议骨科/康复科就诊）';
        result.reason = 'Level 1-4 筛查无法明确，建议进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 踝痛/足痛（四步通用筛查模型）
     * 踝关节/足部疼痛 —— 常见原因：踝关节扭伤（韧带）、足底筋膜炎、跟腱炎
     * ============================================================ */
    'ankle_pain': {
      label: '踝痛/足痛 鉴别诊断',
      icon: '🦶',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_ankle',
          level: 1,
          question: '是否有以下危险信号：踝关节明显红肿热痛、发热、近期有外伤后不能负重或畸形？',
          type: 'radio',
          options: [
            { label: '是，有上述症状', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，无红肿发热/不能负重', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除踝关节骨折、深静脉血栓、化脓性关节炎等急症'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您指出疼痛的最主要位置（可多选）：',
          type: 'checkbox',
          options: [
            { label: '踝外侧（崴骨外侧）', value: 'lateral_ankle', next: 'step_3_concomitant' },
            { label: '踝内侧（胫骨内侧）', value: 'medial_ankle', next: 'step_3_concomitant' },
            { label: '足跟/足底（早起下地最痛）', value: 'heel_foot', next: 'step_3_concomitant' },
            { label: '跟腱区（脚后跟上方）', value: 'achilles', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '是否有明确的外伤史（如崴脚、摔倒、车祸）？',
          type: 'radio',
          options: [
            { label: '是，有外伤史', value: 'trauma_yes', next: 'step_3_duration' },
            { label: '否，无外伤，逐渐起病', value: 'trauma_no', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '这种疼痛持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '不到2周（急性）', value: 'acute', next: 'step_3_aggravating' },
            { label: '2周-3个月（亚急性）', value: 'subacute', next: 'step_3_aggravating' },
            { label: '超过3个月（慢性）', value: 'chronic', next: 'step_3_aggravating' }
          ]
        },
        {
          id: 'step_3_aggravating',
          level: 3,
          question: '什么时候疼痛最明显？（状态轴）',
          type: 'radio',
          options: [
            { label: '早起下地第一步最痛，走几步后缓解', value: 'first_step', next: 'step_4_physical' },
            { label: '长时间站立/行走后加重', value: 'weightbearing', next: 'step_4_physical' },
            { label: '特定方向（如崴脚姿势）诱发痛', value: 'positional', next: 'step_4_physical' },
            { label: '没有明显规律', value: 'unknown', next: 'step_4_physical' }
          ],
          guide: '足底筋膜炎典型表现：晨起第一步痛；踝扭伤典型表现：崴脚姿势诱发痛'
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试单腿站立（患足支撑）。是否能稳定站立超过30秒，还是明显摇晃/不能？',
          type: 'radio',
          options: [
            { label: '不能，站立不稳/<30秒', value: 'balance_pos', next: 'ankle_sprain_result' },
            { label: '能，可以稳定站立30秒以上', value: 'balance_neg', next: 'special_test' }
          ],
          guide: '踝关节不稳典型表现：单腿站立不稳'
        },
        {
          id: 'special_test',
          level: 4,
          question: '请尝试用患侧脚尖站立（提踵）。是否出现明显疼痛或不能完成？',
          type: 'radio',
          options: [
            { label: '是，提踵痛/不能完成', value: 'achilles_pos', next: 'achilles_result' },
            { label: '否，提踵无疼痛', value: 'achilles_neg', next: 'plantar_result' }
          ],
          guide: '跟腱炎典型表现：提踵时跟腱区疼痛'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'ankle', reason: '' };

        // Level 1: 红线检查
        var redflag = answers.redflag_ankle;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑急危重症（骨折/DVT/感染）！请立即就医，勿自行康复。';
          return result;
        }

        var location = answers.step_2_localization;
        var aggravating = answers.step_3_aggravating;
        var balanceTest = answers.step_4_physical;
        var specialTest = answers.special_test;

        // Level 4: 物理测试
        if (balanceTest && balanceTest.indexOf('balance_pos') !== -1) {
          result.diagnosis = 'ankle_sprain';
          result.confidence = 90;
          result.specialty = 'ankle';
          result.label = '踝关节扭伤（韧带损伤）';
          result.reason = '单腿站立不稳（Level 4 物理测试阳性），符合踝关节不稳/韧带损伤';
          return result;
        }

        if (specialTest && specialTest.indexOf('achilles_pos') !== -1) {
          result.diagnosis = 'achilles_tendinopathy';
          result.confidence = 85;
          result.specialty = 'ankle';
          result.label = '跟腱炎/跟腱病变';
          result.reason = '提踵时跟腱区疼痛（Level 4 物理测试阳性），符合跟腱病变';
          return result;
        }

        // Level 3: 根据疼痛模式判断
        if (aggravating && aggravating.indexOf('first_step') !== -1) {
          result.diagnosis = 'plantar_fasciitis';
          result.confidence = 90;
          result.specialty = 'foot';
          result.label = '足底筋膜炎';
          result.reason = '晨起第一步痛，走几步后缓解（Level 3 状态轴），符合足底筋膜炎典型表现';
          return result;
        }

        if (aggravating && aggravating.indexOf('weightbearing') !== -1) {
          result.diagnosis = 'foot_overuse';
          result.confidence = 75;
          result.specialty = 'foot';
          result.label = '足部过劳/足部疼痛综合征';
          result.reason = '长时间站立/行走后加重（Level 3 状态轴），考虑足部过劳';
          return result;
        }

        // 默认
        result.diagnosis = 'ankle_foot_pain_unknown';
        result.confidence = 60;
        result.specialty = 'ankle';
        result.label = '踝/足痛待查（建议骨科/康复科就诊）';
        result.reason = 'Level 1-4 筛查无法明确，建议进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 肘痛（四步通用筛查模型）
     * 肘关节疼痛 —— 常见原因：网球肘（外侧上髁炎）、高尔夫球肘（内侧上髁炎）、肘管综合征
     * ============================================================ */
    'elbow_pain': {
      label: '肘痛 鉴别诊断',
      icon: '💪',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_elbow',
          level: 1,
          question: '是否有以下危险信号：肘关节明显红肿热痛、发热、近期有外伤后畸形？',
          type: 'radio',
          options: [
            { label: '是，有上述症状', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，无红肿发热', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除化脓性关节炎、骨折等急症'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您指出疼痛的最主要位置：',
          type: 'radio',
          options: [
            { label: '肘外侧（上髁外侧，拧毛巾时痛）', value: 'lateral_epicondyle', next: 'step_3_concomitant' },
            { label: '肘内侧（上髁内侧，握拳时痛）', value: 'medial_epicondyle', next: 'step_3_concomitant' },
            { label: '肘后侧（鹰嘴区，伸直受限）', value: 'posterior_elbow', next: 'step_3_concomitant' },
            { label: '整个肘部都痛', value: 'whole_elbow', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '除肘痛外，是否伴有小指/无名指麻木（尺神经分布区）？',
          type: 'radio',
          options: [
            { label: '是，有小指/无名指麻木', value: 'ulnar_paresthesia_yes', next: 'step_3_duration' },
            { label: '否，只有肘痛', value: 'ulnar_paresthesia_no', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '这种肘痛持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '不到2周（急性）', value: 'acute', next: 'step_4_physical' },
            { label: '2周-3个月（亚急性）', value: 'subacute', next: 'step_4_physical' },
            { label: '超过3个月（慢性）', value: 'chronic', next: 'step_4_physical' }
          ]
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试做"拧毛巾"动作（患侧手握拳，做旋转拧毛巾姿势）。肘外侧是否出现明显疼痛？',
          type: 'radio',
          options: [
            { label: '是，拧毛巾时肘外侧痛', value: 'cozen_pos', next: 'tennis_elbow_result' },
            { label: '否，拧毛巾不诱发痛', value: 'cozen_neg', next: 'golfer_elbow_test' }
          ],
          guide: 'Cozen试验阳性提示网球肘（外侧上髁炎）'
        },
        {
          id: 'golfer_elbow_test',
          level: 4,
          question: '请尝试做"握拳屈腕"动作（患侧手握拳，向内侧弯曲手腕）。肘内侧是否出现明显疼痛？',
          type: 'radio',
          options: [
            { label: '是，屈腕时肘内侧痛', value: 'golfer_pos', next: 'golfer_elbow_result' },
            { label: '否，屈腕不诱发痛', value: 'golfer_neg', next: 'cubital_test' }
          ],
          guide: '屈腕抗阻痛提示高尔夫球肘（内侧上髁炎）'
        },
        {
          id: 'cubital_test',
          level: 4,
          question: '长时间手肘弯曲（如打电话、枕着胳膊睡）时，小指/无名指是否麻木加重？',
          type: 'radio',
          options: [
            { label: '是，肘屈曲诱发手指麻木', value: 'cubital_pos', next: 'cubital_result' },
            { label: '否，和肘姿势无关', value: 'cubital_neg', next: 'unknown_result' }
          ],
          guide: '肘管综合征典型诱发姿势：肘屈曲>90°时尺神经受压加重'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'elbow', reason: '' };
        
        // Level 1: 红线检查
        var redflag = answers.redflag_elbow;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑化脓性关节炎/骨折！请立即就医，勿自行康复。';
          return result;
        }

        var location = answers.step_2_localization;
        var ulnarCheck = answers.step_3_concomitant;
        var cozenTest = answers.step_4_physical;
        var golferTest = answers.golfer_elbow_test;
        var cubitalTest = answers.cubital_test;

        // Level 4: 物理测试
        if (cozenTest && cozenTest.indexOf('cozen_pos') !== -1) {
          result.diagnosis = 'tennis_elbow';
          result.confidence = 90;
          result.specialty = 'elbow';
          result.label = '网球肘（外侧上髁炎）';
          result.reason = '拧毛巾动作诱发肘外侧痛（Level 4 物理测试阳性），符合网球肘';
          return result;
        }

        if (golferTest && golferTest.indexOf('golfer_pos') !== -1) {
          result.diagnosis = 'golfer_elbow';
          result.confidence = 90;
          result.specialty = 'elbow';
          result.label = '高尔夫球肘（内侧上髁炎）';
          result.reason = '屈腕动作诱发肘内侧痛（Level 4 物理测试阳性），符合高尔夫球肘';
          return result;
        }

        if (cubitalTest && cubitalTest.indexOf('cubital_pos') !== -1) {
          result.diagnosis = 'cubital_tunnel';
          result.confidence = 85;
          result.specialty = 'elbow';
          result.label = '肘管综合征（尺神经卡压）';
          result.reason = '肘屈曲诱发小指/无名指麻木（Level 4 物理测试阳性），符合肘管综合征';
          return result;
        }

        // Level 2-3: 根据定位判断
        if (location && location.indexOf('lateral_epicondyle') !== -1) {
          result.diagnosis = 'tennis_elbow_suspected';
          result.confidence = 80;
          result.specialty = 'elbow';
          result.label = '网球肘（可疑）';
          result.reason = '疼痛定位于肘外侧（Level 2 定位），怀疑网球肘';
          return result;
        }

        if (location && location.indexOf('medial_epicondyle') !== -1) {
          result.diagnosis = 'golfer_elbow_suspected';
          result.confidence = 80;
          result.specialty = 'elbow';
          result.label = '高尔夫球肘（可疑）';
          result.reason = '疼痛定位于肘内侧（Level 2 定位），怀疑高尔夫球肘';
          return result;
        }

        // 默认
        result.diagnosis = 'elbow_pain_unknown';
        result.confidence = 60;
        result.specialty = 'elbow';
        result.label = '肘痛待查（建议骨科/康复科就诊）';
        result.reason = 'Level 1-4 筛查无法明确，建议进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 腕痛（四步通用筛查模型）
     * 腕关节/手部疼痛 —— 常见原因：桡骨茎突狭窄性腱鞘炎（De Quervain）、腕关节扭伤、腕管综合征
     * ============================================================ */
    'wrist_pain': {
      label: '腕痛/手腕痛 鉴别诊断',
      icon: '🤚',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_wrist',
          level: 1,
          question: '是否有以下危险信号：腕关节明显红肿热痛、发热、近期有外伤后畸形？',
          type: 'radio',
          options: [
            { label: '是，有上述症状', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，无红肿发热', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除化脓性关节炎、骨折等急症'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您指出疼痛的最主要位置：',
          type: 'radio',
          options: [
            { label: '腕桡侧（大拇指侧，握拳/抱婴儿时痛）', value: 'radial_wrist', next: 'step_3_concomitant' },
            { label: '腕掌侧（手掌面，屈腕时痛）', value: 'volar_wrist', next: 'step_3_concomitant' },
            { label: '腕背侧（手背面，伸腕时痛）', value: 'dorsal_wrist', next: 'step_3_concomitant' },
            { label: '整个腕部都痛', value: 'whole_wrist', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '除腕痛外，是否伴有手指麻木（特别是大拇指/食指/中指）？',
          type: 'radio',
          options: [
            { label: '是，有手指麻木', value: 'finger_numbness_yes', next: 'step_3_duration' },
            { label: '否，只有腕痛', value: 'finger_numbness_no', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '这种腕痛持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '不到2周（急性）', value: 'acute', next: 'step_4_physical' },
            { label: '2周-3个月（亚急性）', value: 'subacute', next: 'step_4_physical' },
            { label: '超过3个月（慢性）', value: 'chronic', next: 'step_4_physical' }
          ]
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试做"Finkelstein试验"：患侧手握拳（大拇指包在拳心内），然后向尺侧（小指方向）弯曲手腕。桡侧（大拇指侧）是否出现明显疼痛？',
          type: 'radio',
          options: [
            { label: '是，Finkelstein试验阳性（桡侧痛）', value: 'finkelstein_pos', next: 'dequervain_result' },
            { label: '否，Finkelstein试验阴性', value: 'finkelstein_neg', next: 'phalen_test' }
          ],
          guide: 'Finkelstein试验阳性提示桡骨茎突狭窄性腱鞘炎（De Quervain病）'
        },
        {
          id: 'phalen_test',
          level: 4,
          question: '请尝试双腕极度屈曲（掌心相对，手背相贴），维持60秒。大拇指/食指/中指是否出现麻木/刺痛？',
          type: 'radio',
          options: [
            { label: '是，60秒内出现手指麻木', value: 'phalen_pos', next: 'cts_result' },
            { label: '否，没有手指麻木', value: 'phalen_neg', next: 'unknown_result' }
          ],
          guide: '屈腕试验（Phalen Test）阳性提示腕管综合征'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'wrist', reason: '' };
        
        // Level 1: 红线检查
        var redflag = answers.redflag_wrist;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑化脓性关节炎/骨折！请立即就医，勿自行康复。';
          return result;
        }

        var location = answers.step_2_localization;
        var fingerNumbness = answers.step_3_concomitant;
        var finkelsteinTest = answers.step_4_physical;
        var phalenTest = answers.phalen_test;

        // Level 4: 物理测试
        if (finkelsteinTest && finkelsteinTest.indexOf('finkelstein_pos') !== -1) {
          result.diagnosis = 'dequervain';
          result.confidence = 90;
          result.specialty = 'wrist';
          result.label = '桡骨茎突狭窄性腱鞘炎（De Quervain病）';
          result.reason = 'Finkelstein试验阳性（Level 4 物理测试阳性），符合De Quervain病';
          return result;
        }

        if (phalenTest && phalenTest.indexOf('phalen_pos') !== -1) {
          result.diagnosis = 'carpal_tunnel';
          result.confidence = 90;
          result.specialty = 'wrist';
          result.label = '腕管综合征（正中神经卡压）';
          result.reason = '屈腕试验阳性（Level 4 物理测试阳性），符合腕管综合征';
          return result;
        }

        // Level 2-3: 根据定位判断
        if (location && location.indexOf('radial_wrist') !== -1) {
          result.diagnosis = 'dequervain_suspected';
          result.confidence = 80;
          result.specialty = 'wrist';
          result.label = '桡骨茎突狭窄性腱鞘炎（可疑）';
          result.reason = '疼痛定位于腕桡侧（Level 2 定位），怀疑De Quervain病';
          return result;
        }

        if (fingerNumbness && fingerNumbness.indexOf('finger_numbness_yes') !== -1) {
          result.diagnosis = 'carpal_tunnel_suspected';
          result.confidence = 80;
          result.specialty = 'wrist';
          result.label = '腕管综合征（可疑）';
          result.reason = '腕痛伴手指麻木（Level 3 伴随症状），怀疑腕管综合征';
          return result;
        }

        // 默认
        result.diagnosis = 'wrist_pain_unknown';
        result.confidence = 60;
        result.specialty = 'wrist';
        result.label = '腕痛待查（建议骨科/康复科就诊）';
        result.reason = 'Level 1-4 筛查无法明确，建议进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 足痛/足底痛（四步通用筛查模型）
     * 足部疼痛 —— 常见原因：足底筋膜炎、跟腱炎、足骨关节炎
     * ============================================================ */
    'foot_pain': {
      label: '足痛/足底痛 鉴别诊断',
      icon: '🦶',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_foot',
          level: 1,
          question: '是否有以下危险信号：足部明显红肿热痛、发热、近期有外伤后畸形或不能负重？',
          type: 'radio',
          options: [
            { label: '是，有上述症状', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，无红肿发热/不能负重', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除化脓性关节炎、骨折、跟腱断裂等急症'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您指出疼痛的最主要位置（可多选）：',
          type: 'checkbox',
          options: [
            { label: '足跟/足底（早起下地最痛）', value: 'heel_plantar', next: 'step_3_concomitant' },
            { label: '足背部（走路/久站时痛）', value: 'dorsal_foot', next: 'step_3_concomitant' },
            { label: '足趾（拇趾/其他足趾）', value: 'toe_pain', next: 'step_3_concomitant' },
            { label: '整个足部都痛', value: 'whole_foot', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '足痛是如何开始的？',
          type: 'radio',
          options: [
            { label: '逐渐加重，无明显外伤，早起下地最痛', value: 'gradual', next: 'step_3_duration' },
            { label: '有明确外伤/扭伤史', value: 'trauma', next: 'step_3_duration' },
            { label: '突然剧烈疼痛，完全不能负重', value: 'acute', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '这种足痛持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '不到2周（急性）', value: 'acute', next: 'step_3_aggravating' },
            { label: '2周-3个月（亚急性）', value: 'subacute', next: 'step_3_aggravating' },
            { label: '超过3个月（慢性）', value: 'chronic', next: 'step_3_aggravating' }
          ]
        },
        {
          id: 'step_3_aggravating',
          level: 3,
          question: '什么时候足痛最明显？（状态轴）',
          type: 'radio',
          options: [
            { label: '早起下地第一步最痛，走几步后缓解', value: 'first_step', next: 'step_4_physical' },
            { label: '长时间站立/行走后加重', value: 'weight_bearing', next: 'step_4_physical' },
            { label: '特定鞋子/活动后加重', value: 'shoe_related', next: 'step_4_physical' },
            { label: '没有明显规律', value: 'unknown', next: 'step_4_physical' }
          ],
          guide: '足底筋膜炎典型表现：晨起第一步痛；跟腱炎典型表现：提踵时痛'
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试用患侧脚尖站立（提踵）。足跟/足底是否出现明显疼痛？',
          type: 'radio',
          options: [
            { label: '是，提踵时足跟/足底痛', value: 'plantar_pos', next: 'plantar_result' },
            { label: '否，提踵无疼痛', value: 'plantar_neg', next: 'windlass_test' }
          ],
          guide: '提踵痛提示足底筋膜炎；Windlass试验阳性也提示足底筋膜炎'
        },
        {
          id: 'windlass_test',
          level: 4,
          question: '请尝试被动将大脚趾向上扳（背屈）。足底是否出现明显疼痛或紧张感？',
          type: 'radio',
          options: [
            { label: '是，扳大脚趾时足底痛', value: 'windlass_pos', next: 'plantar_result' },
            { label: '否，扳大脚趾无疼痛', value: 'windlass_neg', next: 'achilles_test' }
          ],
          guide: 'Windlass试验阳性提示足底筋膜炎'
        },
        {
          id: 'achilles_test',
          level: 4,
          question: '请尝试用患侧脚尖站立（提踵）。跟腱区是否出现明显疼痛？',
          type: 'radio',
          options: [
            { label: '是，提踵时跟腱区痛', value: 'achilles_pos', next: 'achilles_result' },
            { label: '否，提踵无疼痛', value: 'achilles_neg', next: 'unknown_result' }
          ],
          guide: '跟腱炎典型表现：提踵时跟腱区疼痛'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'foot', reason: '' };
        
        // Level 1: 红线检查
        var redflag = answers.redflag_foot;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑急危重症（化脓性关节炎/骨折/跟腱断裂）！请立即就医，勿自行康复。';
          return result;
        }

        var location = answers.step_2_localization;
        var aggravating = answers.step_3_aggravating;
        var plantartTest = answers.step_4_physical;
        var windlassTest = answers.windlass_test;
        var achillesTest = answers.achilles_test;

        // Level 4: 物理测试
        if (plantartTest && plantartTest.indexOf('plantar_pos') !== -1) {
          result.diagnosis = 'plantar_fasciitis';
          result.confidence = 90;
          result.specialty = 'foot';
          result.label = '足底筋膜炎';
          result.reason = '提踵时足跟/足底痛（Level 4 物理测试阳性），符合足底筋膜炎';
          return result;
        }

        if (windlassTest && windlassTest.indexOf('windlass_pos') !== -1) {
          result.diagnosis = 'plantar_fasciitis';
          result.confidence = 90;
          result.specialty = 'foot';
          result.label = '足底筋膜炎';
          result.reason = 'Windlass试验阳性（Level 4 物理测试阳性），符合足底筋膜炎';
          return result;
        }

        if (achillesTest && achillesTest.indexOf('achilles_pos') !== -1) {
          result.diagnosis = 'achilles_tendinopathy';
          result.confidence = 85;
          result.specialty = 'foot';
          result.label = '跟腱炎/跟腱病变';
          result.reason = '提踵时跟腱区疼痛（Level 4 物理测试阳性），符合跟腱炎';
          return result;
        }

        // Level 3: 根据疼痛模式判断
        if (aggravating && aggravating.indexOf('first_step') !== -1) {
          result.diagnosis = 'plantar_fasciitis';
          result.confidence = 90;
          result.specialty = 'foot';
          result.label = '足底筋膜炎';
          result.reason = '早起下地第一步痛，走几步后缓解（Level 3 状态轴），符合足底筋膜炎典型表现';
          return result;
        }

        if (aggravating && aggravating.indexOf('weight_bearing') !== -1) {
          result.diagnosis = 'foot_overuse';
          result.confidence = 75;
          result.specialty = 'foot';
          result.label = '足部过劳/足部疼痛综合征';
          result.reason = '长时间站立/行走后加重（Level 3 状态轴），考虑足部过劳';
          return result;
        }

        // 默认
        result.diagnosis = 'foot_pain_unknown';
        result.confidence = 60;
        result.specialty = 'foot';
        result.label = '足痛待查（建议骨科/康复科就诊）';
        result.reason = 'Level 1-4 筛查无法明确，建议进一步检查';
        return result;
      }
    },

    /* ============================================================
     * 步态异常/跛行（四步通用筛查模型）
     * 步态问题 —— 常见原因：神经源性跛行、血管源性跛行、帕金森病、脑卒中后遗症
     * ============================================================ */
    'gait_disorder': {
      label: '步态异常/跛行 鉴别诊断',
      icon: '🚶',
      steps: [
        /* ========== Level 1: 红旗症状安全过滤 ========== */
        {
          id: 'redflag_gait',
          level: 1,
          question: '是否有以下危险信号：突然发生的步态不稳、说话含糊不清、半边脸麻木流涎、胸痛大汗淋漓？',
          type: 'radio',
          options: [
            { label: '是，有上述危险信号', value: 'redflag', action: 'TERMINATE_TO_EMERGENCY' },
            { label: '否，没有这些危险信号', value: 'safe', next: 'step_2_localization' }
          ],
          guide: '排除急性脑卒中（中风）、心梗等急危重症'
        },
        /* ========== Level 2: 解剖部位精细定位 ========== */
        {
          id: 'step_2_localization',
          level: 2,
          question: '请您描述步态异常的主要表现（可多选）：',
          type: 'checkbox',
          options: [
            { label: '走路久了腿没劲/酸胀，坐下休息后缓解（弯腰骑车不痛）', value: 'neurogenic_claudication', next: 'step_3_concomitant' },
            { label: '走路久了腿痛/抽筋，停下站立休息后缓解', value: 'vascular_claudication', next: 'step_3_concomitant' },
            { label: '小碎步、起步困难、走路易跌倒', value: 'parkinsonian_gait', next: 'step_3_concomitant' },
            { label: '一瘸一拐（疼痛性跛行）', value: 'antalgic_gait', next: 'step_3_concomitant' }
          ]
        },
        /* ========== Level 3: 伴随症状与病史追问 ========== */
        {
          id: 'step_3_concomitant',
          level: 3,
          question: '除步态异常外，是否伴有以下情况（可多选）：',
          type: 'checkbox',
          options: [
            { label: '腰痛/腿麻', value: 'back_leg_pain', next: 'step_3_duration' },
            { label: '手部震颤/僵硬', value: 'hand_tremor', next: 'step_3_duration' },
            { label: '有脑卒中（中风）病史', value: 'stroke_history', next: 'step_3_duration' },
            { label: '没有上述伴随症状', value: 'no_concomitant', next: 'step_3_duration' }
          ]
        },
        {
          id: 'step_3_duration',
          level: 3,
          question: '这种步态异常持续多久了？（时间轴）',
          type: 'radio',
          options: [
            { label: '不到2周（急性）', value: 'acute', next: 'step_4_physical' },
            { label: '2周-3个月（亚急性）', value: 'subacute', next: 'step_4_physical' },
            { label: '超过3个月（慢性）', value: 'chronic', next: 'step_4_physical' }
          ]
        },
        /* ========== Level 4: 特殊诱发物理测试 ========== */
        {
          id: 'step_4_physical',
          level: 4,
          question: '请尝试行走，直到出现腿没劲/酸胀/痛。然后改成弯腰骑自行车（或弯腰走路）。症状是否明显减轻或消失？',
          type: 'radio',
          options: [
            { label: '是，弯腰骑车/走路时不痛', value: 'flexion_relief', next: 'neurogenic_result' },
            { label: '否，弯腰骑车/走路时仍然痛', value: 'flexion_no_relief', next: 'vascular_result' }
          ],
          guide: '弯腰减轻提示神经源性跛行（腰椎管狭窄）；弯腰不减轻提示血管源性跛行'
        },
        {
          id: 'timed_up_and_go',
          level: 4,
          question: '请尝试从椅子上站起，走3米，转身走回来坐下。是否需要超过13.5秒，或中途需扶墙/摇晃？',
          type: 'radio',
          options: [
            { label: '是，超过13.5秒 或 需扶墙/摇晃', value: 'tug_abnormal', next: 'parkinson_result' },
            { label: '否，能在13.5秒内完成 且 不需扶墙', value: 'tug_normal', next: 'unknown_result' }
          ],
          guide: 'Timed Up & Go >13.5秒提示跌倒风险增高；帕金森步态典型表现：小碎步、起步困难'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'gait', reason: '' };
        
        // Level 1: 红线检查
        var redflag = answers.redflag_gait;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑急性脑卒中风险！请立即就医，勿自行康复。';
          return result;
        }

        var location = answers.step_2_localization;
        var concomitant = answers.step_3_concomitant;
        var flexionTest = answers.step_4_physical;
        var tugTest = answers.timed_up_and_go;

        // Level 4: 物理测试
        if (flexionTest && flexionTest.indexOf('flexion_relief') !== -1) {
          result.diagnosis = 'neurogenic_claudication';
          result.confidence = 90;
          result.specialty = 'gait';
          result.label = '神经源性跛行（腰椎管狭窄）';
          result.reason = '弯腰骑车/走路时症状减轻（Level 4 物理测试阳性），符合神经源性跛行';
          return result;
        }

        if (flexionTest && flexionTest.indexOf('flexion_no_relief') !== -1) {
          result.diagnosis = 'vascular_claudication';
          result.confidence = 85;
          result.specialty = 'gait';
          result.label = '血管源性跛行（外周动脉疾病）';
          result.reason = '弯腰时不减轻（Level 4 物理测试阳性），符合血管源性跛行';
          return result;
        }

        if (tugTest && tugTest.indexOf('tug_abnormal') !== -1) {
          result.diagnosis = 'parkinsonian_gait';
          result.confidence = 80;
          result.specialty = 'gait';
          result.label = '帕金森步态障碍（可疑）';
          result.reason = 'TUG >13.5秒（Level 4 物理测试阳性），符合帕金森步态障碍';
          return result;
        }

        // Level 2-3: 根据定位和伴随症状判断
        if (location && location.indexOf('neurogenic_claudication') !== -1) {
          result.diagnosis = 'neurogenic_claudication';
          result.confidence = 90;
          result.specialty = 'gait';
          result.label = '神经源性跛行（腰椎管狭窄）';
          result.reason = '走路久了腿没劲，坐下休息后缓解（Level 2 定位），符合神经源性跛行';
          return result;
        }

        if (location && location.indexOf('parkinsonian_gait') !== -1) {
          result.diagnosis = 'parkinsonian_gait';
          result.confidence = 80;
          result.specialty = 'gait';
          result.label = '帕金森步态障碍（可疑）';
          result.reason = '小碎步、起步困难（Level 2 定位），符合帕金森步态障碍';
          return result;
        }

        if (concomitant && concomitant.indexOf('stroke_history') !== -1) {
          result.diagnosis = 'stroke_gait';
          result.confidence = 75;
          result.specialty = 'gait';
          result.label = '脑卒中后步态障碍';
          result.reason = '有脑卒中病史（Level 3 伴随症状），考虑脑卒中后步态障碍';
          return result;
        }

        // 默认
        result.diagnosis = 'gait_disorder_unknown';
        result.confidence = 60;
        result.specialty = 'gait';
        result.label = '步态异常待查（建议神经内科/康复科就诊）';
        result.reason = 'Level 1-4 筛查无法明确，建议进一步检查';
        return result;
      }
    },

  getTree: function(keyword) {
    var k = keyword.replace(/疼/g, '痛').replace(/\s+/g, '');
    
    // 优先使用语义归一化结果
    if (window.SemanticNormalizer) {
      var normalized = SemanticNormalizer.normalize(keyword);
      if (normalized && normalized.standardTag) {
        var treeKey = SemanticNormalizer.getTreeKey(normalized);
        if (treeKey && this.trees[treeKey]) {
          console.log('✅ 语义归一化匹配：', normalized.standardTag, '->', treeKey);
          return this.trees[treeKey];
        }
      }
    }
    
    // 兜底：原有硬编码匹配（保留作为后备）
    if (k.indexOf('手麻') !== -1 || k.indexOf('手指麻') !== -1 || k.indexOf('手掌麻') !== -1 || k.indexOf('小指') !== -1 || k.indexOf('指尖麻') !== -1) {
      return this.trees.hand_numb;
    }
    // 髋痛
    if (k.indexOf('髋痛') !== -1 || k.indexOf('胯痛') !== -1 || k.indexOf('胯骨痛') !== -1 || k.indexOf('腹股沟痛') !== -1 || k.indexOf('大腿根痛') !== -1) {
      return this.trees.hip_pain;
    }
    // 踝痛/足痛
    if (k.indexOf('踝痛') !== -1 || k.indexOf('脚踝痛') !== -1 || k.indexOf('崴脚') !== -1 || k.indexOf('足痛') !== -1 || k.indexOf('足底痛') !== -1 || k.indexOf('足跟痛') !== -1) {
      return this.trees.ankle_pain;
    }
    // 肘痛
    if (k.indexOf('肘痛') !== -1 || k.indexOf('胳膊肘') !== -1 || k.indexOf('网球肘') !== -1 || k.indexOf('高尔夫球肘') !== -1 || k.indexOf('拧毛巾痛') !== -1) {
      return this.trees.elbow_pain;
    }
    // 腕痛
    if (k.indexOf('腕痛') !== -1 || k.indexOf('手腕痛') !== -1 || k.indexOf('鼠标手') !== -1 || k.indexOf('桡骨茎突') !== -1 || k.indexOf('抱婴儿手腕痛') !== -1) {
      return this.trees.wrist_pain;
    }
    // 步态异常
    if (k.indexOf('走路不稳') !== -1 || k.indexOf('跛行') !== -1 || k.indexOf('走路一瘸一拐') !== -1 || k.indexOf('小碎步') !== -1 || k.indexOf('冻结步态') !== -1 || k.indexOf('慌张步态') !== -1) {
      return this.trees.gait_disorder;
    }
    // 肩胛痛
    if (k.indexOf('肩胛') !== -1 || k.indexOf('肩胛缝') !== -1 || k.indexOf('肩胛骨') !== -1 || k.indexOf('后背痛') !== -1 || k.indexOf('后背疼') !== -1 || k.indexOf('肩胛区') !== -1) {
      return this.trees.scapular_pain;
    }
    // 背痛/胸椎痛
    if (k.indexOf('背痛') !== -1 || k.indexOf('背部痛') !== -1 || k.indexOf('胸椎') !== -1 || k.indexOf('后背') !== -1 || k.indexOf('背部不适') !== -1) {
      return this.trees.thoracic_pain;
    }
    // 腰痛
    if (k.indexOf('腰痛') !== -1 || k.indexOf('腰疼') !== -1 || k.indexOf('腰僵') !== -1 || k.indexOf('腰椎') !== -1) {
      return this.trees.low_back_pain;
    }
    // 肩痛
    if (k.indexOf('肩痛') !== -1 || k.indexOf('肩疼') !== -1 || k.indexOf('肩周炎') !== -1 || k.indexOf('抬肩') !== -1) {
      return this.trees.shoulder_pain;
    }
    // 膝痛
    if (k.indexOf('膝痛') !== -1 || k.indexOf('膝盖痛') !== -1 || k.indexOf('膝关节') !== -1 || k.indexOf('上下楼梯痛') !== -1) {
      return this.trees.knee_pain;
    }
    // 头晕/头痛/平衡问题
    if (k.indexOf("头晕") !== -1 || k.indexOf("眩晕") !== -1 || k.indexOf("头痛") !== -1 || k.indexOf("头疼") !== -1 || k.indexOf("平衡") !== -1 || k.indexOf("走路不稳") !== -1) {
      return this.trees.dizziness;
    }
    // 气喘/胸闷/运动后气短
    if (k.indexOf("气喘") !== -1 || k.indexOf("气短") !== -1 || k.indexOf("胸闷") !== -1 || k.indexOf("呼吸困难") !== -1 || k.indexOf("运动后气短") !== -1) {
      return this.trees.dyspnea;
    }
    // 手麻
    if (k.indexOf('手麻') !== -1 || k.indexOf('手指麻') !== -1 || k.indexOf('手掌麻') !== -1 || k.indexOf('小指') !== -1 || k.indexOf('指尖麻') !== -1) {
      return this.trees.hand_numb;
    }
    // 无法匹配 → 走通用追问树（做解剖定位）
    return this.trees.general_symptom;
  }
};

// 显式暴露到全局
window.DifferentialEngine = DifferentialEngine;
