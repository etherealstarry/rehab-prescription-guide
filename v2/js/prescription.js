// prescription.js — 处方生成引擎
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
  var modes = data.modes || ['patient'];

  // 根据评估数据推断评分范围
  var scores = inferScores(data, specialty, diagnosis);

  // 生成 FITT-VP 处方
  var rx = generateFITTVP(data, specialty, diagnosis, scores);

  // 渲染页面
  container.innerHTML = buildPrescriptionHTML(data, specialty, diagnosis, scores, rx, modes);
}

function inferScores(data, specialty, diagnosis) {
  var s = { fmUpper: null, fmLover: null, berg: null, ashworth: null, walkTime: null, vasRest: null, vasMotion: null };

  if (specialty === 'neurologic') {
    // 上肢功能 → FMA 评分推断
    var arm = data.armRaise;
    if (arm === '0') s.fmUpper = '0-20';
    else if (arm === '1') s.fmUpper = '21-40';
    else if (arm === '2') s.fmUpper = '41-60';

    var leg = data.legLift;
    if (leg === '0') s.fmLover = '0-10';
    else if (leg === '1') s.fmLover = '11-20';
    else if (leg === '2') s.fmLover = '21-30';

    // 平衡推断
    var balSit = parseInt(data.balanceSit) || 0;
    var balStand = parseInt(data.balanceStand) || 0;
    var balScore = balSit + balStand;
    if (balScore <= 1) s.berg = '0-20（平衡障碍严重）';
    else if (balScore <= 3) s.berg = '21-40（中等障碍）';
    else s.berg = '41-56（轻度障碍）';

    // 肌张力推断
    var spas = parseInt(data.spasticity) || 0;
    if (spas === 0) s.ashworth = '0 级（无痉挛）';
    else if (spas === 1) s.ashworth = '1-1+ 级（轻度痉挛）';
    else s.ashworth = '2-3 级（中度-重度痉挛）';

    // 行走能力
    var walk = parseInt(data.walkAbility) || 0;
    if (walk === 0) { s.walkTime = '完全不能'; s.sixMWD = '<100m'; }
    else if (walk === 1) { s.walkTime = '需搀扶'; s.sixMWD = '100-200m'; }
    else { s.walkTime = '可独立行走'; s.sixMWD = '200-400m+'; }
  }

  if (specialty === 'orthopedic') {
    var vasR = parseInt(data.vasRest) || 0;
    var vasM = parseInt(data.vasMotion) || 0;
    s.vasRest = vasR;
    s.vasMotion = vasM;

    var canStraighten = parseInt(data.canStraighten) || 0;
    var canFlex = parseInt(data.canFlex) || 0;
    s.romFlex = canFlex === 0 ? '<90°' : canFlex === 1 ? '90-110°' : '>110°';
    s.romExt = canStraighten === 0 ? '缺失 -10~-20°' : canStraighten === 1 ? '缺失 -5~-10°' : '接近正常';

    var walkAid = data.walkAid || 'none';
    s.walkAid = walkAid === 'none' ? '无需辅助' : walkAid === 'cane1' ? '单手杖' : walkAid === 'cane2' ? '助行器' : '非负重';
  }

  if (specialty === 'cardiopulmonary') {
    var wt = data.walkTime;
    if (wt === '0') { s.walkTime = '<3分钟'; s.sixMWD = '<200m'; }
    else if (wt === '1') { s.walkTime = '3-10分钟'; s.sixMWD = '200-300m'; }
    else if (wt === '2') { s.walkTime = '10-30分钟'; s.sixMWD = '300-400m'; }
    else { s.walkTime = '>30分钟'; s.sixMWD = '>400m'; }

    var nyha = data.nyha || 'na';
    s.nyha = nyha === 'na' ? '不适用' : 'NYHA ' + nyha + '级';
    s.vasRest = parseInt(data.vasRest) || 0;
  }

  return s;
}

