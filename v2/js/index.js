// index.js — 首页交互逻辑
document.addEventListener('DOMContentLoaded', function() {

  // 搜索表单提交
  var form = document.getElementById('rx-search-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      doSearch();
    });
  }

  // 回车搜索
  var input = document.getElementById('rx-search-input');
  if (input) {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
      }
    });
  }

  // 语音按钮
  var micBtn = document.getElementById('rx-mic-btn');
  if (micBtn) {
    micBtn.addEventListener('click', function() {
      alert('语音输入功能开发中，敬请期待！');
    });
  }

  // 快速标签按钮（事件委托）
  var tagsContainer = document.getElementById('rx-tags');
  if (tagsContainer) {
    tagsContainer.addEventListener('click', function(e) {
      var btn = e.target.closest('.rx-tag');
      if (btn && btn.dataset.kw) {
        fillInput(btn.dataset.kw);
      }
    });
  }

  // 方向卡片点击（事件委托）
  var cardGrid = document.getElementById('rx-card-grid');
  if (cardGrid) {
    cardGrid.addEventListener('click', function(e) {
      var card = e.target.closest('.rx-card');
      if (card && card.dataset.kw) {
        fillInput(card.dataset.kw);
      }
    });
  }

  // 清除结果按钮
  var clearBtn = document.getElementById('rx-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearResults);
  }

  // 搜索结果卡片内的"开始评估"按钮（事件委托）
  var resultsList = document.getElementById('rx-results-list');
  if (resultsList) {
    resultsList.addEventListener('click', function(e) {
      var btn = e.target.closest('.rx-result-btn');
      if (btn) {
        var specialty = btn.dataset.specialty;
        startAssessment(specialty);
      }
    });
  }

  // 专业版切换链接
  var modeLink = document.getElementById('rx-mode-link');
  if (modeLink) {
    modeLink.addEventListener('click', function(e) {
      e.preventDefault();
      switchMode();
    });
  }

});

// ========== 工具函数 ==========
function fillInput(text) {
  var input = document.getElementById('rx-search-input');
  if (input) input.value = text;
  doSearch(text);
}

function doSearch(keyword) {
  if (!keyword) {
    var input = document.getElementById('rx-search-input');
    keyword = input ? input.value.trim() : '';
  }
  if (!keyword) return;

  var rf = checkRedFlags(keyword);
  if (rf && rf.isRedFlag) {
    showRedFlagAlert(rf);
    return;
  }

  var matches = DiagnosisTree.matchSymptoms(keyword);
  if (!matches || matches.length === 0) {
    showResults(keyword, matches);
    return;
  }

  // 检查是否有追问树（交互式鉴别诊断）
  var tree = null;
  if (window.DifferentialEngine) {
    tree = DifferentialEngine.getTree(keyword);
  }
  if (tree) {
    showDifferential(tree, keyword);
    return;
  }

  showResults(keyword, matches);
}

function showResults(keyword, matches) {
  var defaultCards = document.getElementById('rx-default-cards');
  var results = document.getElementById('rx-results');
  if (defaultCards) defaultCards.style.display = 'none';
  if (results) results.style.display = 'block';

  // 按 specialty 分组，同一专科只显示一个卡片
  var specialtyMap = {};
  matches.forEach(function(m) {
    var sp = m.specialty;
    if (!specialtyMap[sp]) specialtyMap[sp] = [];
    specialtyMap[sp].push(m);
  });

  var specialtyLabel = {
    'neurologic': '神经康复',
    'orthopedic': '骨科康复',
    'cardio':     '心肺康复',
    'cervical':   '颈椎康复',
    'lumbar':     '腰椎康复',
    'hand':       '手功能康复',
    'knee':      '膝关节康复',
    'shoulder':   '肩关节康复',
    'fever':     '发热/内科'
  };

  var count = document.getElementById('rx-results-count');
  var keys = Object.keys(specialtyMap);
  if (count) count.textContent = '根据「' + keyword + '」，建议进行以下专科评估';

  var list = document.getElementById('rx-results-list');
  if (!list) return;
  list.innerHTML = '';

  // 描述文字
  var hint = document.createElement('div');
  hint.className = 'rx-result-hint';
  hint.textContent = '系统将根据您的回答自动判断具体问题，无需自行诊断。';
  list.appendChild(hint);

  keys.forEach(function(sp) {
    var group = specialtyMap[sp];
    var first = group[0];
    var card = document.createElement('div');
    card.className = 'rx-result-card';

    // 列出该专科可能涉及的问题（帮助患者理解）
    var questionList = group.slice(0, 3).map(function(g) {
      return g.label;
    }).join('、');

    card.innerHTML =
      '<div class="rx-result-title">' + (first.icon || '📋') + ' ' + (specialtyLabel[sp] || sp) + '</div>' +
      '<div class="rx-result-desc">可能涉及：' + questionList + '等。评估将帮助系统自动判断您的具体情况。</div>' +
      '<div class="rx-result-meta">' +
        '<span class="rx-specialty-tag">' + (specialtyLabel[sp] || sp) + '</span>' +
        '<span class="rx-evidence-tag">循证等级：' + (first.evidenceLevel || 'B') + '</span>' +
      '</div>' +
      '<button class="rx-result-btn" data-specialty="' + sp + '">开始评估 →</button>';
    list.appendChild(card);
  });
}

