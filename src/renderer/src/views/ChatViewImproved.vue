<template>
  <div class="chat-view flex h-screen bg-background overflow-hidden">
    <!-- 侧边栏 -->
    <aside 
      class="sidebar flex flex-col border-r border-border/50 transition-all duration-300"
      :style="{ width: sidebarWidth + 'px' }"
    >
      <!-- 侧边栏头部 -->
      <div class="sidebar-header p-5 border-b border-border/50">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-bold text-foreground/90">聊天</h1>
          <button
            @click="toggleSidebar"
            class="p-1.5 hover:bg-secondary/80 rounded-lg transition-colors"
            :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
          >
            <PanelLeftClose v-if="!sidebarCollapsed" :size="18" />
            <PanelLeft v-else :size="18" />
          </button>
        </div>
        
        <!-- 新建聊天按钮 -->
        <button 
          @click="createNewChat"
          class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          <Plus :size="20" />
          <span v-if="!sidebarCollapsed" class="text-base">新建聊天</span>
        </button>
      </div>
      
      <!-- 搜索栏 -->
      <div v-if="!sidebarCollapsed" class="px-4 py-3 border-b border-border/30">
        <div class="relative">
          <Search :size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索聊天记录..."
            class="w-full pl-11 pr-4 py-3 bg-secondary/60 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-all border border-transparent focus:border-primary/20"
          />
        </div>
      </div>
      
      <!-- 聊天列表 -->
      <div class="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        <TransitionGroup name="chat-list">
          <div
            v-for="chat in filteredChats"
            :key="chat.id"
            @click="selectChat(chat.id)"
            class="chat-item group"
            :class="[
              'relative px-4 py-4 rounded-xl cursor-pointer transition-all duration-200',
              currentChatId === chat.id 
                ? 'bg-primary/15 border-2 border-primary/30 shadow-lg' 
                : 'hover:bg-secondary/60 border-2 border-transparent hover:shadow-md'
            ]"
          >
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 mt-0.5">
                <MessageSquare 
                  :size="16" 
                  :class="[
                    'transition-colors',
                    currentChatId === chat.id ? 'text-primary' : 'text-muted-foreground'
                  ]"
                />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-base truncate mb-1 leading-tight">{{ chat.title }}</h3>
                <p class="text-sm text-muted-foreground">{{ formatTime(chat.updatedAt) }}</p>
              </div>
              
              <!-- 操作按钮 -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click.stop="deleteChat(chat.id)"
                  class="p-1 hover:bg-background rounded transition-colors"
                  title="删除聊天"
                >
                  <Trash2 :size="14" class="text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>
          </div>
        </TransitionGroup>
        
        <!-- 空状态 -->
        <div v-if="filteredChats.length === 0" class="text-center py-12">
          <MessageSquare :size="32" class="mx-auto mb-3 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">
            {{ searchQuery ? '没有找到匹配的聊天' : '还没有聊天记录' }}
          </p>
        </div>
      </div>
      
      <!-- 侧边栏底部 -->
      <div class="sidebar-footer p-4 border-t border-border/50">
        <button
          @click="$router.push('/settings')"
          class="w-full px-4 py-3 hover:bg-secondary/60 rounded-xl transition-all flex items-center gap-3 font-medium hover:scale-[1.02]"
        >
          <Settings :size="20" class="text-muted-foreground" />
          <span v-if="!sidebarCollapsed" class="text-base">设置</span>
        </button>
      </div>
    </aside>
    
    <!-- 可调整大小的分隔条 -->
    <div
      class="sidebar-resizer w-1 hover:w-2 bg-transparent hover:bg-primary/20 cursor-col-resize transition-all"
      @mousedown="startResize"
    />

    <!-- 主聊天区域 -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- 聊天头部 -->
      <header class="chat-header h-16 px-6 border-b border-border/50 flex items-center justify-between bg-background/95 backdrop-blur">
        <div class="flex items-center gap-4">
          <button
            v-if="isMobile"
            @click="toggleSidebar"
            class="p-2.5 hover:bg-secondary/50 rounded-xl transition-colors lg:hidden"
          >
            <Menu :size="22" />
          </button>
          <h2 class="font-bold text-lg text-foreground/90">{{ currentChat?.title || '新对话' }}</h2>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- 主题切换 -->
          <button
            @click="toggleTheme"
            class="p-2.5 hover:bg-secondary/60 rounded-xl transition-all hover:scale-105"
            :title="isDark ? '切换到亮色主题' : '切换到暗色主题'"
          >
            <Sun v-if="isDark" :size="20" class="text-yellow-500" />
            <Moon v-else :size="20" class="text-blue-500" />
          </button>
          
          <!-- 全局搜索 -->
          <button
            @click="openGlobalSearch"
            class="flex items-center gap-2 px-4 py-2.5 bg-secondary/60 hover:bg-secondary/80 rounded-xl transition-all group border border-transparent hover:border-primary/20"
            title="全局搜索 (Cmd+K)"
          >
            <Search :size="18" class="group-hover:text-primary transition-colors" />
            <span class="hidden sm:inline-block text-sm font-medium group-hover:text-primary transition-colors">搜索</span>
            <kbd class="hidden sm:inline-block px-2 py-1 bg-muted/50 rounded text-xs font-mono">⌘K</kbd>
          </button>
          
          <!-- 更多操作 -->
          <button
            class="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
            title="更多操作"
          >
            <MoreVertical :size="18" />
          </button>
        </div>
      </header>

      <!-- 消息区域 -->
      <div 
        class="flex-1 flex flex-col min-h-0"
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
      >
        <!-- 欢迎界面 -->
        <div v-if="!currentChat?.messages.length" class="welcome-screen flex-1 flex items-center justify-center">
          <div class="text-center py-24 px-6">
            <div class="inline-flex items-center justify-center w-20 h-20 mb-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl shadow-lg">
              <Sparkles :size="36" class="text-primary" />
            </div>
            <h2 class="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              欢迎使用 MiaoDa Chat
            </h2>
            <p class="text-lg text-muted-foreground mb-12 max-w-lg mx-auto leading-relaxed">
              你的智能 AI 助手，随时准备帮你解答问题、编写代码、翻译文本等
            </p>
            
            <!-- 快速开始建议 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <button
                v-for="(suggestion, index) in quickSuggestions"
                :key="index"
                @click="sendQuickMessage(suggestion.text)"
                class="group text-left p-6 bg-secondary/30 hover:bg-secondary/50 rounded-2xl transition-all hover:scale-[1.03] hover:shadow-lg border border-transparent hover:border-primary/20"
              >
                <div class="flex items-start gap-4">
                  <div class="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all group-hover:scale-110">
                    <component :is="suggestion.icon" :size="22" class="text-primary" />
                  </div>
                  <div>
                    <h4 class="font-semibold text-base mb-2">{{ suggestion.title }}</h4>
                    <p class="text-sm text-muted-foreground leading-relaxed">{{ suggestion.text }}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        <!-- 增强的消息列表 -->
        <div 
          v-else
          ref="messagesContainer"
          class="flex-1 overflow-y-auto px-4 py-6"
          @scroll="handleMessageScroll"
        >
          <TransitionGroup name="message">
            <div
              v-for="(message, index) in currentChat.messages"
              :key="message.id"
              :class="[
                'message-item mb-6 transition-all duration-300',
                { 'highlight-flash': highlightedMessageId === message.id },
                'message-enter-viewport'
              ]"
              :data-message-index="index"
            >
              <!-- 消息容器 -->
              <div class="group flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
                <div class="flex max-w-[80%]" :class="message.role === 'user' ? 'flex-row-reverse' : 'flex-row'">
                  <!-- 头像 -->
                  <div class="flex-shrink-0 mx-2">
                    <div 
                      class="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                      :class="message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'"
                    >
                      <User v-if="message.role === 'user'" :size="16" />
                      <Sparkles v-else :size="16" />
                    </div>
                  </div>
                  
                  <!-- 消息内容 -->
                  <div class="flex-1 min-w-0">
                    <!-- 回复指示器 -->
                    <div v-if="message.replyTo" class="mb-2 px-3 py-2 bg-muted/30 rounded-lg border-l-2 border-primary/50">
                      <div class="text-xs text-muted-foreground mb-1">回复：</div>
                      <div class="text-sm text-muted-foreground truncate">{{ message.replyTo.content }}</div>
                    </div>
                    
                    <!-- 消息气泡 -->
                    <div 
                      class="message-bubble relative px-4 py-3 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group cursor-pointer select-text"
                      :class="message.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-br-sm hover:bg-primary/90' 
                        : 'bg-secondary/50 text-foreground rounded-bl-sm hover:bg-secondary/70'"
                      @mouseenter="onMessageHover(message.id)"
                      @mouseleave="onMessageLeave()"
                      @selectstart="onTextSelectionStart(message.id)"
                    >
                      <!-- 文本选择高亮效果 -->
                      <div 
                        class="message-content transition-all duration-200"
                        :class="{
                          'selection-highlight': selectedTextMessageId === message.id && isTextSelected,
                          'hover-glow': hoveredMessageId === message.id
                        }"
                        @mouseup="onTextSelectionEnd"
                      >
                        <MessageContent 
                          :content="message.content" 
                          :is-loading="false"
                        />
                      </div>
                      
                      <!-- 消息操作按钮 -->
                      <Transition name="action-buttons-fade">
                        <div 
                          v-if="hoveredMessageId === message.id"
                          class="absolute top-0 z-10 animate-in"
                          :class="message.role === 'user' ? 'right-full mr-2' : 'left-full ml-2'"
                        >
                          <div class="flex items-center gap-1 p-1 bg-background/95 backdrop-blur-sm rounded-lg shadow-xl border border-border/50 animate-slide-in">
                            <button
                              @click="replyToMessage(message)"
                              class="p-1.5 hover:bg-secondary rounded-md transition-all duration-200 hover:scale-110 active:scale-95"
                              title="回复"
                            >
                              <RefreshCw :size="14" class="transition-colors" />
                            </button>
                            <button
                              @click="copyMessage(message.content)"
                              class="p-1.5 hover:bg-secondary rounded-md transition-all duration-200 hover:scale-110 active:scale-95"
                              title="复制"
                            >
                              <Copy :size="14" class="transition-colors" />
                            </button>
                            <button
                              v-if="message.role === 'assistant'"
                              @click="regenerateMessage(index)"
                              class="p-1.5 hover:bg-secondary rounded-md transition-all duration-200 hover:scale-110 active:scale-95"
                              title="重新生成"
                            >
                              <RefreshCw :size="14" class="transition-colors" />
                            </button>
                            <button
                              @click="deleteMessage(message.id)"
                              class="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all duration-200 hover:scale-110 active:scale-95"
                              title="删除"
                            >
                              <Trash2 :size="14" class="transition-colors" />
                            </button>
                          </div>
                        </div>
                      </Transition>
                    </div>
                    
                    <!-- 时间戳和状态 -->
                    <div 
                      class="flex items-center gap-2 mt-1 text-xs text-muted-foreground transition-all duration-200"
                      :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
                    >
                      <span class="transition-all duration-200 hover:text-foreground">{{ formatMessageTime(message.timestamp) }}</span>
                      <!-- 消息状态指示器 -->
                      <Transition name="status-fade" mode="out-in">
                        <MessageStatusIndicator v-if="message.role === 'user'" :key="message.status" :status="message.status || 'sent'" />
                      </Transition>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
        
        <!-- 滚动到底部按钮 -->
        <Transition name="fade">
          <button
            v-if="showScrollButton"
            @click="scrollToBottom"
            class="fixed bottom-32 right-6 p-3 bg-background rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-border/50 hover:scale-110 z-20"
            title="滚动到底部"
          >
            <ArrowDown :size="20" class="text-muted-foreground" />
          </button>
        </Transition>
        
        <!-- 增强的加载状态 -->
        <Transition name="loading-fade" appear>
          <div v-if="isLoading && currentChat?.messages.length" class="px-6 py-4">
            <div class="ai-thinking-bubble relative overflow-hidden">
              <div class="flex items-center gap-4 p-4 bg-gradient-to-r from-secondary/20 via-secondary/30 to-secondary/20 rounded-2xl border border-border/30 backdrop-blur-sm">
                <!-- AI 头像动画 -->
                <div class="flex-shrink-0 relative">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm animate-pulse-glow">
                    <Sparkles :size="16" class="text-white animate-sparkle" />
                  </div>
                  <!-- 思考波纹 -->
                  <div class="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"></div>
                  <div class="absolute inset-0 rounded-full border-2 border-primary/10 animate-ping" style="animation-delay: 0.5s;"></div>
                </div>
                
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="thinking-dots flex items-center gap-1">
                      <span class="w-1.5 h-1.5 bg-primary rounded-full animate-thinking-dot" style="animation-delay: 0s"></span>
                      <span class="w-1.5 h-1.5 bg-primary rounded-full animate-thinking-dot" style="animation-delay: 0.3s"></span>
                      <span class="w-1.5 h-1.5 bg-primary rounded-full animate-thinking-dot" style="animation-delay: 0.6s"></span>
                    </div>
                    <span class="text-sm font-medium text-foreground animate-text-shimmer">AI 正在思考</span>
                  </div>
                  <div class="text-xs text-muted-foreground">正在分析您的问题并生成回复...</div>
                  
                  <!-- 进度条 -->
                  <div class="mt-2 w-full bg-secondary/50 rounded-full h-1 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-primary to-primary/50 animate-progress-wave"></div>
                  </div>
                </div>
              </div>
              
              <!-- 背景动效 -->
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer-bg"></div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 回复指示器 -->
      <Transition name="slide-up">
        <div v-if="replyingTo" class="border-t border-border/30 bg-muted/20 px-6 py-3">
          <div class="max-w-4xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
              <RefreshCw :size="16" class="text-primary" />
              <div>
                <div class="text-sm font-medium text-foreground">回复消息</div>
                <div class="text-xs text-muted-foreground truncate max-w-md">{{ replyingTo.content }}</div>
              </div>
            </div>
            <button
              @click="replyingTo = null"
              class="p-1 hover:bg-background/50 rounded-lg transition-colors"
            >
              <X :size="16" class="text-muted-foreground" />
            </button>
          </div>
        </div>
      </Transition>

      <!-- 输入区域 -->
      <div class="input-area border-t border-border/50 bg-background/95 backdrop-blur">
        <div class="max-w-4xl mx-auto" :class="isMobile ? 'p-3' : 'p-4'">
          <!-- 配置提示 -->
          <div 
            v-if="!isConfigured" 
            class="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2"
          >
            <AlertCircle :size="16" class="text-warning flex-shrink-0" />
            <span class="text-sm">请先在设置中配置 LLM 提供商</span>
            <button 
              @click="$router.push('/settings')" 
              class="ml-auto text-sm font-medium text-primary hover:underline"
            >
              立即配置 →
            </button>
          </div>
          
          <!-- 附件预览 -->
          <div v-if="attachments.length > 0" class="mb-4">
            <div class="flex flex-wrap gap-3 p-4 bg-secondary/20 rounded-xl border border-border/30">
              <TransitionGroup name="attachment">
                <div
                  v-for="(attachment, index) in attachments"
                  :key="attachment.id"
                  class="attachment-item relative group"
                >
                  <!-- 图片附件 -->
                  <div v-if="attachment.type === 'image'" class="relative">
                    <img 
                      :src="attachment.data" 
                      :alt="attachment.name"
                      class="h-20 w-20 object-cover rounded-lg border border-border"
                    />
                    <button
                      @click="removeAttachment(index)"
                      class="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X :size="12" />
                    </button>
                  </div>
                  
                  <!-- 文件附件 -->
                  <div v-else class="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg border border-border">
                    <FileText :size="16" class="text-muted-foreground" />
                    <span class="text-sm max-w-[150px] truncate">{{ attachment.name }}</span>
                    <button
                      @click="removeAttachment(index)"
                      class="p-1 hover:bg-background rounded transition-colors"
                    >
                      <X :size="12" class="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </div>
          
          <!-- 输入框容器 -->
          <div class="relative">
            <div 
              class="input-container flex items-end transition-all duration-300 ease-out"
              :class="[
                isMobile ? 'gap-3 p-4' : 'gap-4 p-4',
                'bg-secondary/40 rounded-2xl border-2 shadow-sm backdrop-blur-sm',
                isFocused ? 'border-primary/50 shadow-xl bg-background/80 scale-[1.01] animate-focus-breathe' : 'border-transparent hover:border-primary/20 hover:bg-secondary/50'
              ]"
            >
              <!-- 附件按钮 -->
              <div class="flex gap-2 pb-1">
                <button
                  @click="selectFiles"
                  class="action-button transition-all group rounded-xl"
                  :class="isMobile ? 'p-3' : 'p-2.5'"
                  title="添加附件"
                  :disabled="isLoading"
                >
                  <Paperclip 
                    :size="isMobile ? 24 : 22" 
                    class="transition-all"
                    :class="isLoading ? 'text-muted-foreground/50' : 'group-hover:text-primary group-hover:scale-110'"
                  />
                </button>
              </div>
              
              <!-- 文本输入框 -->
              <div class="flex-1 relative">
                <textarea
                  v-model="inputMessage"
                  @keydown.enter.prevent="handleSend"
                  @focus="onInputFocus"
                  @blur="onInputBlur"
                  @paste="handlePaste"
                  @input="onInputChange"
                  :placeholder="getPlaceholder()"
                  :disabled="isLoading || !isConfigured"
                  class="w-full bg-transparent resize-none outline-none placeholder:text-muted-foreground/60 disabled:opacity-50 leading-relaxed transition-all duration-200"
                  :class="[
                    isMobile ? 'min-h-[52px] max-h-[200px] px-4 py-4 text-base' : 'min-h-[48px] max-h-[200px] px-3 py-3 text-base',
                    isFocused ? 'placeholder:text-muted-foreground/80' : ''
                  ]"
                  :rows="1"
                  :style="isMobile ? 'font-size: 16px;' : ''"
                  ref="messageInput"
                />
                
                <!-- 实时打字效果 -->
                <div 
                  v-if="isTypingEffect && inputMessage.length > 0"
                  class="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-primary/60"
                >
                  <div class="typing-indicator">
                    <span class="typing-dot" style="animation-delay: 0s"></span>
                    <span class="typing-dot" style="animation-delay: 0.2s"></span>
                    <span class="typing-dot" style="animation-delay: 0.4s"></span>
                  </div>
                </div>
              </div>
              
              <!-- 语音和发送按钮 -->
              <div class="flex gap-2 pb-1">
                <!-- 语音输入按钮 -->
                <button
                  v-if="isVoiceSupported"
                  @click="toggleVoiceRecording"
                  :disabled="!isConfigured"
                  :title="isRecording ? '停止录音' : '语音输入 (Ctrl+Shift+M)'"
                  class="voice-button relative rounded-xl transition-all duration-300 transform shadow-sm overflow-hidden"
                  :class="[
                    isMobile ? 'p-3.5' : 'p-3',
                    isRecording 
                      ? 'bg-destructive text-destructive-foreground shadow-lg scale-110' 
                      : isConfigured
                        ? 'bg-secondary/80 text-secondary-foreground hover:bg-secondary hover:scale-105 active:scale-95'
                        : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                  ]"
                >
                  <!-- 录音波纹效果 -->
                  <div 
                    v-if="isRecording" 
                    class="absolute inset-0 rounded-xl border-2 border-destructive/30 animate-recording-pulse"
                  ></div>
                  <div 
                    v-if="isRecording" 
                    class="absolute inset-0 rounded-xl border-2 border-destructive/20 animate-recording-pulse" 
                    style="animation-delay: 0.5s;"
                  ></div>
                  
                  <!-- 音频可视化条 -->
                  <div v-if="isRecording" class="absolute bottom-1 left-1 right-1 flex items-end gap-0.5 h-1">
                    <div class="w-0.5 bg-destructive-foreground/60 animate-audio-bar" style="animation-delay: 0s; height: 20%"></div>
                    <div class="w-0.5 bg-destructive-foreground/60 animate-audio-bar" style="animation-delay: 0.1s; height: 60%"></div>
                    <div class="w-0.5 bg-destructive-foreground/60 animate-audio-bar" style="animation-delay: 0.2s; height: 40%"></div>
                    <div class="w-0.5 bg-destructive-foreground/60 animate-audio-bar" style="animation-delay: 0.3s; height: 80%"></div>
                    <div class="w-0.5 bg-destructive-foreground/60 animate-audio-bar" style="animation-delay: 0.4s; height: 30%"></div>
                  </div>
                  
                  <Mic :size="isMobile ? 24 : 22" :class="{ 'animate-bounce': isRecording }" />
                </button>
                
                <!-- 发送按钮 -->
                <button
                  @click="sendMessage"
                  :disabled="!canSend"
                  class="send-button rounded-xl transition-all transform shadow-sm"
                  :class="[
                    isMobile ? 'p-3.5' : 'p-3',
                    canSend
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 shadow-lg active:scale-95' 
                      : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                  ]"
                  :title="getSendButtonTooltip()"
                >
                  <Send 
                    :size="isMobile ? 24 : 22" 
                    class="transition-all" 
                    :class="canSend ? 'translate-x-0' : '-translate-x-0.5'" 
                  />
                </button>
              </div>
            </div>
            
            <!-- 智能提示栏 -->
            <div class="flex items-center justify-between mt-2 px-2">
              <div class="flex items-center gap-4 text-xs text-muted-foreground">
                <span class="flex items-center gap-1.5">
                  <kbd class="px-2 py-1 bg-secondary/60 rounded-md text-xs font-mono font-medium">Enter</kbd> 发送
                </span>
                <span class="flex items-center gap-1.5">
                  <kbd class="px-2 py-1 bg-secondary/60 rounded-md text-xs font-mono font-medium">Shift+Enter</kbd> 换行
                </span>
                <span class="flex items-center gap-1.5" v-if="!isMobile">
                  <kbd class="px-2 py-1 bg-secondary/60 rounded-md text-xs font-mono font-medium">⌘K</kbd> 搜索
                </span>
              </div>
              
              <!-- 字符计数和状态 -->
              <div class="flex items-center gap-3 text-xs text-muted-foreground">
                <Transition name="status-slide" mode="out-in">
                  <span v-if="isLoading" class="flex items-center gap-1 animate-pulse">
                    <Loader2 :size="12" class="animate-spin" />
                    AI 响应中...
                  </span>
                </Transition>
                
                <Transition name="counter-bounce">
                  <span 
                    v-if="inputCharacterCount > 0" 
                    :class="[
                      'font-medium tabular-nums transition-all duration-300',
                      inputCharacterCount > 4000 ? 'text-destructive animate-error-shake' : 
                      inputCharacterCount > 3000 ? 'text-warning' : 
                      'text-muted-foreground hover:text-foreground'
                    ]"
                  >
                    {{ inputCharacterCount.toLocaleString() }}/4000
                  </span>
                </Transition>
                
                <!-- 输入提示 -->
                <Transition name="hint-fade">
                  <div v-if="isFocused && inputMessage.length === 0" class="flex items-center gap-2 text-muted-foreground/50">
                    <span>输入想法...</span>
                    <div class="animate-pulse w-2 h-4 bg-primary/30 rounded-full"></div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 移动端侧边栏遮罩 -->
    <Transition name="overlay-fade">
      <div
        v-if="isMobile && !sidebarCollapsed"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        @click="toggleSidebar"
        @touchstart.passive="toggleSidebar"
      />
    </Transition>
    
    <!-- 全局搜索 -->
    <GlobalSearch
      v-if="showGlobalSearch"
      :is-visible="showGlobalSearch"
      @close="showGlobalSearch = false"
      @message-click="handleSearchMessageClick"
      @chat-click="handleSearchChatClick"
    />
    
    <!-- 性能测试面板（仅开发环境） -->
    <PerformanceTestPanel v-if="isDevelopment" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch, defineComponent, h } from 'vue'