function generateFITTVP(data, specialty, diagnosis, scores) {
  var rx = { frequency: '', intensity: '', time: '', type: '', volume: '', progression: '', notes: [] };

  if (specialty === 'neurologic') {
    var onset = parseInt(data.onsetDays) || 30;
    if (onset <= 7) {
      // 急性期
      rx.frequency = '1次/日';
      rx.intensity = 'RPE 8-11（非常轻度）';
      rx.time = '10-15分钟/次';
      rx.type = '床上体位摆放、被动关节活动、坐位平衡训练';
      rx.volume = '1组/动作，10-15次/组';
      rx.progression = '每日评估耐受性，无不适则每2-3日增加5分钟';
      rx.notes.push('急性期训练以不引起疲劳为宜，心率增幅<20次/分');
      rx.notes.push('避免患侧肩关节半脱位：坐位时给予支撑');
    } else if (onset <= 30) {
      // 亚急性期
      rx.frequency = '1-2次/日';
      rx.intensity = 'RPE 11-13（轻度）';
      rx.time = '20-30分钟/次';
      rx.type = '坐位/立位平衡、患肢部分负重步行、ADL训练';
      rx.volume = '2-3组/动作，15-20次/组，组间休息60-90秒';
      rx.progression = '每3-5日增加难度（如减少支撑面），步行距离每周增加10-20%';
      rx.notes.push('监测血压：若运动中收缩压>180mmHg应中止');
    } else {
      // 恢复期
      rx.frequency = '3-5次/周';
      rx.intensity = 'RPE 13-15（中度），靶心率 = （220-年龄）×（40-60%）';
      rx.time = '30-45分钟/次（含热身5-10分钟，主要训练20-30分钟，整理5-10分钟）';
      rx.type = '有氧训练（步行/固定自行车）、肌力训练（弹力带/哑铃）、平衡协调训练';
      rx.volume = '3-4组/动作，8-12次/组（肌力）；有氧20-30分钟连续或分次累计';
      rx.progression = '每1-2周增加强度5-10%，或延长5分钟；目标：独立社区步行>30分钟';
      rx.notes.push('推荐配合减重步行训练（BWST）以提高步态对称性');
    }
  }

  if (specialty === 'orthopedic') {
    var weeks = parseInt(data.postOpWeeks) || 4;
    var diag = diagnosis || data.diagnosis || '';

    if (weeks <= 2) {
      rx.frequency = '每日多组（踝泵/直腿抬高每2小时1组）';
      rx.intensity = '无痛范围内（VAS<3），肌肉收缩力度：轻-中度';
      rx.time = '踝泵/直腿抬高：每组10-15次，每日5-8组';
      rx.type = '踝泵、直腿抬高、股四头肌等长收缩、冰敷（术后72h内每2h一次，每次15-20分钟）';
      rx.volume = '10-15次/组 × 5-8组/日';
      rx.progression = '伤口稳定后逐步增加屈膝角度（每周增加10-15°），从完全非负重过渡到部分负重';
      rx.notes.push('ACL重建术后：4周内避免主动伸膝末端的0-30°开链运动');
      rx.notes.push('THR术后：避免髋关节屈曲>90°、内旋、内收（防脱位）');
    } else if (weeks <= 6) {
      rx.frequency = '2-3次/日（家庭训练）；1-2次/周（门诊康复）';
      rx.intensity = 'VAS<4，肌力训练强度：10-15RM';
      rx.time = '30-40分钟/次';
      rx.type = '闭链运动（靠墙静蹲、踏板训练）、本体感觉训练、逐步负重行走训练';
      rx.volume = '2-3组/动作，12-15次/组';
      rx.progression = '从双拐→单拐→弃拐；屈膝角度逐步达到120°；第6周起可引入轻阻力训练';
      rx.notes.push('TKR术后：持续被动活动（CPM）有助于减少粘连，目标屈膝>125°');
    } else {
      rx.frequency = '3-5次/周';
      rx.intensity = '肌力训练：8-12RM（60-80% 1RM）；有氧：RPE 12-14';
      rx.time = '45-60分钟/次';
      rx.type = '肌力渐进抗阻、功能性训练（上下楼梯、蹲起）、慢跑（ACL术后12周+）、游泳（TKR术后8周+）';
      rx.volume = '3-4组/动作，8-12次/组（肌力）；有氧20-40分钟';
      rx.progression = '每2-4周调整负荷；重返运动标准：患肢肌力≥健侧90%，无膝关节积液';
      rx.notes.push('重返运动前需通过功能测试：如单腿下蹲、Triple-Hop距离测试');
    }
  }

  if (specialty === 'cardiopulmonary') {
    var onset = parseInt(data.onsetDays) || 30;
    var nyha = data.nyha || 'na';

    if (onset <= 7 || nyha === 'III' || nyha === 'IV') {
      rx.frequency = '每日（住院期）；出院后2-3次/周';
      rx.intensity = '低强度起始：自觉疲劳度 RPE 9-11（非常轻度）或心率储备的30-40%';
      rx.time = '5-15分钟/次（可分段进行，2-3分钟 × 3-5次）';
      rx.type = '床上/坐位肢体活动、床边坐立、室内缓慢步行（心率增幅<20次/分）';
      rx.volume = '低容量起始，以不诱发症状为限';
      rx.progression = 'RPE 每3-7日增加1级（如从9→11），或时长每次增加2-3分钟；目标：连续步行≥30分钟';
      rx.notes.push('严格遵守 Red Flags：运动中若出现胸痛、SpO₂<88%、心律失常应中止');
      rx.notes.push('热身/整理各5-10分钟（缓慢步行/拉伸）不可省略');
    } else {
      rx.frequency = '3-5次/周';
      rx.intensity = '中等强度：RPE 12-14（有些累）或心率储备的40-60%；目标：储备心率的40-59%';
      rx.time = '20-40分钟/次（有氧连续或分次累计）';
      rx.type = '步行（首选）、固定自行车、轻度弹力带抗阻（上肢为主，避免Valsalva）';
      rx.volume = '有氧20-40分钟；抗阻1-2组/动作，10-15次/组（RPE 11-13）';
      rx.progression = '每1-2周增加时长5-10分钟或强度1-2 RPE；阶段I→II→III：从住院→家庭→门诊监护下训练';
      rx.notes.push('COPD患者：呼吸训练（缩唇呼吸、腹式呼吸）每次训练前后各5-10分钟');
      rx.notes.push('药物治疗（如β受体阻滞剂）可能压低心率，此时RPE比靶心率更可靠');
    }
  }

  return rx;
}