function startAssessment(specialty) {
  sessionStorage.setItem('rx-specialty', specialty);
  // 不预设诊断，由评估表单的问题结果自动判断
  sessionStorage.removeItem('rx-diagnosis');
  var input = document.getElementById('rx-search-input');
  sessionStorage.setItem('rx-symptoms', input ? input.value : '');
  window.location.href = 'assessment.html?specialty=' + specialty;
}

function showNoResult(keyword) {
  var defaultCards = document.getElementById('rx-default-cards');
  var results = document.getElementById('rx-results');
  if (defaultCards) defaultCards.style.display = 'none';
  if (results) results.style.display = 'block';

  var count = document.getElementById('rx-results-count');
  if (count) count.textContent = '未找到与「' + keyword + '」相关的结果';

  var list = document.getElementById('rx-results-list');
  if (list) {
    list.innerHTML =
      '<div class="rx-no-result">' +
      '  <p>您可以尝试：</p>' +
      '  <ul><li>使用更通用的症状描述（如"手麻"而非"左手麻木3天"）</li>' +
      '  <li>检查是否有错别字</li>' +
      '  <li>联系我们添加该疾病的康复方案</li></ul>' +
      '</div>';
  }
}

function clearResults() {
  var input = document.getElementById('rx-search-input');
  if (input) input.value = '';
  var results = document.getElementById('rx-results');
  var defaultCards = document.getElementById('rx-default-cards');
  if (results) results.style.display = 'none';
  if (defaultCards) defaultCards.style.display = 'block';
}

function switchMode() {
  var body = document.body;
  if (body.classList.contains('professional-mode')) {
    body.classList.remove('professional-mode');
    var link = document.getElementById('rx-mode-link');
    if (link) link.textContent = '切换专业版 →';
  } else {
    body.classList.add('professional-mode');
    var link2 = document.getElementById('rx-mode-link');
    if (link2) link2.textContent = '切换回普通版 →';
  }
}

/* ============================================================
   交互式追问评估（Differential Diagnosis）
   ============================================================ */
var diffState = null; // { tree, keyword, currentStep, answers }

function showDifferential(tree, keyword) {
  diffState = { tree: tree, keyword: keyword, currentStep: 0, answers: {} };

  var defaultCards = document.getElementById('rx-default-cards');
  var results = document.getElementById('rx-results');
  if (defaultCards) defaultCards.style.display = 'none';
  if (results) results.style.display = 'block';

  var count = document.getElementById('rx-results-count');
  if (count) count.textContent = '根据您描述的症状「' + keyword + '」，系统将通过几个简单问题帮您判断具体情况';

  renderDiffStep();
}

