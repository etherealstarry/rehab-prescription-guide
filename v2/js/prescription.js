// prescription.js — 处方生成引擎（所有参数均来自临床指南）
// 依据：
// 神经康复：《中国脑卒中早期康复治疗指南》（2017，中华神经科杂志）
// 骨科康复：AAOS《前交叉韧带损伤管理临床实践指南》（2022）、ACSM《运动测试与运动处方指南》（第11版）
// 心肺康复：AACVPR《心脏康复核心组件》（2024）、GOLD《COPD诊断与治疗指南》（2024）

function renderPrescription() {
  var container = document.getElementById('rx-container');
  if (!container) return;

  var dataStr = sessionStorage.getItem('rx-assessment-data');
  if (!dataStr) {
    container.innerHTML =
      '<div class="rx-empty">' +
        '<div class="rx-empty-icon">📋</div>' +
        '<p>暂无评估数据</p>' +
        '<p style="font-size:0.85rem;margin-top:0.5rem;">请先完成 <a href="assessment.html" style="color:#1565C0;">康复评估</a></p>' +
      '</div>';
    return;
  }

  var data;
  try { data = JSON.parse(dataStr); } catch(e) {
    container.innerHTML = '<div class="rx-empty"><p>数据解析失败，请重新评估</p></div>';
    return;
  }

  var specialty = data.specialty || sessionStorage.getItem('rx-specialty') || 'neurologic';
  var diagnosis = data.diagnosis || sessionStorage.getItem('rx-diagnosis') || '';

  // 根据评估数据推断评分范围
  var scores = inferScores(data, specialty, diagnosis);

  // 生成 FITT-VP 处方（严格按指南）
  var rx = generateFITTVP(data, specialty, diagnosis, scores);

  // 渲染页面
  container.innerHTML = buildPrescriptionHTML(data, specialty, diagnosis, scores, rx);
}

// ========== 推断评分（仅做参考范围，非正式评分）==========
function inferScores(data, specialty, diagnosis) {
  var s = { fmUpper: null, fmLower: null, berg: null, ashworth: null, walkTime: null, vasRest: null, vasMotion: null };

  if (specialty === 'neurologic') {
    // 上肢功能 → 参考 FMA 上肢评分范围（0-66）
    var arm = data.armRaise;
    if (arm === '0') s.fmUpper = '0-20（重度障碍）';
    else if (arm === '1') s.fmUpper = '21-40（中度障碍）';
    else if (arm === '2') s.fmUpper = '41-60（轻中度障碍）';

    var leg = data.legLift;
    if (leg === '0') s.fmLower = '0-10（重度障碍）';
    else if (leg === '1') s.fmLower = '11-20（中度障碍）';
    else if (leg === '2') s.fmLower = '21-30（轻中度障碍）';

    // 平衡推断（Berg 0-56）
    var balSit = parseInt(data.balanceSit) || 0;
    var balStand = parseInt(data.balanceStand) || 0;
    var balScore = balSit + balStand;
    if (balScore <= 1) s.berg = '0-20（平衡障碍严重，Berg）';
    else if (balScore <= 3) s.berg = '21-40（中等障碍，Berg）';
    else s.berg = '41-56（轻度障碍，Berg）';

    // 肌张力（Ashworth 0-4）
    var spas = parseInt(data.spasticity) || 0;
    if (spas === 0) s.ashworth = '0 级（无痉挛，Ashworth）';
    else if (spas === 1) s.ashworth = '1-1+ 级（轻度痉挛）';
    else s.ashworth = '2-3 级（中度-重度痉挛）';

    // 行走能力 → 6MWD 估算
    var walk = parseInt(data.walkAbility) || 0;
    if (walk === 0) { s.walkTime = '完全不能'; s.sixMWD = '<100m（参考值）'; }
    else if (walk === 1) { s.walkTime = '需搀扶'; s.sixMWD = '100-200m（参考值）'; }
    else { s.walkTime = '可独立行走'; s.sixMWD = '200-400m+（参考值）'; }
  }

  if (specialty === 'orthopedic') {
    var vasR = parseInt(data.vasRest) || 0;
    var vasM = parseInt(data.vasMotion) || 0;
    s.vasRest = vasR;
    s.vasMotion = vasM;

    var canStraighten = parseInt(data.canStraighten) || 0;
    var canFlex = parseInt(data.canFlex) || 0;
    s.romFlex = canFlex === 0 ? '<90°' : canFlex === 1 ? '90-110°' : '>110°';
    s.romExt = canStraighten === 0 ? '伸膝缺失10-20°' : canStraighten === 1 ? '伸膝缺失5-10°' : '接近正常（0-5°缺失）';

    var walkAid = data.walkAid || 'none';
    s.walkAid = walkAid === 'none' ? '无需辅助' : walkAid === 'cane1' ? '单手杖' : walkAid === 'cane2' ? '助行器' : '非负重';
  }

  if (specialty === 'cardiopulmonary') {
    var wt = data.walkTime;
    if (wt === '0') { s.walkTime = '<3分钟'; s.sixMWD = '<200m（参考值）'; }
    else if (wt === '1') { s.walkTime = '3-10分钟'; s.sixMWD = '200-300m（参考值）'; }
    else if (wt === '2') { s.walkTime = '10-30分钟'; s.sixMWD = '300-400m（参考值）'; }
    else { s.walkTime = '>30分钟'; s.sixMWD = '>400m（参考值）'; }

    var nyha = data.nyha || 'na';
    s.nyha = nyha === 'na' ? '不适用' : 'NYHA ' + nyha + '级';
    s.vasRest = parseInt(data.vasRest) || 0;
  }

  return s;
}

