# OSVoice vs Highlight AI: Gap Analysis & Feature Roadmap

## Executive Summary

OSVoice is a production-ready voice-to-text desktop app with 277 TypeScript files, 40+ Tauri commands, 48 database migrations, and support for 6 transcription providers + 9 LLM providers. Highlight AI is a context-aware AI assistant with screen awareness, meeting recording, daily summaries, task tracking, and integrations.

This document maps what we have, what we need, and how to combine them while keeping OSVoice's existing core + Apple-style glassy UI.

---

## 1. FEATURE MATRIX

| Feature Area | OSVoice (Current) | Highlight AI | Gap |
|---|---|---|---|
| **Voice-to-Text (On-Command)** | Full (hotkey-triggered dictation, 6 providers, GPU accel) | Voice commands + dictation | None - OSVoice is stronger here |
| **AI Post-Processing** | Full (9 LLM providers, 5 tones, custom tones, app-specific) | Basic text editing/rewriting | None - OSVoice is stronger |
| **Local Whisper Inference** | Full (5 models, Metal/Vulkan GPU) | Local audio transcription | None - comparable |
| **Dictionary/Glossary** | Full (glossary terms + replacement rules) | Not present | None - OSVoice unique |
| **Multi-Language** | Full (60+ languages, secondary language) | Not documented | None - OSVoice unique |
| **Overlay/Notch UI** | Full (macOS notch, cross-platform overlay) | Not comparable | None |
| **App-Specific Tones** | Full (per-app writing style) | Not present | None - OSVoice unique |
| **AI Chat Interface** | None | Full (text + voice chat, context-aware) | **FULL GAP** |
| **Meeting Recording** | None | Full (system audio capture, no bot) | **FULL GAP** |
| **Speaker Diarization** | None | Not present in Highlight either | **NEW FEATURE** |
| **Meeting Summaries** | None | Full (auto-summaries, action items) | **FULL GAP** |
| **Meeting Prep/Brief** | None | Full (attendee research, past context) | **FULL GAP** |
| **Daily Overview/Summary** | None | Full (daily briefs, weekly/monthly views) | **FULL GAP** |
| **Task Detection/Tracking** | None | Full (auto-detect tasks, triage, reminders) | **FULL GAP** |
| **Screen Awareness/OCR** | Partial (accessibility API, experimental) | Full (screen capture, OCR, context grounding) | **LARGE GAP** |
| **Browser Extension** | None | Full (Chrome extension, tab context) | **FULL GAP** |
| **Calendar Integration** | None | Full (Google Calendar, meeting prep) | **FULL GAP** |
| **Integrations (Slack, Notion, etc.)** | None | Full (Slack, Notion, Linear, GitHub) | **FULL GAP** |
| **Search Across Content** | Basic (transcription search) | Full (search highlights, meetings, tasks) | **LARGE GAP** |
| **Floating Quick-Access Bar** | System tray only | Full ("Ask Highlight..." pill overlay) | **FULL GAP** |
| **Daily Summary Notifications** | None | Full (native OS notifications) | **FULL GAP** |
| **Shareable Summaries** | None | Full (share links with selective access) | **FULL GAP** |
| **Custom AI Actions/Prompts** | Custom tones only | Full (custom actions, community library) | **PARTIAL GAP** |
| **Multi-Model Selection** | Full (9 LLM providers) | Full (GPT-4, Claude, Gemini) | None - OSVoice is stronger |
| **BYOK (Bring Your Own Key)** | Full (per-provider API keys) | Pro plan only | None - OSVoice has this |
| **Local-First/Privacy** | Full (SQLite, encrypted keys, incognito) | Full (local OCR, encrypted storage) | None - comparable |
| **Auto-Update** | Full (channel-based releases) | Yes | None |
| **Onboarding** | Full (9-step wizard) | Getting started flow | None - OSVoice is stronger |
| **Firebase/Cloud Sync** | Full (auth, Firestore, Storage) | Cloud sync for pro | None |
| **Payments/Subscriptions** | Full (Stripe integration) | Yes (tiered plans) | None |
| **MCP Integration** | None | Full (custom plugins via MCP) | **FULL GAP** |

