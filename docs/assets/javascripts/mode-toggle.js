/**
 * mode-toggle.js - 患者模式 / 专业模式切换
 *
 * 功能：
 * 1. 读取 MkDocs Material 的 palette 切换事件
 * 2. 患者模式（default / light）：隐藏专家内容，显示通俗解释
 * 3. 专业模式（slate / dark）：显示完整循证信息、参考文献、专业术语
 * 4. 持久化用户选择（localStorage）
 */

(function () {
  'use strict';

  // ========== 配置 ==========
  const STORAGE_KEY = 'rehab-guide-mode';
  const PROFESSIONAL_CLASS = 'professional-mode';
  const PATIENT_CLASS = 'patient-mode';

  // ========== 初始化 ==========
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // 恢复上次选择
    const savedMode = localStorage.getItem(STORAGE_KEY);
    if (savedMode === 'professional') {
      enableProfessionalMode(false);
    } else {
      enablePatientMode(false);
    }

    // 监听 MkDocs Material palette 切换
    document.addEventListener('palette', function (e) {
      if (!e.detail) return;
      const scheme = e.detail.scheme;
      if (scheme === 'slate') {
        enableProfessionalMode(true);
      } else {
        enablePatientMode(true);
      }
    });
  }

  // ========== 切换到：患者模式 ==========
  function enablePatientMode(save) {
    document.body.classList.remove(PROFESSIONAL_CLASS);
    document.body.classList.add(PATIENT_CLASS);

    // 隐藏专业内容
    hideElementsBySelector('.professional-only');
    // 显示患者内容
    showElementsBySelector('.patient-only');

    // 替换所有 mode-label 文字
    updateModeLabels('patient');

    if (save !== false) {
      localStorage.setItem(STORAGE_KEY, 'patient');
    }

    console.log('[ModeToggle] 已切换到：患者模式');
  }

  // ========== 切换到：专业模式 ==========
  function enableProfessionalMode(save) {
    document.body.classList.remove(PATIENT_CLASS);
    document.body.classList.add(PROFESSIONAL_CLASS);

    // 显示专业内容
    showElementsBySelector('.professional-only');
    // 隐藏患者内容（可选，保留也可）
    hideElementsBySelector('.patient-only');

    // 替换所有 mode-label 文字
    updateModeLabels('professional');

    if (save !== false) {
      localStorage.setItem(STORAGE_KEY, 'professional');
    }

    console.log('[ModeToggle] 已切换到：专业模式');
  }

  // ========== 辅助：隐藏 / 显示元素 ==========
  function hideElementsBySelector(selector) {
    var els = document.querySelectorAll(selector);
    els.forEach(function (el) {
      el.style.display = 'none';
    });
  }

  function showElementsBySelector(selector) {
    var els = document.querySelectorAll(selector);
    els.forEach(function (el) {
      // 根据标签类型恢复默认 display
      var tag = el.tagName.toLowerCase();
      if (tag === 'span' || tag === 'strong' || tag === 'a') {
        el.style.display = 'inline';
      } else if (tag === 'div' || tag === 'details' || tag === 'section') {
        el.style.display = 'block';
      } else {
        el.style.display = '';
      }
    });
  }

  function updateModeLabels(mode) {
    var labels = document.querySelectorAll('.mode-label');
    labels.forEach(function (el) {
      if (mode === 'patient') {
        el.textContent = el.getAttribute('data-patient-label') || '患者模式';
      } else {
        el.textContent = el.getAttribute('data-professional-label') || '专业模式';
      }
    });
  }

  // ========== 暴露 API ==========
  window.ModeToggle = {
    toPatient: function () { enablePatientMode(true); },
    toProfessional: function () { enableProfessionalMode(true); },
    getCurrentMode: function () {
      return document.body.classList.contains(PROFESSIONAL_CLASS)
        ? 'professional'
        : 'patient';
    }
  };

})();