import { 
  Plus, Send, Settings, Paperclip, X, FileText, Bot, User, Mic,
  MessageSquare, Loader2, AlertCircle, Search, Trash2, Menu,
  Sun, Moon, MoreVertical, Copy, RefreshCw, PanelLeft, PanelLeftClose,
  Sparkles, Code2, Languages, HelpCircle, Check, CheckCircle, XCircle,
  Clock, ArrowDown
} from 'lucide-vue-next'
import { useChatStore } from '@renderer/src/stores/chat'
import { formatDistanceToNow } from '@renderer/src/utils/time'
import { useGlobalShortcuts } from '@renderer/src/composables/useGlobalShortcuts'
import MessageContent from '@renderer/src/components/MessageContentImproved.vue'
import GlobalSearch from '@renderer/src/components/search/GlobalSearch.vue'
import PerformanceTestPanel from '@renderer/src/components/dev/PerformanceTestPanel.vue'

// 类型定义
interface Attachment {
  id: string
  name: string
  type: 'image' | 'text' | 'file'
  data?: string
  content?: string
}

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error'

interface EnhancedMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date | string
  status?: MessageStatus
  replyTo?: any
}

// 增强的消息状态指示器组件
const MessageStatusIndicator = defineComponent({
  props: {
    status: {
      type: String as () => MessageStatus,
      default: 'sent'
    }
  },
  setup(props) {
    const getStatusIcon = () => {
      switch (props.status) {
        case 'sending':
          return h('div', {
            class: 'flex items-center gap-1 text-xs text-muted-foreground/70 animate-pulse-subtle',
            title: '发送中...'
          }, [
            h(Loader2, { size: 12, class: 'animate-spin' }),
            h('span', { class: 'hidden sm:inline sending-dots' }, '发送中')
          ])
        case 'sent':
          return h('div', {
            class: 'flex items-center gap-1 text-xs text-muted-foreground transition-all duration-300 hover:text-foreground',
            title: '已发送'
          }, [
            h(Check, { size: 12, class: 'transition-all duration-300 animate-success-check' }),
            h('span', { class: 'hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity duration-200' }, '已发送')
          ])
        case 'delivered':
          return h('div', {
            class: 'flex items-center gap-1 text-xs text-primary transition-all duration-300 animate-bounce-in',
            title: '已送达'
          }, [
            h(Check, { size: 12, class: 'transition-all duration-300 scale-110 animate-success-check' }),
            h('span', { class: 'hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity duration-200' }, '已送达')
          ])
        case 'read':
          return h('div', {
            class: 'flex items-center gap-1 text-xs text-primary transition-all duration-300 animate-bounce-in',
            title: '已读'
          }, [
            h(CheckCircle, { size: 12, class: 'transition-all duration-300 scale-110 animate-success-check' }),
            h('span', { class: 'hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity duration-200' }, '已读')
          ])
        case 'error':
          return h('div', {
            class: 'flex items-center gap-1 text-xs text-destructive transition-all duration-300 cursor-pointer hover:text-destructive/80 animate-error-shake',
            title: '发送失败，点击重试',
            onClick: () => {
              // 触发重试逻辑
              console.log('Retry message sending')
            }
          }, [
            h(XCircle, { size: 12, class: 'transition-all duration-300 hover:scale-110 animate-error-shake' }),
            h('span', { class: 'hidden sm:inline animate-error-shake' }, '重试')
          ])
        default:
          return null
      }
    }

    return () => getStatusIcon()
  }
})