function buildPrescriptionHTML(data, specialty, diagnosis, scores, rx, modes) {
  var isPro = modes && modes.indexOf('professional') !== -1;
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
    html += summaryRow('患侧上肢功能', scoreLabel(scores.fmUpper, 'FMA上肢'));
    html += summaryRow('患侧下肢功能', scoreLabel(scores.fmLover, 'FMA下肢'));
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

  // —— 推荐训练动作列表（专业版可见） ——
  if (isPro) {
    html += '<div class="rx-prescription-card">';
    html += '<h3>🎯 推荐训练动作（专业版）</h3>';
    html += '<ul class="rx-exercise-list">';
    var exercises = getExerciseList(specialty, diagnosis, data);
    exercises.forEach(function(ex, i) {
      html += '<li>';
      html += '<span class="rx-exercise-num">' + (i+1) + '</span>';
      html += '<div>';
      html += '<div class="rx-exercise-name">' + ex.name + '</div>';
      html += '<div class="rx-exercise-detail">📋 ' + ex.detail + '</div>';
      if (ex.note) html += '<div class="rx-exercise-note">⚠️ ' + ex.note + '</div>';
      html += '</div></li>';
    });
    html += '</ul></div>';
  }

  // 操作按钮
  html += '<div class="rx-actions">';
  html += '<button class="rx-btn-primary" onclick="window.print()">🖨️ 打印/保存处方</button>';
  html += '<button class="rx-btn-secondary" onclick="location.href=\'assessment.html\'">🔄 重新评估</button>';
  html += '<button class="rx-btn-secondary" onclick="location.href=\'index.html\'">🏠 返回首页</button>';
  html += '</div>';

  // 免责声明
  html += '<div style="margin-top:1.5rem;font-size:0.75rem;color:#9CA3AF;text-align:center;line-height:1.6;">';
  html += '⚠️ <strong>免责声明</strong>：本处方为辅助参考工具生成，不能替代执业医师的面对面评估与指导。<br>';
  html += '请在专业康复医师指导下执行训练方案。若训练中出现胸痛、呼吸困难、头晕等不适，请立即停止并就医。';
  html += '</div>';

  return html;
}

// —— 工具函数 ——
function summaryRow(label, value) {
  return '<div><span style="color:#6B7280;">' + label + '</span></div>' +
         '<div style="font-weight:500;">' + value + '</div>';
}

function scoreLabel(score, name) {
  if (!score) return '未评估';
  return name + '：' + score;
}

function fittvpItem(label, value) {
  return '<div class="rx-fittvp-item">' +
           '<div class="rx-fittvp-label">' + label + '</div>' +
           '<div class="rx-fittvp-value">' + (value || '待评估后确定') + '</div>' +
         '</div>';
}

function getDiagnosisLabel(diagnosis, specialty) {
  var map = {
    'stroke': '脑卒中', 'sci': '脊髓损伤', 'parkinson': '帕金森病', 'peripheral': '周围神经病变',
    'acl': '前交叉韧带重建术后', 'meniscus': '半月板术后', 'rotator': '肩袖修复术后', 'thr': '全髋关节置换术后', 'tkr': '全膝关节置换术后',
    'copd': '慢性阻塞性肺病（COPD）', 'mi': '急性心肌梗死后', 'heartFailure': '心力衰竭', 'cabg': '冠脉搭桥术后', 'postCovid': '新冠后康复'
  };
  return map[diagnosis] || diagnosis || '未指定';
}

function getEvidenceSource(specialty, diagnosis) {
  if (specialty === 'neurologic') return '基于《中国脑卒中早期康复治疗指南》《AHA/ASA 脑卒中康复指南》';
  if (specialty === 'orthopedic') return '基于 ACSM 运动处方指南、AAOS 临床实践指南';
  if (specialty === 'cardiopulmonary') return '基于 AACVPR 心脏康复核心组件、GOLD 指南';
  return '基于相关临床实践指南';
}