// ========== 生成 FITT-VP 处方（严格按指南参数）==========
function generateFITTVP(data, specialty, diagnosis, scores) {
  var rx = { frequency: '', intensity: '', time: '', type: '', volume: '', progression: '', notes: [], evidence: [] };

  if (specialty === 'neurologic') {
    var onsetDays = parseInt(data.onsetDays) || 30;
    // 参数来源：《中国脑卒中早期康复治疗指南》（2017）Ⅰ级/A级证据
    if (onsetDays <= 7) {
      // 急性期（发病24h后，病情稳定）
      rx.frequency = '1-2 次/日（病情稳定后尽早开始）';
      rx.intensity = '低强度：RPE 8-11（非常轻度），以不引起疲劳为限';
      rx.time = '10-20 分钟/次（循序渐进增加）';
      rx.type = '良肢位摆放（患侧卧/健侧卧，每2h更换）\n被动关节活动度训练（PROM，每个关节2-3次/日）\n坐位平衡训练（支撑下）';
      rx.volume = '每个关节 10-15次 × 2-3组/日（PROM）';
      rx.progression = '每2-3日增加5分钟，以患者耐受为限';
      rx.notes.push('证据：发病24h后可行床边康复（Ⅰ级推荐，A级证据，中国脑卒中早期康复指南）');
      rx.notes.push('避免患侧肩关节过度外展/外旋，预防肩关节半脱位');
      rx.notes.push('被动关节活动范围应在正常范围2/3以内（肩关节尤其注意）');
    } else if (onsetDays <= 30) {
      // 亚急性期
      rx.frequency = '1-2 次/日，每周5日';
      rx.intensity = 'RPE 11-13（轻度），心率增幅 <20次/分';
      rx.time = '20-30 分钟/次（含热身及整理）';
      rx.type = '抗重力肌训练（患侧下肢负重支撑）\n坐位/立位平衡训练\n部分负重步行训练（助行器/双拐）\nADL训练';
      rx.volume = '2-3组/动作，15-20次/组，组间休息60-90秒';
      rx.progression = '每3-5日增加难度（减少支撑面）；步行距离每周增加10-20%';
      rx.notes.push('证据：早期离床站立/步行训练可改善功能（Ⅱ级推荐，B级证据）');
      rx.notes.push('监测血压：收缩压 >180mmHg 应中止训练');
    } else {
      // 恢复期
      rx.frequency = '3-5 次/周';
      rx.intensity = 'RPE 13-15（中度），靶心率 =（220-年龄）×（40-60%）';
      rx.time = '30-45 分钟/次（热身5-10min + 主训练20-30min + 整理5-10min）';
      rx.type = '有氧训练：步行（首选）、固定自行车、活动平板\n肌力训练：渐进抗阻（弹力带/哑铃，8-12RM）\n平衡协调训练\n上肢任务导向性训练（ARAT原则）';
      rx.volume = '肌力：3-4组/动作，8-12次/组；有氧：20-30分钟连续或分次累计';
      rx.progression = '每1-2周增加强度5-10%，或延长5分钟；目标：独立社区步行 >30分钟';
      rx.notes.push('证据：渐进式抗阻训练改善瘫痪肢体功能（Ⅰ级推荐，A级证据）');
      rx.notes.push('减重步行训练（BWST）可改善步态对称性（Ⅱ级推荐，B级证据）');
    }
  }

  if (specialty === 'orthopedic') {
    var weeks = parseInt(data.postOpWeeks) || 4;
    var diag = diagnosis || data.diagnosis || '';
    // 参数来源：AAOS ACL指南（2022）、ACSM指南（第11版）
    if (weeks <= 2) {
      // 术后早期（保护期）
      rx.frequency = '踝泵/直腿抬高：每2小时1组；其他训练 2-3次/日';
      rx.intensity = '无痛范围内（VAS <3），肌肉收缩力度：轻-中度';
      rx.time = '踝泵：10-15次/组 × 5-8组/日；其他：15-20分钟/次';
      rx.type = '踝泵运动（预防DVT）\n直腿抬高（股四头肌激活）\n股四头肌等长收缩\n冰敷（术后72h内，每2h一次，每次15-20分钟）';
      rx.volume = '10-15次/组 × 5-8组/日（踝泵/SLR）';
      rx.progression = '伤口稳定后逐步增加屈膝角度（每周增加10-15°）；从完全非负重过渡到部分负重';
      rx.notes.push('ACL-R：术后4周内避免主动伸膝末端0-30°的开链运动（前交叉韧带应力过大）');
      rx.notes.push('THR术后：避免髋关节屈曲>90°、内旋、内收（防脱位）');
      rx.notes.push('证据：AAOS ACL指南，术后康复需个体化，早期活动度训练至关重要');
    } else if (weeks <= 6) {
      // 中期康复
      rx.frequency = '2-3次/日（家庭训练）；1-2次/周（门诊康复监督）';
      rx.intensity = 'VAS <4；肌力训练：10-15RM（中度阻力）';
      rx.time = '30-40 分钟/次';
      rx.type = '闭链运动：靠墙静蹲（屈膝30-45°）、踏板训练\n本体感觉训练（单腿站立/平衡板）\n逐步负重行走训练（双拐→单拐→弃拐）';
      rx.volume = '2-3组/动作，12-15次/组';
      rx.progression = '从双拐→单拐→弃拐；屈膝角度逐步达到120°；第6周起可引入轻阻力训练';
      rx.notes.push('TKR术后：持续被动活动（CPM）有助于减少粘连，目标屈膝 >125°');
      rx.notes.push('证据：ACSM指南，骨科术后康复应在疼痛控制下进行，循序渐进增加负荷');
    } else {
      // 晚期/重返运动准备
      rx.frequency = '3-5 次/周';
      rx.intensity = '肌力训练：8-12RM（60-80% 1RM）；有氧：RPE 12-14';
      rx.time = '45-60 分钟/次';
      rx.type = '渐进抗阻训练（腿举/腿弯举/髋外展）\n功能性训练（上下楼梯、蹲起、弓步）\n敏捷性训练（折返跑、变向跑）\n游泳（TKR术后8周+）、慢跑（ACL-R术后12周+）';
      rx.volume = '3-4组/动作，8-12次/组（肌力）；有氧20-40分钟';
      rx.progression = '每2-4周调整负荷；重返运动标准：患肢肌力≥健侧90%，无膝关节积液，通过功能测试';
      rx.notes.push('重返运动前需通过功能测试：单腿下蹲测试、Triple-Hop距离测试、侧切动作测试');
      rx.notes.push('证据：AAOS ACL指南，重返运动决策应基于功能测试而非单纯时间');
    }
  }

  if (specialty === 'cardiopulmonary') {
    var onsetDays = parseInt(data.onsetDays) || 30;
    var nyha = data.nyha || 'na';
    // 参数来源：AACVPR《心脏康复核心组件》（2024）、GOLD（2024）
    if (onsetDays <= 7 || nyha === 'III' || nyha === 'IV') {
      // 住院期/高风险期
      rx.frequency = '每日（住院期）；出院后 2-3次/周';
      rx.intensity = '低强度起始：RPE 9-11（非常轻度）或心率储备的30-40%';
      rx.time = '5-15 分钟/次（可分段进行：2-3分钟 × 3-5次）';
      rx.type = '床上/坐位肢体活动\n床边坐立/站立（心率增幅 <20次/分）\n室内缓慢步行（Borg呼吸困难评分 <3/10）';
      rx.volume = '低容量起始，以不诱发症状为限（RPE <11）';
      rx.progression = 'RPE 每3-7日增加1级（如从9→11），或时长每次增加2-3分钟；目标：连续步行 ≥30分钟';
      rx.notes.push('证据：AACVPR 2024，心脏康复可降低心血管死亡率15-28%（Ⅰ级推荐）');
      rx.notes.push('红旗症状：胸痛、SpO₂<88%、心律失常 → 立即中止训练');
      rx.notes.push('热身/整理各5-10分钟（缓慢步行/拉伸）不可省略');
    } else {
      // 稳定期门诊康复
      rx.frequency = '3-5 次/周';
      rx.intensity = '中等强度：RPE 12-14（有些累）或心率储备的40-60%；目标：储备心率的40-59%';
      rx.time = '20-40 分钟/次（有氧连续或分次累计）';
      rx.type = '有氧训练：步行（首选）、固定自行车（COPD患者首选）\n肌力训练：轻度弹力带抗阻（上肢为主，避免Valsalva动作）\n呼吸训练（COPD）：缩唇呼吸、腹式呼吸';
      rx.volume = '有氧20-40分钟；抗阻1-2组/动作，10-15次/组（RPE 11-13）';
      rx.progression = '每1-2周增加时长5-10分钟或强度1-2 RPE；阶段：住院期（I）→ 门诊监护（II）→ 家庭维持（III）';
      rx.notes.push('COPD患者：呼吸训练每次训练前后各5-10分钟（GOLD 2024）');
      rx.notes.push('β受体阻滞剂可能压低心率，此时RPE比靶心率更可靠');
      rx.notes.push('证据：AACVPR 2024，心脏康复核心组件包括患者评估、营养咨询、运动训练、心理社会管理');
    }
  }

  return rx;
}