function renderDiffStep() {
  var list = document.getElementById('rx-results-list');
  if (!list) return;

  var step = diffState.tree.steps[diffState.currentStep];
  if (!step) { renderDiffResult(); return; }

  // 如果是 RED_FLAG 步骤且已触发，直接显示警告
  if (step.next === 'RED_FLAG' && diffState.answers[step.id] === 'redflag') {
    renderDiffResult();
    return;
  }

  var html = '<div class="rx-diff-card">';
  html += '<div class="rx-diff-step-indicator">问题 ' + (diffState.currentStep + 1) + '/' + diffState.tree.steps.length + '</div>';
  html += '<div class="rx-diff-question">' + step.question + '</div>';
  if (step.guide) {
    html += '<div class="rx-diff-guide">💡 ' + step.guide + '</div>';
  }
  html += '<div class="rx-diff-options">';

  if (step.type === 'radio') {
    step.options.forEach(function(opt, idx) {
      var checked = diffState.answers[step.id] === opt.value ? ' checked' : '';
      html += '<label class="rx-diff-option-label">';
      html += '<input type="radio" name="diff_' + step.id + '" value="' + opt.value + '"' + checked + '>';
      html += '<span class="rx-diff-option-text">' + opt.label + '</span>';
      html += '</label>';
    });
  } else if (step.type === 'checkbox') {
    step.options.forEach(function(opt, idx) {
      var checked = (diffState.answers[step.id] || []).indexOf(opt.value) !== -1 ? ' checked' : '';
      html += '<label class="rx-diff-option-label">';
      html += '<input type="checkbox" name="diff_' + step.id + '" value="' + opt.value + '"' + checked + '>';
      html += '<span class="rx-diff-option-text">' + opt.label + '</span>';
      html += '</label>';
    });
  }

  html += '</div>';
  html += '<div class="rx-diff-actions">';
  if (diffState.currentStep > 0) {
    html += '<button class="rx-diff-btn rx-diff-btn-back" onclick="diffGoBack()">← 上一步</button>';
  }
  html += '<button class="rx-diff-btn rx-diff-btn-next" onclick="diffGoNext()">' + 
          (diffState.currentStep < diffState.tree.steps.length - 1 ? '下一步 →' : '查看结果') + 
          '</button>';
  html += '</div></div>';

  list.innerHTML = html;
}

function diffGoNext() {
  var step = diffState.tree.steps[diffState.currentStep];
  var inputName = 'diff_' + step.id;

  if (step.type === 'radio') {
    var checked = document.querySelector('input[name="' + inputName + '"]:checked');
    if (!checked) { alert('请选择一个选项'); return; }
    diffState.answers[step.id] = checked.value;
  } else if (step.type === 'checkbox') {
    var checkedBoxes = document.querySelectorAll('input[name="' + inputName + '"]:checked');
    diffState.answers[step.id] = Array.from(checkedBoxes).map(function(cb) { return cb.value; });
  }

  // 检查是否 RED_FLAG
  if (step.next === 'RED_FLAG' && diffState.answers[step.id] === 'redflag') {
    renderDiffResult();
    return;
  }

  diffState.currentStep++;
  if (diffState.currentStep >= diffState.tree.steps.length) {
    renderDiffResult();
  } else {
    renderDiffStep();
  }
}

function diffGoBack() {
  if (diffState.currentStep > 0) {
    diffState.currentStep--;
    renderDiffStep();
  }
}

function renderDiffResult() {
  var result = diffState.tree.result(diffState.answers);
  var list = document.getElementById('rx-results-list');
  if (!list) return;

  if (result.redflag) {
    list.innerHTML =
      '<div class="rx-redflag-alert">' +
      '  <div class="rx-redflag-icon">⚠️</div>' +
      '  <div class="rx-redflag-title">安全红线警告</div>' +
      '  <div class="rx-redflag-msg">' + result.redflagMsg + '</div>' +
      '  <button class="rx-result-btn" onclick="location.reload()">重新描述症状</button>' +
      '</div>';
    return;
  }

  var html = '<div class="rx-diff-result">';
  html += '<div class="rx-diff-result-title">🧐 您的评估结果</div>';
  html += '<div class="rx-diff-result-label">' + result.label + '</div>';
  html += '<div class="rx-diff-result-confidence">系统判断置信度：' + result.confidence + '%</div>';
  html += '<div class="rx-diff-result-reason">判断依据：' + result.reason + '</div>';
  html += '<div class="rx-diff-result-action">';
  html += '<button class="rx-result-btn" onclick="startAssessmentFromDiff(\'' + result.specialty + '\', \'' + result.diagnosis + '\')">开始评估 →</button>';
  html += '</div></div>';

  list.innerHTML = html;
}

function startAssessmentFromDiff(specialty, diagnosis) {
  sessionStorage.setItem('rx-specialty', specialty);
  sessionStorage.setItem('rx-diagnosis', diagnosis || '');
  sessionStorage.setItem('rx-symptoms', diffState ? diffState.keyword : '');
  sessionStorage.setItem('rx-diff-answers', JSON.stringify(diffState ? diffState.answers : {}));
  window.location.href = 'assessment.html?specialty=' + specialty;
}
