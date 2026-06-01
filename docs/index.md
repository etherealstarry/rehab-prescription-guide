---
hide:
  - navigation
  - toc
---
<script src="assets/javascripts/redflags.js"></script>
<script src="assets/javascripts/diagnosis-tree.js"></script>

<div class="rx-hero">
  <!-- Logo -->
  <div class="rx-logo">
    <span class="logo-rx">Rx</span><span class="logo-name">康复处方</span>
    <span class="logo-badge">BETA</span>
  </div>

  <!-- 搜索框（核心交互） -->
  <form class="rx-search-form" id="rx-search-form" onsubmit="return false;">
    <div class="rx-search-box">
      <svg class="rx-search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#9ca3af" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        type="text"
        id="rx-search-input"
        class="rx-search-input"
        placeholder="描述您的症状或疾病，例如：手麻、膝关节疼痛、气喘..."
        autocomplete="off"
      />
      <div class="rx-search-actions">
        <button type="button" class="rx-mic-btn" onclick="toggleVoice()" title="语音输入">🎙</button>
        <button type="submit" class="rx-search-btn" id="rx-search-btn">搜索</button>
      </div>
    </div>

    <!-- 快速标签 -->
    <div class="rx-tags">
      <span class="rx-tag-label">快速选择：</span>
      <button class="rx-tag" onclick="fillInput('一侧肢体无力、口角歪斜、言语不清')">🧠 疑似脑卒中</button>
      <button class="rx-tag" onclick="fillInput('膝关节疼痛、肿胀，行走时打软腿')">🦴 膝关节问题</button>
      <button class="rx-tag" onclick="fillInput('肩膀疼痛、抬臂困难，夜间痛加重')">🦴 肩关节问题</button>
      <button class="rx-tag" onclick="fillInput('气喘、呼吸困难，活动后加重')">🫀 呼吸困难</button>
      <button class="rx-tag" onclick="fillInput('手抖、动作缓慢、走路小步')">🧠 疑似帕金森</button>
    </div>
  </form>

  <!-- 搜索结果区域（动态生成） -->
  <div class="rx-results" id="rx-results" style="display:none;">
    <div class="rx-results-header">
      <span id="rx-results-count"></span>
      <button class="rx-clear-btn" onclick="clearResults()">✕ 清除</button>
    </div>
    <div class="rx-results-list" id="rx-results-list"></div>
  </div>

  <!-- 首页默认展示的卡片（未搜索时显示） -->
  <div class="rx-default-cards" id="rx-default-cards">
    <div class="rx-section-title">常见康复方向</div>
    <div class="rx-card-grid">
      <div class="rx-card" onclick="fillInput('脑卒中康复')">
        <div class="rx-card-icon">🧠</div>
        <div class="rx-card-title">神经康复</div>
        <div class="rx-card-desc">脑卒中、脊髓损伤、帕金森</div>
      </div>
      <div class="rx-card" onclick="fillInput('膝关节术后康复')">
        <div class="rx-card-icon">🦴</div>
        <div class="rx-card-title">骨科康复</div>
        <div class="rx-card-desc">ACL重建、关节置换、半月板</div>
      </div>
      <div class="rx-card" onclick="fillInput('慢阻肺康复')">
        <div class="rx-card-icon">🫀</div>
        <div class="rx-card-title">心肺康复</div>
        <div class="rx-card-desc">COPD、心梗术后、心衰</div>
      </div>
      <div class="rx-card" onclick="fillInput('儿童康复')">
        <div class="rx-card-icon">👶</div>
        <div class="rx-card-title">儿童康复</div>
        <div class="rx-card-desc">脑瘫、发育迟缓</div>
      </div>
    </div>

    <div class="rx-section-title" style="margin-top:2rem;">如何使用</div>
    <div class="rx-steps-grid">
      <div class="rx-step-card">
        <div class="rx-step-num">1</div>
        <div class="rx-step-text">描述您的症状或疾病</div>
      </div>
      <div class="rx-step-arrow">→</div>
      <div class="rx-step-card">
        <div class="rx-step-num">2</div>
        <div class="rx-step-text">系统智能匹配康复方向</div>
      </div>
      <div class="rx-step-arrow">→</div>
      <div class="rx-step-card">
        <div class="rx-step-num">3</div>
        <div class="rx-step-text">完成评估，生成处方</div>
      </div>
    </div>
  </div>

  <!-- 专业版入口 -->
  <div class="rx-pro-link">
    <a href="javascript:switchMode()" id="rx-mode-link">切换专业版 →</a>
  </div>
