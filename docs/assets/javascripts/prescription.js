/**
 * prescription.js - 运动处方自动生成引擎
 *
 * 功能：
 * 1. 接收评估结果（来自 assessment.js）
 * 2. 匹配 prescriptions/*.json 中的处方模板
 * 3. 根据评估结果填充模板参数，生成个性化 FITT-VP 处方
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
    // 暴露 API 给 assessment.js 调用
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
      // 根据专科 + 评估结果，选择对应的处方模板文件
      const templateFiles = getTemplateFiles(specialty, answers);
      let allPrescriptions = [];

      for (const file of templateFiles) {
        const template = await loadPrescriptionTemplate(file);
        if (template && template.prescriptions) {
          // 根据 answers 过滤/定制处方
          const customized = customizePrescription(template.prescriptions, answers);
          allPrescriptions = allPrescriptions.concat(customized);
        }
      }

      if (allPrescriptions.length === 0) {
        // 没有匹配模板，生成通用处方
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
    const fileMap = {
      'neurologic': ['neurologic/stroke.json'],
      'orthopedic': ['orthopedic/acl-reconstruction.json'],
      'cardiopulmonary': ['cardiopulmonary/copd.json'],
      'pediatric': ['pediatric/cerebral-palsy.json'],
      'geriatric': ['geriatric/sarcopenia.json'],
      'critical-care': ['critical-care/icu-weakness.json'],
      'speech': ['speech/dysphagia.json']
    };

    // 根据答案进一步细化
    if (specialty === 'neurologic' && answers['n-q1']) {
      const condition = answers['n-q1'];
      return [`neurologic/${condition}.json`];
    }
    if (specialty === 'orthopedic' && answers['o-q1']) {
      const condition = answers['o-q1'];
      return [`orthopedic/${condition}.json`];
    }
    if (specialty === 'cardiopulmonary' && answers['c-q1']) {
      const condition = answers['c-q1'];
      return [`cardiopulmonary/${condition}.json`];
    }

    return fileMap[specialty] || [];
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

  // ========== 根据评估结果定制处方 ==========
  function customizePrescription(prescriptions, answers) {
    return prescriptions.map(function (rx) {
      const customized = JSON.parse(JSON.stringify(rx));

      // 根据恢复阶段调整强度和频次
      if (answers['n-q3']) {
        const stage = answers['n-q3'];
        if (stage === 'acute') {
          customized.frequency = '1-2次/周';
          customized.intensity = 'RPE 8-10（极轻度）';
          customized.time = '10-15分钟';
        } else if (stage === 'subacute') {
          customized.frequency = '3-4次/周';
          customized.intensity = 'RPE 11-13（轻度费力）';
          customized.time = '20-30分钟';
        } else if (stage === 'chronic') {
          customized.frequency = rx.frequency || '4-5次/周';
          customized.intensity = rx.intensity || 'RPE 12-15';
          customized.time = rx.time || '30-45分钟';
        }
      }

      // 根据术后时间调整（骨科）
      if (answers['o-q2']) {
        const weeks = parseInt(answers['o-q2'], 10);
        if (!isNaN(weeks)) {
          if (weeks < 2) {
            customized.notes = (customized.notes || '') + '\n⚠️ 术后<2周：仅做等长收缩和踝泵，禁止主动屈膝>90°。';
          } else if (weeks >= 6) {
            customized.notes = (customized.notes || '') + '\n✅ 术后≥6周：可开始开链训练，重量≤30%体重。';
          }
        }
      }

      // 根据疼痛评分调整
      if (answers['o-q4']) {
        const painLevel = parseInt(answers['o-q4'], 10);
        if (painLevel === 2 || painLevel === 3) {
          customized.notes = (customized.notes || '') + '\n⚠️ 疼痛评分较高：建议降低强度，VAS>3分暂停抗阻训练。';
        }
      }

      return customized;
    });
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
      // 在 assessment form 后面插入结果容器
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
    html += '  <h2>🏋 您的个性化运动处方</h2>';
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

    fittvpRows.forEach(function (row, i) {
      const bg = i % 2 === 0 ? '#fafafa' : '#fff';
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
