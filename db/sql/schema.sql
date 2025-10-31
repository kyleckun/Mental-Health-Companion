-- Enable required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- 提供 gen_random_uuid()

-- 1. User/Authentication Tables (用户与认证)
----------------------------------------------------------------------
-- Users 表：存储用户基本信息
CREATE TABLE IF NOT EXISTS Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- 存储哈希密码
    email VARCHAR(255) UNIQUE,
    user_category VARCHAR(50) NOT NULL CHECK (user_category IN ('Student', 'PregnantWoman', 'YoungProfessional', 'General')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- EmergencyContacts 表：存储危机联系人信息
CREATE TABLE IF NOT EXISTS EmergencyContacts (
    contact_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL, -- 需在应用层或数据库层加密
    relationship VARCHAR(50),
    UNIQUE (user_id, phone_number)
);

-- 索引（建议）
CREATE INDEX IF NOT EXISTS idx_users_category ON Users (user_category);
CREATE INDEX IF NOT EXISTS idx_emergencycontacts_user ON EmergencyContacts (user_id);

-- 2. Mood Journal Tables (心情日记模块 - UC-004, UC-006)
----------------------------------------------------------------------
-- MoodEntries 表：存储每一次心情记录 (新增情绪强度和理由字段，与 AI 情绪分析结果一致)
CREATE TABLE IF NOT EXISTS MoodEntries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    mood_score INT NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10), -- 情绪滑块分数 (1-10)
    notes TEXT, -- 可选笔记内容，需在应用层或数据库层加密
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    sentiment_label VARCHAR(50), -- AI 情感分析结果 (label)
    sentiment_intensity FLOAT CHECK (sentiment_intensity >= 0.0 AND sentiment_intensity <= 1.0), -- AI 情感分析强度 (0-1)
    sentiment_rationale TEXT, -- AI 情感分析理由 (rationale)
    is_edited BOOLEAN DEFAULT FALSE
);

-- 创建索引以加速按用户和时间戳的查询（用于趋势分析）
CREATE INDEX IF NOT EXISTS idx_moodentries_user_time ON MoodEntries (user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_moodentries_user ON MoodEntries (user_id);

-- 3. AI & Crisis Tables (AI Chat 模块 - NEW!, UC-001)
----------------------------------------------------------------------
-- ConversationSessions 表：记录 Chat 会话的上下文
CREATE TABLE IF NOT EXISTS ConversationSessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE
);

-- AgentDecisions 表：存储 AI 对每一次用户消息的情绪分析和行动决策
CREATE TABLE IF NOT EXISTS AgentDecisions (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES ConversationSessions(session_id) ON DELETE CASCADE,

    -- 情绪分析结果
    emotion_label VARCHAR(50) NOT NULL,      -- e.g., "sadness", "stress", "anger"
    emotion_intensity FLOAT NOT NULL,        -- 0-1
    emotion_rationale TEXT,                  -- 情绪分析理由

    -- 决策结果
    next_action VARCHAR(50) NOT NULL CHECK (next_action IN ('normal_reply', 'support_suggestion', 'crisis_flow')),
    action_reason TEXT,                      -- 决策的理由
    action_metadata JSONB,                   -- 附加信息（例如建议列表）

    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ConversationMessages 表：存储消息历史记录
CREATE TABLE IF NOT EXISTS ConversationMessages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ConversationSessions(session_id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('User', 'AI')),
    content TEXT NOT NULL, -- 消息内容，需在应用层或数据库层加密
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 关联到本次消息（通常是用户消息）触发的 AI 决策
    decision_id UUID REFERENCES AgentDecisions(decision_id) ON DELETE SET NULL,

    -- 标记该消息是否直接触发了危机流程（方便快速检索）
    is_crisis_trigger BOOLEAN DEFAULT FALSE
);

-- CrisisEvents 表：记录每一次危机检测和响应过程
CREATE TABLE IF NOT EXISTS CrisisEvents (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES ConversationSessions(session_id) ON DELETE SET NULL,
    decision_id UUID NOT NULL REFERENCES AgentDecisions(decision_id) ON DELETE CASCADE,

    detection_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 记录触发时的情绪强度和理由
    emotion_intensity FLOAT NOT NULL,
    emotion_rationale TEXT,

    action_taken TEXT, -- 采取的干预措施 (例如：发送的危机响应文本)
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_time TIMESTAMP WITH TIME ZONE
);

-- 索引（建议）
CREATE INDEX IF NOT EXISTS idx_conversationsessions_user ON ConversationSessions (user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_agentdecisions_user_time ON AgentDecisions (user_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversationmessages_session_time ON ConversationMessages (session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crisisevents_user_time ON CrisisEvents (user_id, detection_time DESC);

-- 4. Trends & Goals Tables (趋势与建议 - UC-005)
----------------------------------------------------------------------
-- TherapeuticGoals 表：存储用户设定的治疗目标
CREATE TABLE IF NOT EXISTS TherapeuticGoals (
    goal_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_achieved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SuggestionLog 表：记录个性化建议的展示和用户交互
CREATE TABLE IF NOT EXISTS SuggestionLog (
    log_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES ConversationSessions(session_id) ON DELETE SET NULL,
    decision_id UUID REFERENCES AgentDecisions(decision_id) ON DELETE SET NULL,

    suggestion_type VARCHAR(100), -- 例如：'breathing', 'grounding_54321', 'journaling'
    is_completed BOOLEAN,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引（建议）
CREATE INDEX IF NOT EXISTS idx_therapeuticgoals_user ON TherapeuticGoals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestionlog_user_time ON SuggestionLog (user_id, logged_at DESC);