/* ============================================================
   stepper.js — 多步骤评估表单（Stepper）
   交互：输入症状/疾病后，平滑展开分步评估表单
   ============================================================ */

function RxStepper(containerId, stepsConfig, onSubmit) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let currentStep = 0;
  const steps = stepsConfig; // [{title, fields: [{name,label,type,options,placeholder}]}]

  function render() {
    let html = '<div class="rx-stepper">';
    steps.forEach((step, i) => {
      const cls = i < currentStep ? 'completed' : i === currentStep ? 'active' : '';
      html += `<div class="rx-step ${cls}">
        <div class="rx-step-circle">${i + 1}</div>
        <span class="rx-step-label">${step.title}</span>
      </div>`;
      if (i < steps.length - 1) html += '<div class="rx-step-line"></div>';
    });
    html += '</div>';

    /* 当前步骤表单 */
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      html += `<div class="rx-step-form" id="rx-step-form">
        <h3 style="margin:1.2rem 0 0.8rem;color:var(--md-primary-fg-color,#1B2A4A);">${step.title}</h3>`;
      (step.fields || []).forEach(f => {
        if (f.type === 'select') {
          html += `<div class="rx-field">
            <label>${f.label}</label>
            <select name="${f.name}" style="width:100%;padding:0.6rem;border:1px solid var(--card-border,#E8EAF0);border-radius:8px;font-size:0.95rem;background:#fff;">
              <option value="">请选择</option>
              ${(f.options||[]).map(o => `<option value="${o.value||o}">${o.label||o}</option>`).join('')}
            </select></div>`;
        } else if (f.type === 'textarea') {
          html += `<div class="rx-field">
            <label>${f.label}</label>
            <textarea name="${f.name}" placeholder="${f.placeholder||''}" style="width:100%;min-height:80px;padding:0.6rem;border:1px solid var(--card-border,#E8EAF0);border-radius:8px;font-size:0.95rem;font-family:var(--font-zh);resize:vertical;"></textarea></div>`;
        } else if (f.type === 'range') {
          html += `<div class="rx-field">
            <label>${f.label} <span class="rx-range-val" id="rx-val-${f.name}">${f.min||0}</span></label>
            <input type="range" name="${f.name}" min="${f.min||0}" max="${f.max||10}" value="${f.min||0}" style="width:100%;" oninput="document.getElementById('rx-val-${f.name}').textContent=this.value"></div>`;
        } else if (f.type === 'radio') {
          html += `<div class="rx-field"><label>${f.label}</label><div style="display:flex;gap:0.8rem;flex-wrap:wrap;margin-top:0.4rem;">${(f.options||[]).map(o => `<label style="display:flex;align-items:center;gap:0.3rem;padding:0.4rem 0.8rem;background:var(--color-healing-green--light,#E8F5F0);border-radius:20px;cursor:pointer;font-size:0.9rem;"><input type="radio" name="${f.name}" value="${o.value||o}"> ${o.label||o}</label>`).join('')}</div></div>`;
        } else {
          html += `<div class="rx-field">
            <label>${f.label}</label>
            <input type="${f.type||'text'}" name="${f.name}" placeholder="${f.placeholder||''}" style="width:100%;padding:0.6rem;border:1px solid var(--card-border,#E8EAF0);border-radius:8px;font-size:0.95rem;"></div>`;
        }
      });
      html += `<div style="display:flex;gap:0.8rem;margin-top:1.5rem;">
        ${currentStep > 0 ? `<button type="button" class="md-button" onclick="RxStepper._prev('${containerId}')">上一步</button>` : ''}
        ${currentStep < steps.length - 1
          ? `<button type="button" class="md-button md-button--primary" onclick="RxStepper._next('${containerId}')">下一步 →</button>`
          : `<button type="button" class="md-button md-button--accent" onclick="RxStepper._submit('${containerId}')">✓ 生成处方</button>`}
      </div>`;
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  this.next = function() {
    if (currentStep < steps.length - 1) { currentStep++; render(); }
  };
  this.prev = function() {
    if (currentStep > 0) { currentStep--; render(); }
  };
  this.submit = function() {
    const formData = {};
    container.querySelectorAll('input,select,textarea').forEach(el => {
      if (el.type === 'radio') { if (el.checked) formData[el.name] = el.value; }
      else formData[el.name] = el.value;
    });
    onSubmit && onSubmit(formData, steps);
  };

  render();
}

