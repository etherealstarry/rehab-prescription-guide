---
hide:
  - navigation
  - toc
---

<div class="search-hero">

  <div class="search-logo">
    <span class="logo-rx">Rx</span><span class="logo-name">康复处方</span>
    <span class="logo-badge">BETA</span>
  </div>

  <p class="search-subtitle">
    输入症状或疾病，获取循证康复运动处方
  </p>

  <!-- 用 form 包裹，确保 Enter 键一定能触发 -->
  <form class="search-box" id="home-search-form" onsubmit="return doSearch();">
    <div class="search-input-wrap">
      <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        id="home-search-input"
        class="search-input"
        placeholder="输入症状或疾病，如：脑卒中、膝关节疼痛、COPD..."
        autocomplete="off"
        spellcheck="false"
      />
      <button type="submit" class="search-go-btn" aria-label="搜索">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </button>
    </div>
    <div class="search-tags">
      <span class="tag-label">热门：</span>
      <button type="button" class="search-tag" data-q="脑卒中">脑卒中</button>
      <button type="button" class="search-tag" data-q="前交叉韧带重建">前交叉韧带重建</button>
      <button type="button" class="search-tag" data-q="COPD">COPD</button>
      <button type="button" class="search-tag" data-q="帕金森病">帕金森病</button>
      <button type="button" class="search-tag" data-q="脊髓损伤">脊髓损伤</button>
    </div>
  </form>

  <div class="search-modes">
    <button type="button" class="mode-btn active" data-mode="patient">🧑⚕️ 患者模式</button>
    <button type="button" class="mode-btn" data-mode="pro">🩺 专业模式</button>
  </div>

</div>

<div class="features-minimal">
  <div class="feature-item">
    <div class="feature-icon">⚠️</div>
    <div>
      <strong>Red Flags 拦截</strong>
      <p>急危重症自动预警，安全第一</p>
    </div>
  </div>
  <div class="feature-item">
    <div class="feature-icon">📋</div>
    <div>
      <strong>FITT-VP 处方</strong>
      <p>频次·强度·时间·类型·总量·进阶</p>
    </div>
  </div>
  <div class="feature-item">
    <div class="feature-icon">📚</div>
    <div>
      <strong>循证等级标注</strong>
      <p>Ia / Ib / IIa 证据来源可追溯</p>
    </div>
  </div>
</div>

<script>
(function() {
  // 模式切换
  document.querySelectorAll('.mode-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.mode-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  // 热门标签点击
  document.querySelectorAll('.search-tag').forEach(function(tag) {
    tag.addEventListener('click', function() {
      var input = document.getElementById('home-search-input');
      input.value = this.getAttribute('data-q');
      input.focus();
    });
  });
})();

function doSearch() {
  var input = document.getElementById('home-search-input');
  var q = input.value.trim();
  if (!q) { input.focus(); return false; }
  var mode = document.querySelector('.mode-btn.active')?.getAttribute('data-mode') || 'patient';
  sessionStorage.setItem('rx-query', q);
  sessionStorage.setItem('rx-mode', mode);
  window.location.href = 'interactive/assessment/?q=' + encodeURIComponent(q) + '&mode=' + mode;
  return false;
}
</script>

<style>
/* 搜索首页极简风格 */
.search-hero {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem 1rem;
  text-align: center;
}

.search-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.logo-rx {
  font-size: 2.8rem;
  font-weight: 800;
  color: #1565C0;
  letter-spacing: -2px;
}
.logo-name {
  font-size: 1.6rem;
  font-weight: 600;
  color: #1a1a2e;
}
.logo-badge {
  font-size: 0.6rem;
  background: #FFC107;
  color: #1a1a2e;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: 1px;
}

.search-subtitle {
  color: #6b7280;
  font-size: 1.05rem;
  margin-bottom: 2rem;
}

/* 搜索框 */
.search-box {
  width: 100%;
  max-width: 620px;
  margin-bottom: 1.2rem;
}
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  border: 2px solid #E8EDF2;
  border-radius: 28px;
  padding: 0.9rem 1.4rem;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 12px rgba(21,101,192,0.06);
}
.search-input-wrap:focus-within {
  border-color: #1565C0;
  box-shadow: 0 4px 20px rgba(21,101,192,0.13);
}
.search-icon { color: #9ca3af; flex-shrink: 0; }
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1.05rem;
  color: #1a1a2e;
  background: transparent;
  font-family: inherit;
}
.search-input::placeholder { color: #9ca3af; }
.search-go-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #1565C0;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.search-go-btn:hover { background: #0D47A1; }

/* 热门标签 */
.search-tags {
  margin-top: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.tag-label {
  font-size: 0.82rem;
  color: #9ca3af;
}
.search-tag {
  font-size: 0.82rem;
  color: #1565C0;
  background: #EBF3FE;
  border: 1px solid #D1E4FD;
  border-radius: 20px;
  padding: 4px 14px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}
.search-tag:hover { background: #D1E4FD; }

/* 模式切换 */
.search-modes {
  display: flex;
  gap: 0.7rem;
  margin-top: 1.5rem;
}
.mode-btn {
  font-size: 0.88rem;
  padding: 8px 20px;
  border-radius: 24px;
  border: 2px solid #E8EDF2;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.mode-btn.active {
  border-color: #1565C0;
  background: #EBF3FE;
  color: #1565C0;
  font-weight: 600;
}
.mode-btn:hover:not(.active) { border-color: #9ca3af; }

/* 底部功能说明 */
.features-minimal {
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  padding: 2rem 1rem 3rem;
  flex-wrap: wrap;
  border-top: 1px solid #F0F2F5;
  max-width: 800px;
  margin: 0 auto;
}
.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  max-width: 220px;
  text-align: left;
}
.feature-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 2px;
}
.feature-item strong {
  display: block;
  font-size: 0.92rem;
  color: #1a1a2e;
  margin-bottom: 0.2rem;
}
.feature-item p {
  font-size: 0.82rem;
  color: #9ca3af;
  margin: 0;
  line-height: 1.4;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .search-logo { flex-wrap: wrap; justify-content: center; }
  .logo-rx { font-size: 2.2rem; }
  .logo-name { font-size: 1.3rem; }
  .search-subtitle { font-size: 0.95rem; }
  .features-minimal { flex-direction: column; align-items: center; gap: 1.5rem; }
  .feature-item { max-width: 100%; }
}
</style>