// ========== 渲染处方页面 ==========
function buildPrescriptionHTML(data, specialty, diagnosis, scores, rx) {
  var specialtyLabel = specialty === 'neurologic' ? '神经康复' : specialty === 'orthopedic' ? '骨科康复' : '心肺康复';
  var diagLabel = getDiagnosisLabel(diagnosis, specialty);

  var html = '';

  // 标题区
  html += '<div class="rx-page-title">📋 您的康复处方</div>';
  html += '<div class="rx-page-sub">' + specialtyLabel + ' · ' + diagLabel + ' · 生成时间：' + new Date().toLocaleDateString('zh-CN') + '</div>';

  // Red Flags 警告
  var rfRaw = sessionStorage.getItem('rx-redflags');
  if (rfRaw) {
    try {
      var rf = JSON.parse(rfRaw);
      if (rf.isRedFlag) {
        html += '<div class="rx-warning">';
        html += '<strong>⚠️ 红旗症状警告</strong><br>';
        html += (rf.message || '') + '<br>';
        html += '建议暂缓运动康复训练，优先前往医院就诊。';
        html += '</div>';
      }
    } catch(e) {}
  }

  // —— 评估摘要卡片 ——
  html += '<div class="rx-prescription-card">';
  html += '<h3>📝 评估摘要</h3>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem 1.2rem;font-size:0.88rem;">';

  if (specialty === 'neurologic') {
    html += summaryRow('患侧上肢功能', scores.fmUpper || '未评估');
    html += summaryRow('患侧下肢功能', scores.fmLower || '未评估');
    html += summaryRow('平衡能力', scores.berg || '未评估');
    html += summaryRow('肌张力（推测）', scores.ashworth || '未评估');
    html += summaryRow('行走能力', scores.walkTime || '未评估');
    if (scores.sixMWD) html += summaryRow('6MWD 估算', scores.sixMWD);
  }
  if (specialty === 'orthopedic') {
    html += summaryRow('关节活动度（屈曲）', scores.romFlex || '未评估');
    html += summaryRow('关节活动度（伸展）', scores.romExt || '未评估');
    html += summaryRow('静息疼痛 VAS', scores.vasRest != null ? scores.vasRest + '/10' : '未评估');
    html += summaryRow('活动疼痛 VAS', scores.vasMotion != null ? scores.vasMotion + '/10' : '未评估');
    html += summaryRow('行走辅助', scores.walkAid || '未评估');
  }
  if (specialty === 'cardiopulmonary') {
    html += summaryRow('步行耐力', scores.walkTime || '未评估');
    html += summaryRow('6MWD 估算', scores.sixMWD || '未评估');
    html += summaryRow('NYHA 分级', scores.nyha || '未评估');
    html += summaryRow('静息呼吸困难', scores.vasRest != null ? scores.vasRest + '/10' : '未评估');
  }

  html += '</div></div>';

  // —— FITT-VP 处方卡片 ——
  html += '<div class="rx-prescription-card">';
  html += '<h3>🏋️ 运动处方（FITT-VP）</h3>';
  html += '<div class="rx-fittvp-grid">';
  html += fittvpItem('F — 频率 Frequency', rx.frequency);
  html += fittvpItem('I — 强度 Intensity', rx.intensity);
  html += fittvpItem('T — 时间 Time', rx.time);
  html += fittvpItem('T — 类型 Type', rx.type);
  html += fittvpItem('V — 总量 Volume', rx.volume);
  html += fittvpItem('P — 进度 Progression', rx.progression);
  html += '</div>';

  if (rx.notes.length > 0) {
    html += '<div style="margin-top:1rem;font-size:0.85rem;color:#92400E;background:#FFFBEB;padding:0.7rem 1rem;border-radius:8px;">';
    html += '<strong>⚠️ 注意事项：</strong><ul style="margin:0.4rem 0 0;padding-left:1.2rem;">';
    rx.notes.forEach(function(n) { html += '<li>' + n + '</li>'; });
    html += '</ul></div>';
  }

  // 证据等级
  html += '<div class="rx-evidence-bar">';
  html += '📚 循证依据：' + getEvidenceSource(specialty, diagnosis);
  html += '</div>';

  html += '</div>';

  // —— 推荐训练动作列表（专业版） ——
  // 注意：专业版功能预留，当前不自动展开
  // 如需启用，在 assessment 页勾选"专业版"后显示

  // 操作按钮
  html += '<div class="rx-actions">';
  html += '<button class="rx-btn-primary" onclick="window.print()">🖨️ 打印/保存处方</button>';
  html += '<button class="rx-btn-secondary" onclick="location.href=\'assessment.html\'">🔄 重新评估</button>';
  html += '<button class="rx-btn-secondary" onclick="location.href=\'index.html\'">🏠 返回首页</button>';
  html += '</div>';

  // 免责声明（强化）
  html += '<div style="margin-top:1.5rem;font-size:0.75rem;color:#9CA3AF;text-align:center;line-height:1.6;">';
  html += '⚠️ <strong>重要免责声明</strong>：本处方为辅助参考工具生成，所有参数均参考自公开发表的临床实践指南，';
  html += '但不能替代执业医师的面对面评估与个体化指导。<br>';
  html += '请在专业康复医师指导下执行训练方案。若训练中出现胸痛、呼吸困难、头晕、关节剧烈疼痛等不适，请立即停止并就医。<br>';
  html += '<strong>本工具不对因使用本处方而产生的任何不良后果承担责任。</strong>';
  html += '</div>';

  return html;
}

