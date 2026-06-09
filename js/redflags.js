// redflags.js — 红旗症状拦截
const RedFlags = {
  keywords: {
    '胸痛':          { level:'red',   alert:'⚠️ 胸痛可能是心脏病发作的征兆，请立即就医！', department:'心内科/急诊' },
    '胸闷':          { level:'red',   alert:'⚠️ 胸闷可能提示心肺问题，建议尽快就医。', department:'心内科/呼吸科' },
    '剧烈头痛':      { level:'red',   alert:'⚠️ 突发剧烈头痛可能是脑血管意外，请立即就医！', department:'神经内科/急诊' },
    '头痛':          { level:'orange', alert:'⚠️ 如果头痛伴随呕吐、视力模糊或意识障碍，请立即就医。', department:'神经内科' },
    '呼吸困难':      { level:'red',   alert:'⚠️ 严重呼吸困难可能是肺栓塞或心衰，请立即就医！', department:'呼吸科/急诊' },
    '气喘':          { level:'orange', alert:'⚠️ 如果静息时也气喘，或伴随胸痛，请立即就医。', department:'呼吸科/心内科' },
    '咯血':          { level:'red',   alert:'⚠️ 咯血可能提示严重肺部疾病，请立即就医！', department:'呼吸科/急诊' },
    '肢体无力':      { level:'red',   alert:'⚠️ 突发肢体无力可能是脑卒中，请立即拨打急救电话！', department:'神经内科/急诊' },
    '一侧肢体无力':  { level:'red',   alert:'⚠️ 突发一侧肢体无力是脑卒中的典型症状，请立即就医！', department:'神经内科/急诊' },
    '口角歪斜':      { level:'red',   alert:'⚠️ 口角歪斜可能是脑卒中的征兆，请立即就医！', department:'神经内科/急诊' },
    '言语不清':      { level:'red',   alert:'⚠️ 突发言语不清可能是脑卒中，请立即就医！', department:'神经内科/急诊' },
    '跌倒':          { level:'orange', alert:'⚠️ 如果近期反复跌倒，建议进行平衡和步态评估。', department:'康复科/神经内科' },
    '发热':          { level:'orange', alert:'⚠️ 康复期间发热可能提示感染，建议就医检查。', department:'全科/感染科' },
    '体温':          { level:'orange', alert:'⚠️ 如果体温＞38.5°C，建议暂停康复训练并就医。', department:'全科' },
    '肿胀':          { level:'orange', alert:'⚠️ 术后肢体突发肿胀可能提示深静脉血栓，请尽快就医！', department:'血管外科/骨科' },
    '红肿':          { level:'orange', alert:'⚠️ 手术切口红肿热痛可能提示感染，建议尽快就医。', department:'骨科/外科' },
    '渗液':          { level:'orange', alert:'⚠️ 手术切口渗液可能提示感染，建议尽快就医。', department:'骨科/外科' },
    '意识模糊':      { level:'red',   alert:'⚠️ 意识模糊可能是严重疾病的征兆，请立即就医！', department:'神经内科/急诊' },
    '抽搐':          { level:'red',   alert:'⚠️ 抽搐可能是癫痫等神经系统疾病，请立即就医！', department:'神经内科/急诊' },
    '吞咽困难':      { level:'orange', alert:'⚠️ 吞咽困难可能导致误吸，建议尽快评估。', department:'康复科/神经内科' },
    '尿失禁':        { level:'orange', alert:'⚠️ 如果突然出现的尿失禁，建议尽快就医。', department:'泌尿外科/神经内科' },
  },

  check: function(text) {
    if (!text) return null;
    var t = text.toLowerCase();
    var matched = [];
    for (var kw in this.keywords) {
      if (t.indexOf(kw.toLowerCase()) !== -1) {
        matched.push({ keyword: kw, info: this.keywords[kw] });
      }
    }
    if (matched.length === 0) return null;
    // 只要有 red 级别就优先返回
    for (var i = 0; i < matched.length; i++) {
      if (matched[i].info.level === 'red') return { isRedFlag: true, matches: [matched[i]], all: matched };
    }
    return { isRedFlag: true, matches: matched, all: matched };
  },

  // 供评估页表单使用：检查选中的红旗症状
  checkSelected: function(selectedValues) {
    if (!selectedValues || selectedValues.length === 0 || selectedValues.indexOf('none') !== -1) return null;
    var matched = [];
    for (var i = 0; i < selectedValues.length; i++) {
      var v = selectedValues[i];
      for (var kw in this.keywords) {
        if (v.indexOf(kw) !== -1 || kw.indexOf(v) !== -1) {
          matched.push({ keyword: kw, info: this.keywords[kw] });
          break;
        }
      }
    }
    if (matched.length === 0) return null;
    return { isRedFlag: true, matches: matched };
  }
};

// 全局函数：检查红旗症状，如果有则弹窗
function checkRedFlags(text) {
  return RedFlags.check(text);
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
      '<a href="assessment.html" class="rx-redflag-btn" style="display:block;text-decoration:none;">我已了解，仍要继续评估</a>' +
    '</div>';
  document.body.appendChild(overlay);
}
