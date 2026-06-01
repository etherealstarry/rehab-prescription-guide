/**
 * redflags.js - 红旗症状（Red Flags）拦截系统
 * 
 * 功能：
 * 1. 在用户输入症状后，先匹配 redflags.json 中的关键词
 * 2. 命中红旗症状 → 弹出红色警告，阻止继续导诊
 * 3. 未命中 → 进入正常导诊流程
 * 
 * 安全底线：医疗健康类网站必须第一时间排查急危重症。
 */

(function () {
  'use strict';

  // ========== 配置 ==========
  const REDFLAGS_JSON_PATH = '../assets/data/redflags.json';
  const SEARCH_INPUT_SELECTOR = '#symptom-input';
  const RESULT_CONTAINER_SELECTOR = '#symptom-result';

  // ========== 状态 ==========
  let redFlagsData = [];

  // ========== 初始化 ==========
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    loadRedFlagsData();
    bindEvents();
  }

  // ========== 加载 Red Flags 数据 ==========
  async function loadRedFlagsData() {
    try {
      const resp = await fetch(REDFLAGS_JSON_PATH);
      if (!resp.ok) throw new Error('无法加载 redflags.json');
      const data = await resp.json();
      redFlagsData = data.red_flags || [];
      console.log('[RedFlags] 已加载', redFlagsData.length, '条红旗症状');
    } catch (err) {
      console.warn('[RedFlags] 加载失败，将使用内置备用数据', err);
      redFlagsData = getFallbackRedFlags();
    }
  }

  // ========== 绑定事件 ==========
  function bindEvents() {
    const input = document.querySelector(SEARCH_INPUT_SELECTOR);
    const submitBtn = document.querySelector('#symptom-submit');

    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          checkRedFlags(input.value);
        }
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const val = input ? input.value : '';
        checkRedFlags(val);
      });
    }
  }

  // ========== 核心：检查红旗症状 ==========
  function checkRedFlags(userInput) {
    if (!userInput || !userInput.trim()) {
      showResult('<p style="color:#777;">请输入症状描述。</p>');
      return;
    }

    const inputLower = userInput.toLowerCase();
    const matchedFlags = [];

    redFlagsData.forEach(function (flag) {
      const keywordsZh = flag.symptom_keywords_zh || [];
      const keywordsEn = flag.symptom_keywords_en || [];
      const allKeywords = keywordsZh.concat(keywordsEn);

      const hit = allKeywords.some(function (kw) {
        return inputLower.includes(kw.toLowerCase());
      });

      if (hit) {
        matchedFlags.push(flag);
      }
    });

    if (matchedFlags.length > 0) {
      showRedFlagWarning(matchedFlags, userInput);
    } else {
      showNoRedFlag(userInput);
    }
  }

  // ========== 显示红旗警告 ==========
  function showRedFlagWarning(flags, userInput) {
    let html = '';
    html += '<div class="redflag-warning">';
    html += '  <div class="redflag-title">⚠️ 红旗警告：检测到急危重症相关症状！</div>';
    html += '  <div style="margin:12px 0;">';
    html += '    <p><strong>您输入的症状：</strong>' + escapeHtml(userInput) + '</p>';
    html += '  </div>';

    flags.forEach(function (flag) {
      const warningText = flag.warning_zh || flag.warning_en || '请立即就医！';
      html += '<div style="background:#fff; border-left:4px solid #d32f2f; padding:12px 16px; margin:12px 0; border-radius:4px;">';
      html += '  <p style="color:#b71c1c; font-weight:600; margin:0 0 8px 0;">' + escapeHtml(warningText) + '</p>';
      if (flag.related_conditions && flag.related_conditions.length > 0) {
        html += '  <p style="margin:4px 0; color:#555;">可能相关：' + flag.related_conditions.map(function (c) { return '<code>' + escapeHtml(c) + '</code>'; }).join('、') + '</p>';
      }
      if (flag.source) {
        html += '  <p style="margin:4px 0; font-size:0.85em; color:#888;">来源：' + escapeHtml(flag.source) + '</p>';
      }
      html += '</div>';
    });

    html += '<div style="margin-top:16px; padding:12px; background:#ffebee; border-radius:4px;">';
    html += '  <p style="color:#b71c1c; font-weight:700;">🚨 请立即采取行动：</p>';
    html += '  <ul style="color:#c62828; margin:8px 0 0 0;">';
    html += '    <li>拨打<strong>急救电话</strong>（中国：120；美国：911）</li>';
    html += '    <li>或立即前往<strong>最近的急诊科</strong></li>';
    html += '    <li>在等待救援时<strong>保持安静</strong>，不要自行走动</li>';
    html += '  </ul>';
    html += '</div>';

    html += '<div style="margin-top:16px;">';
    html += '  <p style="color:#555;">如果您认为这是误判，且目前<strong>没有任何不适</strong>：</p>';
    html += '  <button id="force-continue-btn" style="margin-top:8px; padding:8px 16px; background:#fff; color:#d32f2f; border:1px solid #d32f2f; border-radius:4px; cursor:pointer;">我已确认无急症，仍需查看导诊 →</button>';
    html += '</div>';

    html += '</div>';

    showResult(html);

    // 绑定"强制继续"按钮（不推荐，但留给用户选择）
    var forceBtn = document.querySelector('#force-continue-btn');
    if (forceBtn) {
      forceBtn.addEventListener('click', function () {
        showNoRedFlag(userInput);
      });
    }
  }

  // ========== 未命中红旗 → 正常导诊 ==========
  function showNoRedFlag(userInput) {
    let html = '';
    html += '<div style="background:#e8f5e9; border-left:4px solid #2e7d32; padding:16px; border-radius:4px; margin:16px 0;">';
    html += '  <p style="color:#1b5e20; font-weight:600;">✅ 未检测到红旗症状（急危重症征兆）</p>';
    html += '  <p style="color:#33691e; margin:8px 0 4px 0;">您输入的症状：<code>' + escapeHtml(userInput) + '</code></p>';
    html += '  <p style="color:#555; font-size:0.9em;">接下来将为您展示可能的康复问题......（此功能持续开发中）</p>';
    html += '</div>';
    showResult(html);
  }

  // ========== 工具函数 ==========
  function showResult(html) {
    var container = document.querySelector(RESULT_CONTAINER_SELECTOR);
    if (container) {
      container.innerHTML = html;
      container.style.display = 'block';
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ========== 备用红旗数据（JSON 加载失败时使用）==========
  function getFallbackRedFlags() {
    return [
      {
        id: 'rf-001',
        symptom_keywords_zh: ['胸痛', '胸闷', '胸部压迫感', '压榨性疼痛'],
        symptom_keywords_en: ['chest pain', 'chest pressure', 'angina'],
        urgency: 'emergency',
        warning_zh: '⚠️ 红旗警告：胸痛可能是心梗、肺栓塞等急危重症表现，请立即拨打急救电话或前往最近的急诊科！',
        warning_en: '⚠️ RED FLAG: Chest pain may indicate myocardial infarction or pulmonary embolism. Call emergency services immediately!',
        related_conditions: ['心梗', '肺栓塞', '主动脉夹层'],
        source: 'AHA/ACC 2023 Guideline'
      },
      {
        id: 'rf-002',
        symptom_keywords_zh: ['突然面瘫', '一侧无力', '言语不清', 'face drooping'],
        symptom_keywords_en: ['face drooping', 'arm weakness', 'speech difficulty'],
        urgency: 'emergency',
        warning_zh: '⚠️ 红旗警告：疑似脑卒中（中风）急性期，请立即就医！记住 FAST 原则！',
        warning_en: '⚠️ RED FLAG: Suspected stroke! Seek immediate medical attention. Remember FAST!',
        related_conditions: ['脑卒中急性期'],
        source: 'American Stroke Association 2021'
      }
    ];
  }

})();
