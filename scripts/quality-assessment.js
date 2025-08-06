#!/usr/bin/env node

/**
 * Quality Assessment Script for MiaoDa Chat
 * Performs basic code quality analysis without external dependencies
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, relative } from 'path';
import { existsSync } from 'fs';

// Configuration
const CONFIG = {
  projectRoot: process.cwd(),
  analysisTargets: [
    'src/main',
    'src/renderer/src',
    'src/preload'
  ],
  excludePatterns: [
    'node_modules',
    '.git',
    'dist',
    'out',
    'coverage',
    '__tests__',
    '.test.',
    '.spec.'
  ],
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.vue'],
  thresholds: {
    maxFileSize: 1000,        // lines
    maxFunctionLength: 50,    // lines
    maxComplexity: 10,        // cyclomatic complexity estimate
    duplicateThreshold: 5     // lines
  }
};

class QualityAnalyzer {
  constructor() {
    this.results = {
      summary: {
        totalFiles: 0,
        totalLines: 0,
        analysisDate: new Date().toISOString()
      },
      issues: {
        high: [],
        medium: [],
        low: []
      },
      metrics: {
        fileSize: [],
        complexity: [],
        duplicates: []
      }
    };
  }

  /**
   * Get all files to analyze
   */
  async getAnalysisFiles() {
    const files = [];
    
    for (const target of CONFIG.analysisTargets) {
      const targetPath = join(CONFIG.projectRoot, target);
      if (existsSync(targetPath)) {
        await this.collectFiles(targetPath, files);
      }
    }
    
    return files.filter(file => {
      const ext = extname(file);
      return CONFIG.fileExtensions.includes(ext) &&
             !CONFIG.excludePatterns.some(pattern => file.includes(pattern));
    });
  }

  /**
   * Recursively collect files from directory
   */
  async collectFiles(dir, files) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory() && !CONFIG.excludePatterns.some(pattern => entry.name.includes(pattern))) {
          await this.collectFiles(fullPath, files);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Cannot read directory ${dir}: ${error.message}`);
    }
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const relativePath = relative(CONFIG.projectRoot, filePath);
      
      const analysis = {
        path: relativePath,
        lines: lines.length,
        size: content.length,
        issues: []
      };

      // File size analysis
      if (lines.length > CONFIG.thresholds.maxFileSize) {
        analysis.issues.push({
          type: 'large-file',
          severity: 'medium',
          message: `File is ${lines.length} lines (threshold: ${CONFIG.thresholds.maxFileSize})`
        });
      }

      // Basic complexity analysis
      const complexityScore = this.estimateComplexity(content);
      if (complexityScore > CONFIG.thresholds.maxComplexity) {
        analysis.issues.push({
          type: 'high-complexity',
          severity: 'medium',
          message: `Estimated complexity: ${complexityScore} (threshold: ${CONFIG.thresholds.maxComplexity})`
        });
      }

      // Long function detection
      const longFunctions = this.findLongFunctions(content);
      longFunctions.forEach(func => {
        analysis.issues.push({
          type: 'long-function',
          severity: 'low',
          message: `Function '${func.name}' is ${func.lines} lines (threshold: ${CONFIG.thresholds.maxFunctionLength})`
        });
      });

      // Basic code smells
      const codeSmells = this.detectCodeSmells(content, relativePath);
      analysis.issues.push(...codeSmells);

      return analysis;
    } catch (error) {
      return {
        path: relative(CONFIG.projectRoot, filePath),
        error: error.message
      };
    }
  }

  /**
   * Estimate cyclomatic complexity
   */
  estimateComplexity(content) {
    // Simple heuristic: count decision points
    const decisionPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*.*\s*:/g,  // ternary operator
      /&&/g,
      /\|\|/g
    ];

    let complexity = 1; // Base complexity
    decisionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  /**
   * Find long functions
   */
  findLongFunctions(content) {
    const longFunctions = [];
    const lines = content.split('\n');
    
    // Simple function detection (works for JS/TS)
    const functionRegex = /^\s*(export\s+)?(async\s+)?function\s+(\w+)|^\s*(\w+)\s*[:=]\s*(async\s+)?\s*(\([^)]*\)|\w+)\s*=>/;
    
    let currentFunction = null;
    let braceLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect function start
      const functionMatch = line.match(functionRegex);
      if (functionMatch && !currentFunction) {
        currentFunction = {
          name: functionMatch[3] || functionMatch[4] || 'anonymous',
          startLine: i + 1,
          lines: 0
        };
        braceLevel = 0;
      }
      
      if (currentFunction) {
        currentFunction.lines++;
        
        // Count braces to detect function end
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        braceLevel += openBraces - closeBraces;
        
        // Function ended
        if (braceLevel <= 0 && openBraces === 0 && currentFunction.lines > 1) {
          if (currentFunction.lines > CONFIG.thresholds.maxFunctionLength) {
            longFunctions.push(currentFunction);
          }
          currentFunction = null;
        }
      }
    }
    
    return longFunctions;
  }

  /**
   * Detect basic code smells
   */
  detectCodeSmells(content, filePath) {
    const smells = [];
    const lines = content.split('\n');
    
    // TODO comments
    const todoCount = (content.match(/TODO|FIXME|HACK/gi) || []).length;
    if (todoCount > 5) {
      smells.push({
        type: 'too-many-todos',
        severity: 'low',
        message: `${todoCount} TODO/FIXME/HACK comments found`
      });
    }

    // Long lines
    const longLines = lines.filter(line => line.length > 120);
    if (longLines.length > lines.length * 0.1) { // More than 10% long lines
      smells.push({
        type: 'long-lines',
        severity: 'low',
        message: `${longLines.length} lines exceed 120 characters`
      });
    }

    // Console.log statements (potential debugging leftovers)
    const consoleStatements = (content.match(/console\.(log|warn|error|debug)/g) || []).length;
    if (consoleStatements > 0 && !filePath.includes('test')) {
      smells.push({
        type: 'console-statements',
        severity: 'low',
        message: `${consoleStatements} console statements found (potential debugging leftovers)`
      });
    }

    // Deeply nested code
    const maxNestingLevel = this.calculateMaxNesting(content);
    if (maxNestingLevel > 4) {
      smells.push({
        type: 'deep-nesting',
        severity: 'medium',
        message: `Maximum nesting level: ${maxNestingLevel} (threshold: 4)`
      });
    }

    return smells;
  }

  /**
   * Calculate maximum nesting level
   */
  calculateMaxNesting(content) {
    const lines = content.split('\n');
    let maxLevel = 0;
    let currentLevel = 0;
    
    for (const line of lines) {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      currentLevel += openBraces - closeBraces;
      maxLevel = Math.max(maxLevel, currentLevel);
    }
    
    return maxLevel;
  }

  /**
   * Run complete analysis
   */
  async analyze() {
    console.log('🔍 Starting Quality Assessment for MiaoDa Chat...\n');
    
    const files = await this.getAnalysisFiles();
    console.log(`📁 Found ${files.length} files to analyze\n`);

    this.results.summary.totalFiles = files.length;

    let totalLines = 0;
    const analyses = [];

    for (const file of files) {
      const analysis = await this.analyzeFile(file);
      analyses.push(analysis);
      
      if (analysis.lines) {
        totalLines += analysis.lines;
      }
    }

    this.results.summary.totalLines = totalLines;

    // Categorize issues by severity
    analyses.forEach(analysis => {
      if (analysis.issues) {
        analysis.issues.forEach(issue => {
          const issueWithContext = {
            ...issue,
            file: analysis.path,
            lines: analysis.lines
          };
          
          switch (issue.severity) {
            case 'high':
              this.results.issues.high.push(issueWithContext);
              break;
            case 'medium':
              this.results.issues.medium.push(issueWithContext);
              break;
            case 'low':
              this.results.issues.low.push(issueWithContext);
              break;
          }
        });
      }
    });

    return this.results;
  }

  /**
   * Generate analysis report
   */
  generateReport() {
    const { summary, issues } = this.results;
    
    console.log('📊 Quality Assessment Report');
    console.log('============================\n');
    
    console.log('📈 Summary:');
    console.log(`   Total Files: ${summary.totalFiles}`);
    console.log(`   Total Lines: ${summary.totalLines.toLocaleString()}`);
    console.log(`   Analysis Date: ${new Date(summary.analysisDate).toLocaleString()}\n`);
    
    console.log('🚨 Issues Found:');
    console.log(`   High Priority: ${issues.high.length}`);
    console.log(`   Medium Priority: ${issues.medium.length}`);
    console.log(`   Low Priority: ${issues.low.length}\n`);
    
    // Report high priority issues
    if (issues.high.length > 0) {
      console.log('🔴 High Priority Issues:');
      issues.high.forEach(issue => {
        console.log(`   • ${issue.file}: ${issue.message}`);
      });
      console.log();
    }
    
    // Report medium priority issues (top 10)
    if (issues.medium.length > 0) {
      console.log('🟡 Medium Priority Issues (top 10):');
      issues.medium.slice(0, 10).forEach(issue => {
        console.log(`   • ${issue.file}: ${issue.message}`);
      });
      if (issues.medium.length > 10) {
        console.log(`   ... and ${issues.medium.length - 10} more`);
      }
      console.log();
    }
    
    // Report low priority issues summary
    if (issues.low.length > 0) {
      console.log('🟢 Low Priority Issues Summary:');
      const lowIssueTypes = {};
      issues.low.forEach(issue => {
        lowIssueTypes[issue.type] = (lowIssueTypes[issue.type] || 0) + 1;
      });
      
      Object.entries(lowIssueTypes).forEach(([type, count]) => {
        console.log(`   • ${type}: ${count} occurrences`);
      });
      console.log();
    }
    
    // Recommendations
    console.log('💡 Recommendations:');
    
    if (issues.high.length > 0) {
      console.log('   1. Address high priority issues immediately');
    }
    
    if (issues.medium.length > 5) {
      console.log('   2. Consider refactoring files with high complexity');
    }
    
    if (issues.low.filter(i => i.type === 'long-function').length > 10) {
      console.log('   3. Break down long functions into smaller, focused methods');
    }
    
    if (issues.low.filter(i => i.type === 'console-statements').length > 0) {
      console.log('   4. Remove debugging console statements');
    }
    
    const totalIssueCount = issues.high.length + issues.medium.length + issues.low.length;
    const issuesPerFile = totalIssueCount / summary.totalFiles;
    
    console.log(`\n📋 Overall Quality Score: ${this.calculateQualityScore()}/10`);
    console.log(`   Average issues per file: ${issuesPerFile.toFixed(2)}`);
    
    if (issuesPerFile < 2) {
      console.log('   ✅ Code quality is good!');
    } else if (issuesPerFile < 5) {
      console.log('   ⚠️  Code quality needs some attention');
    } else {
      console.log('   🔴 Code quality needs significant improvement');
    }
  }

  /**
   * Calculate overall quality score (0-10)
   */
  calculateQualityScore() {
    const { issues, summary } = this.results;
    const totalIssues = issues.high.length + issues.medium.length + issues.low.length;
    
    if (summary.totalFiles === 0) return 10;
    
    const issuesPerFile = totalIssues / summary.totalFiles;
    const highIssueWeight = issues.high.length * 3;
    const mediumIssueWeight = issues.medium.length * 2;
    const lowIssueWeight = issues.low.length * 1;
    
    const weightedScore = (highIssueWeight + mediumIssueWeight + lowIssueWeight) / summary.totalFiles;
    
    // Score from 0-10 (10 being best)
    return Math.max(0, Math.min(10, 10 - weightedScore));
  }
}

// Main execution
async function main() {
  try {
    const analyzer = new QualityAnalyzer();
    await analyzer.analyze();
    analyzer.generateReport();
    
    // Save results to file
    const resultsPath = join(CONFIG.projectRoot, 'quality-assessment-results.json');
    await import('fs/promises').then(fs => 
      fs.writeFile(resultsPath, JSON.stringify(analyzer.results, null, 2))
    );
    
    console.log(`\n📄 Detailed results saved to: quality-assessment-results.json`);
    
  } catch (error) {
    console.error('❌ Quality assessment failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  main();
}

// Alternative check for direct execution
if (process.argv[1] && process.argv[1].endsWith('quality-assessment.js')) {
  main();
}

export { QualityAnalyzer, CONFIG };