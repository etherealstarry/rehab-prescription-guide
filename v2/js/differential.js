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
  getTree: function(keyword) {
    var k = keyword.replace(/疼/g, '痛').replace(/\s+/g, '');
    // 手麻/手指麻木
    if (k.indexOf('手麻') !== -1 || k.indexOf('手指麻') !== -1 || k.indexOf('手掌麻') !== -1 || k.indexOf('小指') !== -1 || k.indexOf('指尖麻') !== -1) {
      return this.trees.hand_numb;
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
    // 无法匹配 → 走通用追问树（做解剖定位）
    return this.trees.general_symptom;
  }
};

// 显式暴露到全局
window.DifferentialEngine = DifferentialEngine;
