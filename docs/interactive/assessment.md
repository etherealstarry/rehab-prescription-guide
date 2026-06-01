# 康复评估与处方生成

> 请选择您的康复专科方向，完成标准化评估后，系统将生成个性化 FITT-VP 运动处方。

---

## ⚠️ 免责声明

本网站提供的信息**仅供参考，不构成医疗建议**。  
请在**专业康复医师或治疗师**指导下进行康复训练。  
**如出现红旗症状，请立即就医。**

[查看完整免责声明 →](../guide/disclaimer.md)

---

## 评估问卷

<div id="assessment-steps"></div>

<p id="rx-specialty-loading" style="text-align:center;color:var(--md-default-fg-color--light);padding:2rem;">
  ⏳ 正在加载评估问卷...
</p>

---

<script src="../assets/javascripts/redflags.js"></script>
<script src="../assets/javascripts/stepper.js"></script>
<script>
(function() {
  const params = new URLSearchParams(window.location.search);
  const specialty = params.get('specialty') || 'neurologic';
  const loadingEl = document.getElementById('rx-specialty-loading');
  const stepsEl = document.getElementById('assessment-steps');

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
        { name: 'dominantHand', label: '利手', type: 'select', options: ['左','右','不确定'] }
      ]},
      { title: '运动功能（Fugl-Meyer）', fields: [
        { name: 'fmUpper', label: '上肢 FMA 评分（0–66）', type: 'range', min:0, max:66 },
        { name: 'fmLower', label: '下肢 FMA 评分（0–34）', type: 'range', min:0, max:34 },
        { name: 'berg', label: '平衡能力（Berg 评分）', type: 'select', options: [
          {value:'0',label:'0–20分（平衡障碍严重）'},
          {value:'1',label:'21–40分（中等障碍）'},
          {value:'2',label:'41–56分（轻度障碍）'}
        ]}
      ]},
      { title: '肌张力（Ashworth 分级）', fields: [
        { name: 'ashworth', label: '患侧上肢肌张力', type: 'select', options: ['0','1','1+','2','3','4'] },
        { name: 'ashworthLeg', label: '患侧下肢肌张力', type: 'select', options: ['0','1','1+','2','3','4'] },
        { name: 'spasticityNote', label: '痉挛备注（部位/触发因素）', type: 'textarea', placeholder: '如：踝阵挛阳性，行走时小腿三头肌痉挛' }
      ]},
      { title: '合并症与安全', fields: [
        { name: 'redFlags', label: '是否存在以下红旗症状？（可多选）', type: 'textarea', placeholder: '如：胸痛、剧烈头痛、静息心率>100次/分...\n如无请填"无"' },
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
        { name: 'vas', label: '静息疼痛 VAS（0–10）', type: 'range', min:0, max:10 },
        { name: 'vasMotion', label: '运动时疼痛 VAS（0–10）', type: 'range', min:0, max:10 },
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
        { name: 'borgDyspnea', label: '静息 Borg 呼吸困难评分（0–10）', type: 'range', min:0, max:10 }
      ]},
      { title: '运动能力与 RPE', fields: [
        { name: 'sixMWD', label: '6分钟步行距离（m）', type: 'number', placeholder: '如：400' },
        { name: 'rpeRest', label: '日常活动 RPE（6–20）', type: 'range', min:6, max:20 },
        { name: 'rpeExercise', label: '既往运动强度 RPE（6–20）', type: 'range', min:6, max:20 }
      ]},
      { title: '合并症与安全', fields: [
        { name: 'redFlags', label: '是否存在以下红旗症状？', type: 'textarea', placeholder: '如：静息时胸痛 / 呼吸困难加重\n足踝水肿加重\n如无请填"无"' },
        { name: 'arrhythmia', label: '心律失常史', type: 'select', options: ['无','房颤','室性早搏','起搏器术后','不确定'] }
      ]}
    ]
  };

  const config = configMap[specialty];
  if (!config) {
    loadingEl.textContent = '未知专科，请从首页重新选择。';
    return;
  }

  loadingEl.style.display = 'none';
  stepsEl.style.display = 'block';

  RxStepper._init('assessment-steps', config, function(formData) {
    sessionStorage.setItem('rx-assessment-data', JSON.stringify(formData));
    sessionStorage.setItem('rx-specialty', specialty);
    window.location.href = 'prescription/';
  });
})();
</script>

---

*最后更新：2026 年 6 月*
