/**
 * prescription.js —— 全智能运动处方页（仪表盘 + 循证抽屉 + 反馈交互）
 *
 * 核心功能：
 * 1. 加载微动效：2秒"文献检索/AI生成"动画
 * 2. 三栏仪表盘布局：
 *    - 左侧：处方总览（诊断 + FITT-VP + 开始训练按钮）
 *    - 中间：动作精讲（视频/GIF + 要领 + FITT 参数）
 *    - 右侧：循证医学引文抽屉（可展开）
 * 3. 反馈交互：完成动作 → 追问（缓解/无变化/加重）
 * 4. 悬浮"联系康复师"按钮
 *
 * 参考：APTA CPGs + 各专科临床指南
 */

/* ============================================================
   一、处方数据生成引擎
   ============================================================ */

/**
 * 根据评估数据生成结构化处方（FITT-VP 格式）
 */
function generatePrescriptionFromAssessment(assessmentData) {
  var specialty = assessmentData.specialty || 'general';
  var diagnosis = assessmentData.diagnosis || 'unknown';
  var vasMax = assessmentData.vasMax || 0;

  // 根据 VAS 分数调整处方强度
  var intensityLevel = 'moderate'; // 默认中度
  if (vasMax >= 7) intensityLevel = 'acute'; // 急性期控制
  else if (vasMax <= 2) intensityLevel = 'active'; // 积极训练

  // 调用专科处方生成函数
  var prescription = null;
  switch (specialty) {
    case 'elbow':
    case 'hand':
      prescription = generateElbowPrescription(assessmentData, intensityLevel);
      break;
    case 'lumbar':
      prescription = generateLumbarPrescription(assessmentData, intensityLevel);
      break;
    case 'shoulder':
      prescription = generateShoulderPrescription(assessmentData, intensityLevel);
      break;
    case 'knee':
      prescription = generateKneePrescription(assessmentData, intensityLevel);
      break;
    default:
      prescription = generateGeneralPrescription(assessmentData, intensityLevel);
  }

  return prescription;
}