---

## 2. WHAT WE KEEP (OSVoice Core Strengths)

These are features where OSVoice is already equal or superior to Highlight:

### Voice-to-Text Engine
- Hotkey-triggered dictation (fn key default)
- 6 transcription providers (Local Whisper, Groq, OpenAI, Azure, Gemini, Aldea)
- GPU acceleration (Metal on macOS, Vulkan on Windows/Linux)
- 5 Whisper model sizes (tiny → large)
- 60+ language support with secondary language switching
- Audio waveform visualization during recording

### AI Post-Processing Pipeline
- 9 LLM providers (Groq, OpenAI, Claude, Gemini, Azure, Deepseek, Ollama, OpenRouter, Cloud)
- 5 system tones (Light, Casual, Formal, Business, Punny) + custom tones
- App-specific writing styles (different tone per app)
- Smart formatting detection (email, list, paragraph)
- Text field context awareness for smart spacing

### Dictionary & Glossary System
- Glossary terms for transcription context
- Replacement rules for auto-correction
- Cloud sync when signed in

### Platform Integration
- macOS notch overlay (native Objective-C)
- Cross-platform overlay window (360x80px always-on-top)
- Global keyboard hooks (all platforms)
- System tray with quick actions
- Text injection via clipboard simulation

### Privacy & Storage
- Local-first SQLite database
- HMAC-SHA256 encrypted API keys
- Incognito mode
- Audio retention policy (last 20 only)
- No telemetry in local mode

### Infrastructure
- Tauri (Rust + TypeScript/React) desktop framework
- Turborepo monorepo with shared packages
- Firebase backend (Auth, Firestore, Storage, Functions)
- Stripe payment integration
- Auto-update system with channels
- 9-step onboarding wizard
- i18n with 60+ locales

---

## 3. WHAT WE BUILD (New Feature Gaps)

### Phase 1: AI Chat + Floating Bar (Foundation)

#### 3.1 AI Chat Interface
**Priority: CRITICAL | Effort: Large**

What to build:
- Full conversational AI chat panel (text input + response display)
- Voice input in chat (reuse existing audio recording pipeline)
- Context attachment (attach screen content, transcriptions, files)
- Markdown rendering for responses
- Conversation history persistence (new SQLite table)
- Multi-model selection via @mention in chat (reuse existing 9 LLM providers)
- Streaming responses for real-time feel

Leverage existing:
- Audio recording pipeline (cpal, whisper-rs) for voice input
- 9 LLM provider repos for chat responses
- Zustand state management patterns
- Material UI component system

New components needed:
- `ChatPanel` - Main chat interface
- `ChatMessage` - Message bubble (user/assistant)
- `ChatInput` - Text + voice + attachment input bar
- `ChatHistory` - Scrollable message list with virtualization
- `ContextAttachment` - Attach screen/file/transcription context

New Rust commands:
- None initially (LLM calls happen in TypeScript repos)

New database tables:
```sql
conversations (id, title, created_at, updated_at)
messages (id, conversation_id, role, content, context_json, model, created_at)
```

#### 3.2 Floating Quick-Access Bar ("Ask OSVoice...")
**Priority: CRITICAL | Effort: Medium**

