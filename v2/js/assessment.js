/**
 * assessment.js —— 动态康复评估页（Stepper + 单卡聚焦 + VAS 颜色联动）
 *
 * 核心交互：
 * 1. 进度阶梯（Stepper）：顶部显示 1.疼痛与功能评分 → 2.关节活动度筛查 → 3.安全红线确认
 * 2. 单题卡片流（Single Card Focus）：每次只显示一个评估维度
 * 3. VAS 评分卡片：横向滑块，0-2绿 / 3-5黄 / 6-8橙 / 9-10红，算法联动
 * 4. ROM/肌力交互勾选：左侧图示 + 右侧二选一
 * 5. 自动诊断确定（无需用户选择）
 *
 * 参考：《康复评定学》第3版 + 各专科 CPGs
 */

/* ============================================================
   一、评估流程配置（Stepper 步骤 + 单卡序列）
   ============================================================ */

/**
 * 评估流程按 Stepper 分为 3 大步，每步包含多个卡片
 * 每张卡片 = 一个评估维度（VAS / 量表 / ROM / 红线）
 */
var assessmentFlow = {
  // 从 sessionStorage 读取鉴别诊断结果，动态生成流程
  loadFromSession: function() {
    var diffResult = sessionStorage.getItem('rx-diff-result');
    if (diffResult) {
      try {
        return JSON.parse(diffResult);
      } catch(e) {
        return null;
      }
    }
    return null;
  },

  // 根据鉴别诊断结果，生成个性化评估流程
  buildFlow: function(diffResult) {
    // 优先使用 asState.specialty（从 URL 参数或手动设置），其次使用 diffResult.specialty
    var diagnosis = (diffResult && diffResult.diagnosis) ? diffResult.diagnosis : 'unknown';
    var specialty = asState.specialty || (diffResult && diffResult.specialty) || 'general';
    
    // 调试日志
    console.log('[assessment.js] buildFlow() 最终使用的: diagnosis=' + diagnosis + ', specialty=' + specialty);
    
    // 基础流程（所有患者共用）
    var flow = {
      steps: [
        {
          title: '疼痛与功能评分',
          icon: '🔴',
          cards: [] // 动态填充
        },
        {
          title: '关节活动度与肌力筛查',
          icon: '💪',
          cards: []
        },
        {
          title: '安全红线确认',
          icon: '🚨',
          cards: []
        }
      ]
    };

    // —— 第1步：疼痛与功能评分 ——
    flow.steps[0].cards = [
      {
        id: 'vas_pain',
        type: 'vas',
        title: '疼痛视觉模拟评分（VAS）',
        subtitle: '请在下方滑块上选择最符合您当前疼痛/麻木程度的位置',
        guide: '0分 = 无痛/无麻木；10分 = 无法忍受的剧痛',
        items: [
          { id: 'vas_rest', label: '静息时（不活动时）', key: 'vas_rest' },
          { id: 'vas_movement', label: '活动时（抬手/走路/弯腰等）', key: 'vas_movement' },
          { id: 'vas_night', label: '夜间（影响睡眠的程度）', key: 'vas_night' }
        ],
        evidence: '《康复评定学》第3版 Ch.4；APTA CPGs Level A'
      },
      {
        id: 'functional_limit',
        type: 'radio_card',
        title: '对日常生活的影响程度',
        subtitle: '请选择最符合您当前状态的表述',
        options: [
          { value: 'mild', label: '影响不大', desc: '能正常工作/学习，只是拿筷子、系扣子稍微有点笨拙', icon: '🟢' },
          { value: 'moderate', label: '有些影响', desc: '写字、用剪刀、开瓶盖这些精细动作明显变差，需要放慢速度', icon: '🟡' },
          { value: 'severe', label: '影响很大', desc: '扣纽扣、拉拉链、拧毛巾都困难，可能需要用另一只手帮忙', icon: '🟠' },
          { value: 'extreme', label: '几乎做不了', desc: '连拿手机、翻书页都困难，基本做不了精细动作', icon: '🔴' }
        ],
        key: 'functional_limit'
      }
    ];

    // —— 第2步：关节活动度与肌力筛查（根据诊断动态生成）——
    var romCards = this.buildROMCards(diagnosis, specialty);
    flow.steps[1].cards = romCards;

    // —— 第3步：安全红线确认 ——
    flow.steps[2].cards = [
      {
        id: 'redflags',
        type: 'redflag_check',
        title: '安全红线筛查（重要！）',
        subtitle: '以下问题如有任何一项为"是"，请立即停止训练并就医',
        items: this.getRedFlagItems(diagnosis, specialty),
        evidence: 'AACVPR 2024 + APTA CPGs 安全准则'
      },
      {
        id: 'confirm',
        type: 'confirm',
        title: '评估确认',
        subtitle: '请确认以上信息准确无误，系统将据此生成个性化运动处方',
        summary: true // 显示评估摘要
      }
    ];

    return flow;
  },

  // 根据诊断生成 ROM/肌力评估卡片
  buildROMCards: function(diagnosis, specialty) {
    var cards = [];
    
    // 调试日志
    console.log('[assessment.js] buildROMCards() 收到: diagnosis=' + diagnosis + ', specialty=' + specialty);

    // 肘管综合征 / 尺神经卡压 / 手外科相关
    // 修复：添加更多匹配条件，确保能正确匹配
    if (specialty === 'hand' || specialty === 'cervical' || 
        diagnosis === 'cubital_tunnel' || diagnosis === 'ulnar_canal' || 
        diagnosis === 'cervical_radiculopathy' || diagnosis === 'cervical_myelopathy') {
      cards = [
        {
          id: 'rom_elbow',
          type: 'rom_check',
          title: '肘关节活动度自查',
          subtitle: '请在不诱发疼痛的前提下，尝试以下动作',
          items: [
            {
              id: 'elbow_extend',
              label: '您的左肘关节能完全伸直吗？',
              leftImg: 'elbow_extend', // 预留图片标识
              options: [
                { value: 'normal', label: '可以，和右手一样能完全伸直', icon: '✅' },
                { value: 'limited', label: '不行，伸直时会卡住或诱发麻木', icon: '⚠️' },
                { value: 'pain', label: '伸直时明显疼痛或麻木加重', icon: '🚨' }
              ],
              key: 'elbow_extend'
            },
            {
              id: 'elbow_flexion',
              label: '您的左肘关节能完全屈曲吗？（手心能碰到肩膀吗？）',
              leftImg: 'elbow_flex',
              options: [
                { value: 'normal', label: '可以，活动范围正常', icon: '✅' },
                { value: 'limited', label: '屈曲范围变小，碰不到肩膀', icon: '⚠️' },
                { value: 'pain', label: '屈曲时疼痛或麻木加重', icon: '🚨' }
              ],
              key: 'elbow_flexion'
            }
          ]
        },
        {
          id: 'strength_finger',
          type: 'rom_check',
          title: '手指肌力自查（尺神经支配肌群）',
          subtitle: '尺神经支配骨间肌（手指分开/并拢）和小指屈肌',
          items: [
            {
              id: 'finger_spread',
              label: '请尝试将手指分开（特别是小指和无名指），然后用另一只手去推',
              leftImg: 'finger_spread',
              options: [
                { value: 'normal', label: '能有力分开，推不动', icon: '✅' },
                { value: 'weak', label: '能分开但力量弱，能被推开', icon: '⚠️' },
                { value: 'cannot', label: '完全无法分开小指和无名指', icon: '🚨' }
              ],
              key: 'finger_spread'
            },
            {
              id: 'pinch_test',
              label: '请用小指和拇指夹住一张纸，另一只手尝试抽出',
              leftImg: 'pinch_test',
              options: [
                { value: 'normal', label: '能夹紧，纸抽不出来', icon: '✅' },
                { value: 'weak', label: '能夹住但力量弱，纸能被抽出', icon: '⚠️' },
                { value: 'cannot', label: '夹不住，纸直接掉下来', icon: '🚨' }
              ],
              key: 'pinch_test',
              guide: '夹纸试验（Froment征）是检查尺神经功能的经典体格检查'
            }
          ]
        }
      ];
    }
    // 腰痛（根据 specialty 或 diagnosis 匹配）
    else if (specialty === 'lumbar' || specialty === 'cervical') {
      cards = [
        {
          id: 'rom_lumbar',
          type: 'rom_check',
          title: '腰椎活动度自查',
          subtitle: '请在疼痛允许范围内尝试以下动作',
          items: [
            {
              id: 'lumbar_flexion',
              label: '弯腰摸脚尖（腰椎屈曲），能弯到什么程度？',
              leftImg: 'lumbar_flexion',
              options: [
                { value: 'normal', label: '能摸到脚尖或地面', icon: '✅' },
                { value: 'limited', label: '只能摸到小腿或膝盖', icon: '⚠️' },
                { value: 'severe', label: '弯腰 < 30° 或诱发腿痛', icon: '🚨' }
              ],
              key: 'lumbar_flexion'
            },
            {
              id: 'lumbar_extension',
              label: '向后仰（腰椎伸展），是否会诱发疼痛或腿痛？',
              leftImg: 'lumbar_extension',
              options: [
                { value: 'normal', label: '无疼痛，活动正常', icon: '✅' },
                { value: 'pain_local', label: '腰部局部疼痛，无腿痛', icon: '⚠️' },
                { value: 'pain_radicular', label: '诱发下肢放射痛（提示间盘突出）', icon: '🚨' }
              ],
              key: 'lumbar_extension'
            }
          ]
        },
        {
          id: 'slr_test',
          type: 'rom_check',
          title: '直腿抬高试验（SLR）自查',
          subtitle: '仰卧，伸直膝关节，抬起患肢，观察是否诱发放射痛',
          items: [
            {
              id: 'slr_left',
              label: '抬左腿时，是否在 < 70° 时出现下肢放射痛？',
              leftImg: 'slr_test',
              options: [
                { value: 'negative', label: '阴性（> 70° 也无放射痛）', icon: '✅' },
                { value: 'positive', label: '阳性（< 70° 出现放射痛，提示神经根受压）', icon: '🚨' },
                { value: 'not_tested', label: '未测试 / 不确定', icon: '❓' }
              ],
              key: 'slr_left',
              guide: 'SLR < 70° 出现放射痛是腰椎间盘突出症的特异性体征'
            }
          ]
        }
      ];
    }
    // 肩痛（根据 specialty 匹配）
    else if (specialty === 'shoulder') {
      cards = [
        {
          id: 'rom_shoulder',
          type: 'rom_check',
          title: '肩关节活动度自查',
          subtitle: '请尝试以下动作，观察是否有疼痛或活动受限',
          items: [
            {
              id: 'shoulder_flexion',
              label: '患侧手臂能举多高？（前屈活动度）',
              leftImg: 'shoulder_flexion',
              options: [
                { value: 'normal', label: '能举过头顶（180°），无痛', icon: '✅' },
                { value: 'limited', label: '能举高但 < 180°，或有疼痛', icon: '⚠️' },
                { value: 'severe', label: '严重受限（< 90°）或剧痛', icon: '🚨' }
              ],
              key: 'shoulder_flexion'
            },
            {
              id: 'shoulder_abduction',
              label: '患侧手臂能向侧面抬起多高？（外展活动度）',
              leftImg: 'shoulder_abduction',
              options: [
                { value: 'normal', label: '能抬到侧面耳朵高度（180°）', icon: '✅' },
                { value: 'limited', label: '60-120° 时有疼痛（撞击区）', icon: '⚠️' },
                { value: 'severe', label: '完全无法外展或剧痛', icon: '🚨' }
              ],
              key: 'shoulder_abduction',
              guide: '肩外展 60-120° 疼痛是肩峰下撞击综合征的典型表现'
            }
          ]
        }
      ];
    }
    // 膝痛（默认）
    else {
      cards = [
        {
          id: 'rom_knee',
          type: 'rom_check',
          title: '膝关节活动度自查',
          subtitle: '请在疼痛允许范围内尝试以下动作',
          items: [
            {
              id: 'knee_flexion',
              label: '患侧膝关节能屈曲到多少度？（脚跟能否碰到臀部？）',
              leftImg: 'knee_flexion',
              options: [
                { value: 'normal', label: '能碰到臀部（> 135°）', icon: '✅' },
                { value: 'limited', label: '屈曲受限（< 120°）', icon: '⚠️' },
                { value: 'severe', label: '严重受限（< 90°）或剧痛', icon: '🚨' }
              ],
              key: 'knee_flexion'
            }
          ]
        }
      ];
    }

    return cards;
  },

  // 安全红线问题（根据诊断筛选）
  getRedFlagItems: function(diagnosis, specialty) {
    var items = [
      {
        id: 'red_fever',
        label: '目前有发热（体温 > 38°C）或急性感染症状？',
        key: 'red_fever',
        severity: 'absolute'
      },
      {
        id: 'red_trauma',
        label: '近期（48小时内）有外伤史或跌倒史？',
        key: 'red_trauma',
        severity: 'absolute'
      },
      {
        id: 'red_numbness_progress',
        label: '麻木/无力症状在快速进展（一周内明显加重）？',
        key: 'red_numbness_progress',
        severity: 'urgent'
      }
    ];

    // 根据诊断添加特异性红线
    if (diagnosis === 'cervical_radiculopathy' || diagnosis === 'cervical_myelopathy') {
      items.push({
        id: 'red_gait',
        label: '走路有踩棉花感、不稳、或大小便功能异常？（警惕脊髓型颈椎病）',
        key: 'red_gait',
        severity: 'absolute'
      });
    }

    if (diagnosis === 'lumbar_disc' || diagnosis === 'lumbar_stenosis') {
      items.push({
        id: 'red_cauda',
        label: '有大小便失禁或鞍区（会阴部）麻木？（警惕马尾综合征，急诊手术）',
        key: 'red_cauda',
        severity: 'absolute'
      });
    }

    return items;
  }
};


