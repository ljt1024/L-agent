CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS agent_runs (id UUID PRIMARY KEY, trace_id TEXT NOT NULL, input TEXT NOT NULL, status TEXT NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS agent_runs_created_at_idx ON agent_runs(created_at DESC);
CREATE TABLE IF NOT EXISTS audit_events (id BIGSERIAL PRIMARY KEY, trace_id TEXT NOT NULL, event_type TEXT NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS audit_events_trace_id_idx ON audit_events(trace_id);
CREATE TABLE IF NOT EXISTS memories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), scope TEXT NOT NULL, content TEXT NOT NULL, metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
