/**
 * prescription.js - 运动处方自动生成引擎
 *
 * 功能：
 * 1. 接收评估结果（来自 assessment.js）
 * 2. 匹配 prescriptions/*.json 中的处方模板
 * 3. 根据评估结果（描述性选择题答案）推断严重程度，生成个性化 FITT-VP 处方
 * 4. 渲染处方卡片，附带循证证据标签
 */

(function () {
  'use strict';

  // ========== 配置 ==========
  const PRESCRIPTION_PATH_PREFIX = '../assets/data/prescriptions/';
  const EVIDENCE_PATH = '../assets/data/evidence/evidence-database.json';
  const RESULT_CONTAINER_ID = 'prescription-result-container';

  // ========== 状态 ==========
  let evidenceData = { guidelines: [], systematic_reviews: [], rct_studies: [] };

  // ========== 初始化 ==========
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    loadEvidenceData();
    window.PrescriptionEngine = {
      generate: generatePrescription,
      loadTemplate: loadPrescriptionTemplate
    };
  }

  // ========== 加载证据库 ==========
  async function loadEvidenceData() {
    try {
      const resp = await fetch(EVIDENCE_PATH);
      if (resp.ok) {
        evidenceData = await resp.json();
        console.log('[Prescription] 证据库加载完成');
      }
    } catch (err) {
      console.warn('[Prescription] 证据库加载失败，将使用空数据', err);
    }
  }

  // ========== 核心：生成处方 ==========
  async function generatePrescription(specialty, answers) {
    showPrescriptionLoading('正在生成个性化运动处方...');

    try {
      const templateFiles = getTemplateFiles(specialty, answers);
      let allPrescriptions = [];

      for (const file of templateFiles) {
        const template = await loadPrescriptionTemplate(file);
        if (template && template.prescriptions) {
          const customized = customizePrescription(template.prescriptions, answers, specialty);
          allPrescriptions = allPrescriptions.concat(customized);
        }
      }

      if (allPrescriptions.length === 0) {
        allPrescriptions = generateGenericPrescription(specialty, answers);
      }

      renderPrescriptions(allPrescriptions, specialty, answers);

    } catch (err) {
      showPrescriptionError('生成处方失败：' + err.message);
      console.error('[Prescription] 生成失败', err);
    }
  }

  // ========== 根据专科和答案决定使用哪些模板文件 ==========
  function getTemplateFiles(specialty, answers) {
    const diagnosis = (answers['diagnosis'] || '').toLowerCase();

    const fileMap = {
      'neurologic': {
        'stroke':      ['neurologic/stroke.json'],
        'sci':         ['neurologic/sci.json'],
        'parkinson':   ['neurologic/parkinson.json'],
        'peripheral':  ['neurologic/peripheral.json']
      },
      'orthopedic': {
        'acl':       ['orthopedic/acl-reconstruction.json'],
        'meniscus':  ['orthopedic/meniscus.json'],
        'rotator':   ['orthopedic/rotator-cuff.json'],
        'thr':       ['orthopedic/thr.json'],
        'tkr':       ['orthopedic/tkr.json']
      },
      'cardiopulmonary': {
        'copd':        ['cardiopulmonary/copd.json'],
        'mi':          ['cardiopulmonary/mi.json'],
        'heartfailure': ['cardiopulmonary/heart-failure.json'],
        'cabg':        ['cardiopulmonary/cabg.json'],
        'postcovid':   ['cardiopulmonary/post-covid.json']
      }
    };

    if (fileMap[specialty] && fileMap[specialty][diagnosis]) {
      return fileMap[specialty][diagnosis];
    }

    // 兜底：返回该专科的默认模板列表
    const fallbackMap = {
      'neurologic':      ['neurologic/stroke.json'],
      'orthopedic':      ['orthopedic/acl-reconstruction.json'],
      'cardiopulmonary': ['cardiopulmonary/copd.json'],
      'pediatric':      ['pediatric/cerebral-palsy.json'],
      'geriatric':      ['geriatric/sarcopenia.json'],
      'critical-care':  ['critical-care/icu-weakness.json'],
      'speech':         ['speech/dysphagia.json']
    };
    return fallbackMap[specialty] || [];
  }

  // ========== 加载处方模板 JSON ==========
  async function loadPrescriptionTemplate(fileName) {
    const path = PRESCRIPTION_PATH_PREFIX + fileName;
    try {
      const resp = await fetch(path);
      if (!resp.ok) {
        console.warn('[Prescription] 模板加载失败:', path);
        return null;
      }
      return await resp.json();
    } catch (err) {
      console.warn('[Prescription] 模板加载异常:', path, err);
      return null;
    }
  }

  // ========== 根据描述性答案推断严重程度，定制处方 ==========
  function customizePrescription(prescriptions, answers, specialty) {
    return prescriptions.map(function (rx) {
      const customized = JSON.parse(JSON.stringify(rx));

      if (specialty === 'neurologic') {
        customizeNeurologic(customized, answers);
      } else if (specialty === 'orthopedic') {
        customizeOrthopedic(customized, answers);
      } else if (specialty === 'cardiopulmonary') {
        customizeCardiopulmonary(customized, answers);
      }

      return customized;
    });
  }

  // ========== 神经康复：根据描述性答案推断 FMA/Berg/Ashworth 范围 ==========
  function customizeNeurologic(rx, answers) {
    // --- 发病阶段 ---
    const onset = answers['onsetDays'] || '';
    let stage = 'chronic';
    if (onset === '0-7')     stage = 'acute';
    else if (onset === '8-30')  stage = 'subacute';
    else if (onset === '31-90') stage = 'early-recovery';
    else if (onset === '91-180') stage = 'recovery';

    if (stage === 'acute') {
      rx.frequency = '1-2次/周（床上训练为主）';
      rx.intensity = 'RPE 8-10（极轻度，以完成动作为目标）';
      rx.time = '10-15分钟/次';
      rx.precautions = rx.precautions || [];
      rx.precautions.push('急性期：避免患侧肩关节半脱位，使用吊带保护');
    } else if (stage === 'subacute') {
      rx.frequency = '3-4次/周';
      rx.intensity = 'RPE 11-13（轻度费力，可对话）';
      rx.time = '20-30分钟/次';
    } else {
      rx.frequency = rx.frequency || '4-5次/周';
      rx.intensity = rx.intensity || 'RPE 12-15（中度费力）';
      rx.time = rx.time || '30-45分钟/次';
    }

    // --- 根据上肢功能推断 FMA 上肢范围 ---
    const armRaise  = parseInt(answers['armRaise'], 10);
    const handGrasp = parseInt(answers['handGrasp'], 10);
    if (!isNaN(armRaise) && !isNaN(handGrasp)) {
      // 0=不能(0-1分), 1=部分(2-3分), 2=可完成(4-5分)
      // 粗略估算上肢 FMA：3个动作 × 每个0-5分 = 最多15分，加上其他项目估算
      const upperEstimate = (armRaise * 2) + (handGrasp * 2); // 非常粗略
      if (upperEstimate <= 2) {
        rx.notes = (rx.notes || '') + '\n📊 推测上肢 FMA 严重受损（<20分），建议以被动活动+功能性电刺激为主';
      } else if (upperEstimate <= 6) {
        rx.notes = (rx.notes || '') + '\n📊 推测上肢 FMA 中度受损（20-40分），重点训练伸手/抓握功能性动作';
      } else {
        rx.notes = (rx.notes || '') + '\n📊 推测上肢 FMA 轻度受损（40分以上），可加入任务特异性训练';
      }
    }

    // --- 根据行走能力推断 Berg 范围 ---
    const walkAbility = parseInt(answers['walkAbility'], 10);
    if (!isNaN(walkAbility)) {
      if (walkAbility === 0) {
        rx.notes = (rx.notes || '') + '\n⚠️ 无法独立行走：Berg 评分推测 <20分，跌倒风险高，训练时需全程保护';
      } else if (walkAbility === 1) {
        rx.notes = (rx.notes || '') + '\n⚠️ 需搀扶行走：Berg 评分推测 20-40分，加强平衡训练';
      } else {
        rx.notes = (rx.notes || '') + '\n✅ 可独立行走：Berg 评分推测 >40分，可进行动态平衡训练';
      }
    }

    // --- 根据肌张力推断 Ashworth 等级 ---
    const spasticity = parseInt(answers['spasticity'], 10);
    if (!isNaN(spasticity)) {
      if (spasticity === 0) {
        rx.notes = (rx.notes || '') + '\n💪 肌张力正常（Ashworth 0级），无需抗痉挛处理';
      } else if (spasticity === 1) {
        rx.notes = (rx.notes || '') + '\n💪 轻度痉挛（Ashworth 1-2级）：训练前可做被动牵拉 5-10分钟';
      } else {
        rx.notes = (rx.notes || '') + '\n💪 明显痉挛（Ashworth 3-4级）：建议先处理痉挛（冷敷/药物），再开始训练';
        rx.precautions = rx.precautions || [];
        rx.precautions.push('明显痉挛：避免快速牵拉，使用缓慢持续性牵拉');
      }
    }

    // --- Red Flags 拦截 ---
    const redFlags = answers['redFlags'] || [];
    if (Array.isArray(redFlags) && redFlags.length > 0 && !redFlags.includes('none')) {
      rx.precautions = rx.precautions || [];
      rx.precautions.push('⚠️ 存在红旗症状（' + redFlags.join('、') + '），请先就医排除禁忌后再训练');
    }
  }

  // ========== 骨科康复：根据描述性答案推断 ROM/疼痛/负重阶段 ==========
  function customizeOrthopedic(rx, answers) {
    // --- 术后阶段 ---
    const weeks = answers['postOpWeeks'] || '';
    if (weeks === '0-2') {
      rx.frequency = '每日多次（每次5-10分钟）';
      rx.intensity = '无痛范围内，RPE 8-10';
      rx.time = '5-10分钟/次，每日3-5次';
      rx.notes = (rx.notes || '') + '\n🩹 术后<2周：仅做等长收缩、踝泵、直腿抬高；禁止主动屈膝>90°（ACL）或髋关节屈曲>90°（THR）';
      rx.precautions = rx.precautions || [];
      rx.precautions.push('术后早期：严格遵医嘱负重限制（部分负重/非负重）');
    } else if (weeks === '3-6') {
      rx.frequency = '3-4次/周';
      rx.intensity = 'RPE 10-12（轻度）';
      rx.time = '20-30分钟/次';
      rx.notes = (rx.notes || '') + '\n🩹 术后3-6周：开始活动度训练，ACL 患者避免开链伸膝>30°';
    } else if (weeks === '7-12') {
      rx.frequency = '4-5次/周';
      rx.intensity = 'RPE 12-14（中度）';
      rx.time = '30-45分钟/次';
      rx.notes = (rx.notes || '') + '\n🩹 术后7-12周：开始轻抗阻训练，重量≤30%体重';
    } else if (weeks === '12+') {
      rx.frequency = '4-5次/周';
      rx.intensity = 'RPE 13-16（中高强度）';
      rx.time = '45-60分钟/次';
      rx.notes = (rx.notes || '') + '\n🩹 术后≥12周：可开始跑跳前筛查，逐步返运动';
    }

    // --- 根据伸直/屈曲情况调整 ---
    const canStraighten = parseInt(answers['canStraighten'], 10);
    const canFlex = parseInt(answers['canFlex'], 10);
    if (!isNaN(canStraighten) && canStraighten === 0) {
      rx.precautions = rx.precautions || [];
      rx.precautions.push('伸直受限：训练前需加做持续性牵拉，目标伸直缺失<5°');
    }
    if (!isNaN(canFlex) && canFlex === 0) {
      rx.notes = (rx.notes || '') + '\n📐 屈曲严重受限（<90°）：优先改善活动度，暂缓抗阻训练';
    }

    // --- 根据疼痛调整强度 ---
    const vasRest = parseInt(answers['vasRest'], 10);
    const vasMotion = parseInt(answers['vasMotion'], 10);
    if (!isNaN(vasMotion) && vasMotion >= 4) {
      rx.intensity = 'RPE 8-10（轻度，疼痛限制）';
      rx.precautions = rx.precautions || [];
      rx.precautions.push('活动时疼痛 VAS ≥4分：降低训练强度，必要时冰敷后训练');
    }

    // --- 根据行走辅助工具调整 ---
    const walkAid = answers['walkAid'] || '';
    if (walkAid === 'nonWeight') {
      rx.precautions = rx.precautions || [];
      rx.precautions.push('目前不能负重：严格遵医嘱，做非负重训练（如卧位直腿抬高、踝泵）');
    }
  }

  // ========== 心肺康复：根据描述性答案推断 6MWD/NYHA/RPE ==========
  function customizeCardiopulmonary(rx, answers) {
    // --- 根据连续行走时间推断 6MWD 范围 ---
    const walkTime = parseInt(answers['walkTime'], 10);
    if (!isNaN(walkTime)) {
      // 0=<3min (~<150m), 1=3-10min (~150-300m), 2=10-30min (~300-450m), 3=>30min (~>450m)
      if (walkTime === 0) {
        rx.intensity = 'RPE 9-11（非常轻度）';
        rx.time = '5-10分钟/次，每日多次';
        rx.notes = (rx.notes || '') + '\n🫁 推测 6MWD <150m（重度心肺受限），从 2分钟步行测试开始';
        rx.precautions = rx.precautions || [];
        rx.precautions.push('重度受限：运动前后监测 SpO₂，<88% 需吸氧');
      } else if (walkTime === 1) {
        rx.intensity = 'RPE 11-13（轻度）';
        rx.time = '10-20分钟/次';
        rx.notes = (rx.notes || '') + '\n🫁 推测 6MWD 150-300m，可进行间歇训练（运动3分钟/休息1分钟）';
      } else if (walkTime === 2) {
        rx.intensity = 'RPE 12-14（中度）';
        rx.time = '20-40分钟/次';
        rx.notes = (rx.notes || '') + '\n🫁 推测 6MWD 300-450m，可进行连续有氧运动';
      } else {
        rx.intensity = 'RPE 13-16（中高强度）';
        rx.time = '30-60分钟/次';
        rx.notes = (rx.notes || '') + '\n🫁 推测 6MWD >450m，功能状态良好，可按正常处方训练';
      }
    }

    // --- 根据 NYHA 分级调整强度 ---
    const nyha = answers['nyha'] || '';
    if (nyha === 'III' || nyha === 'IV') {
      rx.intensity = 'RPE 9-11（轻度，以免呼吸困难为限）';
      rx.frequency = '每日多次，每次短时长';
      rx.precautions = rx.precautions || [];
      rx.precautions.push('NYHA III-IV级：避免 Valsalva 动作，运动中间歇休息');
    } else if (nyha === 'II') {
      rx.intensity = 'RPE 11-13（轻度费力）';
    }

    // --- 根据静息呼吸困难程度调整 ---
    const borgRest = parseInt(answers['borgRest'], 10);
    if (!isNaN(borgRest) && borgRest >= 3) {
      rx.precautions = rx.precautions || [];
      rx.precautions.push('静息时即有呼吸困难（Borg ≥3）：建议先医疗评估，暂缓高强度训练');
    }

    // --- 根据指氧情况调整 ---
    const spo2 = answers['spo2Check'] || '';
    if (spo2 === 'low') {
      rx.precautions = rx.precautions || [];
      rx.precautions.push('静息 SpO₂ <92%：运动时需监测血氧，必要时吸氧下训练');
    }
  }

  // ========== 生成通用处方（无模板时） ==========
  function generateGenericPrescription(specialty, answers) {
    const generic = {
      title_zh: '通用运动处方（参考）',
      title_en: 'General Exercise Prescription (Reference)',
      frequency: '3-5次/周',
      intensity: 'RPE 12-14（有点费力）',
      time: '20-40分钟/次',
      type: '有氧运动 + 柔韧性训练',
      volume: '每周≥150分钟中等强度',
      progression: '每1-2周评估一次，逐步进阶',
      precautions: ['如出现胸痛、头晕请立即停止', '运动前测量血压/心率', '在康复师指导下进行'],
      evidence_id: null
    };
    return [generic];
  }

  // ========== 渲染处方卡片 ==========
  function renderPrescriptions(prescriptions, specialty, answers) {
    let container = document.getElementById(RESULT_CONTAINER_ID);
    if (!container) {
      const formContainer = document.getElementById('assessment-form-container');
      if (formContainer && formContainer.parentNode) {
        container = document.createElement('div');
        container.id = RESULT_CONTAINER_ID;
        container.style.marginTop = '32px';
        formContainer.parentNode.appendChild(container);
      }
    }
    if (!container) return;

    let html = '';
    html += '<div class="prescription-result">';
    html += '  <h2>🏋️ 您的个性化运动处方</h2>';
    html += '  <p style="color:#777; font-size:0.9em;">基于您的评估结果生成，遵循 FITT-VP 原则。处方仅供参考，请在康复师指导下执行。</p>';

    prescriptions.forEach(function (rx, idx) {
      html += renderOnePrescriptionCard(rx, idx);
    });

    html += '  <div style="margin-top:24px; padding:16px; background:#fff3e0; border-left:4px solid #ff9800; border-radius:4px;">';
    html += '    <p style="color:#e65100; font-weight:600;">⚠️ 重要提醒</p>';
    html += '    <ul style="color:#5d4037; margin:8px 0 0 0;">';
    html += '      <li>本处方<strong>不能替代</strong>专业康复师的面对面评估</li>';
    html += '      <li>如出现<strong>红旗症状</strong>（胸痛、面瘫、肢体无力、剧烈头痛），请<strong>立即就医</strong></li>';
    html += '      <li>训练时疼痛评分（VAS）不应超过<strong>3分</strong></li>';
    html += '    </ul>';
    html += '  </div>';

    html += '</div>';
    container.innerHTML = html;
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
  }

  // ========== 渲染单张处方卡片 ==========
  function renderOnePrescriptionCard(rx, idx) {
    let html = '';
    html += '<div class="prescription-card">';
    html += '  <h3>' + (idx + 1) + '. ' + escapeHtml(rx.title_zh || rx.title_en || '训练项目') + '</h3>';

    // FITT-VP 表格
    html += '  <table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:0.95em;">';
    html += '    <tr style="background:#e8eaf6;"><th style="padding:8px 12px; text-align:left;">要素</th><th style="padding:8px 12px; text-align:left;">内容</th></tr>';

    const fittvpRows = [
      ['F - Frequency（频次）', rx.frequency || '待评估后确定'],
      ['I - Intensity（强度）', rx.intensity || '待评估后确定'],
      ['T - Time（时间）', rx.time || '待评估后确定'],
      ['T - Type（类型）', rx.type || '待评估后确定'],
      ['V - Volume（总量）', rx.volume || '待评估后确定'],
      ['P - Progression（渐进）', rx.progression || '每1-2周评估进阶']
    ];

    fittvpRows.forEach(function (row, idx) {
      const bg = idx % 2 === 0 ? '#fafafa' : '#fff';
      html += '    <tr style="background:' + bg + ';"><td style="padding:6px 12px; font-weight:600;">' + escapeHtml(row[0]) + '</td><td style="padding:6px 12px;">' + escapeHtml(row[1]) + '</td></tr>';
    });

    html += '  </table>';

    // 训练内容列表
    if (rx.exercises && rx.exercises.length > 0) {
      html += '  <div style="margin:12px 0;"><strong>训练内容：</strong><ul style="margin:6px 0 0 0;">';
      rx.exercises.forEach(function (ex) {
        html += '    <li>' + escapeHtml(ex.name_zh || ex.name_en || '') + ' — ' + escapeHtml(ex.description_zh || ex.description_en || '') + '</li>';
      });
      html += '  </ul></div>';
    }

    // 循证证据标签
    if (rx.evidence_id) {
      html += renderEvidenceTag(rx.evidence_id);
    }

    // 注意事项
    if (rx.precautions && rx.precautions.length > 0) {
      html += '  <div style="margin-top:12px; padding:8px 12px; background:#fce4ec; border-radius:4px; font-size:0.9em; color:#b71c1c;">';
      html += '    <strong>⚠️ 注意事项：</strong><ul style="margin:4px 0 0 0;">';
      rx.precautions.forEach(function (note) {
        html += '      <li>' + escapeHtml(note) + '</li>';
      });
      html += '    </ul></div>';
    }

    // 自定义注意事项
    if (rx.notes) {
      html += '  <div style="margin-top:8px; padding:8px 12px; background:#fff8e1; border-radius:4px; font-size:0.85em; color:#f57f17;">';
      html += escapeHtml(rx.notes).replace(/\n/g, '<br>');
      html += '  </div>';
    }

    html += '</div>';
    return html;
  }

  // ========== 渲染循证证据标签 ==========
  function renderEvidenceTag(evidenceId) {
    const ev = findEvidenceById(evidenceId);
    if (!ev) return '';

    let html = '';
    html += '<div style="margin-top:12px; padding:12px 16px; background:#e8eaf6; border-left:4px solid #3f51b5; border-radius:4px;">';
    html += '  <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">';
    html += '    <span style="font-size:1.1em;">🔬 科学依据</span>';
    html += '    <span class="evidence-badge evidence-badge-' + (ev.evidence_level || 'ii').toLowerCase().replace(' ', '') + '">' + escapeHtml(ev.evidence_level || 'III') + '</span>';
    html += '  </div>';
    html += '  <div style="font-size:0.9em; color:#333;">';
    html += '    <p style="margin:4px 0;"><strong>来源：</strong>' + escapeHtml(ev.title_zh || ev.title_en || '') + '</p>';
    if (ev.main_finding_zh || ev.main_finding_en) {
      html += '    <p style="margin:4px 0;">' + escapeHtml(ev.main_finding_zh || ev.main_finding_en || '') + '</p>';
    }
    if (ev.doi) {
      html += '    <p style="margin:4px 0;"><a href="https://doi.org/' + escapeHtml(ev.doi) + '" target="_blank" style="color:#1565c0;">查看文献 DOI → ' + escapeHtml(ev.doi) + '</a></p>';
    }
    if (ev.url && !ev.doi) {
      html += '    <p style="margin:4px 0;"><a href="' + escapeHtml(ev.url) + '" target="_blank" style="color:#1565c0;">查看原文 →</a></p>';
    }
    html += '  </div></div>';
    return html;
  }

  // ========== 根据 evidence_id 查找证据 ==========
  function findEvidenceById(id) {
    const all = [].concat(
      (evidenceData.guidelines || []),
      (evidenceData.systematic_reviews || []),
      (evidenceData.rct_studies || [])
    );
    return all.find(function (ev) { return ev.id === id; }) || null;
  }

  // ========== UI 工具函数 ==========
  function showPrescriptionLoading(msg) {
    let container = document.getElementById(RESULT_CONTAINER_ID);
    if (container) {
      container.innerHTML = '<p style="color:#777;">' + escapeHtml(msg || '生成中...') + '</p>';
      container.style.display = 'block';
    }
  }

  function showPrescriptionError(msg) {
    let container = document.getElementById(RESULT_CONTAINER_ID);
    if (container) {
      container.innerHTML = '<p style="color:#d32f2f;">⚠️ ' + escapeHtml(msg) + '</p>';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

})();
