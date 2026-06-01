---
hide:
  - navigation
  - toc
---

<div class="dx-hero">

  <!-- Logo -->
  <div class="dx-logo">
    <span class="logo-rx">Rx</span><span class="logo-name">康复处方</span>
    <span class="logo-badge">BETA</span>
  </div>

  <!-- 主标题 -->
  <p class="dx-subtitle">输入您的症状，系统帮您判断可能的疾病，并生成个性化康复处方</p>

  <!-- 步骤指示器 -->
  <div class="dx-steps-bar">
    <div class="dx-step active" data-step="1">
      <div class="dx-step-num">1</div>
      <span>描述症状</span>
    </div>
    <div class="dx-step-line"></div>
    <div class="dx-step" data-step="2">
      <div class="dx-step-num">2</div>
      <span>鉴别诊断</span>
    </div>
    <div class="dx-step-line"></div>
    <div class="dx-step" data-step="3">
      <div class="dx-step-num">3</div>
      <span>康复评估</span>
    </div>
    <div class="dx-step-line"></div>
    <div class="dx-step" data-step="4">
      <div class="dx-step-num">4</div>
      <span>运动处方</span>
    </div>
  </div>

  <!-- 步骤1：输入症状 -->
  <div class="dx-panel" id="panel-1">
    <div class="dx-panel-icon">🩺</div>
    <h2>请描述您的症状</h2>
    <p class="dx-panel-desc">请尽可能详细地描述您的症状，系统将据此进行初步判断</p>

    <div class="dx-textarea-wrap">
      <textarea
        id="dx-symptom-input"
        class="dx-textarea"
        placeholder="例如：右侧肢体无力3天，伴有言语不清，血压偏高..."
        rows="4"
      ></textarea>
    </div>

    <div class="dx-tags">
      <span class="dx-tag-label">快速选择常见症状：</span>
      <button class="dx-tag" onclick="fillSymptom('一侧肢体无力、口角歪斜、言语不清')">🧠 疑似脑卒中</button>
      <button class="dx-tag" onclick="fillSymptom('膝关节疼痛、肿胀，行走时打软腿')">🦴 膝关节问题</button>
      <button class="dx-tag" onclick="fillSymptom('肩膀疼痛、抬臂困难，夜间痛加重')">🦴 肩关节问题</button>
      <button class="dx-tag" onclick="fillSymptom('气喘、呼吸困难，活动后加重')">🫀 呼吸困难</button>
      <button class="dx-tag" onclick="fillSymptom('手抖、动作缓慢、走路小步')">🧠 疑似帕金森</button>
    </div>

    <button class="dx-btn-primary" onclick="startDiagnosis()">
      开始分析 →
    </button>
  </div>

  <!-- 步骤2：鉴别诊断（动态生成选择题） -->
  <div class="dx-panel" id="panel-2" style="display:none;">
    <div class="dx-panel-icon">🔍</div>
    <h2>鉴别诊断</h2>
    <p class="dx-panel-desc" id="dx-specialty-hint"></p>

    <div id="dx-triage-questions"></div>

    <div class="dx-btn-row">
      <button class="dx-btn-secondary" onclick="goToStep(1)">← 重新描述</button>
      <button class="dx-btn-primary" onclick="submitTriage()">确认，进入评估 →</button>
    </div>
  </div>

  <!-- 步骤3：康复评估 -->
  <div class="dx-panel" id="panel-3" style="display:none;">
    <div class="dx-panel-icon">📋</div>
    <h2>康复评估</h2>
    <p class="dx-panel-desc">请完成以下评估，以便生成精准的运动处方</p>

    <div id="dx-assessment-steps"></div>

    <div class="dx-btn-row">
      <button class="dx-btn-secondary" onclick="goToStep(2)">← 上一步</button>
    </div>
  </div>

  <!-- 步骤4：处方生成中 -->
  <div class="dx-panel" id="panel-4" style="display:none;">
    <div class="dx-loading-wrap">
      <div class="dx-spinner"></div>
      <h2>正在生成康复处方...</h2>
      <p class="dx-loading-status" id="dx-loading-status">正在检索权威文献...</p>
      <div class="dx-progress-bar">
        <div class="dx-progress-fill" id="dx-progress-fill"></div>
      </div>
    </div>
  </div>

