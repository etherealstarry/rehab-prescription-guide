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
      ]},
      { title: '患侧运动功能', fields: [
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
      ]},
      { title: '平衡与肌张力', fields: [
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
      ]},
      { title: '安全与合并症', fields: [
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
      ]},
      { title: '关节活动度（日常功能）', fields: [
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
      ]},
      { title: '疼痛与行走', fields: [
        { name: 'vasRest', label: '静息时疼痛程度（0=不痛，10=最痛）', type: 'range', min:0, max:10 },
        { name: 'vasMotion', label: '活动时疼痛程度（0=不痛，10=最痛）', type: 'range', min:0, max:10 },
        { name: 'walkAid', label: '目前行走需要辅助工具吗？', type: 'select', options: [
          {value:'none',label:'不需要，可以独立行走'},
          {value:'cane1',label:'需要单手杖'},
          {value:'cane2',label:'需要双手杖或助行器'},
          {value:'nonWeight',label:'还不能负重行走'}
        ]}
      ]},
      { title: '切口与安全', fields: [
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
        { name: 'onsetDays', label: '发病/术后大概多少天了？', type: 'select', options: [
          {value:'0-7',label:'不到1周（急性期）'},
          {value:'8-30',label:'1-4周（稳定期）'},
          {value:'31-90',label:'1-3个月（康复期）'},
          {value:'90+',label:'3个月以上'}
        ]},
        { name: 'nyha', label: '心衰患者：日常活动是否会气短？（非心衰患者选"不适用"）', type: 'select', options: [
          {value:'I',label:'完全不气短（I级）'},
          {value:'II',label:'快走或爬楼时气短（II级）'},
          {value:'III',label:'平路步行也气短（III级）'},
          {value:'IV',label:'休息时也气短（IV级）'},
          {value:'na',label:'不适用（非心衰）'}
        ]}
      ]},
      { title: '心肺功能（日常感受）', fields: [
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
      ]},
      { title: '运动习惯与 RPE', fields: [
        { name: 'exerciseHabit', label: '发病前是否有规律运动习惯？', type: 'select', options: [
          {value:'none',label:'几乎没有运动习惯'},
          {value:'light',label:'偶尔散步/轻度活动'},
          {value:'moderate',label:'每周2-3次中等强度运动'},
          {value:'high',label:'每周4次以上规律运动'}
        ]},
        { name: 'rpeExercise', label: '如果运动，感觉累的程度（6=最轻松，20=最累）', type: 'range', min:6, max:20 }
      ]},
      { title: '安全与合并症', fields: [
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
