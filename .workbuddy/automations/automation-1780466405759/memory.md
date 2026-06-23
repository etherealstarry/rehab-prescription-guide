# 康复处方指南自动维护与升级 - 执行历史

## 最近一次执行（2026-06-15）

### ✅ 修复的 Bug
- **严重问题**：`prescription_achilles_tendinopathy` 内容错误
  - 问题：复制粘贴错误，错误地为偏头痛处方（放松训练、睡眠卫生教育等）
  - 修复：根据 APTA 跟腱疼痛CPG 2024 更新为正确的跟腱病变处方（跟腱保护、冰敷、离心训练等）

### 📚 根据新指南更新的内容
- **APTA 髋痛CPG 2025**：更新了证据库中的URL（从通用URL更新为具体DOI链接）
- **BMJ 2025 膝OA运动治疗**：新增证据表明有氧运动可能是膝OA最有受益的运动方式

### ➕ 新增的疾病/处方
1. **青少年特发性脊柱侧凸**（DIS_SCOLIOSIS_030）
   - 证据：CMA 青少年特发性脊柱侧凸康复诊疗指南 2024
   - 处方：prescription_scoliosis（PSSE + 支具治疗 + 核心稳定性训练）

2. **骨质疏松症**（DIS_OP_031）
   - 证据：CMA 骨质疏松症康复治疗指南 2024
   - 处方：prescription_osteoporosis（负重运动 + 抗阻训练 + 平衡训练）

### 📂 证据资料库新增/更新的条目
1. **新增 CMA-008**：骨质疏松症康复治疗指南 2024
2. **新增 CR-011**：膝OA运动治疗（BMJ 2025）
3. **更新 CPG-004**：APTA 髋痛CPG 2025 的URL
4. **更新 README.md**：添加新指南条目，更新日期为 2026-06-15

### 🔄 代码同步
- 同步更新了 v2/ 目录的 disease-knowledge-base.js

### 🚀 部署
- 成功部署到 gh-pages 分支（commit: c516a06）

---

## 执行统计
- 总执行时间：约 5 分钟
- 修改的文件：3 个（js/disease-knowledge-base.js, evidence-library/README.md, evidence-library/evidence-library.json）
- 同步的文件：1 个（v2/js/disease-knowledge-base.js）
- 提交的 commit：2 个
- 部署状态：成功

---

## 最近一次执行（2026-06-19）

### ✅ 修复的 Bug
- 无（代码检查完毕，未发现 Bug）

### 📚 根据新指南更新的内容
- **CMA 冠心病康复指南 2024**：新增冠心病康复治疗（DIS_CHD_032）及处方（prescription_chd）

### ➕ 新增的疾病/处方
1. **冠心病康复治疗**（DIS_CHD_032）
   - 证据：CMA 冠心病康复指南 2024
   - 处方：prescription_chd（急性期保护 + 慢性期有氧+抗阻训练 + 心脏危险因素管理）

### 📂 证据资料库新增/更新的条目
1. **新增 CPG-016**：APTA 远程康复CPG 2024
2. **新增 CMA-009**：中国冠心病康复循证实践指南 2024
3. **更新 README.md**：添加新指南条目，更新日期为 2026-06-19
4. **更新 evidence-library.json**：添加新条目，版本号更新为 1.2

### 🔄 代码同步
- 同步更新了 v2/ 目录的 disease-knowledge-base.js

### 🚀 部署
- 成功部署到 gh-pages 分支（commit: 0d06786）

---

## 执行统计
- 总执行时间：约 8 分钟
- 修改的文件：3 个（js/disease-knowledge-base.js, evidence-library/README.md, evidence-library/evidence-library.json）
- 同步的文件：1 个（v2/js/disease-knowledge-base.js）
- 提交的 commit：2 个（f969691, 604fb3f）
- 部署状态：成功
