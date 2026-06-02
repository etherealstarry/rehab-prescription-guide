/* ============================================================
   body-map.js — 人体点选九宫格交互逻辑
   替代文字输入症状定位，让用户直观点击身体部位
   ============================================================ */

const BodyMap = {
  /* 身体部位数据 */
  parts: [
    { id: 'head', icon: '🧠', label: '头/面', value: 'head', keywords: ['头晕', '头痛', '头疼', '面瘫', '面痛'] },
    { id: 'neck', icon: '💆', label: '颈/肩', value: 'neck', keywords: ['颈痛', '颈椎病', '肩痛', '肩周炎', '手麻', '手指麻'] },
    { id: 'chest', icon: '🫀', label: '胸/心', value: 'chest', keywords: ['胸闷', '胸痛', '气喘', '气短', '心悸'] },
    { id: 'abdomen', icon: '🫄', label: '腹/腰', value: 'abdomen', keywords: ['腰痛', '腰疼', '腹痛', '腹胀', '消化'] },
    { id: 'pelvis', icon: '🦴', label: '盆/臀', value: 'pelvis', keywords: ['臀痛', '坐骨神经痛', '会阴麻木', '尿频'] },
    { id: 'leg', icon: '🦵', label: '腿/脚', value: 'leg', keywords: ['腿痛', '腿麻', '脚麻', '足痛', '踝痛'] },
    { id: 'arm', icon: '💪', label: '臂/手', value: 'arm', keywords: ['臂痛', '肘痛', '腕痛', '手痛', '手指痛'] },
    { id: 'knee', icon: '🦿', label: '膝/关', value: 'knee', keywords: ['膝痛', '膝盖痛', '关节痛', '上下楼梯痛'] },
    { id: 'back', icon: '🏋️', label: '背/脊', value: 'back', keywords: ['背痛', '脊柱痛', '驼背', '侧弯'] }
  ],

  /* 初始化 */
  init: function() {
    this.render();
    this.bindEvents();
  },

  /* 渲染九宫格 */
  render: function() {
    var container = document.getElementById('rx-body-map');
    if (!container) return;

    var html = '<div class="rx-body-map-container">' +
                 '<div class="rx-body-map-title">请点击身体部位，描述您的症状</div>' +
                 '<div class="rx-body-grid">';

    this.parts.forEach(function(part) {
      html += '<div class="rx-body-part" data-value="' + part.value + '">' +
                 '<span class="rx-body-part-icon">' + part.icon + '</span>' +
                 '<span class="rx-body-part-label">' + part.label + '</span>' +
               '</div>';
    });

    html += '</div>' +
             '<div class="rx-body-actions">' +
               '<button class="rx-body-btn rx-body-btn-secondary" id="rx-body-reset">重新选择</button>' +
               '<button class="rx-body-btn rx-body-btn-primary" id="rx-body-confirm" disabled>确认选择</button>' +
             '</div>' +
           '</div>';

    container.innerHTML = html;
  },

  /* 绑定事件 */
  bindEvents: function() {
    var self = this;

    // 身体部位点击
    document.addEventListener('click', function(e) {
      var part = e.target.closest('.rx-body-part');
      if (part) {
        // 切换选中状态
        document.querySelectorAll('.rx-body-part').forEach(function(p) {
          p.classList.remove('active');
        });
        part.classList.add('active');

        // 启用确认按钮
        var confirmBtn = document.getElementById('rx-body-confirm');
        if (confirmBtn) confirmBtn.disabled = false;
      }
    });

    // 重新选择
    var resetBtn = document.getElementById('rx-body-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        document.querySelectorAll('.rx-body-part').forEach(function(p) {
          p.classList.remove('active');
        });
        var confirmBtn = document.getElementById('rx-body-confirm');
        if (confirmBtn) confirmBtn.disabled = true;
      });
    }

    // 确认选择
    var confirmBtn = document.getElementById('rx-body-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        var activePart = document.querySelector('.rx-body-part.active');
        if (activePart) {
          var value = activePart.getAttribute('data-value');
          self.onSelect(value);
        }
      });
    }
  },

  /* 选择回调 */
  onSelect: function(value) {
    // 根据选择的身体部位，找到对应的关键词，触发追问树
    var keywords = [];
    this.parts.forEach(function(part) {
      if (part.value === value) {
        keywords = part.keywords;
      }
    });

    if (keywords.length > 0) {
      // 用第一个关键词作为输入，触发搜索
      var input = document.getElementById('rx-search-input');
      if (input) {
        input.value = keywords[0];
        // 触发搜索
        var form = document.getElementById('rx-search-form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }

      // 隐藏人体地图
      var container = document.getElementById('rx-body-map');
      if (container) container.classList.add('rx-hidden');
    }
  }
};

/* 页面加载后初始化 */
document.addEventListener('DOMContentLoaded', function() {
  BodyMap.init();
});