What to build:
- Always-visible floating pill/bar at bottom of screen (like Highlight's)
- Click to expand into full chat
- Voice activation via push-to-talk
- Quick actions menu (three-dot menu)
- Customizable position (drag to reposition)
- Auto-hide on focus loss, reappear on hotkey

Leverage existing:
- Overlay window system (already has transparent always-on-top window)
- Hotkey system (global keyboard hooks)
- System tray (can coexist)

New components needed:
- `FloatingBar` - The pill overlay component
- `QuickActionsMenu` - Dropdown from three-dot button

Implementation approach:
- Create new Tauri window (similar to overlay window pattern)
- Frameless, transparent, always-on-top, click-through when inactive
- Communicate with main window via Tauri events

---

### Phase 2: Meeting Recording + Speaker Diarization

#### 3.3 Meeting Recording (System Audio Capture)
**Priority: HIGH | Effort: Large**

What to build:
- Capture system/desktop audio (not just microphone)
- Long-running recording mode (meetings can be hours)
- Real-time transcription during meeting
- Detect meeting start/end from app activity (Zoom, Teams, Meet)
- No bot joining calls - capture locally from system audio
- Meeting metadata (title, participants, duration, app source)

Leverage existing:
- cpal audio library (needs system audio input, not just mic)
- Whisper transcription pipeline
- SQLite storage for transcriptions
- Audio file management (WAV storage, retention policy)

New Rust modules needed:
- `platform/system_audio.rs` - System audio capture (platform-specific)
  - macOS: CoreAudio aggregate device or ScreenCaptureKit
  - Windows: WASAPI loopback capture
  - Linux: PulseAudio monitor source
- `platform/meeting_detector.rs` - Detect when meeting apps are active

New database tables:
```sql
meetings (id, title, app_source, started_at, ended_at, duration_seconds, status)
meeting_participants (id, meeting_id, name, email, speaker_id)
meeting_segments (id, meeting_id, speaker_id, text, start_time, end_time)
```

#### 3.4 Speaker Diarization (Who Said What)
**Priority: HIGH | Effort: Very Large**

What to build:
- Identify different speakers in meeting audio
- Assign names to speaker voices (manual initially, learn over time)
- Per-speaker transcript segments with timestamps
- Speaker timeline visualization
- Voice fingerprinting for recurring speakers

Technical approach options:
1. **Local diarization** - Use pyannote.audio or similar (Python sidecar or Rust binding)
2. **API-based** - Use AssemblyAI, Deepgram, or Rev.ai diarization APIs
3. **Hybrid** - Local VAD (voice activity detection) + cloud diarization

Recommendation: Start with API-based (AssemblyAI or Deepgram) for accuracy, add local option later.

New repos needed:
- `DiarizeAudioRepo` with implementations:
  - `AssemblyAIDiarizeRepo` - AssemblyAI API
  - `DeepgramDiarizeRepo` - Deepgram API
  - `LocalDiarizeRepo` - Future local implementation

#### 3.5 Meeting Summaries & Action Items
**Priority: HIGH | Effort: Medium**

What to build:
- Auto-generate meeting summary when recording stops
- Extract action items with assignees
- Key decisions and topics discussed
- Shareable meeting summary links
- Ask questions about past meetings

Leverage existing:
- 9 LLM providers for summarization
- Tone/prompt template system for summary style
- Firebase functions for sharing

New components needed:
- `MeetingPage` - Meeting list view
- `MeetingSummary` - Summary display with sections
- `MeetingTimeline` - Speaker timeline with playback
- `ActionItemList` - Extracted action items

---

### Phase 3: Screen Awareness & Context

#### 3.6 Screen Content Capture & OCR
**Priority: MEDIUM | Effort: Large**

What to build:
- Periodic screen capture from whitelisted apps
- On-device OCR text extraction
- Embedding generation for semantic search
- Privacy controls (whitelist/blacklist apps)
- Screenshot storage with auto-cleanup

Leverage existing:
- `get_screen_context_info` Tauri command (already partially implemented!)
- App detection system (`current_app_info_get`)
- SQLite storage

New Rust modules:
- `platform/screen_capture.rs` - Screenshot capture
  - macOS: ScreenCaptureKit API
  - Windows: Desktop Duplication API
  - Linux: X11/Wayland screenshot
- `platform/ocr.rs` - Local OCR
  - Use Tesseract (via leptess crate) or Apple's Vision framework on macOS

New database tables:
```sql
screen_captures (id, app_name, ocr_text, embedding_blob, captured_at, is_processed)
```

#### 3.7 Browser Extension
**Priority: MEDIUM | Effort: Medium**

What to build:
- Chrome extension that sends current page content to OSVoice
- Tab title, URL, and page text extraction
- Communication with desktop app via native messaging or localhost HTTP
- Privacy: user controls what pages are captured

New codebase:
- `apps/browser-extension/` - New workspace in monorepo
  - Manifest V3 Chrome extension
  - Content script for page text extraction
  - Background service worker for communication
  - Popup UI for settings

---

### Phase 4: Productivity & Intelligence

#### 3.8 Daily Overview & Summaries
**Priority: MEDIUM | Effort: Medium**

What to build:
- Dashboard showing daily activity summary
- Aggregate from: transcriptions, meetings, screen captures, tasks
- Generate AI-powered daily recap
- Weekly/monthly trend views
- Daily summary notification (native OS notification)

Leverage existing:
- Home page with recent transcriptions (extend this)
- Stats page with word/WPM tracking
- LLM providers for summary generation
- Tauri notification plugin

New components needed:
- `DailyOverview` - Main dashboard widget
- `DailySummaryNotification` - Notification trigger
- `ActivityTimeline` - Visual timeline of day's activity
- `RecapGenerator` - AI recap using LLM

#### 3.9 Task Detection & Tracking
**Priority: MEDIUM | Effort: Medium**

What to build:
- Auto-detect tasks from transcriptions and meeting notes
- Task list with status (pending, in-progress, done)
- Reminders and due dates
- Export to external tools (Notion, Linear)
- One-click triage from notifications

New database tables:
```sql
tasks (id, title, description, status, source_type, source_id, due_at, created_at)
task_reminders (id, task_id, remind_at, is_sent)
```

New components:
- `TasksPage` - Task list with filters
- `TaskCard` - Individual task display
- `TaskDetector` - Background service analyzing transcripts for tasks

#### 3.10 Calendar Integration
**Priority: LOW-MEDIUM | Effort: Medium**

What to build:
- Google Calendar OAuth connection
- Show upcoming meetings in dashboard
- Auto-detect meeting start from calendar events
- Meeting prep (pull attendee info)
- Sync detected tasks to calendar

New repos:
- `CalendarRepo` with Google Calendar API implementation
- OAuth flow (can use existing Firebase Auth patterns)

#### 3.11 External Integrations
**Priority: LOW | Effort: Large (cumulative)**

What to build (incremental):
- **Slack**: Import channel activity, post summaries
- **Notion**: Sync notes, export meeting summaries
- **Linear**: Create issues from action items
- **GitHub**: PR context awareness

Each integration follows the repo pattern:
- `SlackIntegrationRepo`, `NotionIntegrationRepo`, etc.
- OAuth flows for each service
- Settings UI for connection management

#### 3.12 MCP (Model Context Protocol) Support
**Priority: LOW | Effort: Medium**

What to build:
- MCP server implementation for OSVoice
- Allow external tools to query OSVoice data
- Custom plugin creation framework
- Community plugin marketplace (future)

---

### Phase 5: Search & Polish

#### 3.13 Universal Search
**Priority: MEDIUM | Effort: Medium**

What to build:
- Search across all content types (transcriptions, meetings, tasks, screen captures)
- Full-text search in SQLite (FTS5)
- Semantic search via embeddings (optional)
- Search results with previews and navigation
- Keyboard shortcut to invoke (Cmd+K style)

Leverage existing:
- Transcription search (already exists, extend it)
- SQLite database (add FTS5 virtual tables)

#### 3.14 Shareable Content
**Priority: LOW | Effort: Medium**

What to build:
- Generate shareable links for meeting summaries
- Selective sharing (choose what to include)
- Recipient access control
- Link revocation

Leverage existing:
- Firebase Functions for link generation
- Firebase Storage for shared content

---

## 4. UI/UX EVOLUTION

### Current Style (Keep & Enhance)
- Material UI 7 with custom theme
- Dark mode: `#121212` → `#1C1C1C` → `#2D2D2D` → `#3E3E3E`
- Light mode: `#FFFFFF` → `#F5F5F5` → `#E0E0E0`
- Blue accent: `#3198ff` (dark) / `#1b8af8` (light)
- 12px border radius globally
- No shadows (flat design)
- Roboto typography

### New Apple-Style Glassy Enhancements
- **Glassmorphism**: Add `backdrop-filter: blur()` to panels
- **Translucency**: Semi-transparent backgrounds (`rgba(28, 28, 28, 0.85)`)
- **Color palette**: White, gray, glass, black (as specified)
- **Vibrancy**: Use Tauri's window vibrancy APIs for native translucency
  - macOS: `.vibrancy("under-window-background")`
  - Windows: Mica/Acrylic material
- **Frosted glass cards**: For meeting summaries, task cards, chat bubbles
- **Subtle borders**: 1px borders with low-opacity white (`rgba(255,255,255,0.1)`)
- **Depth with blur**: Multiple blur layers for depth hierarchy

### New Navigation Structure

```
Floating Bar ("Ask OSVoice...") ← Always visible
    ↓ (click/hotkey)
Main Window
├── Sidebar (existing + new items)
│   ├── Home (enhanced with Daily Overview)
│   ├── Chat (NEW - AI conversations)
│   ├── Meetings (NEW - recordings + summaries)
│   ├── Tasks (NEW - detected tasks)
│   ├── Transcriptions (existing)
│   ├── Dictionary (existing)
│   ├── Writing Styles (existing)
│   ├── Stats (existing, enhanced)
│   ├── Apps (existing)
│   ├── Integrations (NEW)
│   └── Settings (existing, extended)
```

---

## 5. IMPLEMENTATION PRIORITY & PHASES

### Phase 1 (Weeks 1-4): AI Chat Foundation
1. AI Chat Interface with text input
2. Floating Quick-Access Bar
3. Voice input in chat (reuse audio pipeline)
4. Conversation persistence (SQLite)
5. Glassy UI theme update

### Phase 2 (Weeks 5-10): Meeting Intelligence
6. System audio capture (platform-specific)
7. Long-running meeting recording mode
8. Meeting transcription with timestamps
9. Speaker diarization (API-based first)
10. Meeting summaries & action items
11. Meeting list/detail UI

### Phase 3 (Weeks 11-14): Screen & Context
12. Screen capture with OCR
13. Context grounding for chat responses
14. Browser extension (Chrome)
15. Universal search (FTS5)

### Phase 4 (Weeks 15-18): Productivity
16. Daily overview & summaries
17. Task detection from transcripts/meetings
18. Calendar integration (Google)
19. Daily summary notifications

### Phase 5 (Weeks 19-24): Integrations & Polish
20. Slack integration
21. Notion integration
22. Linear integration
23. Shareable content links
24. MCP support
25. Community action library

---

## 6. TECHNICAL ARCHITECTURE CHANGES

### New Database Tables (8 new tables)

```sql
-- Phase 1: Chat
conversations (id TEXT PK, title TEXT, model TEXT, created_at TEXT, updated_at TEXT)
messages (id TEXT PK, conversation_id TEXT FK, role TEXT, content TEXT,
          context_json TEXT, model TEXT, tokens_used INTEGER, created_at TEXT)

-- Phase 2: Meetings
meetings (id TEXT PK, title TEXT, app_source TEXT, started_at TEXT,
          ended_at TEXT, duration_seconds INTEGER, summary TEXT,
          status TEXT DEFAULT 'recording', audio_path TEXT)
meeting_segments (id TEXT PK, meeting_id TEXT FK, speaker_id TEXT,
                  speaker_name TEXT, text TEXT, start_ms INTEGER, end_ms INTEGER)

-- Phase 3: Screen
screen_captures (id TEXT PK, app_name TEXT, window_title TEXT,
                 ocr_text TEXT, captured_at TEXT)

-- Phase 4: Tasks
tasks (id TEXT PK, title TEXT, description TEXT, status TEXT DEFAULT 'pending',
       source_type TEXT, source_id TEXT, assignee TEXT,
       due_at TEXT, completed_at TEXT, created_at TEXT)
task_reminders (id TEXT PK, task_id TEXT FK, remind_at TEXT, is_sent INTEGER DEFAULT 0)

-- Phase 4: Calendar
calendar_events (id TEXT PK, external_id TEXT, title TEXT, start_at TEXT,
                 end_at TEXT, attendees_json TEXT, meeting_id TEXT FK)
```

### New Rust Modules

```
src-tauri/src/
├── platform/
│   ├── system_audio.rs      (Phase 2 - system audio capture)
│   ├── screen_capture.rs    (Phase 3 - screenshot capture)
│   ├── ocr.rs               (Phase 3 - local OCR)
│   └── meeting_detector.rs  (Phase 2 - detect meeting apps)
├── db/
│   ├── conversation_queries.rs  (Phase 1)
│   ├── message_queries.rs       (Phase 1)
│   ├── meeting_queries.rs       (Phase 2)
│   ├── task_queries.rs          (Phase 4)
│   └── screen_capture_queries.rs (Phase 3)
```

### New TypeScript Modules

```
src/
├── actions/
│   ├── chat.actions.ts           (Phase 1)
│   ├── meeting.actions.ts        (Phase 2)
│   ├── task.actions.ts           (Phase 4)
│   ├── screen-context.actions.ts (Phase 3)
│   └── calendar.actions.ts       (Phase 4)
├── repos/
│   ├── chat.repo.ts              (Phase 1)
│   ├── meeting.repo.ts           (Phase 2)
│   ├── diarize.repo.ts           (Phase 2)
│   ├── screen-capture.repo.ts    (Phase 3)
│   ├── task.repo.ts              (Phase 4)
│   └── calendar.repo.ts          (Phase 4)
├── components/
│   ├── chat/                     (Phase 1)
│   ├── floating-bar/             (Phase 1)
│   ├── meetings/                 (Phase 2)
│   ├── tasks/                    (Phase 4)
│   └── daily-overview/           (Phase 4)
├── state/
│   ├── chat.state.ts             (Phase 1)
│   ├── meeting.state.ts          (Phase 2)
│   └── task.state.ts             (Phase 4)
```

### New Tauri Windows

```
// tauri.conf.json additions
{
  "windows": [
    // Existing: main, overlay
    {
      "label": "floating-bar",
      "width": 320,
      "height": 48,
      "decorations": false,
      "transparent": true,
      "alwaysOnTop": true,
      "skipTaskbar": true
    }
  ]
}
```

---

## 7. KEY DIFFERENTIATORS vs HIGHLIGHT

Where OSVoice will be **better** than Highlight:

1. **Voice-to-text is a first-class feature** (not an afterthought)
   - On-command dictation with hotkey
   - 6 transcription providers
   - GPU-accelerated local inference
   - 60+ languages

2. **9 LLM providers** vs Highlight's 3 (GPT-4, Claude, Gemini)
   - Ollama for fully local AI
   - OpenRouter for 200+ models
   - BYOK on free tier

3. **App-specific writing styles** (unique feature)
   - Different tone per application
   - Custom tone templates

4. **Dictionary/Glossary system** (unique feature)
   - Improve transcription accuracy with custom terms
   - Auto-replacement rules

5. **Speaker diarization** (Highlight doesn't have this)
   - Know who said what in meetings
   - Per-speaker transcripts

6. **Truly local-first** with Ollama
   - 100% offline operation possible
   - No data ever leaves the machine

7. **Cross-platform** (macOS, Windows, Linux)
   - Highlight is macOS + Windows only

---

## 8. RISK ASSESSMENT

| Risk | Impact | Mitigation |
|---|---|---|
| System audio capture is platform-specific and complex | High | Start with macOS (ScreenCaptureKit), add others incrementally |
| Speaker diarization accuracy | Medium | Use proven APIs (AssemblyAI/Deepgram) first, local later |
| Screen capture privacy concerns | High | Strict whitelist-only, local processing, clear UI indicators |
| Feature bloat / UI complexity | High | Progressive disclosure, keep core voice-to-text prominent |
| Performance with always-on capture | Medium | Background process isolation, configurable capture frequency |
| Meeting recording legal issues | Medium | Clear user consent UI, recording indicators, participant awareness |