/* 静态方法供 onclick 调用 */
RxStepper._instances = {};
RxStepper._init = function(containerId, stepsConfig, onSubmit) {
  RxStepper._instances[containerId] = new RxStepper(containerId, stepsConfig, onSubmit);
};
RxStepper._next = function(id) { RxStepper._instances[id] && RxStepper._instances[id].next(); };
RxStepper._prev = function(id) { RxStepper._instances[id] && RxStepper._instances[id].prev(); };
RxStepper._submit = function(id) { RxStepper._instances[id] && RxStepper._instances[id].submit(); };

/* 供 assessment.js 调用 */
function initAssessmentStepper(specialty) {
  const configMap = {
    'neurologic': [
      { title: '基本信息', fields: [
        { name: 'diagnosis', label: '诊断/病名', type: 'select', options: [
          {value:'stroke',label:'脑卒中（缺血性/出血性）'},
          {value:'sci',label:'脊髓损伤'},
          {value:'parkinson',label:'帕金森病'},
          {value:'peripheral',label:'周围神经病变'}
        ]},
        { name: 'onsetDays', label: '发病/术后天数', type: 'number', placeholder: '天' },
        { name: 'dominantHand', label: '利手', type: 'select', options: ['左','右'] }
      ]},
      { title: '运动功能（Fugl-Meyer）', fields: [
        { name: 'fmUpper', label: '上肢 FMA 评分（0-66）', type: 'range', min:0, max:66 },
        { name: 'fmLower', label: '下肢 FMA 评分（0-34）', type: 'range', min:0, max:34 },
        { name: 'balance', label: '平衡能力（Berg 评分）', type: 'select', options: [
          {value:'0',label:'0-20分（平衡障碍严重）'},
          {value:'1',label:'21-40分（中等障碍）'},
          {value:'2',label:'41-56分（轻度障碍）'}
        ]}
      ]},
      { title: '肌张力（Ashworth 分级）', fields: [
        { name: 'ashworth', label: '患侧上肢肌张力', type: 'select', options: ['0','1','1+','2','3','4'] },
        { name: 'ashworthLeg', label: '患侧下肢肌张力', type: 'select', options: ['0','1','1+','2','3','4'] },
        { name: 'spasticityNote', label: '痉挛备注（部位/触发因素）', type: 'textarea', placeholder: '如：踝阵挛阳性，行走时小腿三头肌痉挛' }
      ]},
      { title: '合并症与安全', fields: [
        { name: 'redFlags', label: '是否存在以下红旗症状？（可多选）', type: 'textarea', placeholder: '如：胸痛、剧烈头痛、静息心率>100次/分…\n如无请您填写"无"' },
        { name: 'comorbidities', label: '合并症（高血压/糖尿病/冠心病等）', type: 'textarea', placeholder: '请列出目前正在服用的药物及诊断' },
        { name: 'medications', label: '当前用药', type: 'textarea', placeholder: '如：阿司匹林 100mg qd，二甲双胍 500mg tid' }
      ]}
    ],
    'orthopedic': [
      { title: '基本信息', fields: [
        { name: 'diagnosis', label: '诊断/手术名称', type: 'select', options: [
          {value:'acl',label:'前交叉韧带重建术（ACL-R）'},
          {value:'meniscus',label:'半月板缝合/切除'},
          {value:'rotator',label:'肩袖修复术'},
          {value:'thr',label:'全髋关节置换术（THR）'},
          {value:'tkr',label:'全膝关节置换术（TKR）'}
        ]},
        { name: 'postOpWeeks', label: '术后周数', type: 'number', placeholder: '周' },
        { name: 'surgicalApproach', label: '手术入路（THR/TKR）', type: 'select', options: ['前侧入路','外侧入路','后侧入路','不确定'] }
      ]},
      { title: '关节活动度（ROM）', fields: [
        { name: 'romFlexion', label: '屈曲 ROM（°）', type: 'number', placeholder: '如：ACL-R 屈膝：120°' },
        { name: 'romExtension', label: '伸展缺失（°）', type: 'number', placeholder: '如：伸膝缺失 -5°' },
        { name: 'romNote', label: '其他关节 / 注意事项', type: 'textarea', placeholder: '如：肩外展受限至 90°，需避免超过 120° 外展' }
      ]},
      { title: '疼痛与功能', fields: [
        { name: 'vas', label: '静息疼痛 VAS（0-10）', type: 'range', min:0, max:10 },
        { name: 'vasMotion', label: '运动时疼痛 VAS（0-10）', type: 'range', min:0, max:10 },
        { name: 'walkAid', label: '行走辅助', type: 'select', options: ['无（独立行走）','单手杖','双手杖','助行器','无法负重'] }
      ]},
      { title: '合并症与安全', fields: [
        { name: 'redFlags', label: '是否存在以下红旗症状？', type: 'textarea', placeholder: '如：术侧肢体突发肿胀/发红（疑似 DVT）\n静息时胸痛/呼吸困难（疑似 PE）\n如无请填"无"' },
        { name: 'wound', label: '切口情况', type: 'select', options: ['已愈合','仍有渗液','红肿热痛','不确定'] }
      ]}
    ],
    'cardiopulmonary': [
      { title: '基本信息', fields: [
        { name: 'diagnosis', label: '诊断', type: 'select', options: [
          {value:'copd',label:'慢性阻塞性肺病（COPD）'},
          {value:'mi',label:'急性心肌梗死（AMI）'},
          {value:'heartFailure',label:'心力衰竭'},
          {value:'cabg',label:'冠脉搭桥术后（CABG）'},
          {value:'postCovid',label:'新冠后康复（Long COVID）'}
        ]},
        { name: 'onsetDays', label: '发病/术后天数', type: 'number', placeholder: '天' },
        { name: 'nyha', label: 'NYHA 心功能分级（心衰患者）', type: 'select', options: ['I级','II级','III级','IV级','不适用'] }
      ]},
      { title: '心肺功能评估', fields: [
        { name: 'restHR', label: '静息心率（次/分）', type: 'number', placeholder: '如：72' },
        { name: 'restBP', label: '静息血压（mmHg）', type: 'text', placeholder: '如：120/80' },
        { name: 'spo2', label: '静息 SpO₂（%）', type: 'number', placeholder: '如：96' },
        { name: 'borgDyspnea', label: '静息 Borg 呼吸困难评分（0-10）', type: 'range', min:0, max:10 }
      ]},
      { title: '运动能力与 RPE', fields: [
        { name: 'sixMWD', label: '6分钟步行距离（m）', type: 'number', placeholder: '如：400' },
        { name: 'rpeRest', label: '日常活动 RPE（6-20）', type: 'range', min:6, max:20 },
        { name: 'rpeExercise', label: '既往运动强度 RPE（6-20）', type: 'range', min:6, max:20 }
      ]},
      { title: '合并症与安全', fields: [
        { name: 'redFlags', label: '是否存在以下红旗症状？', type: 'textarea', placeholder: '如：静息时胸痛 / 呼吸困难加重\n足踝水肿加重\n如无请填"无"' },
        { name: 'arrhythmia', label: '心律失常史', type: 'select', options: ['无','房颤','室性早搏','起搏器术后','不确定'] }
      ]}
    ]
  };

  const config = configMap[specialty] || configMap['neurologic'];
  const container = document.getElementById('assessment-steps');
  if (container) {
    RxStepper._init('assessment-steps', config, function(formData, steps) {
      /* 提交后跳转到处方页 */
      sessionStorage.setItem('rx-assessment-data', JSON.stringify(formData));
      sessionStorage.setItem('rx-specialty', specialty);
      window.location.href = '../interactive/prescription.html';
    });
  }
}