// ========== 工具函数 ==========
function summaryRow(label, value) {
  return '<div><span style="color:#6B7280;">' + label + '</span></div>' +
         '<div style="font-weight:500;">' + value + '</div>';
}

function fittvpItem(label, value) {
  // 将 \n 转为 <br>
  var displayValue = (value || '待评估后确定').replace(/\\n/g, '<br>');
  return '<div class="rx-fittvp-item">' +
           '<div class="rx-fittvp-label">' + label + '</div>' +
           '<div class="rx-fittvp-value">' + displayValue + '</div>' +
         '</div>';
}

function getDiagnosisLabel(diagnosis, specialty) {
  var map = {
    'stroke':'脑卒中','sci':'脊髓损伤','parkinson':'帕金森病','peripheral':'周围神经病变',
    'acl':'前交叉韧带重建术后','meniscus':'半月板术后','rotator':'肩袖修复术后','thr':'全髋关节置换术后','tkr':'全膝关节置换术后',
    'copd':'慢性阻塞性肺病（COPD）','mi':'急性心肌梗死','heartFailure':'心力衰竭','cabg':'冠脉搭桥术后','postCovid':'新冠后康复'
  };
  return map[diagnosis] || diagnosis || '未指定';
}

function getEvidenceSource(specialty, diagnosis) {
  if (specialty === 'neurologic') return '《中国脑卒中早期康复治疗指南》（2017，中华神经科杂志）— Ⅰ级/A级证据';
  if (specialty === 'orthopedic') return 'AAOS《前交叉韧带损伤管理临床实践指南》（2022）＋ ACSM《运动测试与运动处方指南》（第11版）';
  if (specialty === 'cardiopulmonary') return 'AACVPR《心脏康复核心组件》（2024）＋ GOLD《COPD诊断与治疗指南》（2024）';
  return '相关临床实践指南';
}
