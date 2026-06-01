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
        var diagnosis = btn.dataset.diagnosis;
        startAssessment(specialty, diagnosis);
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
    showNoResult(keyword);
    return;
  }

  showResults(keyword, matches);
}

function showResults(keyword, matches) {
  var defaultCards = document.getElementById('rx-default-cards');
  var results = document.getElementById('rx-results');
  if (defaultCards) defaultCards.style.display = 'none';
  if (results) results.style.display = 'block';

  var count = document.getElementById('rx-results-count');
  if (count) count.textContent = '找到 ' + matches.length + ' 个相关康复方向';

  var list = document.getElementById('rx-results-list');
  if (!list) return;
  list.innerHTML = '';

  matches.forEach(function(m) {
    var specLabel = m.specialty === 'neurologic' ? '神经康复' :
                   m.specialty === 'orthopedic' ? '骨科康复' : '心肺康复';
    var card = document.createElement('div');
    card.className = 'rx-result-card';
    card.innerHTML =
      '<div class="rx-result-title">' + (m.icon || '📋') + ' ' + m.label + '</div>' +
      '<div class="rx-result-desc">' + (m.description || '') + '</div>' +
      '<div class="rx-result-meta">' +
        '<span class="rx-specialty-tag">' + specLabel + '</span>' +
        '<span class="rx-evidence-tag">循证等级：' + (m.evidenceLevel || 'B') + '</span>' +
      '</div>' +
      '<button class="rx-result-btn" data-specialty="' + m.specialty + '" data-diagnosis="' + (m.diagnosis || '') + '">开始评估 →</button>';
    list.appendChild(card);
  });
}

function startAssessment(specialty, diagnosis) {
  sessionStorage.setItem('rx-specialty', specialty);
  sessionStorage.setItem('rx-diagnosis', diagnosis || '');
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
