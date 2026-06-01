/**
 * evidence.js - 循证证据展示模块
 *
 * 功能：
 * 1. 加载 evidence-database.json（三层级证据库）
 * 2. 根据 evidence_id 查找并返回格式化证据卡片 HTML
 * 3. 在处方卡片中渲染"科学依据"标签
 * 4. 提供"点击展开/折叠"交互
 */

(function () {
  'use strict';

  // ========== 配置 ==========
  const EVIDENCE_JSON_PATH = '../assets/data/evidence/evidence-database.json';

  // ========== 状态 ==========
  let evidenceDB = { guidelines: [], systematic_reviews: [], rct_studies: [] };

  // ========== 初始化 ==========
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    loadEvidenceData();
    bindEvidenceToggles();
  }

  // ========== 加载证据数据库 ==========
  async function loadEvidenceData() {
    try {
      const resp = await fetch(EVIDENCE_JSON_PATH);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      evidenceDB = await resp.json();
      console.log('[Evidence] 证据库加载完成', {
        guidelines: (evidenceDB.guidelines || []).length,
        reviews: (evidenceDB.systematic_reviews || []).length,
        rcts: (evidenceDB.rct_studies || []).length
      });
    } catch (err) {
      console.warn('[Evidence] JSON 加载失败，使用空库', err.message);
      evidenceDB = { guidelines: [], systematic_reviews: [], rct_studies: [] };
    }
  }

  // ========== 根据 evidence_id 查找证据 ==========
  function findEvidenceById(evidenceId) {
    if (!evidenceId) return null;
    const all = []
      .concat(evidenceDB.guidelines || [])
      .concat(evidenceDB.systematic_reviews || [])
      .concat(evidenceDB.rct_studies || []);
    return all.find(function (ev) { return ev.id === evidenceId; }) || null;
  }

  // ========== 根据条件查找相关证据（用于自动关联）==========
  function findEvidenceByCondition(conditionId) {
    if (!conditionId) return [];
    const all = []
      .concat(evidenceDB.guidelines || [])
      .concat(evidenceDB.systematic_reviews || [])
      .concat(evidenceDB.rct_studies || []);
    return all.filter(function (ev) {
      const related = ev.related_conditions || [];
      return related.indexOf(conditionId) !== -1;
    });
  }

  // ========== 根据干预措施查找相关证据 ==========
  function findEvidenceByIntervention(interventionName) {
    if (!interventionName) return [];
    const all = []
      .concat(evidenceDB.guidelines || [])
      .concat(evidenceDB.systematic_reviews || [])
      .concat(evidenceDB.rct_studies || []);
    return all.filter(function (ev) {
      const related = ev.related_interventions || [];
      return related.some(function (iv) {
        return iv.toLowerCase().indexOf(interventionName.toLowerCase()) !== -1;
      });
    });
  }

  // ========== 渲染单条证据卡片 HTML ==========
  function renderEvidenceCard(ev, options) {
    if (!ev) return '';
    const opts = options || {};
    const collapsed = opts.collapsed !== false; // 默认折叠

    const levelClass = 'evidence-badge-' + (ev.evidence_level || 'iii').toLowerCase().replace(/[^a-z]/g, '');
    const levelText = escapeHtml(ev.evidence_level || 'III');
    const titleZh = ev.title_zh || ev.title_en || 'Untitled';
    const mainFinding = ev.main_finding_zh || ev.main_finding_en || '';
    const source = ev.issuer_zh || ev.issuer_en || '';
    const year = ev.year || '';
    const doi = ev.doi || '';
    const url = ev.url || '';

    let html = '';
    html += '<div class="evidence-card" style="margin:12px 0; border:1px solid #c5cae9; border-radius:6px; overflow:hidden;">';

    // 标题栏（可点击折叠）
    html += '  <div class="evidence-card-header" data-evidence-toggle="' + escapeHtml(ev.id || '') + '" style="background:#e8eaf6; padding:10px 14px; cursor:pointer; display:flex; align-items:center; gap:8px;">';
    html += '    <span class="evidence-toggle-icon">▶</span>';
    html += '    <span class="evidence-badge ' + levelClass + '" style="padding:2px 8px; border-radius:10px; font-size:0.8em; font-weight:600;">' + levelText + '</span>';
    html += '    <span style="flex:1; font-weight:600; font-size:0.95em;">' + escapeHtml(titleZh) + '</span>';
    html += '    <span style="color:#666; font-size:0.85em;">' + (year ? String(year) : '') + '</span>';
    html += '  </div>';

    // 内容区（默认折叠）
    html += '  <div class="evidence-card-body" id="evidence-body-' + escapeHtml(ev.id || '') + '" style="display:' + (collapsed ? 'none' : 'block') + '; padding:12px 14px; font-size:0.9em; color:#333;">';

    if (source) {
      html += '    <p style="margin:4px 0;"><strong>发布机构：</strong>' + escapeHtml(source) + '</p>';
    }
    if (mainFinding) {
      html += '    <p style="margin:8px 0;">' + escapeHtml(mainFinding) + '</p>';
    }
    if (doi) {
      html += '    <p style="margin:4px 0;"><strong>DOI：</strong><a href="https://doi.org/' + escapeHtml(doi) + '" target="_blank" style="color:#1565c0;">' + escapeHtml(doi) + ' ↗</a></p>';
    } else if (url) {
      html += '    <p style="margin:4px 0;"><a href="' + escapeHtml(url) + '" target="_blank" style="color:#1565c0;">查看原文 →</a></p>';
    }

    html += '  </div>';
    html += '</div>';

    return html;
  }

  // ========== 渲染多条证据的汇总面板 ==========
  function renderEvidencePanel(evidenceIds, options) {
    if (!evidenceIds || evidenceIds.length === 0) return '';

    let html = '';
    html += '<div class="evidence-panel" style="margin:16px 0;">';
    html += '  <div style="font-weight:600; color:#3f51b5; margin-bottom:8px;">🔬 科学依据</div>';

    evidenceIds.forEach(function (eid) {
      const ev = findEvidenceById(eid);
      if (ev) {
        html += renderEvidenceCard(ev, options);
      }
    });

    html += '</div>';
    return html;
  }

  // ========== 绑定折叠/展开交互 ==========
  function bindEvidenceToggles() {
    document.addEventListener('click', function (e) {
      const header = e.target.closest('[data-evidence-toggle]');
      if (!header) return;
      const evId = header.getAttribute('data-evidence-toggle');
      const body = document.getElementById('evidence-body-' + evId);
      if (!body) return;

      const icon = header.querySelector('.evidence-toggle-icon');
      if (body.style.display === 'none') {
        body.style.display = 'block';
        if (icon) icon.textContent = '▼';
      } else {
        body.style.display = 'none';
        if (icon) icon.textContent = '▶';
      }
    });
  }

  // ========== 工具函数 ==========
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ========== 暴露公共 API ==========
  window.EvidenceEngine = {
    findById: findEvidenceById,
    findByCondition: findEvidenceByCondition,
    findByIntervention: findEvidenceByIntervention,
    renderCard: renderEvidenceCard,
    renderPanel: renderEvidencePanel,
    getDB: function () { return evidenceDB; }
  };

})();