</div>

<script>
// ========== 搜索交互 ==========
function fillInput(text) {
  document.getElementById('rx-search-input').value = text;
  doSearch(text);
}

function doSearch(keyword) {
  if (!keyword) keyword = document.getElementById('rx-search-input').value.trim();
  if (!keyword) return;

  // 检查红旗症状
  var rf = checkRedFlags(keyword);
  if (rf.isRedFlag) {
    showRedFlagAlert(rf);
    return;
  }

  // 匹配症状
  var matches = DiagnosisTree.matchSymptoms(keyword);
  if (!matches || matches.length === 0) {
    showNoResult(keyword);
    return;
  }

  // 显示结果
  showResults(keyword, matches);
}

function showResults(keyword, matches) {
  document.getElementById('rx-default-cards').style.display = 'none';
  document.getElementById('rx-results').style.display = 'block';
  document.getElementById('rx-results-count').textContent = '找到 ' + matches.length + ' 个相关康复方向';

  var list = document.getElementById('rx-results-list');
  list.innerHTML = '';

  matches.forEach(function(m) {
    var card = document.createElement('div');
    card.className = 'rx-result-card';
    card.innerHTML =
      '<div class="rx-result-title">' + (m.icon||'📋') + ' ' + m.label + '</div>' +
      '<div class="rx-result-desc">' + (m.description||'') + '</div>' +
      '<div class="rx-result-meta">' +
        '<span class="rx-specialty-tag">' + (m.specialty==='neurologic'?'神经康复':m.specialty==='orthopedic'?'骨科康复':'心肺康复') + '</span>' +
        '<span class="rx-evidence-tag">循证等级：' + (m.evidenceLevel||'B') + '</span>' +
      '</div>' +
      '<button class="rx-result-btn" onclick="startAssessment(\'' + m.specialty + '\',\'' + (m.diagnosis||'') + '\')">开始评估 →</button>';
    list.appendChild(card);
  });
}

function startAssessment(specialty, diagnosis) {
  sessionStorage.setItem('rx-specialty', specialty);
  sessionStorage.setItem('rx-diagnosis', diagnosis || '');
  sessionStorage.setItem('rx-symptoms', document.getElementById('rx-search-input').value);
  window.location.href = 'interactive/assessment/?specialty=' + specialty;
}

function showNoResult(keyword) {
  document.getElementById('rx-default-cards').style.display = 'none';
  document.getElementById('rx-results').style.display = 'block';
  document.getElementById('rx-results-count').textContent = '未找到与「' + keyword + '」相关的结果';
  document.getElementById('rx-results-list').innerHTML =
    '<div class="rx-no-result">' +
    '  <p>您可以尝试：</p>' +
    '  <ul><li>使用更通用的症状描述（如"手麻"而非"左手麻木3天"）</li>' +
    '  <li>检查是否有错别字</li>' +
    '  <li>联系我们添加该疾病的康复方案</li></ul>' +
    '</div>';
}

function clearResults() {
  document.getElementById('rx-search-input').value = '';
  document.getElementById('rx-results').style.display = 'none';
  document.getElementById('rx-default-cards').style.display = 'block';
}

function toggleVoice() {
  alert('语音输入功能开发中，敬请期待！');
}

// ========== 表单绑定 ==========
document.getElementById('rx-search-form').addEventListener('submit', function(e) {
  e.preventDefault();
  doSearch();
});

document.getElementById('rx-search-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    doSearch();
  }
});

// ========== 模式切换 ==========
function switchMode() {
  var body = document.body;
  if (body.classList.contains('professional-mode')) {
    body.classList.remove('professional-mode');
    document.getElementById('rx-mode-link').textContent = '切换专业版 →';
  } else {
    body.classList.add('professional-mode');
    document.getElementById('rx-mode-link').textContent = '切换回普通版 →';
  }
}
</script>