</div>

<script src="assets/javascripts/diagnosis-tree.js"></script>
<script>
var currentStep = 1;
var dxData = {};

function fillSymptom(text) {
  document.getElementById('dx-symptom-input').value = text;
}

function startDiagnosis() {
  var input = document.getElementById('dx-symptom-input').value.trim();
  if (!input) {
    alert('请先描述您的症状');
    return;
  }
  dxData.symptoms = input;

  // 匹配症状
  var matches = DiagnosisTree.matchSymptoms(input);
  dxData.matches = matches;
  dxData.specialty = matches[0].specialty;
  dxData.diagnosis = matches[0].diagnosis;

  // 显示分诊问题
  var triageEl = document.getElementById('dx-triage-questions');
  triageEl.innerHTML = '';
  var triage = matches[0].triage;

  var hintText = '根据您描述的症状，系统初步判断属于<b>' + 
    (matches[0].specialty === 'neurologic' ? '神经康复' : 
     matches[0].specialty === 'orthopedic' ? '骨科康复' : 
     matches[0].specialty === 'cardiopulmonary' ? '心肺康复' : '康复') + 
    '</b>方向。请回答以下问题以进一步确认：';
  document.getElementById('dx-specialty-hint').innerHTML = hintText;

  triage.forEach(function(q, i) {
    var card = document.createElement('div');
    card.className = 'dx-question-card';
    if (q.isRedFlag) {
      card.classList.add('dx-redflag-card');
    }
    var optionsHtml = q.options.map(function(opt) {
      return '<label class="dx-radio-label"><input type="radio" name="triage-' + q.key + '" value="' + opt + '" /> ' + opt + '</label>';
    }).join('');

    card.innerHTML = '<div class="dx-question-title">' + (q.isRedFlag ? '⚠️ ' : '') + q.q + '</div><div class="dx-radio-group">' + optionsHtml + '</div>';
    triageEl.appendChild(card);
  });

  goToStep(2);
}

function submitTriage() {
  // 收集分诊答案
  var triage = dxData.matches[0].triage;
  var triageAnswers = {};
  var allAnswered = true;

  triage.forEach(function(q) {
    var checked = document.querySelector('input[name="triage-' + q.key + '"]:checked');
    if (checked) {
      triageAnswers[q.key] = checked.value;
    } else {
      allAnswered = false;
    }
  });

  if (!allAnswered) {
    alert('请回答所有问题后再继续');
    return;
  }

  // 检查红旗症状
  if (triageAnswers.redFlags && triageAnswers.redFlags.indexOf('以上都没有') === -1 && triageAnswers.redFlags.indexOf('无') === -1) {
    if (confirm('⚠️ 检测到可能的红旗症状！\n\n建议您立即就医，不要延误。\n\n是否仍要继续查看参考处方？（仅供参考，不替代医疗建议）')) {
      // 继续
    } else {
      return;
    }
  }

  dxData.triageAnswers = triageAnswers;

  // 加载评估问卷
  var assessment = DiagnosisTree.getAssessmentForSpecialty(dxData.specialty, dxData.diagnosis);
  renderAssessment(assessment);
  goToStep(3);
}