// 响应式数据
const chatStore = useChatStore()

// Initialize global shortcuts
const { shortcuts } = useGlobalShortcuts()

const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()
const virtualMessageList = ref<InstanceType<typeof VirtualMessageList>>()
const chatContainer = ref<HTMLElement>()

// 界面状态
const inputMessage = ref('')
const isLoading = ref(false)
const attachments = ref<Attachment[]>([])
const isConfigured = ref(false)
const searchQuery = ref('')
const showGlobalSearch = ref(false)
const isFocused = ref(false)
const isTypingEffect = ref(false)
const inputChangeTimeout = ref<NodeJS.Timeout>()
const isDark = ref(false)
const isMobile = ref(false)
const highlightedMessageId = ref<string>()
const isDevelopment = ref(import.meta.env.MODE === 'development')
const showScrollButton = ref(false)
const replyingTo = ref<any>(null)
const inputCharacterCount = ref(0)
const hoveredMessageId = ref<string>()
const selectedTextMessageId = ref<string>()
const isTextSelected = ref(false)

// 语音输入相关状态
const isVoiceSupported = ref(false)
const isRecording = ref(false)
const recognition = ref<SpeechRecognition | null>(null)

// 侧边栏状态
const sidebarWidth = ref(280)
const sidebarCollapsed = ref(false)
const minSidebarWidth = 200
const maxSidebarWidth = 400