/* ============================================================
   二、全局状态管理
   ============================================================ */
var asState = {
  currentStep: 0,      // 当前 Stepper 步骤索引
  currentCard: 0,      // 当前卡片索引（在当前步骤内）
  totalSteps: 3,       // 总步骤数
  flow: null,          // 评估流程配置
  data: {},            // 评估数据收集
  diffResult: null,    // 鉴别诊断结果

  // 初始化
  init: function() {
    // 使用手动设置的 diffResult，如果没有则尝试从 sessionStorage 读取
    if (!this.diffResult) {
      this.diffResult = assessmentFlow.loadFromSession();
    }
    
    // 调试日志
    console.log('[asState.init()] this.diffResult:', this.diffResult);
    console.log('[asState.init()] this.specialty:', this.specialty);
    
    this.flow = assessmentFlow.buildFlow(this.diffResult);
    this.renderStepper();
    this.renderCurrentCard();
  },

  // 获取当前步骤
  getCurrentStep: function() {
    return this.flow.steps[this.currentStep];
  },

  // 获取当前卡片
  getCurrentCard: function() {
    var step = this.getCurrentStep();
    return step.cards[this.currentCard];
  },

  // 获取总卡片数（当前步骤内）
  getTotalCardsInStep: function() {
    return this.getCurrentStep().cards.length;
  },

  // 保存当前卡片数据
  saveCurrentCardData: function() {
    var card = this.getCurrentCard();
    if (!card) return;

    var cardData = {};
    if (card.type === 'vas') {
      card.items.forEach(function(item) {
        var slider = document.getElementById('vas-' + item.key);
        cardData[item.key] = slider ? parseInt(slider.value) : 0;
      });
    }
    else if (card.type === 'radio_card') {
      var checked = document.querySelector('input[name="' + card.id + '"]:checked');
      cardData[card.key || card.id] = checked ? checked.value : '';
    }
    else if (card.type === 'rom_check') {
      card.items.forEach(function(item) {
        var checked = document.querySelector('input[name="' + item.id + '"]:checked');
        cardData[item.key || item.id] = checked ? checked.value : '';
      });
    }
    else if (card.type === 'redflag_check') {
      card.items.forEach(function(item) {
        var checked = document.querySelector('input[name="' + item.id + '"]:checked');
        cardData[item.key || item.id] = checked ? checked.value : 'no';
      });
    }

    // 存储到 this.data
    if (!this.data[card.id]) this.data[card.id] = {};
    Object.assign(this.data[card.id], cardData);
  },

  // 前进到下一个卡片/步骤
  next: function() {
    this.saveCurrentCardData();

    var step = this.getCurrentStep();
    if (this.currentCard < step.cards.length - 1) {
      // 同一步骤内下一个卡片
      this.currentCard++;
    } else if (this.currentStep < this.totalSteps - 1) {
      // 下一个步骤
      this.currentStep++;
      this.currentCard = 0;
    } else {
      // 流程结束，提交
      this.submit();
      return;
    }

    this.renderStepper();
    this.renderCurrentCard();
    this.scrollToTop();
  },

  // 返回上一个卡片/步骤
  back: function() {
    this.saveCurrentCardData();

    if (this.currentCard > 0) {
      this.currentCard--;
    } else if (this.currentStep > 0) {
      this.currentStep--;
      var prevStep = this.flow.steps[this.currentStep];
      this.currentCard = prevStep.cards.length - 1;
    } else {
      // 已经是第一步第一张卡片，返回首页
      window.location.href = 'index.html';
      return;
    }

    this.renderStepper();
    this.renderCurrentCard();
    this.scrollToTop();
  },

  // 滚动到顶部
  scrollToTop: function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // 提交评估
  submit: function() {
    this.saveCurrentCardData();

    // 检查红线
    var redFlags = this.checkRedFlags();
    if (redFlags.length > 0) {
      this.showRedFlagAlert(redFlags);
      return;
    }

    // 封装数据
    var assessmentData = {
      specialty: this.diffResult ? this.diffResult.specialty : 'general',
      diagnosis: this.diffResult ? this.diffResult.diagnosis : 'unknown',
      diagnosisLabel: this.diffResult ? this.diffResult.label : '未知',
      confidence: this.diffResult ? this.diffResult.confidence : 'low',
      timestamp: new Date().toISOString(),
      vasMax: this.getVASMax(),
      data: this.data
    };

    // 保存到 sessionStorage
    sessionStorage.setItem('rx-assessment-data', JSON.stringify(assessmentData));
    sessionStorage.setItem('rx-specialty', assessmentData.specialty);
    sessionStorage.setItem('rx-diagnosis', assessmentData.diagnosis);

    // 跳转到处方页面（带加载动画）
    this.showLoadingAnimation(function() {
      window.location.href = 'prescription.html';
    });
  },

  // 获取 VAS 最高分（用于算法联动）
  getVASMax: function() {
    var max = 0;
    var vasData = this.data.vas_pain || {};
    ['vas_rest', 'vas_movement', 'vas_night'].forEach(function(key) {
      var val = parseInt(vasData[key]) || 0;
      if (val > max) max = val;
    });
    return max;
  },

  // 检查安全红线
  checkRedFlags: function() {
    var flags = [];
    var redflagData = this.data.redflags || {};

    Object.keys(redflagData).forEach(function(key) {
      if (redflagData[key] === 'yes') {
        var item = null;
        if (asState.flow) {
          asState.flow.steps.forEach(function(step) {
            step.cards.forEach(function(card) {
              if (card.items) {
                card.items.forEach(function(it) {
                  if (it.key === key || it.id === key) item = it;
                });
              }
            });
          });
        }
        flags.push(item ? item.label : key);
      }
    });

    return flags;
  },

  // 显示红线警告
  showRedFlagAlert: function(flags) {
    var overlay = document.createElement('div');
    overlay.className = 'rx-redflag-overlay';
    overlay.innerHTML = `
      <div class="rx-redflag-modal">
        <div class="rx-redflag-icon">🚨</div>
        <div class="rx-redflag-title">安全红线检查未通过！</div>
        <ul class="rx-redflag-list">
          ${flags.map(function(f) { return '<li>' + f + '</li>'; }).join('')}
        </ul>
        <p style="font-size:0.85rem;color:#374151;margin-top:1rem;">系统已拦截处方生成。请先处理上述问题后重新评估。</p>
        <button class="rx-redflag-btn" onclick="this.parentNode.parentNode.remove()">我知道了</button>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  // 显示加载动画
  showLoadingAnimation: function(callback) {
    var overlay = document.createElement('div');
    overlay.className = 'rx-loading-overlay';
    overlay.innerHTML = `
      <div class="rx-loading-spinner">
        <div class="rx-loading-icon">📊</div>
        <div class="rx-loading-text">正在根据评估数据生成循证处方...</div>
        <div class="rx-loading-subtext">检索 APTA 指南 · 匹配 FITT-VP 参数 · 计算安全强度</div>
        <div class="rx-loading-bar">
          <div class="rx-loading-bar-fill"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 2秒后跳转
    setTimeout(function() {
      overlay.remove();
      callback();
    }, 2000);
  },


  /* ============================================================
     三、渲染函数
     ============================================================ */

  // 渲染 Stepper
  renderStepper: function() {
    var container = document.getElementById('as-stepper');
    if (!container) {
      // 创建 Stepper 容器
      container = document.createElement('div');
      container.id = 'as-stepper';
      container.className = 'as-stepper';
      var header = document.querySelector('.as-header');
      if (header) {
        header.parentNode.insertBefore(container, header.nextSibling);
      }
    }

    var html = '';
    this.flow.steps.forEach(function(step, idx) {
      var cls = '';
      if (idx < asState.currentStep) cls = 'done';
      else if (idx === asState.currentStep) cls = 'active';
      html += `
        <div class="as-step ${cls}">
          <div class="as-step-num">${idx + 1}</div>
          <div class="as-step-label">${step.icon} ${step.title}</div>
          ${idx < asState.totalSteps - 1 ? '<div class="as-step-line"></div>' : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  },

  // 渲染当前卡片
  renderCurrentCard: function() {
    var container = document.getElementById('as-card-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'as-card-container';
      container.className = 'as-card-container';
      var formContainer = document.getElementById('assessment-form-container');
      if (formContainer) formContainer.appendChild(container);
    }

    var card = this.getCurrentCard();
    if (!card) return;

    var html = '';

    if (card.type === 'vas') {
      html = this.renderVASCard(card);
    }
    else if (card.type === 'radio_card') {
      html = this.renderRadioCard(card);
    }
    else if (card.type === 'rom_check') {
      html = this.renderROMCheckCard(card);
    }
    else if (card.type === 'redflag_check') {
      html = this.renderRedFlagCard(card);
    }
    else if (card.type === 'confirm') {
      html = this.renderConfirmCard(card);
    }

    // 添加导航按钮
    html += this.renderNavButtons();

    container.innerHTML = html;

    // 绑定 VAS 滑块事件
    if (card.type === 'vas') {
      this.bindVASSliders(card);
    }
  },

  // 渲染 VAS 评分卡片
  renderVASCard: function(card) {
    var html = `
      <div class="as-card vas-card">
        <div class="as-card-header">
          <div class="as-card-title">${card.title}</div>
          <div class="as-card-subtitle">${card.subtitle}</div>
          ${card.evidence ? '<div class="as-card-evidence">📖 ' + card.evidence + '</div>' : ''}
        </div>
        <div class="as-card-body">
    `;

    card.items.forEach(function(item, idx) {
      html += `
        <div class="vas-item">
          <div class="vas-label">${item.label}</div>
          <div class="vas-slider-container">
            <input type="range" id="vas-${item.key}" class="vas-slider" min="0" max="10" value="0"
                   data-item-key="${item.key}">
            <div class="vas-value-display" id="vas-${item.key}-display">0</div>
          </div>
          <div class="vas-labels">
            <span class="vas-label-left">0（无痛）</</span>
            <span class="vas-label-right">10（剧痛）</span>
          </div>
          <div class="vas-color-bar" id="vas-${item.key}-color"></div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  },

  // 绑定 VAS 滑块事件（颜色联动）
  bindVASSliders: function(card) {
    var self = this;
    card.items.forEach(function(item) {
      var slider = document.getElementById('vas-' + item.key);
      var display = document.getElementById('vas-' + item.key + '-display');
      var colorBar = document.getElementById('vas-' + item.key + '-color');

      if (!slider) return;

      function updateVAS() {
        var val = parseInt(slider.value);
        display.textContent = val;

        // 颜色联动
        var color = '#059669'; // 绿色 0-2
        var bgColor = '#D1FAE5';
        if (val >= 3 && val <= 5) {
          color = '#D97706'; // 黄色
          bgColor = '#FEF3C7';
        } else if (val >= 6 && val <= 8) {
          color = '#EA580C'; // 橙色
          bgColor = '#FFEDD5';
        } else if (val >= 9) {
          color = '#DC2626'; // 红色
          bgColor = '#FEE2E2';
        }

        display.style.color = color;
        if (colorBar) {
          colorBar.style.background = bgColor;
          colorBar.style.borderLeft = '4px solid ' + color;
        }

        // 算法联动：VAS ≥ 7 时提示
        if (val >= 7) {
          self.showVASAlert(val);
        }
      }

      slider.addEventListener('input', updateVAS);
      updateVAS(); // 初始化
    });
  },

  // VAS ≥ 7 时显示算法联动提示
  showVASAlert: function(val) {
    if (document.getElementById('vas-alert')) return; // 避免重复显示

    var alertEl = document.createElement('div');
    alertEl.id = 'vas-alert';
    alertEl.className = 'as-vas-alert';
    alertEl.innerHTML = `
      <div class="as-vas-alert-icon">⚠️</div>
      <div class="as-vas-alert-text">
        <strong>检测到中重度疼痛（VAS ≥ 7分）</strong><br>
        系统将自动调整为<strong>「急性期控制」模式</strong>：<br>
        · 剔除所有高强度抗阻训练<br>
        · 以疼痛管理 + 温和活动为主<br>
        · 建议先就医明确诊断
      </div>
    `;

    var cardBody = document.querySelector('.as-card-body');
    if (cardBody) cardBody.appendChild(alertEl);
  },

  // 渲染单选卡片（功能受限程度）
  renderRadioCard: function(card) {
    var html = `
      <div class="as-card radio-card">
        <div class="as-card-header">
          <div class="as-card-title">${card.title}</div>
          <div class="as-card-subtitle">${card.subtitle}</div>
        </div>
        <div class="as-card-body">
          <div class="radio-card-grid">
    `;

    card.options.forEach(function(opt, idx) {
      html += `
        <label class="radio-card-item">
          <input type="radio" name="${card.id}" value="${opt.value}">
          <div class="radio-card-content">
            <div class="radio-card-icon">${opt.icon}</div>
            <div class="radio-card-label">${opt.label}</div>
            <div class="radio-card-desc">${opt.desc}</div>
          </div>
        </label>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;

    return html;
  },

  // 渲染 ROM 检查卡片（左侧图示 + 右侧选项）
  renderROMCheckCard: function(card) {
    var html = `
      <div class="as-card rom-card">
        <div class="as-card-header">
          <div class="as-card-title">${card.title}</div>
          <div class="as-card-subtitle">${card.subtitle}</div>
        </div>
        <div class="as-card-body">
    `;

    card.items.forEach(function(item) {
      html += `
        <div class="rom-item">
          <div class="rom-item-left">
            <div class="rom-item-img" id="rom-img-${item.id}">
              <div class="rom-img-placeholder">🦴</div>
              <div class="rom-img-label">${item.label}</div>
            </div>
          </div>
          <div class="rom-item-right">
            <div class="rom-item-question">${item.label}</div>
            ${item.guide ? '<div class="rom-item-guide">💡 ' + item.guide + '</div>' : ''}
            <div class="rom-options">
      `;

      item.options.forEach(function(opt, idx) {
        html += `
          <label class="rom-option-item">
            <input type="radio" name="${item.id}" value="${opt.value}">
            <div class="rom-option-content">
              <span class="rom-option-icon">${opt.icon}</span>
              <span class="rom-option-label">${opt.label}</span>
            </div>
          </label>
        `;
      });

      html += `
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  },

  // 渲染红线检查卡片
  renderRedFlagCard: function(card) {
    var html = `
      <div class="as-card redflag-card">
        <div class="as-card-header">
          <div class="as-card-title">${card.title}</div>
          <div class="as-card-subtitle">${card.subtitle}</div>
          ${card.evidence ? '<div class="as-card-evidence">📖 ' + card.evidence + '</div>' : ''}
        </div>
        <div class="as-card-body">
          <div class="redflag-list">
    `;

    card.items.forEach(function(item) {
      html += `
        <div class="redflag-item">
          <div class="redflag-item-label">${item.label}</div>
          <div class="redflag-item-options">
            <label class="redflag-option">
              <input type="radio" name="${item.id}" value="no">
              <span class="redflag-option-label">否</span>
            </label>
            <label class="redflag-option redflag-option-yes">
              <input type="radio" name="${item.id}" value="yes">
              <span class="redflag-option-label">是</span>
            </label>
          </div>
          ${item.severity === 'absolute' ? '<div class="redflag-item-severity">绝对禁忌</div>' : ''}
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;

    return html;
  },

  // 渲染确认卡片
  renderConfirmCard: function(card) {
    var html = `
      <div class="as-card confirm-card">
        <div class="as-card-header">
          <div class="as-card-title">${card.title}</div>
          <div class="as-card-subtitle">${card.subtitle}</div>
        </div>
        <div class="as-card-body">
    `;

    // 显示评估摘要
    if (card.summary) {
      html += '<div class="confirm-summary">';
      html += '<div class="confirm-summary-title">📋 评估摘要</div>';

      // 诊断
      if (this.diffResult) {
        html += '<div class="confirm-item"><strong>疑似诊断：</strong>' + this.diffResult.label + '</div>';
        html += '<div class="confirm-item"><strong>置信度：</strong>' + this.diffResult.confidence + '</div>';
      }

      // VAS
      var vasMax = this.getVASMax();
      var vasLevel = vasMax <= 2 ? '轻度' : vasMax <= 5 ? '中度' : vasMax <= 8 ? '重度' : '极重度';
      html += '<div class="confirm-item"><strong>疼痛程度：</strong>VAS ' + vasMax + '分（' + vasLevel + '）</div>';

      // 功能受限
      var funcLimit = this.data.functional_limit ? this.data.functional_limit.functional_limit : '未评估';
      html += '<div class="confirm-item"><strong>功能受限：</strong>' + funcLimit + '</div>';

      html += '</div>';
    }

    html += `
          <div class="confirm-notice">
            <div class="confirm-notice-icon">⚠️</div>
            <div class="confirm-notice-text">
              系统将根据以上信息生成<strong>循证运动处方</strong>。<br>
              处方生成后，请务必在专业人员指导下执行。
            </div>
          </div>
        </div>
      </div>
    `;

    return html;
  },

  // 渲染导航按钮
  renderNavButtons: function() {
    var isFirst = (this.currentStep === 0 && this.currentCard === 0);
    var isLast = (this.currentStep === this.totalSteps - 1 &&
                  this.currentCard === this.getCurrentStep().cards.length - 1);

    var html = `
      <div class="as-nav-bar">
        <button class="as-nav-btn as-nav-back" id="as-nav-back" ${isFirst ? 'disabled' : ''}>
          ← 上一步
        </button>
        <div class="as-nav-progress">
          第 ${this.currentStep + 1} 步 · 第 ${this.currentCard + 1}/${this.getTotalCardsInStep()} 题
        </div>
        <button class="as-nav-btn as-nav-next" id="as-nav-next">
          ${isLast ? '生成处方 →' : '下一步 →'}
        </button>
      </div>
    `;

    return html;
  }
};


/* ============================================================
   四、初始化
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  // 直接从 URL 参数读取 specialty（最可靠的方式）
  var urlParams = new URLSearchParams(window.location.search);
  var urlSpecialty = urlParams.get('specialty') || '';
  
  // 从 sessionStorage 读取 diffResult
  var diffResult = null;
  var diffResultStr = sessionStorage.getItem('rx-diff-result');
  if (diffResultStr) {
    try {
      diffResult = JSON.parse(diffResultStr);
    } catch(e) {
      console.error('[assessment.js] 解析 rx-diff-result 失败:', e);
    }
  }
  
  // 优先使用 diffResult.specialty，其次使用 URL 参数，最后使用 sessionStorage
  var specialty = (diffResult && diffResult.specialty) ? diffResult.specialty : 
                  (urlSpecialty ? urlSpecialty : 
                  sessionStorage.getItem('rx-specialty') || 'general');
  
  var diagnosis = (diffResult && diffResult.diagnosis) ? diffResult.diagnosis : 
                 sessionStorage.getItem('rx-diagnosis') || 'unknown';
  
  // 调试日志
  console.log('[assessment.js] 初始化: specialty=' + specialty + ', diagnosis=' + diagnosis);
  console.log('[assessment.js] diffResult:', diffResult);
  console.log('[assessment.js] urlSpecialty:', urlSpecialty);
  
  // 显示诊断结果在页面顶部
  if (diffResult && diffResult.label) {
    var titleEl = document.getElementById('assessment-title');
    var guideEl = document.getElementById('assessment-guide');
    if (titleEl) titleEl.textContent = '康复评估 · ' + diffResult.label;
    if (guideEl) guideEl.textContent = '根据您的症状描述，系统初步判断为：' + diffResult.label + '（置信度：' + diffResult.confidence + '）';
  }
  
  // 手动设置 asState 的 diffResult 和 specialty
  asState.diffResult = diffResult;
  asState.specialty = specialty;
  asState.diagnosis = diagnosis;
  
  // 初始化评估流程
  asState.init();

  // 绑定导航按钮事件（使用事件委托）
  document.addEventListener('click', function(e) {
    if (e.target.id === 'as-nav-next') {
      e.preventDefault();
      asState.next();
    } else if (e.target.id === 'as-nav-back') {
      e.preventDefault();
      asState.back();
    }
  });
});