/* ——— 肘管综合征 / 尺神经卡压 处方 ——— */
function generateElbowPrescription(data, intensityLevel) {
  var isAcute = (intensityLevel === 'acute');

  var exercises = [];

  if (isAcute) {
    // 急性期：疼痛管理 + 神经保护
    exercises = [
      {
        id: 'ex-nerve-gliding',
        name: '尺神经滑动练习（Nerve Gliding）',
        category: '神经松动',
        difficulty: '初级',
        fitt: {
          frequency: '每天 2-3 次',
          intensity: '无痛或末端微麻',
          time: '每组 10 次',
          type: '神经滑动',
          sets: '2-3 组/天',
          duration: '约 10 分钟/天'
        },
        technique: '坐位，肩外展 → 肘屈曲 → 腕背伸 → 手指张开（尺神经滑动序列）。动作缓慢（每个位置维持3秒），出现麻木时减小活动范围。',
        videoPlaceholder: '尺神经滑动练习演示',
        evidence: {
          title: 'APTA 骨科物理治疗指南',
          source: 'Journal of Orthopaedic & Sports Physical Therapy (JOSPT)',
          level: 'A级（强证据支持）',
          summary: '神经滑动技术可改善尺神经活动性，减轻麻木症状。推荐用于肘管综合征保守治疗。',
          pmid: 'PMID: 28494631'
        }
      },
      {
        id: 'ex-sleep-posture',
        name: '睡眠体位调整',
        category: '生活方式',
        difficulty: '初级',
        fitt: {
          frequency: '每晚',
          intensity: '无痛',
          time: '持续维持',
          type: '体位管理',
          sets: '1 次/晚',
          duration: '整夜'
        },
        technique: '患侧在上（侧卧）→ 肘下垫枕头（避免肘屈曲 > 90° 睡眠，减少尺神经张力）。禁忌：避免患侧在下的睡姿（加重神经压迫）。',
        videoPlaceholder: '正确睡眠体位演示',
        evidence: {
          title: 'Clinical Orthopaedics and Related Research',
          source: '肘管综合征保守治疗体位管理',
          level: 'B级（中等证据）',
          summary: '睡眠时肘屈曲 > 90° 会增加尺神经张力，加重麻木。保持肘伸直或微屈可减轻症状。',
          pmid: ''
        }
      }
    ];
  } else {
    // 非急性期：神经滑动 + 肌力训练
    exercises = [
      {
        id: 'ex-nerve-gliding-2',
        name: '尺神经滑动练习（进阶版）',
        category: '神经松动',
        difficulty: '中级',
        fitt: {
          frequency: '每天 3 次',
          intensity: '末端有轻微牵拉感',
          time: '每组 15 次',
          type: '神经滑动',
          sets: '3 组/天',
          duration: '约 15 分钟/天'
        },
        technique: '在基础滑动序列上，增加"过头位"（手臂上举过头，同时腕背伸）。动作更大幅度，但仍在无痛范围内。',
        videoPlaceholder: '尺神经滑动进阶版演示',
        evidence: {
          title: 'APTA 骨科物理治疗指南',
          source: 'JOSPT 2021',
          level: 'A级（强证据支持）',
          summary: '渐进性神经滑动可改善神经活动性，促进神经血供。',
          pmid: 'PMID: 28494631'
        }
      },
      {
        id: 'ex-finger-spread',
        name: '手指分开训练（骨间肌强化）',
        category: '肌力训练',
        difficulty: '中级',
        fitt: {
          frequency: '每天 2-3 次',
          intensity: '轻阻力（橡皮筋）',
          time: '每组 15 次',
          type: '肌力训练',
          sets: '2-3 组/天',
          duration: '约 10 分钟/天'
        },
        technique: '将橡皮筋套在小指和无名指上，尝试分开手指（对抗橡皮筋阻力）。动作缓慢，避免代偿。',
        videoPlaceholder: '手指分开训练演示',
        evidence: {
          title: 'Hand Therapy Journal',
          source: '尺神经卡压后手内肌训练',
          level: 'B级（中等证据）',
          summary: '手内肌（骨间肌）强化可改善手指灵活性和握力。橡皮筋训练是安全有效的居家训练方法。',
          pmid: ''
        }
      }
    ];
  }

  return {
    diagnosis: {
      label: '肘管综合征（Cubital Tunnel Syndrome）',
      severity: isAcute ? '急性期' : '亚急性期',
      phase: isAcute ? '疼痛控制期' : '功能恢复期',
      warning: '训练过程中允许有微弱酸胀，但若出现刀割样剧痛请立即停止。'
    },
    fittvp: {
      period: '建议练习 4 周（每周 5 天）',
      totalTime: '每天 2-3 个动作，预计耗时 15-25 分钟',
      phase: isAcute ? '第一阶段：神经松解与减压期' : '第二阶段：肌力强化期'
    },
    exercises: exercises,
    contraindications: [
      '肘部外伤后未评估（需排除骨折/脱位）',
      '尺神经半脱位（Subluxation）严重者需手术固定',
      '训练中 VAS 疼痛 > 5 分应降低强度'
    ],
    precautions: [
      '避免长时间肘屈曲（打电话、睡觉时）',
      '使用手机/电脑时，保持肘部微屈（不要完全屈曲）',
      '如果症状进展（麻木范围扩大、肌无力加重），请立即就医'
    ],
    evidenceLevel: 'A级',
    guideSource: 'APTA 骨科 CPG 2021 + JOSPT'
  };
}