// 快速建议配置
const quickSuggestions = [
  {
    icon: Code2,
    title: '编写代码',
    text: '帮我编写一个 Python 函数来处理数据'
  },
  {
    icon: Languages,
    title: '翻译文本',
    text: '将这段文字翻译成英文'
  },
  {
    icon: HelpCircle,
    title: '解答问题',
    text: '解释量子计算的基本原理'
  },
  {
    icon: Sparkles,
    title: '创意写作',
    text: '写一个关于未来城市的短故事'
  }
]

// 计算属性
const chats = computed(() => chatStore.chats)
const currentChatId = computed(() => chatStore.currentChatId)
const currentChat = computed(() => chatStore.currentChat)

const filteredChats = computed(() => {
  if (!searchQuery.value) return chats.value
  
  const query = searchQuery.value.toLowerCase()
  return chats.value.filter(chat => 
    chat.title.toLowerCase().includes(query) ||
    chat.messages.some(msg => msg.content.toLowerCase().includes(query))
  )
})

const canSend = computed(() => {
  return (inputMessage.value.trim() || attachments.value.length > 0) && 
         !isLoading.value && 
         isConfigured.value
})

// 生命周期
onMounted(async () => {
  await chatStore.initialize()
  
  // 检查 LLM 配置
  isConfigured.value = await window.api.llm.isConfigured()
  
  // 检查主题
  isDark.value = document.documentElement.classList.contains('dark')
  
  // 检查移动端
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // 初始化语音识别
  initializeVoiceRecognition()
  
  // 注册快捷键
  setupShortcuts()
  
  // 恢复侧边栏宽度
  const savedWidth = localStorage.getItem('sidebarWidth')
  if (savedWidth) {
    sidebarWidth.value = parseInt(savedWidth)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  cleanupShortcuts()
  
  // 清理计时器
  if (inputChangeTimeout.value) {
    clearTimeout(inputChangeTimeout.value)
  }
})

// 监听配置变化
watch(() => chatStore.currentChatId, () => {
  // 切换聊天时滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
})

// 方法
const createNewChat = () => {
  chatStore.createChat()
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

const selectChat = (chatId: string) => {
  chatStore.selectChat(chatId)
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

const deleteChat = async (chatId: string) => {
  if (confirm('确定要删除这个聊天吗？')) {
    await chatStore.deleteChat(chatId)
  }
}

const formatTime = (date: Date | string | undefined) => {
  if (!date) return '刚刚'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return '刚刚'
    return formatDistanceToNow(dateObj)
  } catch (error) {
    console.warn('Invalid date format:', date)
    return '刚刚'
  }
}

const formatMessageTime = (date: Date | string | undefined) => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return ''
    return dateObj.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.warn('Invalid date format:', date)
    return ''
  }
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// 语音输入相关方法
const initializeVoiceRecognition = () => {
  console.log('[Voice] Initializing voice recognition...')
  
  // 检查语音识别支持
  const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  console.log('[Voice] Speech recognition supported:', hasSpeechRecognition)
  
  if (hasSpeechRecognition) {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognition.value = new SpeechRecognition()
      
      recognition.value.continuous = false
      recognition.value.interimResults = false
      recognition.value.lang = 'zh-CN'
      
      recognition.value.onstart = () => {
        isRecording.value = true
        console.log('[Voice] Recording started')
      }
      
      recognition.value.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        const confidence = event.results[0][0].confidence
        
        console.log('[Voice] Transcript:', transcript, 'Confidence:', confidence)
        
        if (confidence > 0.7) {
          inputMessage.value = transcript
          messageInput.value?.focus()
        }
      }
      
      recognition.value.onerror = (event: any) => {
        console.error('[Voice] Recognition error:', event.error)
        isRecording.value = false
      }
      
      recognition.value.onend = () => {
        isRecording.value = false
        console.log('[Voice] Recording ended')
      }
      
      isVoiceSupported.value = true
      console.log('[Voice] Voice recognition initialized successfully')
    } catch (error) {
      console.error('[Voice] Failed to initialize speech recognition:', error)
      isVoiceSupported.value = false
    }
  } else {
    console.log('[Voice] Speech recognition not supported in this browser')
    isVoiceSupported.value = false
  }
}

