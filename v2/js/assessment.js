// assessment.js — 评估页逻辑（纯 JS，无 MkDocs 限制）
(function() {
  'use strict';

  // ========== 问题配置（按专科） ==========
  var configMap = {
    'neurologic': [
      {
        title: '基本信息',
        fields: [
          { name: 'diagnosis', label: '诊断/病名', type: 'select', options: [
            {value:'stroke',label:'脑卒中（缺血性/出血性）'},
            {value:'sci',label:'脊髓损伤'},
            {value:'parkinson',label:'帕金森病'},
            {value:'peripheral',label:'周围神经病变'}
          ]},
          { name: 'onsetDays', label: '发病/术后大概多少天了？', type: 'select', options: [
            {value:'0-7',label:'不到1周（急性期）'},
            {value:'8-30',label:'1-4周（亚急性期）'},
            {value:'31-90',label:'1-3个月（早期恢复）'},
            {value:'91-180',label:'3-6个月（恢复期）'},
            {value:'180+',label:'6个月以上（慢性期）'}
          ]},
          { name: 'dominantHand', label: '平时习惯用哪一侧手？', type: 'select', options: [
            {value:'right',label:'右手（右利手）'},
            {value:'left',label:'左手（左利手）'},
            {value:'unknown',label:'不确定'}
          ]}
        ]
      },
      {
        title: '患侧运动功能',
        fields: [
          { name: 'armRaise', label: '患侧手臂能否抬到肩膀高度？', type: 'select', options: [
            {value:'0',label:'完全不能（一点也抬不起来）'},
            {value:'1',label:'能抬一点，但很困难'},
            {value:'2',label:'可以抬到肩膀高度，但动作不灵活'}
          ], hint: '对应上肢 FMA 评分参考' },
          { name: 'handGrasp', label: '患手能否握拳或抓东西？', type: 'select', options: [
            {value:'0',label:'完全不能（手指不能动）'},
            {value:'1',label:'能轻微弯曲，但握不住东西'},
            {value:'2',label:'能握拳，但力量较弱'}
          ], hint: '对应上肢精细功能评估' },
          { name: 'legLift', label: '平躺时能否抬起患侧腿？', type: 'select', options: [
            {value:'0',label:'完全不能'},
            {value:'1',label:'能抬离床面，但很费力'},
            {value:'2',label:'可以抬起并保持几秒'}
          ], hint: '对应下肢 FMA 评分参考' },
          { name: 'walkAbility', label: '目前能否独立行走（无需他人搀扶）？', type: 'select', options: [
            {value:'0',label:'完全不能（无法站立或需两人搀扶）'},
            {value:'1',label:'可以站，但行走需一人搀扶'},
            {value:'2',label:'可以独立行走，但步态异常/缓慢'}
          ]}
        ]
      },
      {
        title: '平衡与肌张力',
        fields: [
          { name: 'balanceSit', label: '坐位时能否保持平衡（不靠扶）？', type: 'select', options: [
            {value:'0',label:'不能，容易歪倒'},
            {value:'1',label:'可以，但需要用手支撑'},
            {value:'2',label:'可以稳稳坐住'}
          ]},
          { name: 'balanceStand', label: '站立时（可扶东西）能否保持平衡？', type: 'select', options: [
            {value:'0',label:'站立困难，容易跌倒'},
            {value:'1',label:'扶着可以站，但不稳'},
            {value:'2',label:'可以独立站立数秒'}
          ]},
          { name: 'spasticity', label: '患侧肢体是否有僵硬或痉挛感？', type: 'select', options: [
            {value:'0',label:'没有，肌肉很松弛'},
            {value:'1',label:'偶尔有，活动时轻微僵硬'},
            {value:'2',label:'经常有，肌肉明显僵硬或痉挛'}
          ], hint: '对应 Ashworth 肌张力分级参考' },
          { name: 'spasticityTiming', label: '痉挛/僵硬在什么情况下更明显？', type: 'select', options: [
            {value:'none',label:'没有明显的痉挛'},
            {value:'active',label:'活动时更明显（如走路、伸手）'},
            {value:'passive',label:'被别人活动时更明显'}
          ]}
        ]
      },
      {
        title: '安全与合并症',
        fields: [
          { name: 'redFlags', label: '最近是否有以下情况？（可多选）', type: 'checkbox', options: [
            {value:'chestPain',label:'胸痛或胸闷'},
            {value:'severeHeadache',label:'剧烈头痛'},
            {value:'fall',label:'最近跌倒'},
            {value:'fever',label:'发热（体温＞38°C）'},
            {value:'none',label:'以上都没有'}
          ]},
          { name: 'comorbidities', label: '是否有以下疾病？（可多选）', type: 'checkbox', options: [
            {value:'hypertension',label:'高血压'},
            {value:'diabetes',label:'糖尿病'},
            {value:'heartDisease',label:'心脏病'},
            {value:'none',label:'以上都没有'}
          ]},
          { name: 'medications', label: '目前在服用的药物（选填）', type: 'textarea', placeholder: '如：阿司匹林、降压药的名称\n如无需服药请留空' }
        ]
      }
    ],

    'orthopedic': [
      {
        title: '基本信息',
        fields: [
          { name: 'diagnosis', label: '诊断/手术名称', type: 'select', options: [
            {value:'acl',label:'前交叉韧带重建术（ACL-R）'},
            {value:'meniscus',label:'半月板缝合/切除'},
            {value:'rotator',label:'肩袖修复术'},
            {value:'thr',label:'全髋关节置换术（THR）'},
            {value:'tkr',label:'全膝关节置换术（TKR）'}
          ]},
          { name: 'postOpWeeks', label: '术后大概多少周了？', type: 'select', options: [
            {value:'0-2',label:'不到2周（刚手术）'},
            {value:'3-6',label:'3-6周（早期康复）'},
            {value:'7-12',label:'7-12周（功能恢复期）'},
            {value:'12+',label:'3个月以上（运动恢复期）'}
          ]},
          { name: 'surgicalApproach', label: '手术入路（THR/TKR 患者请选）', type: 'select', options: [
            {value:'anterior',label:'前侧入路'},
            {value:'lateral',label:'外侧入路'},
            {value:'posterior',label:'后侧入路'},
            {value:'unknown',label:'不确定/不是关节置换'}
          ]}
        ]
      },
      {
        title: '关节活动度（日常功能）',
        fields: [
          { name: 'canStraighten', label: '患肢能否完全伸直（膝盖/手肘打直）？', type: 'select', options: [
            {value:'0',label:'不能，一直弯着'},
            {value:'1',label:'可以伸直，但感觉紧绷/疼痛'},
            {value:'2',label:'可以完全伸直，无明显受限'}
          ]},
          { name: 'canFlex', label: '患肢弯曲（屈膝/屈肘）能达到什么程度？', type: 'select', options: [
            {value:'0',label:'弯曲严重受限（＜90°）'},
            {value:'1',label:'可以弯到接近90°，但再弯就痛'},
            {value:'2',label:'可以弯曲超过90°，接近正常'}
          ]},
          { name: 'stairAbility', label: '上下楼梯是否需要辅助？', type: 'select', options: [
            {value:'0',label:'完全不能上下楼梯'},
            {value:'1',label:'需要扶栏杆或有人搀扶'},
            {value:'2',label:'可以独立上下楼梯（可能稍慢）'}
          ]}
        ]
      },
      {
        title: '疼痛与行走',
        fields: [
          { name: 'vasRest', label: '静息时疼痛程度（0=不痛，10=最痛）', type: 'range', min:0, max:10 },
          { name: 'vasMotion', label: '活动时疼痛程度（0=不痛，10=最痛）', type: 'range', min:0, max:10 },
          { name: 'walkAid', label: '目前行走需要辅助工具吗？', type: 'select', options: [
            {value:'none',label:'不需要，可以独立行走'},
            {value:'cane1',label:'需要单手杖'},
            {value:'cane2',label:'需要双手杖或助行器'},
            {value:'nonWeight',label:'还不能负重行走'}
          ]}
        ]
      },
      {
        title: '切口与安全',
        fields: [
          { name: 'redFlags', label: '术侧肢体是否有以下情况？（可多选）', type: 'checkbox', options: [
            {value:'swelling',label:'突然肿胀/发红（疑似血栓）'},
            {value:'chestPain',label:'静息时胸痛/呼吸困难（疑似肺栓塞）'},
            {value:'fever',label:'发热（体温＞38°C）'},
            {value:'none',label:'以上都没有'}
          ]},
          { name: 'wound', label: '手术切口情况', type: 'select', options: [
            {value:'healed',label:'已愈合，无不适'},
            {value:'oozing',label:'仍有渗液'},
            {value:'red',label:'红肿、发热或疼痛'},
            {value:'unknown',label:'不确定'}
          ]}
        ]
      }
    ],

    'cardiopulmonary': [
      {
        title: '基本信息',
        fields: [
          { name: 'diagnosis', label: '诊断', type: 'select', options: [
            {value:'copd',label:'慢性阻塞性肺病（COPD）'},
            {value:'mi',label:'急性心肌梗死（AMI）'},
            {value:'heartFailure',label:'心力衰竭'},
            {value:'cabg',label:'冠脉搭桥术后（CABG）'},
            {value:'postCovid',label:'新冠后康复（Long COVID）'}
          ]},
          { name: 'onsetDays', label: '发病/术后大概多少天了？', type: 'select', options: [
            {value:'0-7',label:'不到1周（急性期）'},
            {value:'8-30',label:'1-4周（稳定期）'},
            {value:'31-90',label:'1-3个月（康复期）'},
            {value:'90+',label:'3个月以上'}
          ]},
          { name: 'nyha', label: '日常活动是否会气短？（非心衰患者选"不适用"）', type: 'select', options: [
            {value:'I',label:'完全不气短（I级）'},
            {value:'II',label:'快走或爬楼时气短（II级）'},
            {value:'III',label:'平路步行也气短（III级）'},
            {value:'IV',label:'休息时也气短（IV级）'},
            {value:'na',label:'不适用（非心衰）'}
          ]}
        ]
      },
      {
        title: '心肺功能（日常感受）',
        fields: [
          { name: 'walkTime', label: '平地走路能连续走多久？', type: 'select', options: [
            {value:'0',label:'走不到3分钟就需要停下来休息'},
            {value:'1',label:'能连续走3-10分钟'},
            {value:'2',label:'能连续走10-30分钟'},
            {value:'3',label:'能连续走30分钟以上'}
          ], hint: '用于估算6分钟步行距离范围' },
          { name: 'spo2Check', label: '是否有指氧仪？静息时血氧是多少？', type: 'select', options: [
            {value:'unknown',label:'没有指氧仪/不知道'},
            {value:'low',label:'低于92%'},
            {value:'normal',label:'94-96%'},
            {value:'high',label:'97%以上'}
          ]},
          { name: 'borgRest', label: '静息时呼吸困难程度（0=不喘，10=最喘）', type: 'range', min:0, max:10 },
          { name: 'palpitation', label: '日常活动时是否感觉心悸或心跳很快？', type: 'select', options: [
            {value:'0',label:'没有，心跳正常'},
            {value:'1',label:'偶尔有，轻微'},
            {value:'2',label:'经常有，比较明显'}
          ]}
        ]
      },
      {
        title: '运动习惯与 RPE',
        fields: [
          { name: 'exerciseHabit', label: '发病前是否有规律运动习惯？', type: 'select', options: [
            {value:'none',label:'几乎没有运动习惯'},
            {value:'light',label:'偶尔散步/轻度活动'},
            {value:'moderate',label:'每周2-3次中等强度运动'},
            {value:'high',label:'每周4次以上规律运动'}
          ]},
          { name: 'rpeExercise', label: '如果运动，感觉累的程度（6=最轻松，20=最累）', type: 'range', min:6, max:20 }
        ]
      },
      {
        title: '安全与合并症',
        fields: [
          { name: 'redFlags', label: '最近是否有以下情况？（可多选）', type: 'checkbox', options: [
            {value:'chestPain',label:'静息时胸痛或胸闷加重'},
            {value:'dyspnea',label:'呼吸困难加重'},
            {value:'edema',label:'足踝水肿加重'},
            {value:'dizziness',label:'头晕或晕厥'},
            {value:'none',label:'以上都没有'}
          ]},
          { name: 'arrhythmia', label: '是否有心律失常史？', type: 'select', options: [
            {value:'none',label:'无'},
            {value:'af',label:'房颤'},
            {value:'pvc',label:'室性早搏'},
            {value:'pacemaker',label:'起搏器术后'},
            {value:'unknown',label:'不确定'}
          ]}
        ]
      }
    ]
  };

  // ========== 状态 ==========
  var steps = [];
  var currentStep = 0;
  var formData = {};
  var specialty = '';

  // ========== 初始化 ==========
  document.addEventListener('DOMContentLoaded', function() {
    // 读取 URL 参数
    var params = new URLSearchParams(window.location.search);
    specialty = params.get('specialty') || sessionStorage.getItem('rx-specialty') || 'neurologic';
    var diagnosis = params.get('diagnosis') || sessionStorage.getItem('rx-diagnosis') || '';

    steps = configMap[specialty] || configMap['neurologic'];

    // 设置标题
    var titleEl = document.getElementById('assessment-title');
    if (titleEl) {
      var specLabel = specialty === 'neurologic' ? '神经康复' : specialty === 'orthopedic' ? '骨科康复' : '心肺康复';
      titleEl.textContent = specLabel + ' — 康复评估';
    }

    // 绑定按钮
    var btnPrev = document.getElementById('btn-prev');
    var btnNext = document.getElementById('btn-next');
    var btnBack = document.getElementById('btn-back');
    var btnBackA = document.getElementById('btn-back-to-assessment');

    if (btnPrev) btnPrev.addEventListener('click', prevStep);
    if (btnNext) btnNext.addEventListener('click', nextStep);
    if (btnBack) btnBack.addEventListener('click', function() { window.location.href = 'index.html'; });
    if (btnBackA) btnBackA.addEventListener('click', showAssessment);

    renderStepIndicator();
    renderStep();
  });

  // ========== 渲染步骤指示器 ==========
  function renderStepIndicator() {
    var container = document.getElementById('step-indicator');
    if (!container) return;
    var html = '';
    for (var i = 0; i < steps.length; i++) {
      var cls = '';
      if (i === currentStep) cls = 'active';
      else if (i < currentStep) cls = 'done';
      html += '<div class="step-dot ' + cls + '"></div>';
    }
    container.innerHTML = html;
  }

  // ========== 渲染当前步骤 ==========
  function renderStep() {
    var container = document.getElementById('step-content');
    if (!container) return;

    var step = steps[currentStep];
    var html = '<div class="step-card"><div class="step-card-title">' + step.title + '</div>';

    step.fields.forEach(function(f) {
      html += '<div class="step-field">';
      html += '<div class="step-field-label">' + f.label + '</div>';

      if (f.type === 'select') {
        html += '<select name="' + f.name + '" class="step-select">';
        (f.options || []).forEach(function(o) {
          html += '<option value="' + (o.value || o) + '">' + (o.label || o) + '</option>';
        });
        html += '</select>';
      } else if (f.type === 'textarea') {
        html += '<textarea name="' + f.name + '" placeholder="' + (f.placeholder||'') + '" class="step-textarea"></textarea>';
      } else if (f.type === 'range') {
        var min = f.min !== undefined ? f.min : 0;
        var max = f.max !== undefined ? f.max : 10;
        html += '<div style="display:flex;align-items:center;gap:0.8rem;">';
        html += '<span style="font-size:0.82rem;color:#6b7280;">' + min + '</span>';
        html += '<input type="range" name="' + f.name + '" min="' + min + '" max="' + max + '" value="' + Math.round((min+max)/2) + '" style="flex:1;" class="step-range">';
        html += '<span style="font-size:0.82rem;color:#6b7280;">' + max + '</span>';
        html += '</div>';
        html += '<div class="range-labels"><span id="range-val-' + f.name + '">' + Math.round((min+max)/2) + '</span></div>';
      } else if (f.type === 'checkbox') {
        html += '<div style="display:flex;flex-direction:column;gap:0.4rem;margin-top:0.4rem;">';
        (f.options || []).forEach(function(o) {
          html += '<label style="display:flex;align-items:center;gap:0.4rem;padding:0.35rem 0.7rem;background:#E8F5F0;border-radius:16px;cursor:pointer;font-size:0.88rem;">' +
                  '<input type="checkbox" name="' + f.name + '" value="' + (o.value || o) + '" style="accent-color:#1565C0;"> ' +
                  (o.label || o) +
                  '</label>';
        });
        html += '</div>';
      } else if (f.type === 'radio') {
        html += '<div class="step-options">';
        (f.options || []).forEach(function(o) {
          html += '<label class="step-option" onclick="this.classList.toggle(\'selected\')">' +
                  '<input type="radio" name="' + f.name + '" value="' + (o.value || o) + '">' +
                  '<span>' + (o.label || o) + '</span>' +
                  '</label>';
        });
        html += '</div>';
      }

      if (f.hint) {
        html += '<div class="step-field-hint">' + f.hint + '</div>';
      }
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // 绑定 range 滑块实时显示
    step.fields.forEach(function(f) {
      if (f.type === 'range') {
        var input = container.querySelector('input[name="' + f.name + '"]');
        var valSpan = document.getElementById('range-val-' + f.name);
        if (input && valSpan) {
          input.addEventListener('input', function() {
            valSpan.textContent = input.value;
          });
        }
      }
    });

    // 绑定 radio 选中样式
    var radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach(function(r) {
      r.addEventListener('change', function() {
        container.querySelectorAll('.step-option').forEach(function(opt) { opt.classList.remove('selected'); });
        r.closest('.step-option').classList.add('selected');
      });
    });

    // 恢复已填数据
    restoreStepData(step);

    // 更新按钮状态
    updateButtons();
    showButtons();
  }

  // ========== 恢复步骤数据 ==========
  function restoreStepData(step) {
    step.fields.forEach(function(f) {
      var saved = formData[f.name];
      if (saved === undefined) return;

      if (f.type === 'checkbox') {
        var vals = Array.isArray(saved) ? saved : [saved];
        vals.forEach(function(v) {
          var cb = document.querySelector('input[name="' + f.name + '"][value="' + v + '"]');
          if (cb) cb.checked = true;
        });
      } else if (f.type === 'radio') {
        var rb = document.querySelector('input[name="' + f.name + '"][value="' + saved + '"]');
        if (rb) {
          rb.checked = true;
          var opt = rb.closest('.step-option');
          if (opt) opt.classList.add('selected');
        }
      } else if (f.type === 'range') {
        var range = document.querySelector('input[name="' + f.name + '"]');
        if (range) {
          range.value = saved;
          var valSpan = document.getElementById('range-val-' + f.name);
          if (valSpan) valSpan.textContent = saved;
        }
      } else {
        var el = document.querySelector('[name="' + f.name + '"]');
        if (el) el.value = saved;
      }
    });
  }

  // ========== 收集当前步骤数据 ==========
  function collectStepData(step) {
    step.fields.forEach(function(f) {
      if (f.type === 'checkbox') {
        var checked = document.querySelectorAll('input[name="' + f.name + '"]:checked');
        formData[f.name] = Array.from(checked).map(function(cb) { return cb.value; });
      } else if (f.type === 'radio') {
        var rb = document.querySelector('input[name="' + f.name + '"]:checked');
        if (rb) formData[f.name] = rb.value;
      } else if (f.type === 'range') {
        var range = document.querySelector('input[name="' + f.name + '"]');
        if (range) formData[f.name] = range.value;
      } else {
        var el = document.querySelector('[name="' + f.name + '"]');
        if (el) formData[f.name] = el.value;
      }
    });
  }

  // ========== 按钮逻辑 ==========
  function updateButtons() {
    var btnPrev = document.getElementById('btn-prev');
    var btnNext = document.getElementById('btn-next');
    if (btnPrev) btnPrev.style.display = currentStep === 0 ? 'none' : '';
    if (btnNext) {
      btnNext.textContent = currentStep === steps.length - 1 ? '生成处方 →' : '下一步 →';
    }
  }

  function showButtons() {
    var btns = document.getElementById('step-buttons');
    if (btns) btns.style.display = '';
  }

  function prevStep() {
    if (currentStep <= 0) return;
    collectStepData(steps[currentStep]);
    currentStep--;
    renderStepIndicator();
    renderStep();
  }

  function nextStep() {
    collectStepData(steps[currentStep]);

    if (currentStep < steps.length - 1) {
      currentStep++;
      renderStepIndicator();
      renderStep();
    } else {
      // 最后一步 → 保存数据并跳转到处方页
      var rf = checkRedFlagsFromForm();
      if (rf && rf.isRedFlag) {
        sessionStorage.setItem('rx-redflags', JSON.stringify(rf));
      } else {
        sessionStorage.removeItem('rx-redflags');
      }
      sessionStorage.setItem('rx-assessment-data', JSON.stringify(formData));
      sessionStorage.setItem('rx-specialty', specialty);
      window.location.href = 'prescription.html';
    }
  }

  // ========== 红旗症状检查 ==========
  function checkRedFlagsFromForm() {
    for (var key in formData) {
      if (key === 'redFlags') {
        var rf = RedFlags.checkSelected(formData[key]);
        if (rf) return rf;
      }
    }
    return null;
  }

  function showRedFlagAlert(rf) {
    var overlay = document.createElement('div');
    overlay.className = 'rx-redflag-overlay';
    var items = '';
    for (var i = 0; i < rf.matches.length; i++) {
      items += '<li>' + rf.matches[i].info.alert + '（建议就诊：' + rf.matches[i].info.department + '）</li>';
    }
    overlay.innerHTML =
      '<div class="rx-redflag-modal">' +
        '<div class="rx-redflag-icon">⚠️</div>' +
        '<div class="rx-redflag-title">检测到红旗症状，请优先就医！</div>' +
        '<ul class="rx-redflag-list">' + items + '</ul>' +
        '<button class="rx-redflag-btn" onclick="this.closest(\'.rx-redflag-overlay\').remove()">我已了解，仍要继续评估</button>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  // ========== 显示/隐藏视图 ==========
  function showPrescription() {
    var assessmentView = document.querySelector('.assessment-container');
    var prescriptionView = document.getElementById('prescription-view');
    if (assessmentView) assessmentView.style.display = 'none';
    if (prescriptionView) {
      prescriptionView.style.display = '';
      renderPrescription();
    }
  }

  function showAssessment() {
    var assessmentView = document.querySelector('.assessment-container');
    var prescriptionView = document.getElementById('prescription-view');
    if (assessmentView) assessmentView.style.display = '';
    if (prescriptionView) prescriptionView.style.display = 'none';
  }

  // ========== 渲染处方 ==========
  function renderPrescription() {
    var data = JSON.parse(sessionStorage.getItem('rx-assessment-data') || '{}');
    var spec = sessionStorage.getItem('rx-specialty') || 'neurologic';

    var content = document.getElementById('rx-prescription-content');
    if (!content) return;

    // 根据表单数据推断评分范围
    var fmaUpper = inferFmaUpper(data.armRaise, data.handGrasp);
    var fmaLower = inferFmaLower(data.legLift, data.walkAbility);
    var bergLevel = inferBerg(data.balanceSit, data.balanceStand);
    var ashworthLevel = inferAshworth(data.spasticity, data.spasticityTiming);
    var walk6min = infer6mwd(data.walkTime);

    // 诊断标签
    var diagnosisLabel = {
      'stroke':'脑卒中','sci':'脊髓损伤','parkinson':'帕金森病','peripheral':'周围神经病变',
      'acl':'前交叉韧带重建术后','meniscus':'半月板术后','rotator':'肩袖修复术后','thr':'全髋关节置换术后','tkr':'全膝关节置换术后',
      'copd':'慢性阻塞性肺病（COPD）','mi':'急性心肌梗死','heartFailure':'心力衰竭','cabg':'冠脉搭桥术后','postCovid':'新冠后康复'
    };
    var diag = diagnosisLabel[data.diagnosis] || data.diagnosis || '未知';

    // 生成处方
    var prescription = generatePrescription(spec, data, {
      fmaUpper: fmaUpper, fmaLower: fmaLower,
      bergLevel: bergLevel, ashworthLevel: ashworthLevel,
      walk6min: walk6min
    });

    content.innerHTML = prescription;
  }

  // ========== 推断评分 ==========
  function inferFmaUpper(arm, hand) {
    var score = 0;
    if (arm === '2') score += 18; else if (arm === '1') score += 10;
    if (hand === '2') score += 12; else if (hand === '1') score += 6;
    return { score: score, max: 66, level: score >= 40 ? '轻中度' : score >= 20 ? '中重度' : '重度', raw: arm };
  }
  function inferFmaLower(leg, walk) {
    var score = 0;
    if (leg === '2') score += 10; else if (leg === '1') score += 5;
    if (walk === '2') score += 8; else if (walk === '1') score += 4;
    return { score: score, max: 34, level: score >= 20 ? '轻中度' : score >= 10 ? '中重度' : '重度', raw: leg };
  }
  function inferBerg(sit, stand) {
    if (sit === '2' && stand === '2') return { level: '轻度障碍（Berg 41-56）', raw: sit };
    if (sit === '1' || stand === '1') return { level: '中等障碍（Berg 21-40）', raw: sit };
    return { level: '严重障碍（Berg 0-20）', raw: sit };
  }
  function inferAshworth(sp, timing) {
    if (sp === '0') return { level: 'Ashworth 0 级（无痉挛）', raw: sp };
    if (sp === '1') return { level: 'Ashworth 1-1+ 级（轻度痉挛）', raw: sp };
    return { level: 'Ashworth 2-3 级（中重度痉挛）', raw: sp };
  }
  function infer6mwd(walkTime) {
    if (walkTime === '3') return { est:'约 400-500m', raw: walkTime };
    if (walkTime === '2') return { est:'约 250-400m', raw: walkTime };
    if (walkTime === '1') return { est:'约 100-250m', raw: walkTime };
    return { est:'<100m', raw: walkTime };
  }

  // ========== 生成 FITT-VP 处方 ==========
  function generatePrescription(specialty, data, scores) {
    var isEarly = (data.onsetDays === '0-7' || data.onsetDays === '8-30' || data.postOpWeeks === '0-2' || data.postOpWeeks === '3-6');
    var isSubacute = (data.onsetDays === '31-90' || data.postOpWeeks === '3-6');
    var hasSeverePain = (data.vasRest >= 7 || data.vasMotion >= 7);

    var freq, intensity, time, type, volume, progression;

    if (specialty === 'neurologic') {
      freq = isEarly ? '3-5 次/周' : '5-7 次/周';
      intensity = scores.fmaUpper.score < 20 ? 'RPE 11-13（非常轻度）' : 'RPE 13-15（轻度）';
      time = isEarly ? '20-30 分钟/次' : '30-60 分钟/次';
      type = '有氧：步行、固定自行车\n力量：患侧肢体辅助主动活动\n平衡：坐位/立位平衡训练\n神经发育：任务导向性训练';
      volume = isEarly ? '总计 60-90 分钟/周' : '总计 150-300 分钟/周';
      progression = '每 1-2 周根据 FMA 评分调整\n目标：FMA 每月提高 ≥ 5 分';
    } else if (specialty === 'orthopedic') {
      freq = isEarly ? '2-3 次/周（术后保护期）' : '3-5 次/周';
      intensity = hasSeverePain ? 'RPE 9-11（非常轻度，无痛范围内）' : 'RPE 11-14（轻度）';
      time = isEarly ? '15-20 分钟/次（切口愈合前）' : '30-45 分钟/次';
      type = '有氧：固定自行车（非负重）\n力量：股四头肌等长收缩 → 渐进抗阻\n关节活动：髌骨松动、屈膝练习\n本体感觉：单腿站立（保护下）';
      volume = '总计 60-150 分钟/周（依术后阶段）';
      progression = '术后 12 周内避免开链股四头肌训练\n每 2 周复查关节活动度';
    } else {
      freq = '3-5 次/周';
      intensity = 'RPE 12-14（轻度，呼吸困难 ≤ 3/10）';
      time = '20-40 分钟/次（间歇进行）';
      type = '有氧：步行、固定自行车\n呼吸训练：缩唇呼吸、腹式呼吸\n力量：上肢抗阻训练（轻度）\n教育：节能技术、戒烟指导';
      volume = '总计 90-150 分钟/周（分多次完成）';
      progression = 'RPE 每 2 周增加 1-2 分\n目标：6MWD 提高 30-50m';
    }

    // 注意事项
    var precautions = [];
    if (data.redFlags && data.redFlags.length > 0 && data.redFlags.indexOf('none') === -1) {
      precautions.push('⚠️ 您有红旗症状，请先就医确认安全后再开始训练！');
    }
    if (specialty === 'neurologic') {
      if (scores.ashworthLevel.level.indexOf('2-3') !== -1) precautions.push('肌张力较高，训练前先做被动牵拉 10-15 分钟。');
      if (scores.bergLevel.level.indexOf('严重') !== -1) precautions.push('平衡功能较差，所有站立训练需有人陪护。');
    }
    if (specialty === 'orthopedic') {
      if (data.vasRest >= 5) precautions.push('静息疼痛较明显，建议冰敷后再训练。');
      if (data.walkAid === 'nonWeight') precautions.push('目前不能负重，训练仅限非负重动作。');
    }
    if (specialty === 'cardiopulmonary') {
      if (data.borgRest >= 4) precautions.push('静息时即感气喘，建议先就医评估，暂缓训练。');
      if (data.spo2Check === 'low') precautions.push('血氧偏低，运动时需要持续监测血氧饱和度。');
    }

    // 组装 HTML
    var html = '';

    // 摘要卡片
    html += '<div class="rx-summary-card">' +
      '<div class="rx-summary-row">' +
        '<div class="rx-summary-diagnosis">📋 ' + diag + '</div>' +
        '<div class="rx-summary-mode">基于：' + (specialty === 'neurologic' ? '神经康复指南' : specialty === 'orthopedic' ? '骨科康复指南' : '心肺康复指南') + '</div>' +
      '</div>' +
      '<div class="rx-summary-evidence">证据等级：A（基于临床实践指南）｜本处方仅供参考，请结合临床实际情况调整。</div>' +
    '</div>';

    // 功能评分摘要
    html += '<div class="rx-fittvp-section">' +
      '<div class="rx-fittvp-title">📊 您的功能评估摘要</div>' +
      '<table class="rx-fittvp-table">' +
        '<tr><th>评估项目</th><th>您的表现</th><th>推断评分范围</th></tr>';
    if (scores.fmaUpper) html += '<tr><td>上肢运动功能</td><td>' + (scores.fmaUpper.raw==='0'?'完全不能抬臂':scores.fmaUpper.raw==='1'?'能抬一点':'接近正常') + '</td><td>FMA 上肢 约 ' + scores.fmaUpper.score + '/' + scores.fmaUpper.max + '（' + scores.fmaUpper.level + '）</td></tr>';
    if (scores.bergLevel) html += '<tr><td>平衡功能</td><td>' + (scores.bergLevel.raw==='0'?'容易歪倒':scores.bergLevel.raw==='1'?'需支撑':'可稳坐') + '</td><td>' + scores.bergLevel.level + '</td></tr>';
    if (scores.ashworthLevel) html += '<tr><td>肌张力</td><td>' + (scores.ashworthLevel.raw==='0'?'无僵硬':scores.ashworthLevel.raw==='1'?'轻微僵硬':'明显痉挛') + '</td><td>' + scores.ashworthLevel.level + '</td></tr>';
    if (scores.walk6min) html += '<tr><td>步行耐力</td><td>' + (scores.walk6min.raw==='0'?'<3分钟':scores.walk6min.raw==='1'?'3-10分钟':scores.walk6min.raw==='2'?'10-30分钟':'30分钟以上') + '</td><td>6MWD 约 ' + scores.walk6min.est + '</td></tr>';
    html += '</table></div>';

    // FITT-VP 处方
    html += '<div class="rx-fittvp-section">' +
      '<div class="rx-fittvp-title">💊 您的 FITT-VP 运动处方</div>' +
      '<table class="rx-fittvp-table">' +
        '<tr><th>维度</th><th>建议</th></tr>' +
        '<tr><td><strong>Frequency（频率）</strong></td><td>' + freq + '</td></tr>' +
        '<tr><td><strong>Intensity（强度）</strong></td><td>' + intensity + '</td></tr>' +
        '<tr><td><strong>Time（时间）</strong></td><td>' + time + '</td></tr>' +
        '<tr><td><strong>Type（类型）</strong></td><td style="white-space:pre-line">' + type + '</td></tr>' +
        '<tr><td><strong>Volume（总量）</strong></td><td>' + volume + '</td></tr>' +
        '<tr><td><strong>Progression（进阶）</strong></td><td style="white-space:pre-line">' + progression + '</td></tr>' +
      '</table></div>';

    // 注意事项
    if (precautions.length > 0) {
      html += '<div class="rx-precautions">' +
        '<div class="rx-precautions-title">⚠️ 注意事项</div><ul class="rx-precautions-list">';
      precautions.forEach(function(p) { html += '<li>' + p + '</li>'; });
      html += '</ul></div>';
    }

    // 参考文献按钮
    html += '<button class="rx-drawer-toggle" onclick="toggleEvidenceDrawer()">📚 查看参考文献与循证依据</button>';
    html += '<div class="rx-evidence-drawer" id="evidence-drawer">' +
      '<div class="rx-drawer-header">' +
        '<div class="rx-drawer-title">📚 循证参考文献</div>' +
        '<button class="rx-drawer-close" onclick="toggleEvidenceDrawer()">✕</button>' +
      '</div>' +
      '<div class="rx-drawer-body" id="evidence-drawer-body">加载中...</div>' +
    '</div>';

    return html;
  }

  // ========== 全局函数：参考文献抽屉 ==========
  window.toggleEvidenceDrawer = function() {
    var drawer = document.getElementById('evidence-drawer');
    if (drawer) drawer.classList.toggle('open');
    if (drawer && drawer.classList.contains('open')) {
      renderEvidence();
    }
  };

  function renderEvidence() {
    var body = document.getElementById('evidence-drawer-body');
    if (!body) return;
    var specialty = sessionStorage.getItem('rx-specialty') || 'neurologic';
    var refs = {
      'neurologic': [
        { title:'中国脑卒中早期康复治疗指南（2017）', source:'中华医学会物理医学与康复学分会', level:'1' },
        { title:'Stroke Rehabilitation Clinical Practice Guideline (2022)', source:'ASIA/AHA', level:'1' },
        { title:'帕金森病康复指南', source:'中国医师协会神经内科分会', level:'2' },
      ],
      'orthopedic': [
        { title:'ACSM Exercise Testing and Prescription (11th Ed)', source:'American College of Sports Medicine', level:'1' },
        { title:'AAOS Clinical Practice Guideline: ACL Injury', source:'American Academy of Orthopaedic Surgeons', level:'1' },
        { title:'全膝关节置换术康复指南', source:'中华医学会骨科分会', level:'2' },
      ],
      'cardiopulmonary': [
        { title:'GOLD 2024 Report: COPD Diagnosis and Management', source:'Global Initiative for Chronic Obstructive Lung Disease', level:'1' },
        { title:'AACVPR Core Components of Cardiac Rehab (2022)', source:'American Association of Cardiovascular and Pulmonary Rehabilitation', level:'1' },
        { title:'WHO 新冠康复指导手册（2023）', source:'World Health Organization', level:'2' },
      ]
    };
    var list = refs[specialty] || refs['neurologic'];
    var html = '';
    list.forEach(function(r) {
      var cls = r.level === '1' ? 'rx-ref-level-1' : r.level === '2' ? 'rx-ref-level-2' : 'rx-ref-level-3';
      html += '<div class="rx-ref-item">' +
        '<div class="rx-ref-title">' + r.title + '</div>' +
        '<div class="rx-ref-meta">来源：' + r.source + '</div>' +
        '<span class="rx-ref-level ' + cls + '">证据等级 ' + r.level + '</span>' +
      '</div>';
    });
    body.innerHTML = html;
  }

})();
