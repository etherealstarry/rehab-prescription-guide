/* ============================================================
   differential.js — 交互式鉴别诊断追问引擎
   当症状匹配多个可能诊断时，通过连环追问（是非题/动作测试）锁定诊断
   参考：《康复评定学》第3版；《诊断学》第9版 症状鉴别诊断章节
   ============================================================ */

const DifferentialEngine = {
  /* ——— 追问树定义 ——— */
  trees: {
    /* ---- 手麻 / 小指麻木 ---- */
    'hand_numb': {
      label: '手麻/小指麻木 鉴别诊断',
      icon: '✋',
      steps: [
        {
          id: 'redflag_stroke',
          question: '您的麻木是突然发生的吗？是否同时伴有以下任何一种情况：说话含糊不清、半边脸麻木流涎、或单侧上肢完全抬不起来？',
          type: 'radio',
          options: [
            { label: '是，有上述情况', value: 'redflag', next: 'RED_FLAG' },
            { label: '否，单纯只有小指/手麻', value: 'safe', next: 'neck_test' }
          ],
          guide: '排除急性脑卒中（中风）风险，见《神经康复学》急诊筛查流程'
        },
        {
          id: 'neck_test',
          question: '请尝试把头向左后方倾斜并微微后仰（仰头看左上方）。此时，您小指的麻木感是否明显加重，甚至有一股电流感从脖子窜到手指？',
          type: 'radio',
          options: [
            { label: '是，仰头时麻木加重', value: 'cervical', next: 'cervical_detail' },
            { label: '否，和仰头无关', value: 'peripheral', next: 'location_test' }
          ],
          guide: '仰头动作牵拉颈椎神经根，若麻木加重提示神经根型颈椎病（C8），见APTA颈椎CPG 2021'
        },
        {
          id: 'cervical_detail',
          question: '除小指麻木外，是否伴有颈肩痛、上肢放射痛？麻木范围是小指+无名指尺侧一半，还是整个手指？',
          type: 'checkbox',
          options: [
            { label: '有小指+无名指尺侧麻木，颈肩痛', value: 'cervical_rad_C8' },
            { label: '只有小指麻木，颈部无症状', value: 'cervical_neg' }
          ],
          next: 'cervical_radiculopathy'
        },
        {
          id: 'location_test',
          question: '除了小指麻木外，您的手背小指这一侧（手背尺侧）是否也发麻？',
          type: 'radio',
          options: [
            { label: '是，手背+手掌一起麻', value: 'cubital', next: 'elbow_test' },
            { label: '只有手掌和手指麻，手背正常', value: 'ulnar_canal', next: 'wrist_test' }
          ],
          guide: '手背尺侧由尺神经手背支支配，该分支在肘管下方发出；若手背不麻，病变在腕尺管（Guyon管）'
        },
        {
          id: 'elbow_test',
          question: '长时间手肘弯曲（如打电话、枕着胳膊睡）时，小指麻木是否比平时更严重？',
          type: 'radio',
          options: [
            { label: '是，手肘弯曲久了更麻', value: 'cubital_pos', next: 'cubital_syndrome' },
            { label: '否，和手肘姿势无关', value: 'cubital_neg', next: 'ulnar_canal_syndrome' }
          ],
          guide: '肘管综合征典型诱发姿势：肘屈曲>90°时尺神经受压加重'
        }
      ],
      result: function(answers) {
        // 根据追问答案计算概率
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'hand', reason: '' };
        var redflag = answers.redflag_stroke;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑急性脑卒中风险！请立即就医，勿自行康复。';
          return result;
        }
        var neck = answers.neck_test;
        if (neck && neck.indexOf('cervical') !== -1) {
          result.diagnosis = 'cervical_radiculopathy';
          result.confidence = 85;
          result.specialty = 'cervical';
          result.label = '神经根型颈椎病（C8）';
          result.reason = '仰头时麻木加重，提示症状与颈椎神经根相关';
          return result;
        }
        var loc = answers.location_test;
        if (loc && loc.indexOf('cubital') !== -1) {
          var elbow = answers.elbow_test;
          if (elbow && elbow.indexOf('cubital_pos') !== -1) {
            result.diagnosis = 'cubital_tunnel_syndrome';
            result.confidence = 90;
            result.specialty = 'hand';
            result.label = '肘管综合征（尺神经卡压）';
            result.reason = '手背尺侧受累 + 肘屈曲诱发加重，符合肘管综合征';
            return result;
          }
        }
        if (loc && loc.indexOf('ulnar_canal') !== -1) {
          result.diagnosis = 'ulnar_canal_syndrome';
          result.confidence = 80;
          result.specialty = 'hand';
          result.label = '腕尺管综合征（Guyon管综合征）';
          result.reason = '仅手掌尺侧麻木，手背正常，病变位于腕部';
          return result;
        }
        // 默认
        result.diagnosis = 'hand_numb_unknown';
        result.confidence = 60;
        result.specialty = 'hand';
        result.label = '手麻待查（建议手外科/神经内科就诊）';
        result.reason = '多项排查无法明确锁定，建议进一步检查';
        return result;
      }
    },

    /* ---- 腰痛 ---- */
    'low_back_pain': {
      label: '腰痛 鉴别诊断',
      icon: '🦴',
      steps: [
        {
          id: 'redflag_cauda',
          question: '是否有以下"马尾综合征"危险信号：会阴部（骑跨区）麻木、大小便失禁或潴留、双下肢突然无力？',
          type: 'radio',
          options: [
            { label: '是，有上述症状', value: 'redflag', next: 'RED_FLAG' },
            { label: '否，无大小便问题', value: 'safe', next: 'pain_pattern' }
          ],
          guide: '马尾综合征为神经外科急症，需24小时内手术，见《骨科康复学》Ch.5'
        },
        {
          id: 'pain_pattern',
          question: '您的腰痛属于以下哪种模式？（参考APTA腰痛CPG分类）',
          type: 'radio',
          options: [
            { label: '翻身/起床时腰僵疼痛，活动后反而减轻（晨僵>30分钟）', value: 'inflammatory', next: 'inflammatory' },
            { label: '久坐/弯腰时痛，站立/后仰缓解，感觉腰"不稳"', value: 'instability', next: 'instability' },
            { label: '腰部活动受限明显，某个方向卡住不敢动', value: 'stiffness', next: 'stiffness' },
            { label: '腿痛大于腰痛，放射至小腿/足', value: 'radicular', next: 'radicular' }
          ],
          guide: 'APTA腰痛CPG 2021：按疼痛模式分类决定康复策略'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'lumbar', reason: '' };
        var redflag = answers.redflag_cauda;
        if (redflag && redflag.indexOf('redflag') !== -1) {
          result.redflag = true;
          result.redflagMsg = '⚠️ 怀疑马尾综合征！请立即前往医院急诊，勿自行康复。';
          return result;
        }
        var pattern = answers.pain_pattern;
        if (pattern && pattern.indexOf('instability') !== -1) {
          result.diagnosis = 'lumbar_instability';
          result.confidence = 85;
          result.label = '腰椎不稳/非特异性腰痛（稳定机制异常型）';
          result.reason = '疼痛与姿势相关，活动后缓解，符合稳定机制异常模式';
        } else if (pattern && pattern.indexOf('stiffness') !== -1) {
          result.diagnosis = 'lumbar_stiffness';
          result.confidence = 80;
          result.label = '腰椎活动度受限';
          result.reason = '活动受限明显，符合关节源性腰痛';
        } else if (pattern && pattern.indexOf('radicular') !== -1) {
          result.diagnosis = 'lumbar_disc_herniation';
          result.confidence = 85;
          result.label = '腰椎间盘突出症';
          result.reason = '腿痛大于腰痛，放射至小腿/足，符合根性痛';
        } else if (pattern && pattern.indexOf('inflammatory') !== -1) {
          result.diagnosis = 'inflammatory_back_pain';
          result.confidence = 75;
          result.label = '炎性腰痛（需排查强直性脊柱炎）';
          result.reason = '晨僵>30分钟，活动后减轻，符合炎性模式';
        } else {
          result.diagnosis = 'lumbar_nonspecific';
          result.confidence = 70;
          result.label = '非特异性腰痛';
          result.reason = '无法明确分类，按非特异性腰痛处理';
        }
        return result;
      }
    },

    /* ---- 肩痛 ---- */
    'shoulder_pain': {
      label: '肩痛 鉴别诊断',
      icon: '🦾',
      steps: [
        {
          id: 'pain_onset',
          question: '肩痛是如何开始的？',
          type: 'radio',
          options: [
            { label: '逐渐加重，无明显外伤，夜间痛明显', value: 'gradual', next: 'rom_test' },
            { label: '有明确外伤/手术后逐渐活动受限', value: 'trauma', next: 'trauma_detail' },
            { label: '突然剧烈疼痛，完全不能抬起', value: 'acute', next: 'acute_detail' }
          ]
        },
        {
          id: 'rom_test',
          question: '请尝试主动抬起患肩（前屈）。与健侧相比，抬高的幅度是否严重受限（差>50%）？再让别人帮您被动抬高患肩，幅度是否和主动抬高差不多？',
          type: 'radio',
          options: [
            { label: '主动和被动都严重受限，像"冻住"了一样', value: 'frozen', next: 'frozen_shoulder' },
            { label: '主动抬不高，但别人帮我抬能抬得更高', value: 'weakness', next: 'rotator_cuff' },
            { label: '主动被动都还好，但某个角度会痛', value: 'impingement', next: 'impingement' }
          ],
          guide: '主动<被动 → 肩袖损伤（肌力不足）；主动≈被动受限 → 冻结肩（关节囊挛缩）'
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'shoulder', reason: '' };
        var rom = answers.rom_test;
        if (rom && rom.indexOf('frozen') !== -1) {
          result.diagnosis = 'frozen_shoulder';
          result.confidence = 90;
          result.label = '冻结肩（粘连性关节囊炎）';
          result.reason = '主动+被动活动均严重受限，符合冻结肩特征';
        } else if (rom && rom.indexOf('weakness') !== -1) {
          result.diagnosis = 'rotator_cuff_injury';
          result.confidence = 85;
          result.label = '肩袖损伤';
          result.reason = '主动活动<被动活动，提示肩袖肌力不足';
        } else if (rom && rom.indexOf('impingement') !== -1) {
          result.diagnosis = 'shoulder_impingement';
          result.confidence = 80;
          result.label = '肩峰下撞击综合征';
          result.reason = '特定角度疼痛，活动度尚可，符合撞击综合征';
        } else {
          result.diagnosis = 'shoulder_pain_unknown';
          result.confidence = 60;
          result.label = '肩痛待查';
        }
        return result;
      }
    },

    /* ---- 膝关节痛 ---- */
    'knee_pain': {
      label: '膝关节痛 鉴别诊断',
      icon: '🦵',
      steps: [
        {
          id: 'trauma_history',
          question: '是否有明确的外伤史（如运动扭伤、摔倒、车祸）？',
          type: 'radio',
          options: [
            { label: '是，外伤后膝不稳/卡锁/肿胀', value: 'trauma', next: 'trauma_detail' },
            { label: '否，无外伤，逐渐起病', value: 'gradual', next: 'age_pattern' }
          ]
        },
        {
          id: 'trauma_detail',
          question: '外伤时您听到"啪"的一声吗？之后膝关节是否反复"打软腿"（突然跪倒）？',
          type: 'radio',
          options: [
            { label: '是，有弹响+反复打软腿', value: 'acl', next: 'acl_injury' },
            { label: '无弹响，主要是卡锁/交锁', value: 'meniscus', next: 'meniscus_injury' },
            { label: '主要是肿胀+活动受限', value: 'effusion', next: 'knee_oa' }
          ]
        },
        {
          id: 'age_pattern',
          question: '您的年龄和疼痛特点是？',
          type: 'radio',
          options: [
            { label: '年龄>50岁，晨起膝僵<30分钟，活动后减轻但久走又痛', value: 'oa', next: 'knee_oa' },
            { label: '年龄<40岁，上下楼梯痛明显，跪地/下蹲痛', value: 'patellofemoral', next: 'patellofemoral' },
            { label: '跑步/跳跃后膝前痛，胫骨结节处压痛（青少年）', value: 'osgood', next: 'osgood_schlatter' }
          ]
        }
      ],
      result: function(answers) {
        var result = { diagnosis: 'unknown', confidence: 0, specialty: 'knee', reason: '' };
        var trauma = answers.trauma_history;
        if (trauma && trauma.indexOf('trauma') !== -1) {
          var detail = answers.trauma_detail;
          if (detail && detail.indexOf('acl') !== -1) {
            result.diagnosis = 'acl_injury';
            result.confidence = 90;
            result.label = '前交叉韧带（ACL）损伤';
            result.reason = '外伤弹响+反复打软腿，典型ACL损伤表现';
          } else if (detail && detail.indexOf('meniscus') !== -1) {
            result.diagnosis = 'meniscus_injury';
            result.confidence = 85;
            result.label = '半月板损伤';
            result.reason = '关节卡锁/交锁，提示半月板撕裂';
          }
        } else {
          var age = answers.age_pattern;
          if (age && age.indexOf('oa') !== -1) {
            result.diagnosis = 'knee_oa';
            result.confidence = 85;
            result.label = '膝骨关节炎（KOA）';
            result.reason = '年龄>50岁+活动后痛，符合膝OA';
          } else if (age && age.indexOf('patellofemoral') !== -1) {
            result.diagnosis = 'patellofemoral_pain';
            result.confidence = 80;
            result.label = '髌股关节疼痛综合征（PFPS）';
            result.reason = '上下楼梯痛+下蹲痛，符合PFPS';
          }
        }
        if (result.diagnosis === 'unknown') {
          result.diagnosis = 'knee_pain_unknown';
          result.confidence = 60;
          result.label = '膝痛待查';
        }
        return result;
      }
    }
  },

  /* ——— 根据症状关键词匹配追问树 ——— */
  getTree: function(keyword) {
    var k = keyword.replace(/疼/g, '痛').replace(/\s+/g, '');
    // 手麻/小指麻木
    if (k.indexOf('小指') !== -1 || k.indexOf('手麻') !== -1 || k.indexOf('手指麻') !== -1 || k.indexOf('手掌麻') !== -1) {
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
    return null; // 无追问树，走普通专科评估流程
  }
};

// 显式暴露到全局
window.DifferentialEngine = DifferentialEngine;
