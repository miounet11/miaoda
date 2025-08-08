/**
 * 推荐算法实现
 */
import type { 
  TFIDFVector, 
  SimilarityScore, 
  AlgorithmType,
  UserProfile,
  RecommendationItem 
} from '../../types/recommendation'

// 文本预处理工具
export class TextProcessor {
  private stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were',
    'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'shall', 'to', 'of', 'in', 'for', 'with',
    'by', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', '是', '的', '了', '在', '有', '我', '你', '他', '她', '它', '们', '这', '那',
    '什么', '怎么', '为什么', '哪里', '什么时候', '谁', '如何', '吗', '呢', '啊', '哦'
  ])

  /**
   * 分词和清理文本
   */
  tokenize(text: string): string[] {
    // 基础分词：按空格、标点分割，中英文混合处理
    const tokens = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')  // 保留中英文字符
      .split(/\s+/)
      .filter(token => 
        token.length > 1 && 
        !this.stopWords.has(token) &&
        !token.match(/^\d+$/)  // 过滤纯数字
      )

    return tokens
  }

  /**
   * 提取关键词（简化版）
   */
  extractKeywords(text: string, maxKeywords: number = 10): string[] {
    const tokens = this.tokenize(text)
    const frequency: Record<string, number> = {}

    // 计算词频
    tokens.forEach(token => {
      frequency[token] = (frequency[token] || 0) + 1
    })

    // 按频率排序并返回前N个
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word)
  }

  /**
   * 计算文本相似度（余弦相似度）
   */
  cosineSimilarity(text1: string, text2: string): number {
    const tokens1 = this.tokenize(text1)
    const tokens2 = this.tokenize(text2)
    
    const allTokens = new Set([...tokens1, ...tokens2])
    const vector1: number[] = []
    const vector2: number[] = []

    allTokens.forEach(token => {
      vector1.push(tokens1.filter(t => t === token).length)
      vector2.push(tokens2.filter(t => t === token).length)
    })

    const dotProduct = vector1.reduce((sum, a, i) => sum + a * vector2[i], 0)
    const magnitude1 = Math.sqrt(vector1.reduce((sum, a) => sum + a * a, 0))
    const magnitude2 = Math.sqrt(vector2.reduce((sum, a) => sum + a * a, 0))

    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0
  }
}

// TF-IDF算法实现
export class TFIDFAnalyzer {
  private textProcessor = new TextProcessor()
  private documentFreq: Record<string, number> = {}
  private totalDocuments = 0

  /**
   * 训练TF-IDF模型
   */
  train(documents: string[]): void {
    this.totalDocuments = documents.length
    this.documentFreq = {}

    documents.forEach(doc => {
      const tokens = new Set(this.textProcessor.tokenize(doc))
      tokens.forEach(token => {
        this.documentFreq[token] = (this.documentFreq[token] || 0) + 1
      })
    })
  }

  /**
   * 计算单个文档的TF-IDF向量
   */
  calculateTFIDF(document: string): TFIDFVector[] {
    const tokens = this.textProcessor.tokenize(document)
    const termFreq: Record<string, number> = {}

    // 计算词频
    tokens.forEach(token => {
      termFreq[token] = (termFreq[token] || 0) + 1
    })

    const totalTerms = tokens.length
    const vectors: TFIDFVector[] = []

    Object.entries(termFreq).forEach(([term, freq]) => {
      const tf = freq / totalTerms
      const df = this.documentFreq[term] || 1
      const idf = Math.log(this.totalDocuments / df)
      const tfidf = tf * idf

      vectors.push({ term, tf, idf, tfidf })
    })

    return vectors.sort((a, b) => b.tfidf - a.tfidf)
  }

  /**
   * 计算文档相似度
   */
  calculateSimilarity(doc1: string, doc2: string): number {
    return this.textProcessor.cosineSimilarity(doc1, doc2)
  }
}

// 协同过滤算法
export class CollaborativeFilter {
  private userSimilarity: Record<string, Record<string, number>> = {}
  private itemSimilarity: Record<string, Record<string, number>> = {}