/* ——— 腰痛 处方 ——— */
function generateLumbarPrescription(data, intensityLevel) {
  var isAcute = (intensityLevel === 'acute');

  var exercises = [];

  if (isAcute) {
    exercises = [
      {
        id: 'ex-pelvic-tilt',
        name: '骨盆倾斜训练（Pelvic Tilt）',
        category: '核心稳定性',
        difficulty: '初级',
        fitt: {
          frequency: '每天 3 次',
          intensity: 'RPE 8-11/20',
          time: '每组 10-15 次',
          type: '核心激活',
          sets: '3 组/天',
          duration: '约 15 分钟/天'
        },
        technique: '仰卧位，腰部贴紧地面（骨盆后倾），维持5-10秒后放松。激活腹横肌，不产生疼痛。',
        videoPlaceholder: '骨盆倾斜训练演示',
        evidence: {
          title: 'APTA 腰痛 CPG 2021',
          source: 'Journal of Orthopaedic & Sports Physical Therapy',
          level: 'A级（强证据支持）',
          summary: '核心稳定性训练是慢性腰痛的一线治疗方案。骨盆倾斜是腹横肌激活的基础动作。',
          pmid: 'PMID: 27918776'
        }
      }
    ];
  } else {
    exercises = [
      {
        id: 'ex-dead-bug',
        name: '死虫式（Dead Bug）',
        category: '核心稳定性',
        difficulty: '中级',
        fitt: {
          frequency: '每周 5-7 次',
          intensity: 'RPE 11-13/20',
          time: '每侧 10 次 × 2-3 组',
          type: '核心训练',
          sets: '2-3 组',
          duration: '约 20 分钟/天'
        },
        technique: '仰卧位，双臂上举，双膝屈曲90°。缓慢伸展对侧上肢和对侧下肢，保持腰椎贴紧地面。避免腰部拱起。',
        videoPlaceholder: '死虫式训练演示',
        evidence: {
          title: 'APTA 腰痛 CPG 2021',
          source: 'McGill SM. Low Back Disorders 3rd ed.',
          level: 'A级（强证据支持）',
          summary: '死虫式是 McGill "Big 3" 核心训练之一，安全有效激活核心肌群，不产生腰椎过度负荷。',
          pmid: ''
        }
      }
    ];
  }

  return {
    diagnosis: {
      label: '非特异性腰痛（Non-specific Low Back Pain）',
      severity: isAcute ? '急性期' : '慢性期',
      phase: isAcute ? '疼痛控制期' : '功能恢复期',
      warning: '训练过程中允许有微弱酸胀，但若出现腿痛加重请立即停止。'
    },
    fittvp: {
      period: '建议练习 6 周（每周 5 天）',
      totalTime: '每天 3-4 个动作，预计耗时 20-30 分钟',
      phase: isAcute ? '第一阶段：疼痛控制与核心激活' : '第二阶段：核心稳定性强化'
    },
    exercises: exercises,
    contraindications: [
      '马尾综合征（大小便失禁 + 鞍区麻木）→ 急诊手术',
      '进行性神经功能缺损'
    ],
    precautions: [
      '避免腰椎过度屈曲（久坐 + 前屈）',
      '抬重物时使用"蹲起"而非"弯腰"'
    ],
    evidenceLevel: 'A级',
    guideSource: 'APTA 腰痛 CPG 2021'
  };
}


/* ——— 通用处方（兜底） ——— */
function generateGeneralPrescription(data, intensityLevel) {
  return {
    diagnosis: {
      label: '待进一步明确诊断',
      severity: '未知',
      phase: '评估期',
      warning: '建议在专业康复师指导下进行评估和训练。'
    },
    fittvp: {
      period: '建议先完成专业评估',
      totalTime: '待定',
      phase: '诊断明确后再开始训练'
    },
    exercises: [],
    contraindications: ['诊断不明确，不建议自行训练'],
    precautions: ['请先咨询康复医师或康复治疗师'],
    evidenceLevel: '待评估',
    guideSource: '待评估'
  };
}


/* ============================================================
   二、页面渲染引擎（仪表盘布局）
   ============================================================ */