const toggleVoiceRecording = () => {
  if (!recognition.value) return
  
  if (isRecording.value) {
    recognition.value.stop()
  } else {
    recognition.value.start()
  }
}

// 全局搜索相关方法
const openGlobalSearch = () => {
  showGlobalSearch.value = true
}

const handleSearchMessageClick = (messageId: string, chatId: string) => {
  chatStore.selectChat(chatId)
  showGlobalSearch.value = false
  // 使用虚拟滚动定位到指定消息
  nextTick(() => {
    highlightedMessageId.value = messageId
    virtualMessageList.value?.scrollToMessage(messageId)
    // 清除高亮状态
    setTimeout(() => {
      highlightedMessageId.value = ''
    }, 3000)
  })
}

const handleSearchChatClick = (chatId: string) => {
  chatStore.selectChat(chatId)
  showGlobalSearch.value = false
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

// 侧边栏调整大小
const startResize = (e: MouseEvent) => {
  const startX = e.clientX
  const startWidth = sidebarWidth.value
  
  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = startWidth + (e.clientX - startX)
    sidebarWidth.value = Math.max(minSidebarWidth, Math.min(maxSidebarWidth, newWidth))
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    localStorage.setItem('sidebarWidth', sidebarWidth.value.toString())
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 文件处理
const selectFiles = async () => {
  const files = await window.api.file.select()
  
  for (const file of files) {
    const attachment: Attachment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type as any,
      data: file.data,
      content: file.content
    }
    attachments.value.push(attachment)
  }
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault()
      
      const file = item.getAsFile()
      if (!file) continue
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        const fileInfo = await window.api.file.paste(dataUrl)
        
        attachments.value.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: fileInfo.name,
          type: 'image',
          data: fileInfo.data
        })
      }
      reader.readAsDataURL(file)
    }
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (!files) return
  
  for (const file of files) {
    const reader = new FileReader()
    
    if (file.type.startsWith('image/')) {
      reader.onload = (e) => {
        attachments.value.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: 'image',
          data: e.target?.result as string
        })
      }
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('text/')) {
      reader.onload = (e) => {
        attachments.value.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: 'text',
          content: e.target?.result as string
        })
      }
      reader.readAsText(file)
    }
  }
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