function renderAssessment(config) {
  var container = document.getElementById('dx-assessment-steps');
  container.innerHTML = '';
  dxData.assessmentAnswers = {};

  config.forEach(function(step, stepIdx) {
    var card = document.createElement('div');
    card.className = 'dx-question-card';
    card.id = 'dx-step-' + stepIdx;

    var fieldsHtml = step.fields.map(function(f) {
      if (f.type === 'select') {
        var opts = f.options.map(function(opt) {
          if (typeof opt === 'object') return '<option value="' + opt.value + '">' + opt.label + '</option>';
          return '<option>' + opt + '</option>';
        }).join('');
        return '<div class="dx-field"><label>' + f.label + '</label><select id="dx-field-' + f.name + '" class="dx-select"><option value="">请选择</option>' + opts + '</select></div>';
      }
      if (f.type === 'range') {
        return '<div class="dx-field"><label>' + f.label + '</label><input type="range" id="dx-field-' + f.name + '" min="' + (f.min||0) + '" max="' + (f.max||10) + '" value="' + (f.min||0) + '" class="dx-range" oninput="this.nextElementSibling.textContent=this.value" /><span class="dx-range-val">' + (f.min||0) + '</span></div>';
      }
      if (f.type === 'textarea') {
        return '<div class="dx-field"><label>' + f.label + '</label><textarea id="dx-field-' + f.name + '" class="dx-textarea-small" placeholder="' + (f.placeholder||'') + '"></textarea></div>';
      }
      return '<div class="dx-field"><label>' + f.label + '</label><input type="number" id="dx-field-' + f.name + '" class="dx-input" placeholder="' + (f.placeholder||'') + '" /></div>';
    }).join('');

    card.innerHTML = '<div class="dx-question-title">' + (stepIdx+1) + '/' + config.length + ' ' + step.title + '</div>' + fieldsHtml;

    if (stepIdx < config.length - 1) {
      var btn = document.createElement('button');
      btn.className = 'dx-btn-primary';
      btn.textContent = '下一步 →';
      btn.onclick = function() { /* 简单滚动到下一步 */ };
      card.appendChild(btn);
    } else {
      var btn2 = document.createElement('button');
      btn2.className = 'dx-btn-primary';
      btn2.textContent = '生成处方 →';
      btn2.onclick = generatePrescription;
      card.appendChild(btn2);
    }

    container.appendChild(card);
  });
}

function generatePrescription() {
  // 收集评估答案
  var config = DiagnosisTree.getAssessmentForSpecialty(dxData.specialty, dxData.diagnosis);
  var answers = {};
  config.forEach(function(step) {
    step.fields.forEach(function(f) {
      var el = document.getElementById('dx-field-' + f.name);
      if (el) answers[f.name] = el.value;
    });
  });
  dxData.assessmentAnswers = answers;

  // 保存到 sessionStorage
  sessionStorage.setItem('rx-dx-data', JSON.stringify(dxData));

  goToStep(4);

  // 模拟加载进度
  var progress = 0;
  var fill = document.getElementById('dx-progress-fill');
  var status = document.getElementById('dx-loading-status');
  var statuses = ['正在检索权威文献...', '正在匹配康复指南...', '正在生成 FITT-VP 处方...', '正在标注循证等级...', '处方生成完成！'];
  var idx = 0;

  var timer = setInterval(function() {
    progress += 20;
    fill.style.width = Math.min(progress, 100) + '%';
    if (idx < statuses.length) {
      status.textContent = statuses[idx];
      idx++;
    }
    if (progress >= 100) {
      clearInterval(timer);
      setTimeout(function() {
        window.location.href = 'prescription/';
      }, 600);
    }
  }, 500);
}