function getExerciseList(specialty, diagnosis, data) {
  if (specialty === 'neurologic' && diagnosis === 'stroke') {
    var onset = parseInt(data.onsetDays) || 30;
    if (onset <= 7) {
      return [
        { name: '体位摆放（抗痉挛体位）', detail: '仰卧/健侧卧/患侧卧，各体位每2h更换', note: '患侧肩下垫枕，避免肩关节半脱位' },
        { name: '被动关节活动（PROM）', detail: '肩、肘、腕、指关节，每个方向10-15次 × 2组', note: '动作轻柔，以不引起疼痛为度' },
        { name: '坐位平衡训练（支撑下）', detail: '坐位下双手交叉，重心左右/前后转移，各10次', note: '需治疗师或家属保护' },
      ];
    } else if (onset <= 30) {
      return [
        { name: '桥式运动（双桥→单桥）', detail: '仰卧位屈膝，抬起臀部保持5-10秒，10-15次 × 2-3组', note: '训练臀大肌，避免腰部代偿' },
        { name: '坐位/立位平衡训练', detail: '坐位下双手交叉前伸触靶；立位下重心转移，各10-20次', note: '立位训练需有人保护防跌倒' },
        { name: '部分负重步行训练', detail: '使用助行器或双拐，患肢部分负重（体重的20-30%）步行5-10分钟', note: '避免过度负重导致膝反张' },
      ];
    } else {
      return [
        { name: '步态训练（减重步行或手杖辅助）', detail: '重点是患侧骨盆抬高、支撑相膝控制、摆动相屈膝，步行10-20分钟', note: '可配合镜面反馈纠正步态' },
        { name: '上肢功能性训练（ARAT 项目）', detail: '抓握木钉、翻转卡片、模拟进食动作，15-20分钟', note: '强调患侧手反复使用，克服习得性失用' },
        { name: '有氧训练（步行或固定自行车）', detail: 'RPE 13-15，20-30分钟，靶心率（220-年龄）×（40-60%）', note: '监测血压和心率，若收缩>180mmHg应降低强度' },
      ];
    }
  }
  if (specialty === 'orthopedic' && diagnosis === 'acl') {
    var weeks = parseInt(data.postOpWeeks) || 4;
    if (weeks <= 2) {
      return [
        { name: '踝泵运动', detail: '背屈/跖屈最大范围，10-15次 × 每2小时1组', note: '预防深静脉血栓（DVT）' },
        { name: '直腿抬高（健侧先行）', detail: '仰卧，膝伸直抬离床面20cm保持5秒，10次 × 3组', note: '4周内避免主动伸膝末端的0-30°开链运动' },
        { name: '股四头肌等长收缩', detail: '膝下垫毛巾卷，用力下压保持5-10秒，15次 × 3组', note: '避免股四头肌抑制' },
      ];
    } else if (weeks <= 6) {
      return [
        { name: '靠墙静蹲', detail: '屈膝30-45°，保持10-30秒，3-5组', note: '避免屈膝>60°（ACL应力过大）' },
        { name: '本体感觉训练（单腿站立/平衡板）', detail: '双手叉腰单腿站，从睁眼→闭眼，各30-60秒 × 3组', note: '旁人保护防跌倒' },
        { name: '逐步负重行走', detail: '双拐→单拐→弃拐，步行10-20分钟 × 2-3次/日', note: '循序渐进，以疼痛 VAS<4 为限' },
      ];
    } else {
      return [
        { name: '渐进抗阻训练（腿举/腿弯举）', detail: '60-80% 1RM，8-12次 × 3-4组', note: '术前需测试1RM，术后12周+才可进行' },
        { name: '敏捷性训练（ cones 绕桩/折返跑）', detail: '低-中等速度，重点在减速控制和方向变换', note: '重返运动前需通过功能测试' },
        { name: '慢跑→快跑（循序渐进）', detail: '从直线慢跑开始，无不适则每1-2周增加速度和时长', note: '出现膝关节积液应中止并返回低强度' },
      ];
    }
  }
  // 默认通用
  return [
    { name: '有氧运动（步行/固定自行车）', detail: '低-中等强度，RPE 11-13，15-30分钟', note: '循序渐进增加时长' },
    { name: '柔韧性训练（静态拉伸）', detail: '主要肌群各动作保持15-30秒，2-3组', note: '避免疼痛范围内过度拉伸' },
    { name: '肌力训练（自重或弹力带）', detail: '8-12次/组 × 2-3组，RPE 12-14', note: '动作标准优于负荷重量' },
  ];
}
