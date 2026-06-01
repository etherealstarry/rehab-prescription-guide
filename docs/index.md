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

  <div class="search-box" id="home-search-box">
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
      <kbd class="search-kbd">↵</kbd>
    </div>
    <div class="search-tags">
      <span class="tag-label">热门搜索：</span>
      <button class="search-tag" onclick="fillSearch('脑卒中')">脑卒中</button>
      <button class="search-tag" onclick="fillSearch('前交叉韧带重建')">前交叉韧带重建</button>
      <button class="search-tag" onclick="fillSearch('COPD')">COPD</button>
      <button class="search-tag" onclick="fillSearch('帕金森病')">帕金森病</button>
      <button class="search-tag" onclick="fillSearch('脊髓损伤')">脊髓损伤</button>
    </div>
  </div>

  <div class="search-modes">
    <button class="mode-btn active" data-mode="patient" onclick="switchMode('patient', this)">
      🧑⚕️ 患者模式
    </button>
    <button class="mode-btn" data-mode="pro" onclick="switchMode('pro', this)">
      🩺 专业模式
    </button>
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
// 搜索框交互
const input = document.getElementById('home-search-input');

input.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitSearch();
  }
});

function fillSearch(text) {
  input.value = text;
  input.focus();
}

function submitSearch() {
  const q = input.value.trim();
  if (!q) { input.focus(); return; }
  const mode = document.querySelector('.mode-btn.active')?.dataset.mode || 'patient';
  // 存入 sessionStorage，跳转到评估页
  sessionStorage.setItem('rx-query', q);
  sessionStorage.setItem('rx-mode', mode);
  window.location.href = 'interactive/assessment.html?q=' + encodeURIComponent(q) + '&mode=' + mode;
}

function switchMode(mode, btn) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
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
.search-kbd {
  font-size: 0.7rem;
  color: #9ca3af;
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 2px 8px;
  font-family: monospace;
}

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
