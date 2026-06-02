/* ==========================================================
   semantic-normalizer.js — 语义归一化模块
   将用户的自由文本输入归一化为标准症状标签
   ========================================================== */

const SemanticNormalizer = {
  /* 初始化 */
  init: function() {
    if (!window.DiseaseKnowledgeBase) {
      console.error('❌ DiseaseKnowledgeBase 未加载！');
      return false;
    }
    return true;
  },

  /* 主函数：将用户输入归一化为标准标签 */
  normalize: function(userInput) {
    if (!this.init()) return null;

    var input = userInput.trim().toLowerCase();
    var kb = window.DiseaseKnowledgeBase;

    // 1. 直接匹配标准症状
    var directMatch = this._directMatch(input, kb);
    if (directMatch) {
      console.log('✅ 直接匹配:', directMatch);
      return directMatch;
    }

    // 2. 同义词匹配
    var synonymMatch = this._synonymMatch(input, kb);
    if (synonymMatch) {
      console.log('✅ 同义词匹配:', synonymMatch);
      return synonymMatch;
    }

    // 3. 关键词模糊匹配
    var keywordMatch = this._keywordMatch(input, kb);
    if (keywordMatch) {
      console.log('✅ 关键词匹配:', keywordMatch);
      return keywordMatch;
    }

    // 4. 未匹配
    console.log('⚠️ 未匹配，返回 null');
    return null;
  },

  /* 直接匹配：用户输入 exactly 等于某个标准症状 */
  _directMatch: function(input, kb) {
    var standardTags = kb.symptomToStandardTag;
    for (var key in standardTags) {
      if (key.toLowerCase() === input) {
        return {
          originalInput: input,
          standardTag: standardTags[key],
          matchType: 'direct',
          confidence: 100
        };
      }
    }
    return null;
  },

  /* 同义词匹配：用户输入在同义词库中 */
  _synonymMatch: function(input, kb) {
    var synonyms = kb.symptomSynonyms;
    for (var key in synonyms) {
      var synList = synonyms[key];
      for (var i = 0; i < synList.length; i++) {
        if (synList[i].toLowerCase() === input) {
          return {
            originalInput: input,
            standardTag: kb.symptomToStandardTag[key],
            matchType: 'synonym',
            matchedFrom: key,
            confidence: 90
          };
        }
      }
    }
    return null;
  },

  /* 关键词模糊匹配：用户输入包含某个同义词的部分 */
  _keywordMatch: function(input, kb) {
    var synonyms = kb.symptomSynonyms;
    var bestMatch = null;
    var bestScore = 0;

    for (var key in synonyms) {
      var synList = synonyms[key];
      for (var i = 0; i < synList.length; i++) {
        var syn = synList[i].toLowerCase();
        if (input.indexOf(syn) !== -1 || syn.indexOf(input) !== -1) {
          var score = syn.length;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = {
              originalInput: input,
              standardTag: kb.symptomToStandardTag[key],
              matchType: 'keyword',
              matchedKeyword: syn,
              confidence: 70
            };
          }
        }
      }
    }

    return bestMatch;
  },

  /* 获取追问树Key */
  getTreeKey: function(normalizedResult) {
    if (!normalizedResult) return null;
    var kb = window.DiseaseKnowledgeBase;
    return kb.standardTagToTree[normalizedResult.standardTag] || null;
  },

  /* 调试：打印所有同义词 */
  debugPrintSynonyms: function() {
    if (!this.init()) return;
    var kb = window.DiseaseKnowledgeBase;
    console.log('=== 症状同义词库 ===');
    for (var key in kb.symptomSynonyms) {
      console.log(key + ':', kb.symptomSynonyms[key]);
    }
    console.log('=== 标准标签 → 追问树 ===');
    for (var tag in kb.standardTagToTree) {
      console.log(tag + ' → ' + kb.standardTagToTree[tag]);
    }
  }
};

/* 暴露接口 */
if (typeof window !== 'undefined') {
  window.SemanticNormalizer = SemanticNormalizer;
}