// 输入框交互处理
const onInputFocus = () => {
  isFocused.value = true
  isTypingEffect.value = true
}

const onInputBlur = () => {
  isFocused.value = false
  setTimeout(() => {
    isTypingEffect.value = false
  }, 500)
}

const onInputChange = () => {
  inputCharacterCount.value = inputMessage.value.length
  
  // 清除之前的延时
  if (inputChangeTimeout.value) {
    clearTimeout(inputChangeTimeout.value)
  }
  
  // 显示打字效果
  isTypingEffect.value = true
  
  // 延时隐藏打字效果
  inputChangeTimeout.value = setTimeout(() => {
    if (!isFocused.value) {
      isTypingEffect.value = false
    }
  }, 1000)
}

// 消息交互处理
const onMessageHover = (messageId: string) => {
  hoveredMessageId.value = messageId
}

const onMessageLeave = () => {
  // 延迟隐藏操作按钮，给用户时间点击
  setTimeout(() => {
    hoveredMessageId.value = undefined
  }, 150)
}

const onTextSelectionStart = (messageId: string) => {
  selectedTextMessageId.value = messageId
  isTextSelected.value = true
}

const onTextSelectionEnd = () => {
  const selection = window.getSelection()
  if (selection && selection.toString().length === 0) {
    // 没有选中文本，清除高亮
    setTimeout(() => {
      isTextSelected.value = false
      selectedTextMessageId.value = undefined
    }, 200)
  }
}

// 消息操作
const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // TODO: 显示复制成功提示动画
    console.log('Message copied successfully')
  } catch (error) {
    console.error('Failed to copy message:', error)
  }
}

const regenerateMessage = async (index: number) => {
  // TODO: 实现重新生成功能
  console.log('Regenerating message at index:', index)
}

const replyToMessage = (message: any) => {
  replyingTo.value = message
  messageInput.value?.focus()
}

const deleteMessage = async (messageId: string) => {
  if (confirm('确定要删除这条消息吗？')) {
    const chatMessages = currentChat.value?.messages
    if (chatMessages) {
      const index = chatMessages.findIndex(m => m.id === messageId)
      if (index > -1) {
        chatMessages.splice(index, 1)
      }
    }
  }
}

// 滚动相关方法
const handleMessageScroll = () => {
  if (!messagesContainer.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
  showScrollButton.value = !isNearBottom && scrollHeight > clientHeight
}

// 发送消息
const handleSend = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    sendMessage()
  }
}

const sendQuickMessage = (message: string) => {
  inputMessage.value = message
  sendMessage()
}