  /**
   * 基于用户的协同过滤
   */
  userBasedRecommendation(
    userId: string,
    userItemMatrix: Record<string, Record<string, number>>,
    topK: number = 10
  ): SimilarityScore[] {
    const targetUserItems = userItemMatrix[userId] || {}
    const recommendations: SimilarityScore[] = []

    // 计算用户相似度
    Object.keys(userItemMatrix).forEach(otherUserId => {
      if (otherUserId === userId) return

      const similarity = this.calculateUserSimilarity(
        targetUserItems,
        userItemMatrix[otherUserId]
      )

      // 推荐相似用户喜欢但目标用户未接触的项目
      Object.entries(userItemMatrix[otherUserId]).forEach(([itemId, score]) => {
        if (!(itemId in targetUserItems) && score > 0) {
          const existingRec = recommendations.find(r => r.itemId === itemId)
          if (existingRec) {
            existingRec.score += similarity * score
          } else {
            recommendations.push({
              itemId,
              score: similarity * score,
              algorithm: 'collaborative'
            })
          }
        }
      })
    })

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  /**
   * 基于物品的协同过滤
   */
  itemBasedRecommendation(
    userId: string,
    userItemMatrix: Record<string, Record<string, number>>,
    topK: number = 10
  ): SimilarityScore[] {
    const targetUserItems = userItemMatrix[userId] || {}
    const recommendations: SimilarityScore[] = []

    // 为目标用户已交互的物品找相似物品
    Object.entries(targetUserItems).forEach(([itemId, userScore]) => {
      if (userScore <= 0) return

      Object.keys(this.getAllItems(userItemMatrix)).forEach(otherItemId => {
        if (itemId === otherItemId || otherItemId in targetUserItems) return

        const similarity = this.calculateItemSimilarity(
          itemId,
          otherItemId,
          userItemMatrix
        )

        if (similarity > 0) {
          const existingRec = recommendations.find(r => r.itemId === otherItemId)
          if (existingRec) {
            existingRec.score += similarity * userScore
          } else {
            recommendations.push({
              itemId: otherItemId,
              score: similarity * userScore,
              algorithm: 'collaborative'
            })
          }
        }
      })
    })

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  private calculateUserSimilarity(
    user1Items: Record<string, number>,
    user2Items: Record<string, number>
  ): number {
    const commonItems = Object.keys(user1Items).filter(
      item => item in user2Items
    )

    if (commonItems.length === 0) return 0

    const sum1 = commonItems.reduce((sum, item) => sum + user1Items[item], 0)
    const sum2 = commonItems.reduce((sum, item) => sum + user2Items[item], 0)
    
    const sum1Sq = commonItems.reduce((sum, item) => sum + user1Items[item] ** 2, 0)
    const sum2Sq = commonItems.reduce((sum, item) => sum + user2Items[item] ** 2, 0)
    
    const sumProduct = commonItems.reduce(
      (sum, item) => sum + user1Items[item] * user2Items[item], 0
    )

    const numerator = sumProduct - (sum1 * sum2) / commonItems.length
    const denominator = Math.sqrt(
      (sum1Sq - (sum1 ** 2) / commonItems.length) *
      (sum2Sq - (sum2 ** 2) / commonItems.length)
    )

    return denominator === 0 ? 0 : numerator / denominator
  }

  private calculateItemSimilarity(
    item1: string,
    item2: string,
    userItemMatrix: Record<string, Record<string, number>>
  ): number {
    const users1 = Object.keys(userItemMatrix).filter(
      user => item1 in userItemMatrix[user] && userItemMatrix[user][item1] > 0
    )
    const users2 = Object.keys(userItemMatrix).filter(
      user => item2 in userItemMatrix[user] && userItemMatrix[user][item2] > 0
    )

    const commonUsers = users1.filter(user => users2.includes(user))
    
    if (commonUsers.length === 0) return 0

    // 计算余弦相似度
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    commonUsers.forEach(user => {
      const rating1 = userItemMatrix[user][item1]
      const rating2 = userItemMatrix[user][item2]
      dotProduct += rating1 * rating2
      norm1 += rating1 ** 2
      norm2 += rating2 ** 2
    })

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }

  private getAllItems(userItemMatrix: Record<string, Record<string, number>>): Set<string> {
    const items = new Set<string>()
    Object.values(userItemMatrix).forEach(userItems => {
      Object.keys(userItems).forEach(item => items.add(item))
    })
    return items
  }
}

// 内容相似度分析器
export class ContentSimilarityAnalyzer {
  private textProcessor = new TextProcessor()

  /**
   * 基于内容的推荐
   */
  contentBasedRecommendation(
    targetContent: string,
    candidateItems: { id: string; content: string }[],
    topK: number = 10
  ): SimilarityScore[] {
    const scores: SimilarityScore[] = []

    candidateItems.forEach(item => {
      const similarity = this.textProcessor.cosineSimilarity(
        targetContent,
        item.content
      )

      scores.push({
        itemId: item.id,
        score: similarity,
        algorithm: 'content_based'
      })
    })

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  /**
   * 基于用户画像的内容推荐
   */
  profileBasedRecommendation(
    userProfile: UserProfile,
    candidateItems: { id: string; content: string; category?: string }[],
    topK: number = 10
  ): SimilarityScore[] {
    const userInterestText = userProfile.interests
      .map(interest => `${interest.keyword} `.repeat(Math.ceil(interest.weight * 10)))
      .join(' ')

    const userDomainText = userProfile.knowledgeDomains
      .map(domain => `${domain.domain} ${domain.subDomains.join(' ')} `.repeat(
        Math.ceil(domain.interestLevel / 10)
      ))
      .join(' ')

    const combinedProfile = `${userInterestText} ${userDomainText}`

    return this.contentBasedRecommendation(
      combinedProfile,
      candidateItems,
      topK
    )
  }
}

// 混合推荐算法
export class HybridRecommendationEngine {
  private tfidfAnalyzer = new TFIDFAnalyzer()
  private collaborativeFilter = new CollaborativeFilter()
  private contentAnalyzer = new ContentSimilarityAnalyzer()

  /**
   * 混合推荐：结合多种算法
   */
  hybridRecommendation(options: {
    userId: string
    userProfile: UserProfile
    userItemMatrix: Record<string, Record<string, number>>
    candidateItems: { id: string; content: string; category?: string }[]
    weights: {
      collaborative: number
      content: number
      profile: number
    }
    topK: number
  }): SimilarityScore[] {
    const { userId, userProfile, userItemMatrix, candidateItems, weights, topK } = options

    // 协同过滤推荐
    const collaborativeRecs = this.collaborativeFilter.userBasedRecommendation(
      userId,
      userItemMatrix,
      topK * 2
    )

    // 基于内容的推荐
    const userRecentContent = this.getUserRecentContent(userId, userItemMatrix, candidateItems)
    const contentRecs = this.contentAnalyzer.contentBasedRecommendation(
      userRecentContent,
      candidateItems,
      topK * 2
    )

    // 基于用户画像的推荐
    const profileRecs = this.contentAnalyzer.profileBasedRecommendation(
      userProfile,
      candidateItems,
      topK * 2
    )

    // 合并和加权
    const combinedScores: Record<string, number> = {}

    // 加权协同过滤结果
    collaborativeRecs.forEach(rec => {
      combinedScores[rec.itemId] = (combinedScores[rec.itemId] || 0) + 
        rec.score * weights.collaborative
    })

    // 加权内容推荐结果
    contentRecs.forEach(rec => {
      combinedScores[rec.itemId] = (combinedScores[rec.itemId] || 0) + 
        rec.score * weights.content
    })

    // 加权画像推荐结果
    profileRecs.forEach(rec => {
      combinedScores[rec.itemId] = (combinedScores[rec.itemId] || 0) + 
        rec.score * weights.profile
    })

    // 转换为推荐结果并排序
    const finalRecommendations = Object.entries(combinedScores)
      .map(([itemId, score]) => ({
        itemId,
        score,
        algorithm: 'hybrid' as AlgorithmType
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return finalRecommendations
  }

  private getUserRecentContent(
    userId: string,
    userItemMatrix: Record<string, Record<string, number>>,
    candidateItems: { id: string; content: string }[]
  ): string {
    const userItems = userItemMatrix[userId] || {}
    const recentItems = Object.entries(userItems)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([itemId]) => itemId)

    return recentItems
      .map(itemId => {
        const item = candidateItems.find(c => c.id === itemId)
        return item?.content || ''
      })
      .join(' ')
  }
}