function goToStep(n) {
  document.querySelectorAll('.dx-panel').forEach(function(p) { p.style.display = 'none'; });
  document.getElementById('panel-' + n).style.display = 'block';
  document.querySelectorAll('.dx-step').forEach(function(s) {
    var stepNum = parseInt(s.getAttribute('data-step'));
    s.classList.toggle('active', stepNum <= n);
    s.classList.toggle('done', stepNum < n);
  });
  currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<style>
/* ===== 诊断决策树页面样式 ===== */
.dx-hero {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

.dx-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.3rem;
}
.logo-rx { font-size: 2.4rem; font-weight: 800; color: #1565C0; letter-spacing: -2px; }
.logo-name { font-size: 1.4rem; font-weight: 600; color: #1a1a2e; }
.logo-badge { font-size: 0.55rem; background: #FFC107; color: #1a1a2e; padding: 2px 6px; border-radius: 4px; font-weight: 700; letter-spacing: 1px; }

.dx-subtitle {
  text-align: center;
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

/* 步骤条 */
.dx-steps-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2.5rem;
  gap: 0;
}
.dx-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  opacity: 0.4;
  transition: all 0.3s;
}
.dx-step.active { opacity: 1; }
.dx-step.done { opacity: 0.7; }
.dx-step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #E8EDF2;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}
.dx-step.active .dx-step-num { background: #1565C0; color: #fff; }
.dx-step.done .dx-step-num { background: #2E7D32; color: #fff; }
.dx-step span { font-size: 0.7rem; color: #6b7280; font-weight: 600; }
.dx-step-line {
  width: 40px;
  height: 2px;
  background: #E8EDF2;
  margin: 0 0.3rem;
  margin-bottom: 1rem;
}

/* 面板 */
.dx-panel {
  animation: dxFadeIn 0.4s ease;
}
@keyframes dxFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.dx-panel-icon { font-size: 2.5rem; text-align: center; margin-bottom: 0.8rem; }
.dx-panel h2 { text-align: center; font-size: 1.4rem; color: #1a1a2e; margin-bottom: 0.4rem; }
.dx-panel-desc { text-align: center; color: #6b7280; font-size: 0.9rem; margin-bottom: 2rem; }

/* 文本输入区 */
.dx-textarea-wrap {
  background: #fff;
  border: 2px solid #E8EDF2;
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1.2rem;
  transition: border-color 0.2s;
}
.dx-textarea-wrap:focus-within { border-color: #1565C0; }
.dx-textarea {
  width: 100%;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #1a1a2e;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  background: transparent;
}
.dx-textarea::placeholder { color: #9ca3af; }

/* 快速标签 */
.dx-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1.5rem;
}
.dx-tag-label { font-size: 0.8rem; color: #9ca3af; }
.dx-tag {
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
.dx-tag:hover { background: #D1E4FD; }

/* 按钮 */
.dx-btn-primary {
  display: block;
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #1565C0, #0D47A1);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  font-family: inherit;
}
.dx-btn-primary:hover { opacity: 0.9; }
.dx-btn-secondary {
  padding: 10px 20px;
  border-radius: 10px;
  border: 2px solid #E8EDF2;
  background: #fff;
  color: #6b7280;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
}
.dx-btn-row {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
.dx-btn-row .dx-btn-primary { flex: 1; }

/* 问题卡片 */
.dx-question-card {
  background: #fff;
  border: 1px solid #E8EDF2;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.dx-redflag-card {
  border-color: #F44336;
  background: #FFF8F8;
}
.dx-question-title {
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 1rem;
  font-size: 1rem;
}
.dx-radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.dx-radio-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 10px 14px;
  border: 1px solid #E8EDF2;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.92rem;
  color: #374151;
}
.dx-radio-label:hover { border-color: #1565C0; background: #F0F7FF; }
.dx-radio-label input[type="radio"] { accent-color: #1565C0; width: 18px; height: 18px; }

/* 表单元素 */
.dx-select, .dx-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E8EDF2;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #1a1a2e;
  background: #FAFBFC;
  font-family: inherit;
  margin-top: 0.3rem;
}
.dx-textarea-small {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E8EDF2;
  border-radius: 10px;
  font-size: 0.95rem;
  min-height: 60px;
  resize: vertical;
  font-family: inherit;
  margin-top: 0.3rem;
}
.dx-range { width: 100%; accent-color: #1565C0; margin-top: 0.5rem; }
.dx-range-val { font-weight: 700; color: #1565C0; margin-left: 0.5rem; }
.dx-field { margin-bottom: 1.2rem; }
.dx-field label { font-size: 0.9rem; font-weight: 600; color: #374151; display: block; margin-bottom: 0.3rem; }

/* 加载动画 */
.dx-loading-wrap { text-align: center; padding: 3rem 1rem; }
.dx-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #E8EDF2;
  border-top-color: #1565C0;
  border-radius: 50%;
  animation: dxSpin 0.8s linear infinite;
  margin: 0 auto 1.5rem;
}
@keyframes dxSpin { to { transform: rotate(360deg); } }
.dx-loading-status { color: #6b7280; font-size: 0.9rem; margin-bottom: 1.2rem; }
.dx-progress-bar {
  width: 100%;
  max-width: 320px;
  height: 6px;
  background: #E8EDF2;
  border-radius: 3px;
  margin: 0 auto;
  overflow: hidden;
}
.dx-progress-fill {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, #1565C0, #2E7D32);
  border-radius: 3px;
  transition: width 0.5s ease;
}

@media (max-width: 640px) {
  .dx-steps-bar { gap: 0; }
  .dx-step span { font-size: 0.6rem; }
  .dx-step-line { width: 20px; }
}
</style>