<style>
/* ===== 全局 ===== */
.rx-hero {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

/* ===== Logo ===== */
.rx-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2rem;
}
.logo-rx { font-size: 2.4rem; font-weight: 800; color: #1565C0; letter-spacing: -2px; }
.logo-name { font-size: 1.4rem; font-weight: 600; color: #1a1a2e; }
.logo-badge { font-size: 0.55rem; background: #FFC107; color: #1a1a2e; padding: 2px 6px; border-radius: 4px; font-weight: 700; letter-spacing: 1px; }

/* ===== 搜索框 ===== */
.rx-search-form { margin-bottom: 2rem; }
.rx-search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  border: 2px solid #E8EDF2;
  border-radius: 28px;
  padding: 6px 8px 6px 18px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.rx-search-box:focus-within {
  border-color: #1565C0;
  box-shadow: 0 2px 16px rgba(21,101,192,0.12);
}
.rx-search-icon { flex-shrink: 0; }
.rx-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #1a1a2e;
  font-family: inherit;
  background: transparent;
  min-width: 0;
}
.rx-search-input::placeholder { color: #9ca3af; }
.rx-search-actions { display: flex; gap: 0.3rem; flex-shrink: 0; }
.rx-mic-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: none;
  background: #F3F4F6;
  cursor: pointer;
  font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.rx-mic-btn:hover { background: #E5E7EB; }
.rx-search-btn {
  padding: 8px 20px;
  border-radius: 20px;
  border: none;
  background: #1565C0;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.rx-search-btn:hover { background: #0D47A1; }

/* ===== 快速标签 ===== */
.rx-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1rem;
  justify-content: center;
}
.rx-tag-label { font-size: 0.8rem; color: #9ca3af; }
.rx-tag {
  font-size: 0.8rem;
  color: #1565C0;
  background: #EBF3FE;
  border: 1px solid #D1E4FD;
  border-radius: 20px;
  padding: 5px 14px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}
.rx-tag:hover { background: #D1E4FD; }

/* ===== 默认卡片区 ===== */
.rx-default-cards { animation: rxFadeIn 0.4s ease; }
.rx-section-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}
.rx-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.rx-card {
  background: #fff;
  border: 1px solid #E8EDF2;
  border-radius: 16px;
  padding: 1.2rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.rx-card:hover {
  border-color: #1565C0;
  box-shadow: 0 4px 16px rgba(21,101,192,0.1);
  transform: translateY(-2px);
}
.rx-card-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.rx-card-title { font-size: 0.95rem; font-weight: 700; color: #1a1a2e; margin-bottom: 0.3rem; }
.rx-card-desc { font-size: 0.78rem; color: #6b7280; }

/* ===== 使用步骤 ===== */
.rx-steps-grid {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  justify-content: center;
}
.rx-step-card {
  background: #F9FAFB;
  border: 1px solid #E8EDF2;
  border-radius: 12px;
  padding: 0.8rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1;
  min-width: 140px;
}
.rx-step-num {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #1565C0;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}
.rx-step-text { font-size: 0.85rem; color: #374151; font-weight: 500; }
.rx-step-arrow { color: #9ca3af; font-size: 1.2rem; }

/* ===== 搜索结果 ===== */
.rx-results { animation: rxFadeIn 0.3s ease; }
.rx-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #6b7280;
}
.rx-clear-btn {
  background: none;
  border: none;
  color: #1565C0;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: inherit;
}
.rx-result-card {
  background: #fff;
  border: 1px solid #E8EDF2;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1rem;
  transition: border-color 0.2s;
}
.rx-result-card:hover { border-color: #1565C0; }
.rx-result-title { font-size: 1.05rem; font-weight: 700; color: #1a1a2e; margin-bottom: 0.4rem; }
.rx-result-desc { font-size: 0.88rem; color: #6b7280; margin-bottom: 0.6rem; }
.rx-result-meta { display: flex; gap: 0.6rem; margin-bottom: 0.8rem; }
.rx-specialty-tag {
  font-size: 0.75rem;
  background: #E8F5E9;
  color: #2E7D32;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 600;
}
.rx-evidence-tag {
  font-size: 0.75rem;
  background: #FFF8E1;
  color: #F57F17;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 600;
}
.rx-result-btn {
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  background: #1565C0;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.rx-result-btn:hover { background: #0D47A1; }
.rx-no-result { color: #6b7280; font-size: 0.9rem; }
.rx-no-result ul { margin-top: 0.5rem; padding-left: 1.2rem; }
.rx-no-result li { margin-bottom: 0.3rem; }

/* ===== 专业版链接 ===== */
.rx-pro-link {
  text-align: center;
  margin-top: 2.5rem;
  font-size: 0.85rem;
}
.rx-pro-link a {
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.15s;
}
.rx-pro-link a:hover { color: #1565C0; }

@keyframes rxFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .rx-hero { padding: 1.2rem 0.8rem 3rem; }
  .rx-card-grid { grid-template-columns: repeat(2, 1fr); }
  .rx-steps-grid { flex-direction: column; }
  .rx-step-arrow { transform: rotate(90deg); }
}
</style>
