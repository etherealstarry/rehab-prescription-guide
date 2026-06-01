/* ============================================================
   drawer.js — 文献引用抽屉（从右侧滑出）
   ============================================================ */

function RxDrawer() {
  /* 单例：如果抽屉已存在则复用 */
  let overlay = document.getElementById('rx-drawer-overlay');
  let drawer  = document.getElementById('rx-drawer');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rx-drawer-overlay';
    overlay.className = 'rx-drawer-overlay';
    document.body.appendChild(overlay);
  }

  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'rx-drawer';
    drawer.className = 'rx-drawer';
    drawer.innerHTML = `
      <button class="rx-drawer-close" aria-label="关闭">✕</button>
      <div id="rx-drawer-body"></div>`;
    document.body.appendChild(drawer);
  }

  /* 关闭 */
  function close() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', close);
  drawer.querySelector('.rx-drawer-close').addEventListener('click', close);

  return {
    /* evidence = { title, authors, journal, year, doi, abstract, level, source } */
    open(evidence) {
      const body = document.getElementById('rx-drawer-body');
      const authors = (evidence.authors || []).join(', ');
      const doiLink = evidence.doi
        ? `https://doi.org/${evidence.doi}`
        : (evidence.url || '');

      const evLevelBadge = evidence.level
        ? `<span class="rx-badge rx-badge--blue" style="margin-left:0.5rem;">${evidence.level}</span>`
        : '';

      body.innerHTML = `
        <h3>${evidence.title || '文献详情'}${evLevelBadge}</h3>
        ${authors ? `<p class="evidence-meta">👤 ${authors}</p>` : ''}
        ${evidence.journal ? `<p class="evidence-meta">📋 ${evidence.journal} (${evidence.year || '—'})</p>` : ''}
        ${evidence.doi ? `<p class="evidence-meta">🔗 DOI: <a href="https://doi.org/${evidence.doi}" target="_blank" rel="noopener">${evidence.doi}</a></p>` : ''}
        <hr style="margin:1rem 0;border:none;border-top:1px solid var(--card-border);">
        <div class="evidence-abstract">
          ${(evidence.abstract || '暂无摘要。').replace(/\n/g, '<br>')}
        </div>
        ${doiLink ? `<p style="margin-top:1.2rem;"><a class="evidence-link" href="${doiLink}" target="_blank" rel="noopener">🔗 查看原文 →</a></p>` : ''}
        ${evidence.recommendation ? `<div style="margin-top:1.2rem;padding:0.8rem;background:var(--color-healing-green--light, #E8F5F0);border-radius:8px;font-size:0.92rem;color:var(--md-primary-fg-color, #1B2A4A);"><strong>💡 临床推荐：</strong>${evidence.recommendation}</div>` : ''}
      `;

      /* 动画：先添 overlay，再添 drawer */
      requestAnimationFrame(() => {
        overlay.classList.add('open');
        requestAnimationFrame(() => {
          drawer.classList.add('open');
          document.body.style.overflow = 'hidden';
        });
      });
    },
    close
  };
}

/* 全局单例 */
const __rxDrawer = RxDrawer();

/* 供 HTML 内联 onclick 调用 */
function openEvidenceDrawer(evidenceObj) {
  __rxDrawer.open(evidenceObj);
}

function closeEvidenceDrawer() {
  __rxDrawer.close();
}