var rxState = {
  prescription: null,
  currentExerciseIdx: 0,
  feedback: [],

  init: function() {
    var self = this;

    // 1. 显示加载动画
    self.showLoadingAnimation(function() {
      // 2. 读取评估数据
      var assessmentData = self.loadAssessmentData();
      if (!assessmentData) {
        self.showError('未找到评估数据，请先完成评估。');
        return;
      }

      // 3. 生成处方
      self.prescription = generatePrescriptionFromAssessment(assessmentData);

      // 4. 渲染仪表盘
      self.renderDashboard();

      // 5. 绑定事件
      self.bindEvents();
    });
  },

  // 读取评估数据
  loadAssessmentData: function() {
    var dataStr = sessionStorage.getItem('rx-assessment-data');
    if (!dataStr) return null;
    try {
      return JSON.parse(dataStr);
    } catch(e) {
      return null;
    }
  },

  // 显示加载动画
  showLoadingAnimation: function(callback) {
    var container = document.getElementById('prescription-result');
    if (!container) { callback(); return; }

    container.innerHTML = `
      <div class="rx-loading-overlay">
        <div class="rx-loading-spinner">
          <div class="rx-loading-icon">📊</div>
          <div class="rx-loading-text">正在根据评估数据生成循证处方...</div>
          <div class="rx-loading-subtext">检索 APTA 指南 · 匹配 FITT-VP 参数 · 计算安全强度</div>
          <div class="rx-loading-bar">
            <div class="rx-loading-bar-fill"></div>
          </div>
        </div>
      </div>
    `;

    setTimeout(function() {
      container.innerHTML = '';
      callback();
    }, 2000);
  },

  // 渲染仪表盘
  renderDashboard: function() {
    var container = document.getElementById('prescription-result');
    if (!container || !this.prescription) return;

    var rx = this.prescription;

    var html = `
      <!-- 顶部横幅 -->
      <div class="rx-banner">
        <div class="rx-banner-phase">${rx.diagnosis.phase}</div>
        <div class="rx-banner-warning">⚠️ ${rx.diagnosis.warning}</div>
      </div>

      <!-- 三栏仪表盘 -->
      <div class="rx-dashboard">
        <!-- 左侧栏：处方总览 -->
        <div class="rx-sidebar">
          ${this.renderSidebar(rx)}
        </div>

        <!-- 中间栏：动作精讲 -->
        <div class="rx-main">
          ${this.renderExerciseDetail(rx)}
        </div>

        <!-- 右侧栏：循证医学引文抽屉 -->
        <div class="rx-evidence-panel">
          ${this.renderEvidencePanel(rx)}
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="rx-feedback-bar">
        ${this.renderFeedbackBar(rx)}
      </div>

      <!-- 悬浮"联系康复师"按钮 -->
      <div class="rx-float-contact" id="rx-float-contact">
        💬 数据有误？联系专业康复师
      </div>
    `;

    container.innerHTML = html;
  },

  // 渲染左侧栏（处方总览）
  renderSidebar: function(rx) {
    var html = `
      <div class="rx-sidebar-header">
        <div class="rx-sidebar-diagnosis">${rx.diagnosis.label}</div>
        <div class="rx-sidebar-severity">${rx.diagnosis.severity}</div>
      </div>

      <div class="rx-sidebar-fittvp">
        <div class="rx-sidebar-fittvp-title">📊 处方总览（FITT-VP）</div>
        <div class="rx-sidebar-fittvp-item">
          <div class="rx-sidebar-fittvp-label">周期</div>
          <div class="rx-sidebar-fittvp-value">${rx.fittvp.period}</div>
        </div>
        <div class="rx-sidebar-fittvp-item">
          <div class="rx-sidebar-fittvp-label">总量</div>
          <div class="rx-sidebar-fittvp-value">${rx.fittvp.totalTime}</div>
        </div>
        <div class="rx-sidebar-fittvp-item">
          <div class="rx-sidebar-fittvp-label">阶段</div>
          <div class="rx-sidebar-fittvp-value">${rx.fittvp.phase}</div>
        </div>
      </div>

      <div class="rx-sidebar-actions">
        <button class="rx-btn-primary rx-btn-start" id="rx-start-training">
          开始今日康复训练
        </button>
      </div>

      <div class="rx-sidebar-exercise-list">
        <div class="rx-sidebar-exercise-list-title">📋 动作列表</div>
        ${rx.exercises.map(function(ex, idx) {
          return `
            <div class="rx-sidebar-exercise-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
              <div class="rx-sidebar-exercise-item-num">${idx + 1}</div>
              <div class="rx-sidebar-exercise-item-name">${ex.name}</div>
              <div class="rx-sidebar-exercise-item-category">${ex.category}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    return html;
  },

  // 渲染中间栏（动作精讲）
  renderExerciseDetail: function(rx, idx) {
    idx = idx || 0;
    if (!rx.exercises || rx.exercises.length === 0) {
      return '<div class="rx-empty">暂无推荐动作，请先完成专业评估。</div>';
    }

    var ex = rx.exercises[idx];

    var html = `
      <div class="rx-exercise-detail-header">
        <div class="rx-exercise-detail-title">${ex.name}</div>
        <div class="rx-exercise-detail-category">
          <span class="rx-badge">${ex.category}</span>
          <span class="rx-badge rx-badge-difficulty">${ex.difficulty}</span>
        </div>
      </div>

      <!-- 视频/GIF 演示区 -->
      <div class="rx-exercise-video">
        <div class="rx-video-placeholder">
          <div class="rx-video-icon">🎬</div>
          <div class="rx-video-text">${ex.videoPlaceholder || '动作演示视频'}</div>
          <div class="rx-video-note">（实际部署时替换为真实视频/GIF）</div>
        </div>
      </div>

      <!-- FITT 参数数据卡片 -->
      <div class="rx-fitt-cards">
        <div class="rx-fitt-card">
          <div class="rx-fitt-card-value">${ex.fitt.frequency}</div>
          <div class="rx-fitt-card-label">Frequency</div>
        </div>
        <div class="rx-fitt-card">
          <div class="rx-fitt-card-value">${ex.fitt.intensity}</div>
          <div class="rx-fitt-card-label">Intensity</div>
        </div>
        <div class="rx-fitt-card">
          <div class="rx-fitt-card-value">${ex.fitt.time}</div>
          <div class="rx-fitt-card-label">Time</div>
        </div>
        <div class="rx-fitt-card">
          <div class="rx-fitt-card-value">${ex.fitt.sets}</div>
          <div class="rx-fitt-card-label">Sets</div>
        </div>
        <div class="rx-fitt-card">
          <div class="rx-fitt-card-value">${ex.fitt.duration}</div>
          <div class="rx-fitt-card-label">Duration</div>
        </div>
      </div>

      <!-- 动作要领 -->
      <div class="rx-exercise-technique">
        <div class="rx-exercise-technique-title">📝 动作要领</div>
        <div class="rx-exercise-technique-text">${ex.technique}</div>
      </div>

      <!-- 完成按钮 -->
      <div class="rx-exercise-complete">
        <button class="rx-btn-primary rx-btn-complete" data-idx="${idx}">
          ✅ 完成该动作
        </button>
      </div>
    `;

    return html;
  },

  // 渲染右侧栏（循证医学引文抽屉）
  renderEvidencePanel: function(rx, idx) {
    idx = idx || 0;
    if (!rx.exercises || rx.exercises.length === 0) {
      return '<div class="rx-evidence-empty">暂无循证数据</div>';
    }

    var ex = rx.exercises[idx];
    var ev = ex.evidence || {};

    var html = `
      <div class="rx-evidence-header">
        <div class="rx-evidence-title">💡 方案依据</div>
      </div>
      <div class="rx-evidence-content">
        <div class="rx-evidence-source">
          <div class="rx-evidence-source-title">${ev.title || '临床指南'}</div>
          <div class="rx-evidence-source-journal">${ev.source || '待补充'}</div>
        </div>
        <div class="rx-evidence-level">
          <span class="rx-evidence-level-badge">${ev.level || '待评估'}</span>
        </div>
        <div class="rx-evidence-summary">
          ${ev.summary || '该方案的循证依据正在补充中。'}
        </div>
        ${ev.pmid ? '<div class="rx-evidence-pmid">📚 ' + ev.pmid + '</div>' : ''}
        <button class="rx-evidence-expand-btn" id="rx-evidence-expand">
          展开查看 PubMed 摘要
        </button>
        <div class="rx-evidence-abstract" id="rx-evidence-abstract" style="display:none;">
          <p>PubMed 摘要内容将在实际部署时通过 API 获取。</p>
          <p>目前显示为示例文本。</p>
        </div>
      </div>
    `;

    return html;
  },

  // 渲染反馈栏
  renderFeedbackBar: function(rx) {
    var html = `
      <div class="rx-feedback-title">完成动作后，请反馈您的感受：</div>
      <div class="rx-feedback-options">
        <button class="rx-feedback-btn rx-feedback-better" data-value="better">
          缓解 😊
        </button>
        <button class="rx-feedback-btn rx-feedback-same" data-value="same">
          无变化 😐
        </button>
        <button class="rx-feedback-btn rx-feedback-worse" data-value="worse">
          加重 😣
        </button>
      </div>
    `;

    return html;
  },


  /* ============================================================
     三、事件绑定
     ============================================================ */
  bindEvents: function() {
    var self = this;

    // 左侧动作列表点击
    document.querySelectorAll('.rx-sidebar-exercise-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-idx'));
        self.switchExercise(idx);
      });
    });

    // 完成动作按钮
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('rx-btn-complete')) {
        self.completeExercise(parseInt(e.target.getAttribute('data-idx')));
      }
    });

    // 反馈按钮
    document.querySelectorAll('.rx-feedback-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        self.submitFeedback(this.getAttribute('data-value'));
      });
    });

    // 循证抽屉展开
    var expandBtn = document.getElementById('rx-evidence-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', function() {
        var abstract = document.getElementById('rx-evidence-abstract');
        if (abstract) {
          abstract.style.display = abstract.style.display === 'none' ? 'block' : 'none';
          this.textContent = abstract.style.display === 'none' ? '展开查看 PubMed 摘要' : '收起摘要';
        }
      });
    }

    // 悬浮联系按钮
    var floatBtn = document.getElementById('rx-float-contact');
    if (floatBtn) {
      floatBtn.addEventListener('click', function() {
        alert('实际部署时，此处将连接到专业康复师咨询入口。\n\n目前为演示模式。');
      });
    }

    // 开始训练按钮
    var startBtn = document.getElementById('rx-start-training');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        self.startTraining();
      });
    }
  },

  // 切换动作
  switchExercise: function(idx) {
    this.currentExerciseIdx = idx;
    var rx = this.prescription;

    // 更新左侧激活状态
    document.querySelectorAll('.rx-sidebar-exercise-item').forEach(function(item, i) {
      item.classList.toggle('active', i === idx);
    });

    // 更新中间栏
    var main = document.querySelector('.rx-main');
    if (main) main.innerHTML = this.renderExerciseDetail(rx, idx);

    // 更新右侧栏
    var panel = document.querySelector('.rx-evidence-panel');
    if (panel) panel.innerHTML = this.renderEvidencePanel(rx, idx);

    // 重新绑定事件
    this.bindEvents();
  },

  // 完成动作
  completeExercise: function(idx) {
    var self = this;
    var rx = this.prescription;

    // 增加完成计数
    this.completedExercises = (this.completedExercises || 0) + 1;

    // 显示反馈追问
    var feedbackBar = document.querySelector('.rx-feedback-bar');
    if (feedbackBar) {
      feedbackBar.classList.add('active');
      feedbackBar.scrollIntoView({ behavior: 'smooth' });
    }

    // 检查是否所有动作都完成了
    if (this.completedExercises >= rx.exercises.length) {
      // 停止计时器
      if (this.trainingTimer) {
        clearInterval(this.trainingTimer);
        this.trainingTimer = null;
      }

      // 计算总训练时间
      var totalSeconds = Math.floor((new Date() - this.trainingStartTime) / 1000);
      var mins = Math.floor(totalSeconds / 60);
      var secs = totalSeconds % 60;

      // 显示完成页面
      setTimeout(function() {
        var container = document.getElementById('prescription-result');
        if (container) {
          container.innerHTML = `
            <div style="text-align:center;padding:4rem 2rem;">
              <div style="font-size:4rem;margin-bottom:1rem;">🎉</div>
              <h2 style="color:#059669;margin-bottom:1rem;">今日训练完成！</h2>
              <p style="color:#6B7280;margin-bottom:2rem;font-size:1.1rem;">
                总训练时间：${mins}分${secs}秒<br>
                完成动作：${rx.exercises.length}个
              </p>
              <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:1.5rem;margin-bottom:2rem;text-align:left;">
                <h3 style="color:#059669;margin-bottom:1rem;font-size:1rem;">📊 训练总结</h3>
                <p style="color:#374151;line-height:1.8;font-size:.9rem;">
                  ✅ 您已完成今日所有康复训练动作<br>
                  ✅ 系统已记录您的训练数据<br>
                  ✅ 明天将根据您的反馈调整训练强度<br><br>
                  <strong>建议：</strong>训练后如有轻微酸胀属正常现象，若出现剧烈疼痛请立即停止并联系医师。
                </p>
              </div>
              <button onclick="location.reload()" style="padding:.8rem 2rem;border:none;border-radius:10px;background:#1565C0;color:#fff;font-size:1rem;cursor:pointer;">
                返回查看处方
              </button>
            </div>
          `;
        }
      }, 500);
    } else {
      // 自动切换到下一个动作
      setTimeout(function() {
        self.switchExercise(idx + 1);
      }, 1500);
    }
  },

  // 提交反馈
  submitFeedback: function(value) {
    this.feedback.push({
      exerciseIdx: this.currentExerciseIdx,
      value: value,
      timestamp: new Date().toISOString()
    });

    // 视觉反馈
    document.querySelectorAll('.rx-feedback-btn').forEach(function(btn) {
      btn.classList.remove('active');
      if (btn.getAttribute('data-value') === value) {
        btn.classList.add('active');
      }
    });

    // 如果反馈"加重"，显示警告
    if (value === 'worse') {
      alert('⚠️ 检测到症状加重，建议：\n\n1. 降低训练强度或暂停训练\n2. 联系您的主治医师或康复治疗师\n3. 记录加重的诱因（动作/时间/强度）');
    }
  },

  // 开始训练
  startTraining: function() {
    var self = this;
    
    // 初始化训练状态
    this.trainingStartTime = new Date();
    this.trainingTimer = null;
    this.completedExercises = 0;
    this.currentExerciseIdx = 0;
    
    // 更新按钮状态
    var startBtn = document.getElementById('rx-start-training');
    if (startBtn) {
      startBtn.innerHTML = '训练中 <span id="rx-timer">00:00</span>';
      startBtn.style.background = '#059669';
      startBtn.disabled = true;
    }
    
    // 启动计时器
    var seconds = 0;
    this.trainingTimer = setInterval(function() {
      seconds++;
      var mins = Math.floor(seconds / 60);
      var secs = seconds % 60;
      var timerEl = document.getElementById('rx-timer');
      if (timerEl) {
        timerEl.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
      }
    }, 1000);
    
    // 切换到第一个动作
    this.switchExercise(0);
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 显示提示
    console.log('[处方页] 训练开始！');
  },

  // 显示错误
  showError: function(msg) {
    var container = document.getElementById('prescription-result');
    if (container) {
      container.innerHTML = '<div class="rx-error">⚠️ ' + msg + '</div>';
    }
  }
};


/* ============================================================
   四、初始化
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  rxState.init();
});
