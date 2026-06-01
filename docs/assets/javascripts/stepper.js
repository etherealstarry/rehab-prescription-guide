/* ============================================================
   stepper.js — 多步骤评估表单（Stepper）
   交互：分步问卷，选择题自动评分，无需专业背景
   注意：不使用内联 onclick/oninput（MkDocs Material 会剥离）
   ============================================================ */

function RxStepper(containerId, stepsConfig, onSubmit) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var currentStep = 0;
  var steps = stepsConfig;
  var self = this;

  function bindEvents() {
    /* 按钮：通过 data-rx-btn 属性绑定 */
    container.querySelectorAll('[data-rx-btn]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var action = this.getAttribute('data-rx-btn');
        if (action === 'prev') self.prev();
        else if (action === 'next') self.next();
        else if (action === 'submit') self.submit();
      });
    });

    /* range 滑块：实时更新数值显示 */
    container.querySelectorAll('input[type="range"]').forEach(function(r) {
      var span = document.getElementById('rx-val-' + r.name);
      if (span) span.textContent = r.value;
      r.addEventListener('input', function() {
        var s = document.getElementById('rx-val-' + r.name);
        if (s) s.textContent = r.value;
      });
    });
  }

  function render() {
    var html = '<div class="rx-stepper">';
    steps.forEach(function(step, i) {
      var cls = i < currentStep ? 'completed' : i === currentStep ? 'active' : '';
      html += '<div class="rx-step ' + cls + '">' +
        '<div class="rx-step-circle">' + (i + 1) + '</div>' +
        '<span class="rx-step-label">' + step.title + '</span>' +
        '</div>';
      if (i < steps.length - 1) html += '<div class="rx-step-line"></div>';
    });
    html += '</div>';

    if (currentStep < steps.length) {
      var step = steps[currentStep];
      html += '<div class="rx-step-form" id="rx-step-form">' +
        '<h3 style="margin:1.2rem 0 0.8rem;color:var(--md-primary-fg-color,#1B2A4A);">' + step.title + '</h3>';

      (step.fields || []).forEach(function(f) {
        var name = f.name;
        if (f.type === 'select') {
          var opts = '<option value="">请选择</option>';
          (f.options || []).forEach(function(o) {
            opts += '<option value="' + (o.value || o) + '">' + (o.label || o) + '</option>';
          });
          html += '<div class="rx-field"><label>' + f.label + '</label>' +
            '<select name="' + name + '" style="width:100%;padding:0.6rem;border:1px solid var(--card-border,#E8EAF0);border-radius:8px;font-size:0.95rem;background:#fff;">' +
            opts + '</select></div>';

        } else if (f.type === 'textarea') {
          html += '<div class="rx-field"><label>' + f.label + '</label>' +
            '<textarea name="' + name + '" placeholder="' + (f.placeholder || '') + '" style="width:100%;min-height:80px;padding:0.6rem;border:1px solid var(--card-border,#E8EAF0);border-radius:8px;font-size:0.95rem;font-family:var(--font-zh);resize:vertical;"></textarea></div>';

        } else if (f.type === 'range') {
          var min = f.min || 0;
          var max = f.max || 10;
          var valId = 'rx-val-' + name;
          html += '<div class="rx-field"><label>' + f.label + ' <span class="rx-range-val" id="' + valId + '">' + min + '</span></label>' +
            '<input type="range" name="' + name + '" min="' + min + '" max="' + max + '" value="' + min + '" style="width:100%;"></div>';

        } else if (f.type === 'checkbox') {
          var cbHtml = '';
          (f.options || []).forEach(function(o) {
            cbHtml += '<label style="display:flex;align-items:center;gap:0.4rem;padding:0.35rem 0.7rem;background:var(--color-healing-green--light,#E8F5F0);border-radius:16px;cursor:pointer;font-size:0.88rem;">' +
              '<input type="checkbox" name="' + name + '" value="' + (o.value || o) + '" style="accent-color:var(--md-primary-fg-color,#1565C0);">' +
              (o.label || o) + '</label>';
          });
          html += '<div class="rx-field"><label>' + f.label + '</label>' +
            '<div style="display:flex;flex-direction:column;gap:0.4rem;margin-top:0.4rem;">' + cbHtml + '</div>' +
            (f.hint ? '<p style="font-size:0.78rem;color:var(--md-default-fg-color--light);margin:0.3rem 0 0;opacity:0.7;">' + f.hint + '</p>' : '') +
            '</div>';

        } else if (f.type === 'radio') {
          var radioHtml = '';
          (f.options || []).forEach(function(o) {
            radioHtml += '<label style="display:flex;align-items:center;gap:0.3rem;padding:0.4rem 0.8rem;background:var(--color-healing-green--light,#E8F5F0);border-radius:20px;cursor:pointer;font-size:0.9rem;">' +
              '<input type="radio" name="' + name + '" value="' + (o.value || o) + '"> ' + (o.label || o) + '</label>';
          });
          html += '<div class="rx-field"><label>' + f.label + '</label><div style="display:flex;gap:0.8rem;flex-wrap:wrap;margin-top:0.4rem;">' + radioHtml + '</div></div>';

        } else {
          html += '<div class="rx-field"><label>' + f.label + '</label>' +
            '<input type="' + (f.type || 'text') + '" name="' + name + '" placeholder="' + (f.placeholder || '') + '" style="width:100%;padding:0.6rem;border:1px solid var(--card-border,#E8EAF0);border-radius:8px;font-size:0.95rem;"></div>';
        }
      });

      /* 按钮：使用 data-rx-btn 属性 */
      var btnHtml = '<div style="display:flex;gap:0.8rem;margin-top:1.5rem;">';
      if (currentStep > 0) {
        btnHtml += '<button type="button" class="md-button" data-rx-btn="prev">上一步</button>';
      }
      if (currentStep < steps.length - 1) {
        btnHtml += '<button type="button" class="md-button md-button--primary" data-rx-btn="next">下一步 →</button>';
      } else {
        btnHtml += '<button type="button" class="md-button md-button--accent" data-rx-btn="submit">✓ 生成处方</button>';
      }
      btnHtml += '</div>';
      html += btnHtml + '</div>';
    }
    html += '</div>';
    container.innerHTML = html;

    /* 绑定所有动态事件 */
    bindEvents();
  }

  this.next = function() {
    if (currentStep < steps.length - 1) { currentStep++; render(); }
  };
  this.prev = function() {
    if (currentStep > 0) { currentStep--; render(); }
  };
  this.submit = function() {
    var formData = {};
    container.querySelectorAll('input[type="checkbox"]').forEach(function(el) {
      if (!formData[el.name]) formData[el.name] = [];
      if (el.checked) formData[el.name].push(el.value);
    });
    container.querySelectorAll('input:not([type="checkbox"]),select,textarea').forEach(function(el) {
      if (el.type === 'radio') {
        if (el.checked) formData[el.name] = el.value;
      } else if (!formData.hasOwnProperty(el.name)) {
        formData[el.name] = el.value;
      }
    });
    if (onSubmit) onSubmit(formData, steps);
  };

  render();
}

/* 静态方法供外部调用 */
RxStepper._instances = {};
RxStepper._init = function(containerId, stepsConfig, onSubmit) {
  RxStepper._instances[containerId] = new RxStepper(containerId, stepsConfig, onSubmit);
};
RxStepper._next = function(id) { if (RxStepper._instances[id]) RxStepper._instances[id].next(); };
RxStepper._prev = function(id) { if (RxStepper._instances[id]) RxStepper._instances[id].prev(); };
RxStepper._submit = function(id) { if (RxStepper._instances[id]) RxStepper._instances[id].submit(); };