const sendMessage = async () => {
  if (!canSend.value) return
  
  const message = inputMessage.value
  const messageAttachments = [...attachments.value]
  
  inputMessage.value = ''
  attachments.value = []
  
  // 构建消息内容
  let fullContent = message
  
  for (const attachment of messageAttachments) {
    if (attachment.type === 'image' && attachment.data) {
      fullContent = `![${attachment.name}](${attachment.data})\n\n${fullContent}`
    } else if (attachment.type === 'text' && attachment.content) {
      fullContent = `${fullContent}\n\n\`\`\`\n${attachment.content}\n\`\`\``
    }
  }
  
  // 添加用户消息（带状态和回复）
  const userMessage = await chatStore.addMessage({
    role: 'user',
    content: fullContent,
    status: 'sending',
    replyTo: replyingTo.value
  })
  
  // 清除回复状态
  replyingTo.value = null
  
  // 立即更新为已发送状态
  setTimeout(() => {
    if (userMessage) {
      userMessage.status = 'sent'
    }
  }, 100)
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
  
  // 检查配置
  if (!isConfigured.value) {
    await chatStore.addMessage({
      role: 'assistant',
      content: '请先在设置中配置 LLM 提供商。'
    })
    return
  }
  
  isLoading.value = true
  
  // 创建助手消息
  const assistantMessage = await chatStore.addMessage({
    role: 'assistant',
    content: ''
  })
  
  try {
    // 设置流式响应监听
    let streamedContent = ''
    const cleanupChunk = window.api.llm.onChunk((data: any) => {
      if (data.chatId === currentChat.value?.id && data.messageId === assistantMessage.id) {
        streamedContent += data.chunk
        const msg = currentChat.value?.messages.find(m => m.id === assistantMessage.id)
        if (msg) {
          msg.content = streamedContent
        }
        
        nextTick(() => {
          scrollToBottom()
        })
      }
    })
    
    // 发送到 LLM
    const response = await window.api.llm.sendMessage(
      fullContent,
      currentChat.value!.id,
      assistantMessage.id
    )
    
    // 更新最终响应
    const msg = currentChat.value?.messages.find(m => m.id === assistantMessage.id)
    if (msg) {
      msg.content = response
    }
    
    cleanupChunk()
  } catch (error: any) {
    const msg = currentChat.value?.messages.find(m => m.id === assistantMessage.id)
    if (msg) {
      msg.content = `错误: ${error.message}`
    }
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 辅助方法
const getPlaceholder = () => {
  if (!isConfigured.value) return '请先配置 LLM 提供商...'
  if (isLoading.value) return 'AI 正在响应...'
  return '输入消息...'
}

const getSendButtonTooltip = () => {
  if (!isConfigured.value) return '请先配置 LLM 提供商'
  if (isLoading.value) return '请稍候...'
  if (!inputMessage.value.trim() && attachments.value.length === 0) return '输入消息'
  return '发送消息'
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}


// 快捷键设置
const setupShortcuts = () => {
  window.addEventListener('app:new-chat', createNewChat)
  window.addEventListener('app:focus-input', () => messageInput.value?.focus())
  window.addEventListener('app:clear-chat', () => {
    if (currentChat.value && confirm('清空当前聊天？')) {
      createNewChat()
    }
  })
  
  // 添加全局搜索快捷键
  const handleKeydown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + Shift + F 打开全局搜索
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault()
      openGlobalSearch()
    }
    // ESC 关闭全局搜索
    if (e.key === 'Escape' && showGlobalSearch.value) {
      showGlobalSearch.value = false
    }
  }
  document.addEventListener('keydown', handleKeydown)
  
  // 保存引用以便清理
  ;(window as any).__searchKeydownHandler = handleKeydown
}

const cleanupShortcuts = () => {
  window.removeEventListener('app:new-chat', createNewChat)
  const handler = (window as any).__searchKeydownHandler
  if (handler) {
    document.removeEventListener('keydown', handler)
    delete (window as any).__searchKeydownHandler
  }
}
</script>

<style scoped>
/* === 高亮闪烁效果 === */
@keyframes highlight-flash {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(var(--primary), 0.2); }
}

.highlight-flash {
  animation: highlight-flash 0.5s ease-in-out 3;
}

