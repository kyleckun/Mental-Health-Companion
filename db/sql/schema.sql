-- Enable required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- Provides gen_random_uuid()

-- 1. User/Authentication Tables (User and Authentication)
----------------------------------------------------------------------
-- Users table: stores basic user information
CREATE TABLE IF NOT EXISTS Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Stores hashed password
    email VARCHAR(255) UNIQUE,
    user_category VARCHAR(50) NOT NULL CHECK (user_category IN ('Student', 'PregnantWoman', 'YoungProfessional', 'General')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- EmergencyContacts table: stores emergency contact information
CREATE TABLE IF NOT EXISTS EmergencyContacts (
    contact_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL, -- Should be encrypted at the application or database level
    relationship VARCHAR(50),
    UNIQUE (user_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_users_category ON Users (user_category);
CREATE INDEX IF NOT EXISTS idx_emergencycontacts_user ON EmergencyContacts (user_id);

-- 2. Mood Journal Tables (Mood Journal Module - UC-004, UC-006)
----------------------------------------------------------------------
-- MoodEntries table: stores each mood entry (includes emotion intensity and rationale aligned with AI emotion analysis results)
CREATE TABLE IF NOT EXISTS MoodEntries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    mood_score INT NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10), -- Emotion score (1-10)
    notes TEXT, -- Optional notes, should be encrypted at the app or DB level
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    sentiment_label VARCHAR(50), -- AI sentiment analysis result (label)
    sentiment_intensity FLOAT CHECK (sentiment_intensity >= 0.0 AND sentiment_intensity <= 1.0), -- AI sentiment intensity (0–1)
    sentiment_rationale TEXT, -- AI sentiment rationale
    is_edited BOOLEAN DEFAULT FALSE
);

-- Create indexes to accelerate queries by user and timestamp (used for trend analysis)
CREATE INDEX IF NOT EXISTS idx_moodentries_user_time ON MoodEntries (user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_moodentries_user ON MoodEntries (user_id);

-- 3. AI & Crisis Tables (AI Chat Module - NEW!, UC-001)
----------------------------------------------------------------------
-- ConversationSessions table: records chat session context
CREATE TABLE IF NOT EXISTS ConversationSessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE
);

-- AgentDecisions table: stores AI emotion analysis and action decisions for each user message
CREATE TABLE IF NOT EXISTS AgentDecisions (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES ConversationSessions(session_id) ON DELETE CASCADE,

    -- Emotion analysis result
    emotion_label VARCHAR(50) NOT NULL,      -- e.g., "sadness", "stress", "anger"
    emotion_intensity FLOAT NOT NULL,        -- 0–1
    emotion_rationale TEXT,                  -- Rationale for emotion analysis

    -- Decision result
    next_action VARCHAR(50) NOT NULL CHECK (next_action IN ('normal_reply', 'support_suggestion', 'crisis_flow')),
    action_reason TEXT,                      -- Reason for the decision
    action_metadata JSONB,                   -- Additional info (e.g., suggestion list)

    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ConversationMessages table: stores message history
CREATE TABLE IF NOT EXISTS ConversationMessages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ConversationSessions(session_id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('User', 'AI')),
    content TEXT NOT NULL, -- Message content, should be encrypted at app or DB level
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Link to the AI decision triggered by this message (usually for user messages)
    decision_id UUID REFERENCES AgentDecisions(decision_id) ON DELETE SET NULL,

    -- Indicates whether this message directly triggered a crisis flow (for quick lookup)
    is_crisis_trigger BOOLEAN DEFAULT FALSE
);

-- CrisisEvents table: records each crisis detection and response process
CREATE TABLE IF NOT EXISTS CrisisEvents (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES ConversationSessions(session_id) ON DELETE SET NULL,
    decision_id UUID NOT NULL REFERENCES AgentDecisions(decision_id) ON DELETE CASCADE,

    detection_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Emotion intensity and rationale at trigger time
    emotion_intensity FLOAT NOT NULL,
    emotion_rationale TEXT,

    action_taken TEXT, -- Intervention action taken (e.g., crisis response text sent)
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_time TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_conversationsessions_user ON ConversationSessions (user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_agentdecisions_user_time ON AgentDecisions (user_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversationmessages_session_time ON ConversationMessages (session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crisisevents_user_time ON CrisisEvents (user_id, detection_time DESC);

-- 4. Trends & Goals Tables (Trends and Suggestions - UC-005)
----------------------------------------------------------------------
-- TherapeuticGoals table: stores user-defined therapeutic goals
CREATE TABLE IF NOT EXISTS TherapeuticGoals (
    goal_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_achieved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SuggestionLog table: records personalized suggestions shown and user interactions
CREATE TABLE IF NOT EXISTS SuggestionLog (
    log_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES ConversationSessions(session_id) ON DELETE SET NULL,
    decision_id UUID REFERENCES AgentDecisions(decision_id) ON DELETE SET NULL,

    suggestion_type VARCHAR(100), -- e.g., 'breathing', 'grounding_54321', 'journaling'
    is_completed BOOLEAN,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_therapeuticgoals_user ON TherapeuticGoals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestionlog_user_time ON SuggestionLog (user_id, logged_at DESC);