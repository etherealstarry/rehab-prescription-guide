/**
 * assessment.js - 多维度评估问卷渲染引擎
 *
 * 功能：
 * 1. 根据用户选择的亚专科，动态加载对应的 assessment JSON
 * 2. 渲染评估表单（select / number / multiselect）
 * 3. 收集评估结果，传递给处方生成引擎
 * 4. 在提交前再次检查 Red Flags
 */

(function () {
  'use strict';

  // ========== 配置 ==========
  const ASSESSMENT_PATH_PREFIX = '../assets/data/assessments/';
  const REDFLAGS_PATH = '../assets/data/redflags.json';
  const FORM_CONTAINER_ID = 'assessment-form-container';
  const RESULT_CONTAINER_ID = 'prescription-result-container';

  // ========== 状态 ==========
  let currentSpecialty = null;
  let currentAssessmentData = null;
  let redFlagsData = [];

  // ========== 初始化 ==========
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    bindSpecialtyButtons();
    loadRedFlagsData();
  }

  // ========== 绑定专科选择按钮 ==========
  function bindSpecialtyButtons() {
    var buttons = document.querySelectorAll('[data-specialty]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var specialty = this.getAttribute('data-specialty');
        loadAssessment(specialty);
      });
    });
  }

  // ========== 加载 Red Flags 数据 ==========
  async function loadRedFlagsData() {
    try {
      var resp = await fetch(REDFLAGS_PATH);
      if (resp.ok) {
        var data = await resp.json();
        redFlagsData = data.red_flags || [];
      }
    } catch (err) {
      console.warn('[Assessment] RedFlags 加载失败', err);
    }
  }

  // ========== 加载评估问卷 JSON ==========
  async function loadAssessment(specialty) {
    currentSpecialty = specialty;
    var fileName = specialty + '.json';
    var path = ASSESSMENT_PATH_PREFIX + fileName;

    showLoading('正在加载评估问卷...');

    try {
      var resp = await fetch(path);
      if (!resp.ok) throw new Error('加载失败: ' + path);
      currentAssessmentData = await resp.json();
      renderAssessmentForm(currentAssessmentData);
    } catch (err) {
      showError('无法加载评估问卷：' + err.message);
      console.error('[Assessment] 加载失败', err);
    }
  }

  // ========== 渲染评估表单 ==========
  function renderAssessmentForm(data) {
    var container = getContainer(FORM_CONTAINER_ID);
    if (!container) return;

    var html = '';
    html += '<div class="assessment-form">';
    html += '  <h2>📋 ' + escapeHtml(data.specialty_name_zh || data.specialty_name_en || '') + ' - 标准化评估</h2>';
    html += '  <p style="color:#777; font-size:0.9em;">请尽可能准确地填写以下内容，带 * 的为必填项。</p>';

    // Red Flags 再次提醒
    html += '  <div class="redflag-warning" style="margin:16px 0;">';
    html += '    <div class="redflag-title">⚠️ 开始前请确认</div>';
    html += '    <p>如出现 <strong>胸痛、面瘫、肢体无力、剧烈头痛</strong> 等症状，请 <strong>立即就医</strong>，不要继续填写此问卷。</p>';
    html += '  </div>';

    html += '  <form id="assessment-form">';

    (data.questions || []).forEach(function (q, idx) {
      html += renderQuestion(q, idx);
    });

    html += '    <div style="margin-top:24px; padding-top:16px; border-top:1px solid #eee;">';
    html += '      <button type="submit" style="padding:10px 24px; background:var(--md-primary-fg-color,#1976d2); color:#fff; border:none; border-radius:4px; font-size:1em; cursor:pointer;">📊 生成运动处方</button>';
    html += '      <button type="reset" style="margin-left:12px; padding:10px 20px; background:#eee; color:#333; border:none; border-radius:4px; cursor:pointer;">重置</button>';
    html += '    </div>';
    html += '  </form>';
    html += '</div>';

    container.innerHTML = html;
    container.style.display = 'block';

    // 绑定表单提交
    var form = document.getElementById('assessment-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleFormSubmit(data);
      });
    }

    // 滚动到表单
    container.scrollIntoView({ behavior: 'smooth' });
  }

  // ========== 渲染单个问题 ==========
  function renderQuestion(q, idx) {
    var html = '';
    html += '<div class="assessment-question">';
    html += '  <label for="' + escapeHtml(q.id) + '">' + (idx + 1) + '. ' + escapeHtml(q.question_zh || q.question_en || '') + '</label>';

    if (q.hint_zh) {
      html += '  <div class="hint">' + escapeHtml(q.hint_zh) + '</div>';
    }

    var fieldName = q.id;

    if (q.type === 'select') {
      html += '  <select name="' + fieldName + '" id="' + fieldName + '" required style="padding:8px 12px; border:1px solid #ccc; border-radius:4px; font-size:1em; min-width:200px;">';
      html += '    <option value="">-- 请选择 --</option>';
      (q.options || []).forEach(function (opt) {
        html += '    <option value="' + escapeHtml(String(opt.value)) + '">' + escapeHtml(opt.label_zh || opt.label_en || '') + '</option>';
      });
      html += '  </select>';
    }

    if (q.type === 'number') {
      html += '  <input type="number" name="' + fieldName + '" id="' + fieldName + '" required style="padding:8px 12px; border:1px solid #ccc; border-radius:4px; font-size:1em; width:200px;" />';
      if (q.unit_zh) {
        html += '  <span style="margin-left:8px; color:#777;">' + escapeHtml(q.unit_zh) + '</span>';
      }
    }

    if (q.type === 'multiselect') {
      html += '  <div class="multiselect-container" style="margin-top:8px;">';
      (q.options || []).forEach(function (opt) {
        html += '    <label style="display:block; margin:4px 0; cursor:pointer;">';
        html += '      <input type="checkbox" name="' + fieldName + '" value="' + escapeHtml(String(opt.value)) + '" /> ';
        html += '      ' + escapeHtml(opt.label_zh || opt.label_en || '');
        html += '    </label>';
      });
      html += '  </div>';
    }

    html += '</div>';
    return html;
  }

  // ========== 处理表单提交 ==========
  function handleFormSubmit(data) {
    // 收集答案
    var form = document.getElementById('assessment-form');
    var formData = new FormData(form);
    var answers = {};

    data.questions.forEach(function (q) {
      if (q.type === 'multiselect') {
        var values = formData.getAll(q.id);
        answers[q.id] = values.length > 0 ? values : ['none'];
      } else {
        var val = formData.get(q.id);
        answers[q.id] = val || 'not-assessed';
      }
    });

    console.log('[Assessment] 评估结果：', answers);

    // 简单 Red Flags 二次检查（基于答案中的红旗关键词）
    var redFlagHit = checkAnswersForRedFlags(answers);
    if (redFlagHit) {
      alert('⚠️ 根据您的回答，检测到可能的急危重症征兆，请立即咨询专业医师！');
      return;
    }

    // 传递结果给处方生成引擎
    if (window.PrescriptionEngine) {
      window.PrescriptionEngine.generate(data.specialty, answers);
    } else {
      console.warn('[Assessment] PrescriptionEngine 未加载');
      showPrescriptionPlaceholder(data.specialty, answers);
    }
  }

  // ========== 基于答案二次检查 Red Flags ==========
  function checkAnswersForRedFlags(answers) {
    // 简单检查：如果用户在 multiselect 中选择了红旗相关选项
    var redFlagKeywords = ['chest-pain', 'acute', 'severe-pain', 'unable', 'confusion', 'fever'];
    var hit = false;
    Object.keys(answers).forEach(function (key) {
      var val = answers[key];
      var vals = Array.isArray(val) ? val : [val];
      vals.forEach(function (v) {
        if (redFlagKeywords.indexOf(v) !== -1) hit = true;
      });
    });
    return hit;
  }

  // ========== 显示处方占位（PrescriptionEngine 未就绪时）==========
  function showPrescriptionPlaceholder(specialty, answers) {
    var container = getContainer(RESULT_CONTAINER_ID);
    if (!container) {
      // 如果结果容器不存在，创建一个
      var formContainer = getContainer(FORM_CONTAINER_ID);
      if (formContainer && formContainer.parentNode) {
        var resultDiv = document.createElement('div');
        resultDiv.id = RESULT_CONTAINER_ID;
        resultDiv.style.marginTop = '32px';
        formContainer.parentNode.appendChild(resultDiv);
        container = resultDiv;
      }
    }

    if (container) {
      var html = '';
      html += '<div class="prescription-card">';
      html += '  <h2>🏃 运动处方（预览）</h2>';
      html += '  <p style="color:#777;">专科：<code>' + escapeHtml(specialty) + '</code></p>';
      html += '  <p>评估结果已收集，处方生成引擎加载中......</p>';
      html += '  <details>';
      html += '    <summary>查看原始评估数据（调试用）</summary>';
      html += '    <pre style="background:#f5f5f5; padding:12px; border-radius:4px; font-size:0.85em; overflow:auto;">' + JSON.stringify(answers, null, 2) + '</pre>';
      html += '  </details>';
      html += '</div>';
      container.innerHTML = html;
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ========== 工具函数 ==========
  function getContainer(id) {
    return document.getElementById(id);
  }

  function showLoading(msg) {
    var container = getContainer(FORM_CONTAINER_ID);
    if (container) {
      container.innerHTML = '<p style="color:#777;">' + escapeHtml(msg || '加载中...') + '</p>';
      container.style.display = 'block';
    }
  }

  function showError(msg) {
    var container = getContainer(FORM_CONTAINER_ID);
    if (container) {
      container.innerHTML = '<p style="color:#d32f2f;">⚠️ ' + escapeHtml(msg) + '</p>';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  // ========== 暴露 API ==========
  window.AssessmentEngine = {
    load: loadAssessment,
    getAnswers: function () { return currentAssessmentData; }
  };

})();
