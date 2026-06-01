---
hide:
  - navigation
  - toc
---

<div class="rx-result" id="rx-result">

  <!-- 诊断结论卡片 -->
  <div class="rx-diagnosis-card">
    <div class="rx-dx-badge" id="rx-dx-badge">初步判断</div>
    <h1 class="rx-dx-title" id="rx-dx-title">正在加载...</h1>
    <div class="rx-dx-meta" id="rx-dx-meta"></div>
  </div>

  <!-- 红旗症状警告 -->
  <div class="rx-redflag" id="rx-redflag" style="display:none;">
    ⚠️ <strong>红旗症状警告：</strong><span id="rx-redflag-text"></span>
    <br><strong>请立即就医，不要延误！</strong>
  </div>

  <!-- 处方卡片 -->
  <div class="rx-prescription-section">
    <h2>📋 个性化运动处方（FITT-VP）</h2>
    <div id="rx-prescription-cards"></div>
  </div>

  <!-- 循证来源 -->
  <div class="rx-evidence-section">
    <h2>📚 循证来源</h2>
    <div id="rx-evidence-list"></div>
  </div>

  <!-- 免责声明 -->
  <div class="rx-disclaimer">
    <strong>⚠️ 免责声明</strong>
    <p>本处方仅供参考，不构成医疗建议。请在专业康复医师指导下进行训练。如出现不适，请立即停止并就医。</p>
    <a href="../guide/disclaimer.html" class="rx-link">查看完整免责声明 →</a>
  </div>

  <!-- 操作按钮 -->
  <div class="rx-actions">
    <button class="rx-btn-outline" onclick="window.print()">🖨️ 打印处方</button>
    <button class="rx-btn-outline" onclick="location.href='../'">🔄 重新评估</button>
  </div>

</div>