/* === 消息状态动画 === */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes success-check {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-pulse-subtle {
  animation: pulse-subtle 1.5s ease-in-out infinite;
}

.animate-success-check {
  animation: success-check 0.5s ease-out;
}

.animate-error-shake {
  animation: error-shake 0.5s ease-in-out;
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 动画定义 */
.chat-list-move,
.chat-list-enter-active,
.chat-list-leave-active {
  transition: all 0.3s ease;
}

.chat-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.chat-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.message-move,
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.message-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.attachment-enter-active,
.attachment-leave-active {
  transition: all 0.2s ease;
}

.attachment-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.attachment-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 自定义滚动条 */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  @apply bg-border/50 rounded-full;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  @apply bg-border;
}

/* 响应式文本域 */
textarea {
  field-sizing: content;
  min-height: 44px;
}

/* 消息气泡样式 */
.message-bubble {
  word-break: break-word;
  animation: messageIn 0.3s ease-out;
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 输入框聚焦效果 */
.input-container {
  transition: border-color 0.2s, box-shadow 0.2s;
}

/* 侧边栏调整大小 */
.sidebar-resizer {
  position: relative;
  flex-shrink: 0;
}

.sidebar-resizer::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 30px;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.2s;
}

.sidebar-resizer:hover::after {
  opacity: 0.3;
}

/* 过渡动画 */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 200ms ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 300ms ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 触摸反馈 */
.action-button {
  @apply hover:bg-background/70 rounded-lg;
  min-width: 44px;
  min-height: 44px;
}

@media (hover: none) and (pointer: coarse) {
  .action-button:hover {
    background-color: inherit;
  }
  
  .action-button:active {
    transform: scale(0.95);
    background-color: hsl(var(--muted));
  }
}

/* 移动端样式 */
@media (max-width: 768px) {
  .chat-view {
    @apply relative;
    /* Prevent scroll during sidebar animation */
    overflow-x: hidden;
  }
  
  .sidebar {
    @apply fixed left-0 top-0 h-full z-50 shadow-2xl;
    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
    /* Better touch scrolling */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  
  .sidebar.collapsed {
    transform: translate3d(-100%, 0, 0);
  }
  
  .sidebar-resizer {
    @apply hidden;
  }
  
  /* Better mobile header */
  .chat-header {
    @apply h-16 px-3;
    padding-top: max(1rem, env(safe-area-inset-top));
    /* Prevent text selection on mobile */
    -webkit-user-select: none;
    user-select: none;
  }
  
  .chat-header button {
    @apply p-2.5 active:scale-95;
    min-width: 44px;
    min-height: 44px;
    transition: transform 150ms ease;
  }
  
  /* Optimize input area for mobile */
  .input-area {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
    /* Ensure input stays above mobile keyboards */
    position: relative;
    z-index: 10;
  }
  
  /* Better attachment handling */
  .attachment-item {
    @apply max-w-[200px];
  }
  
  .attachment-item button {
    @apply active:scale-90;
    transition: transform 120ms ease;
  }
  
  /* Mobile-friendly welcome screen */
  .welcome-screen {
    @apply px-4 py-8;
  }
  
  .welcome-screen .grid {
    @apply grid-cols-1 gap-3;
  }
  
  .welcome-screen button {
    @apply p-4 text-left;
    min-height: 80px;
    transition: transform 150ms ease;
  }
  
  .welcome-screen button:active {
    transform: scale(0.98);
  }
  
  /* Improve text readability on mobile */
  .welcome-screen h2 {
    @apply text-2xl;
  }
  
  .welcome-screen p {
    @apply text-base;
  }
  
  /* Better chat item touch targets */
  .chat-item {
    @apply active:scale-[0.98];
    transition: transform 120ms ease;
    min-height: 64px;
  }
  
  /* Mobile-optimized message bubbles */
  .message-bubble {
    @apply max-w-[85%];
  }
  
  /* Better scrollbar for mobile */
  .sidebar::-webkit-scrollbar {
    width: 3px;
  }
  
  /* Improve button spacing */
  .sidebar-header button,
  .sidebar-footer button {
    @apply active:scale-95;
    transition: transform 150ms ease;
  }
  
  /* Text input improvements */
  .text-16 {
    font-size: 16px !important; /* Prevent zoom on iOS */
  }
  
  /* Safe area handling */
  .sidebar-header {
    padding-top: max(1rem, env(safe-area-inset-top));
  }
  
  .sidebar-footer {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
}

/* === 输入框动画 === */
@keyframes focus-breathe {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(var(--primary), 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(var(--primary), 0.1);
  }
}

@keyframes typing-dot {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.animate-focus-breathe {
  animation: focus-breathe 2s ease-in-out infinite;
}

.typing-indicator {
  display: flex;
  gap: 2px;
}

.typing-dot {
  width: 3px;
  height: 3px;
  background: currentColor;
  border-radius: 50%;
  animation: typing-dot 1.4s infinite ease-in-out;
}

/* === 消息气泡动画 === */
.message-bubble {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.message-bubble:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.selection-highlight {
  background: rgba(var(--primary), 0.1) !important;
  box-shadow: 0 0 0 1px rgba(var(--primary), 0.3);
}

.hover-glow {
  box-shadow: 0 0 20px rgba(var(--primary), 0.15);
}

/* === 加载动画 === */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.6);
  }
}

@keyframes sparkle {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
}

@keyframes thinking-dot {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@keyframes text-shimmer {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

@keyframes progress-wave {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes shimmer-bg {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-sparkle {
  animation: sparkle 3s linear infinite;
}

.animate-thinking-dot {
  animation: thinking-dot 1.4s infinite ease-in-out;
}

.animate-text-shimmer {
  animation: text-shimmer 2s ease-in-out infinite;
}

.animate-progress-wave {
  animation: progress-wave 1.5s linear infinite;
}

.animate-shimmer-bg {
  animation: shimmer-bg 3s linear infinite;
}

.ai-thinking-bubble {
  position: relative;
  overflow: hidden;
}

/* === 语音输入动画 === */
@keyframes recording-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

@keyframes audio-bar {
  0%, 100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}

.animate-recording-pulse {
  animation: recording-pulse 1.5s ease-out infinite;
}

.animate-audio-bar {
  animation: audio-bar 0.8s ease-in-out infinite alternate;
  transform-origin: bottom;
}

/* === 过渡动画 === */
.status-fade-enter-active,
.status-fade-leave-active {
  transition: all 0.3s ease;
}

.status-fade-enter-from,
.status-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.counter-bounce-enter-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.counter-bounce-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: all 0.3s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.action-buttons-fade-enter-active {
  transition: all 0.2s ease-out;
}

.action-buttons-fade-leave-active {
  transition: all 0.15s ease-in;
}

.action-buttons-fade-enter-from {
  opacity: 0;
  transform: translateY(-5px) scale(0.95);
}

.action-buttons-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.95);
}

.loading-fade-enter-active {
  transition: all 0.4s ease-out;
}

.loading-fade-leave-active {
  transition: all 0.3s ease-in;
}

.loading-fade-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.loading-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.status-slide-enter-active,
.status-slide-leave-active {
  transition: all 0.2s ease;
}

.status-slide-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.status-slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slide-in 0.2s ease-out;
}

.animate-in {
  animation: slide-in 0.2s ease-out;
}

/* === 滚动动画 === */
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@keyframes scroll-button-bounce {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  60% {
    transform: scale(1.1) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes message-enter-viewport {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}

.scroll-button-bounce-enter-active {
  animation: scroll-button-bounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.scroll-button-bounce-leave-active {
  transition: all 0.3s ease-in;
}

.scroll-button-bounce-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.message-enter-viewport {
  animation: message-enter-viewport 0.4s ease-out;
}

/* 滚动按钮增强效果 */
.scroll-to-bottom-btn {
  backdrop-filter: blur(10px);
  background: rgba(var(--background), 0.9);
}

.scroll-to-bottom-btn:hover {
  background: rgba(var(--background), 0.95);
  transform: scale(1.1) translateY(-2px);
}

.scroll-to-bottom-btn:active {
  transform: scale(0.95) translateY(0);
}

/* === 性能优化 === */
.message-bubble,
.input-container,
.voice-button,
.send-button {
  will-change: transform;
}

/* GPU 加速 */
@supports (transform: translate3d(0, 0, 0)) {
  .message-bubble:hover {
    transform: translate3d(0, -1px, 0) scale(1.02);
  }
  
  .input-container.focused {
    transform: translate3d(0, 0, 0) scale(1.01);
  }
}
</style>