<script>
(function() {
  var data = {};
  try {
    data = JSON.parse(sessionStorage.getItem('rx-dx-data') || '{}');
  } catch(e) {}

  if (!data.symptoms) {
    document.getElementById('rx-dx-title').textContent = '未找到评估数据，请重新评估';
    return;
  }

  // 显示诊断结论
  document.getElementById('rx-dx-title').textContent = data.diagnosis || '待明确诊断';
  document.getElementById('rx-dx-meta').innerHTML =
    '<span>📝 症状描述：' + escapeHtml(data.symptoms) + '</span>' +
    '<span>🏥 专科方向：' + getSpecialtyName(data.specialty) + '</span>';

  // 显示红旗症状
  if (data.triageAnswers && data.triageAnswers.redFlags && 
      data.triageAnswers.redFlags.indexOf('以上都没有') === -1 && 
      data.triageAnswers.redFlags.indexOf('无') === -1) {
    document.getElementById('rx-redflag').style.display = 'block';
    document.getElementById('rx-redflag-text').textContent = data.triageAnswers.redFlags;
  }

  // 生成处方卡片
  renderPrescription(data);

  // 生成循证来源
  renderEvidence(data);

  function getSpecialtyName(s) {
    var map = { neurologic: '神经康复', orthopedic: '骨科康复', cardiopulmonary: '心肺康复' };
    return map[s] || s;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderPrescription(data) {
    var cards = getPrescriptionBySpecialty(data.specialty, data);
    var container = document.getElementById('rx-prescription-cards');
    container.innerHTML = cards.map(function(c) {
      return '<div class="rx-prescription-card">' +
        '<div class="rx-pc-header">' +
          '<span class="rx-pc-phase">' + c.phase + '</span>' +
          '<span class="rx-pc-evidence badge-evidence-' + c.evidenceLevel + '">证据 ' + c.evidenceLevel + '</span>' +
        '</div>' +
        '<h3 class="rx-pc-title">' + c.title + '</h3>' +
        '<div class="rx-pc-fitt">' +
          '<div class="rx-fitt-item"><span class="rx-fitt-label">频次(F)</span><span class="rx-fitt-value">' + c.frequency + '</span></div>' +
          '<div class="rx-fitt-item"><span class="rx-fitt-label">强度(I)</span><span class="rx-fitt-value">' + c.intensity + '</span></div>' +
          '<div class="rx-fitt-item"><span class="rx-fitt-label">时间(T)</span><span class="rx-fitt-value">' + c.time + '</span></div>' +
          '<div class="rx-fitt-item"><span class="rx-fitt-label">类型(T)</span><span class="rx-fitt-value">' + c.type + '</span></div>' +
          '<div class="rx-fitt-item"><span class="rx-fitt-label">总量(V)</span><span class="rx-fitt-value">' + c.volume + '</span></div>' +
          '<div class="rx-fitt-item"><span class="rx-fitt-label">进阶(P)</span><span class="rx-fitt-value">' + c.progression + '</span></div>' +
        '</div>' +
        '<p class="rx-pc-note">' + c.note + '</p>' +
        '<button class="rx-evidence-toggle" onclick="toggleEvidence(this)">📖 查看循证来源</button>' +
        '<div class="rx-evidence-detail" style="display:none;">' + (c.evidenceSource || '来源待补充') + '</div>' +
      '</div>';
    }).join('');
  }

  function getPrescriptionBySpecialty(specialty, data) {
    // 根据专科和诊断返回处方模板
    if (specialty === 'neurologic') {
      return [
        { phase: '急性期（0-2周）', title: '体位管理与被动活动', evidenceLevel: 'Ia',
          frequency: '每日 2-3 次', intensity: '无痛范围内', time: '每次 20-30 min',
          type: '被动关节活动、体位摆放', volume: '每周 14-18 次', progression: '疼痛耐受范围内逐渐增加 ROM',
          note: '重点预防并发症（肩关节半脱位、肩手综合征、深静脉血栓）。所有训练在无痛范围内进行。',
          evidenceSource: '参考文献：中国脑卒中早期康复治疗指南（2017）、Cochrane Review: Early mobilisation after stroke (2021)' },
        { phase: '亚急性期（2周-3月）', title: '任务导向性训练 + 肌力训练', evidenceLevel: 'Ia',
          frequency: '每日 1-2 次', intensity: 'RPE 11-13（轻度出汗）', time: '每次 30-45 min',
          type: '任务导向性训练、功能性电刺激、步行训练', volume: '每周 7-14 次', progression: '根据 FMA 评分每 2 周调整',
          note: '重点：任务导向性训练（Trunk Task-Specific Training）有 Ia 证据支持。每次训练前评估血压和疲劳度。',
          evidenceSource: '参考文献：Stroke Rehabilitation Clinical Practice Guideline (2020), Langhorne et al. Lancet Neurol 2021' },
        { phase: '恢复期（3-6月）', title: '步态训练 + 上肢功能训练', evidenceLevel: 'Ib',
          frequency: '每周 3-5 次', intensity: '中等强度（RPE 13-15）', time: '每次 45-60 min',
          type: '步行训练、平衡训练、上肢机器人辅助训练', volume: '每周 150 min 中等强度', progression: '逐步增加步行速度和距离',
          note: '此阶段可引入强制性运动疗法（CIMT）和机器人辅助训练，有 Ib 证据支持。',
          evidenceSource: '参考文献：AHA/ASA Guideline for Adult Stroke Rehabilitation (2021)' }
      ];
    }
    if (specialty === 'orthopedic') {
      return [
        { phase: '术后早期（0-2周）', title: '消肿止痛 + 早期活动', evidenceLevel: 'Ia',
          frequency: '每日 2-3 次', intensity: '无痛范围内', time: '每次 15-20 min',
          type: '冰敷、抬高患肢、踝泵、股四头肌等长收缩', volume: '每周 14-18 次', progression: '逐渐增加到 90° 屈曲（ACL-R）',
          note: 'ACL-R 术后：0-2周限制伸直 0°，屈曲逐步增加到 90°。避免被动伸直训练。',
          evidenceSource: '参考文献：AAOS Clinical Practice Guideline: Management of ACL Injuries (2022)' },
        { phase: '功能恢复期（2周-3月）', title: '肌力训练 + 本体感觉', evidenceLevel: 'Ia',
          frequency: '每周 3-4 次', intensity: 'RPE 12-14', time: '每次 30-40 min',
          type: '开链/闭链肌力训练、本体感觉训练、平衡训练', volume: '每周 10-14 次', progression: '术后 8 周可开始轻度开链训练',
          note: '重点：闭链训练（如靠墙静蹲）在 ACL-R 康复中优于开链训练，可减少前交叉韧带应力。',
          evidenceSource: '参考文献：JOSPT Clinical Practice Guidelines for ACL Rehabilitation (2020)' }
      ];
    }
    if (specialty === 'cardiopulmonary') {
      return [
        { phase: '稳定期', title: '有氧运动训练', evidenceLevel: 'Ia',
          frequency: '每周 3-5 次', intensity: '靶心率 = (220-年龄) × 40-60%', time: '每次 20-40 min',
          type: '步行、功率车、呼吸训练', volume: '每周 150 min 中等强度', progression: '每 2 周增加 5-10% 运动量',
          note: 'COPD 患者有氧训练有 Ia 证据支持，可显著改善 6MWD 和生活质量。训练前必须评估 SpO₂，如 <88% 需吸氧训练。',
          evidenceSource: '参考文献：GOLD Guideline (2024), AACVPR Guidelines for Pulmonary Rehab (2022)' }
      ];
    }
    return [{ phase: '通用', title: '待补充', evidenceLevel: '待评估',
      frequency: '待评估', intensity: '待评估', time: '待评估', type: '待评估', volume: '待评估', progression: '待评估',
      note: '请补充更多信息以生成个性化处方。', evidenceSource: '待补充' }];
  }

  function renderEvidence(data) {
    var list = document.getElementById('rx-evidence-list');
    list.innerHTML = '<ul class="rx-evidence-ul">' +
      '<li><a href="https://goldcopd.org/guideline/" target="_blank">GOLD 慢性阻塞性肺病指南 (2024)</a> — 证据等级 Ia</li>' +
      '<li><a href="https://www.stroke.org/guidelines/" target="_blank">AHA/ASA 脑卒中康复指南 (2021)</a> — 证据等级 Ia</li>' +
      '<li><a href="https://www.jospt.org/" target="_blank">JOSPT 前交叉韧带康复临床指南 (2020)</a> — 证据等级 Ia</li>' +
      '<li><a href="https://www.physio-pedia.com/" target="_blank">Physio-pedia 循证康复资源</a> — 综论</li>' +
    '</ul>';
  }

  window.toggleEvidence = function(btn) {
    var detail = btn.nextElementSibling;
    if (detail.style.display === 'none') {
      detail.style.display = 'block';
      btn.textContent = '📖 收起循证来源';
    } else {
      detail.style.display = 'none';
      btn.textContent = '📖 查看循证来源';
    }
  };
})();
</script>

<style>
/* ===== 处方结果页样式 ===== */
.rx-result {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

/* 诊断结论卡片 */
.rx-diagnosis-card {
  background: linear-gradient(135deg, #1565C0, #0D47A1);
  color: #fff;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}
.rx-dx-badge {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
}
.rx-dx-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.8rem; }
.rx-dx-meta { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.85rem; opacity: 0.85; }

/* 红旗警告 */
.rx-redflag {
  background: #FFF8F8;
  border: 2px solid #F44336;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
  color: #C62828;
  font-size: 0.92rem;
  line-height: 1.6;
}

/* 处方区 */
.rx-prescription-section { margin-bottom: 2rem; }
.rx-prescription-section h2 {
  font-size: 1.2rem;
  color: #1a1a2e;
  margin-bottom: 1.2rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #E8EDF2;
}

/* 处方卡片 */
.rx-prescription-card {
  background: #fff;
  border: 1px solid #E8EDF2;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s;
}
.rx-prescription-card:hover { box-shadow: 0 4px 16px rgba(21,101,192,0.1); }

.rx-pc-header { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.7rem; }
.rx-pc-phase {
  font-size: 0.75rem;
  background: #EBF3FE;
  color: #1565C0;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 600;
}
.rx-pc-title { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; margin-bottom: 1rem; }

/* 证据等级徽章 */
.badge-evidence-Ia { background: #C8E6C9; color: #2E7D32; }
.badge-evidence-Ib { background: #FFF9C4; color: #F57F17; }
.badge-evidence-IIa { background: #FFE0B2; color: #E65100; }
.badge-evidence-IIb { background: #FFCCBC; color: #BF360C; }

/* FITT-VP 网格 */
.rx-pc-fitt {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.7rem;
  margin-bottom: 1rem;
}
.rx-fitt-item {
  background: #F8F9FA;
  border-radius: 10px;
  padding: 0.7rem;
  text-align: center;
}
.rx-fitt-label { display: block; font-size: 0.72rem; color: #9ca3af; font-weight: 600; margin-bottom: 0.2rem; }
.rx-fitt-value { display: block; font-size: 0.88rem; color: #1a1a2e; font-weight: 600; }

.rx-pc-note {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 0.8rem;
}

.rx-evidence-toggle {
  font-size: 0.82rem;
  color: #1565C0;
  background: none;
  border: 1px solid #D1E4FD;
  border-radius: 8px;
  padding: 5px 12px;
  cursor: pointer;
  font-family: inherit;
}
.rx-evidence-toggle:hover { background: #EBF3FE; }
.rx-evidence-detail {
  margin-top: 0.7rem;
  padding: 0.8rem;
  background: #F0F7FF;
  border-radius: 10px;
  font-size: 0.82rem;
  color: #374151;
  line-height: 1.6;
}

/* 循证来源区 */
.rx-evidence-section { margin-bottom: 2rem; }
.rx-evidence-section h2 {
  font-size: 1.2rem;
  color: #1a1a2e;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #E8EDF2;
}
.rx-evidence-ul { list-style: none; padding: 0; }
.rx-evidence-ul li {
  padding: 0.6rem 0;
  border-bottom: 1px solid #F0F2F5;
  font-size: 0.9rem;
}
.rx-evidence-ul a { color: #1565C0; text-decoration: none; }
.rx-evidence-ul a:hover { text-decoration: underline; }

/* 免责声明 */
.rx-disclaimer {
  background: #FFF8E1;
  border: 1px solid #FFE082;
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 2rem;
  font-size: 0.88rem;
  color: #5D4037;
  line-height: 1.6;
}
.rx-disclaimer strong { color: #E65100; }
.rx-link { color: #1565C0; text-decoration: none; font-weight: 600; }

/* 操作按钮 */
.rx-actions { display: flex; gap: 1rem; justify-content: center; }
.rx-btn-outline {
  padding: 10px 24px;
  border-radius: 10px;
  border: 2px solid #E8EDF2;
  background: #fff;
  color: #374151;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.rx-btn-outline:hover { border-color: #1565C0; color: #1565C0; }

@media (max-width: 640px) {
  .rx-pc-fitt { grid-template-columns: repeat(2, 1fr); }
  .rx-actions { flex-direction: column; }
}
</style>
