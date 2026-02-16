# OSVoice Platform Roadmap

> Last updated: 2026-02-17
> Branch: `dev` (all phases merged to `main`)
> Reference: `docs/gap-analysis-highlight-ai.md`

---

## Platform Overview

OSVoice is a local-first, cross-platform voice-to-text desktop app built with Tauri (Rust + TypeScript/React). It currently ships with **76+ Tauri commands**, **52 database migrations**, **7 transcription providers**, **9 LLM providers**, **4 overlay windows**, **1 diarization provider**, and full cross-platform support (macOS, Windows, Linux).

The roadmap evolves OSVoice from a dictation tool into a **full AI productivity assistant** — competing with Highlight AI while keeping OSVoice's core strengths: local-first privacy, multi-provider flexibility, and app-specific intelligence.

---

## What We Have Today (Production Core)

### Voice-to-Text Engine
| Feature | Status | Details |
|---------|--------|---------|
| Hotkey-triggered dictation | Done | fn key default, customizable |
| Local Whisper inference | Done | 4 model sizes (tiny → medium), GPU acceleration |
| Groq transcription | Done | whisper-large-v3-turbo |
| OpenAI transcription | Done | whisper-1 |
| Azure transcription | Done | Azure Speech, streaming support |
| Gemini transcription | Done | gemini-2.5-flash/pro, gemini-3-flash |
| Aldea transcription | Done | Provider-managed |
| Cloud transcription | Done | Firebase → Groq pipeline |
| 60+ language support | Done | Primary + secondary language switching |
| Audio waveform overlay | Done | Pill overlay with recording state |
| Audio retention | Done | Last 20 transcriptions, auto-purge |

### AI Post-Processing Pipeline
| Feature | Status | Details |
|---------|--------|---------|
| Groq LLM | Done | llama-4-scout, gpt-oss-20b/120b |
| OpenAI LLM | Done | gpt-4o, gpt-4o-mini |
| Claude LLM | Done | 27 models (opus-4-6 → haiku) |
| Gemini LLM | Done | gemini-2.5/3-flash/pro |
| DeepSeek LLM | Done | deepseek-chat, deepseek-reasoner |
| Azure OpenAI LLM | Done | gpt-5-mini/nano, gpt-4o |
| OpenRouter LLM | Done | 100+ models, provider routing |
| Ollama (local) | Done | User-configurable, fully offline |
| Cloud LLM | Done | Firebase function proxy |
| LLM provider shared utils | Done | `openai-compat.utils.ts`: deduplicated ~520 lines across 5 OpenAI-compatible providers (contentToString, buildTextMessages, buildChatMessages, accumulateStream) |
| Tone-based prompts | Done | Custom prompt templates with {transcript} |
| App-specific tones | Done | Different tone per app target |
| Smart formatting | Done | Email, list, paragraph detection |

### Dictionary & Glossary
| Feature | Status | Details |
|---------|--------|---------|
| Glossary terms | Done | Included in transcription prompts |
| Replacement rules | Done | Auto-correction (e.g. "GPT" → "ChatGPT") |
| Cloud sync | Done | Syncs when signed in |

### Platform & Infrastructure
| Feature | Status | Details |
|---------|--------|---------|
| macOS notch overlay | Done | Native Objective-C interop |
| Cross-platform overlay | Done | 4 overlay windows (pill, toast, agent, quick bar) |
| Global keyboard hooks | Done | All platforms via rdev |
| System tray | Done | Quick actions, recording state |
| Text injection | Done | Clipboard simulation, custom paste keybinds |
| GPU acceleration | Done | Vulkan/Metal/DX12 via wgpu |
| Multi-monitor | Done | Cursor-following overlays |
| Auto-update | Done | Channel-based (dev/prod) |
| Firebase backend | Done | Auth, Firestore, Storage, Functions |
| Stripe payments | Done | Subscription management |
| 9-step onboarding | Done | Setup wizard |
| API key encryption | Done | HMAC-SHA256 |
| Incognito mode | Done | Database flag |
| i18n | Done | 60+ locales |

---

## Phase 1: AI Chat + Quick Bar (COMPLETE)

**Branch:** `feature/phase-1-ai-chat` (merged to main)
**Goal:** Transform OSVoice from dictation-only into a conversational AI assistant.

### Completed

| Feature | Commits | Notes |
|---------|---------|-------|
| Conversations DB table | `5da6627` | conversations + messages, FK cascade, composite index (migration 049) |
| Rust domain + queries + 6 commands | `5da6627` | Full CRUD registered in `app.rs` |
| Shared types | `5da6627` | `@repo/types/conversation.types.ts` |
| TypeScript repo + actions + state | `5da6627` | Optimistic updates, normalized entity maps |
| ChatPage (two-panel layout) | `b05d094` | Conversation sidebar + message list |
| ChatMessageList (virtualized) | `b05d094` | react-virtuoso, auto-scroll, typing indicator |
| ChatMessageBubble (markdown) | `b05d094` | react-markdown + rehype-sanitize, React.memo |
| ChatInput (text + voice) | `b05d094` | Recording states, voice input in chat |
| ChatConversationList | `b05d094` | Sidebar with React.memo on items |
| ChatEmptyState | `b05d094` | Placeholder UI |
| Quick bar overlay | `dbbf90f` | Glassy bar, voice input, menu, event bridge (320x250) |
| Glassy UI theme | `dbbf90f` | Glass palette vars, backdrop-filter blur |
| Dashboard routing + nav | `dbbf90f` | /dashboard/chat route, AI sparkle icon |
| Code review fixes | `89972e3` | State cleanup, rollback, input validation, accessibility |
| Streaming LLM responses | `c25d7db` | RAF batching, stop support, incremental rendering |
| Streaming for Claude + Gemini | `7220626` | Provider-specific streaming implementations |
| Context attachment | `7220626` | Attach transcriptions/files to chat messages |
| Provider deduplication | `8e00d75` | `openai-compat.utils.ts` (~520 lines deduplicated across 5 providers) |
| useVoiceRecording hook | `ca750f1` | Extracted from ChatInput to shared hook |

### Remaining (Nice-to-Have)

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| **@mention model selection** | Medium | Medium | Type `@claude` or `@gpt-4o` in chat to override the default model per-message. |
| **Global hotkey for quick bar** | Medium | Small | Register Cmd+Shift+Space (or similar) to toggle quick bar visibility. |
| **Draggable quick bar** | Low | Small | Save position to preferences, restore on startup. |
| **Conversation search** | Low | Small | Filter/search conversation list by title. |

### Phase 1 Completion Criteria
- [x] Chat works end-to-end (send message -> get AI response)
- [x] Voice input works in chat
- [x] Quick bar sends queries to chat
- [x] Conversations persist across restarts
- [x] Streaming responses show tokens in real-time
- [x] Can attach context (at least transcriptions) to chat

---

## Phase 2: Meeting Intelligence (COMPLETE — Core)

**Branch:** `feature/phase-2-meetings` → merged to `dev` → merged to `main` (PR #4)
**Goal:** Capture, transcribe, and summarize meetings with speaker identification.

### Completed (Infrastructure — 33 files, commit `3f02c4e`)

| Feature | Layer | Notes |
|---------|-------|-------|
| Database schema (migration 051) | Rust | `meetings` + `meeting_segments` tables, FK cascade, indexes |
| Rust domain + queries + 11 commands | Rust | Full CRUD, batch insert, audio writer, speaker rename |
| Streaming WAV writer | Rust | `MeetingWavWriter` with append_samples + finalize |
| Meeting audio store | Rust | Path management, sanitized IDs, path traversal protection |
| Shared types | `@repo/types` | `Meeting`, `MeetingSegment`, `MeetingStatus` |
| Meeting repo | TypeScript | `LocalMeetingRepo` with all invoke() calls |
| AssemblyAI diarization | TypeScript | `AssemblyAIDiarizeRepo` for API-based speaker ID |
| Meeting actions | TypeScript | Start/stop recording, process, summarize, CRUD, speaker rename |
| Meeting prompt utils | TypeScript | Summary prompt builder + JSON response parser |
| Full meeting UI (9 components) | React | MeetingsPage, DetailPage, List, Timeline, Summary, ActionItems, EmptyState, RecordingBar, SpeakerRenameDialog |
| Dashboard routing + nav | React | /dashboard/meetings route |

### Code Review Fixes (commit `80d399c`, on branch)

| Fix | Category |
|-----|----------|
| Memory leak in error path | Bug — `cleanupRecordingResources()` + `stop_recording` in catch |
| Flush race condition | Bug — `isFlushing` mutex flag with `finally` reset |
| DoS: audio chunk cap | Security — 960K samples max (~20s @ 48kHz) |
| DoS: segment batch cap | Security — 500 segments max per batch |
| Segment rollback on delete | Bug — Snapshot + restore segments on failure |
| Transaction on batch insert | Data integrity — `pool.begin()` / `tx.commit()` |
| Stale titleDraft | UI — `useEffect` syncs on `meeting.id` change |

### Remaining: Quality & Security

| Item | Priority | Effort |
|------|----------|--------|
| State subscription perf in `MeetingTranscriptTimeline` | Should Fix | Small |
| Array recreation perf in `MeetingsPage` | Should Fix | Small |
| Error boundaries around meeting routes | Should Fix | Small |
| i18n completion (hardcoded strings) | Should Fix | Small |
| String length validation on meeting fields | Medium Security | Small |
| Time range validation on segments | Medium Security | Small |
| Total audio duration cap (~4 hours) | Medium Security | Small |

### Remaining: Feature Gaps

| Item | Priority | Effort |
|------|----------|--------|
| **System audio capture (macOS)** | High | Large |
| **Meeting app detection** | Medium | Medium |
| Local diarization | Low | Very Large |
| Voice fingerprinting | Low | Large |
| Meeting Q&A | Low | Medium |
| Shareable summaries | Low | Medium |

### Phase 2 Completion Criteria
- [x] Meeting list + detail UI
- [x] Mic-based meeting recording with chunked audio
- [x] Meeting transcription with timestamps
- [x] Speaker diarization (API-based via AssemblyAI)
- [x] Auto-generated meeting summary via LLM
- [x] Action items extracted
- [ ] System audio capture on macOS
- [ ] Meeting app detection

---

## Phase 3: Screen Awareness & Search

**Goal:** Make OSVoice context-aware of what's on screen, enabling grounded AI responses.

### 3.1 Screen Content Capture
| Item | Description | Effort |
|------|-------------|--------|
| Periodic screenshots | Configurable interval (e.g. every 30s) | Medium |
| App whitelisting | User controls which apps are captured | Small |
| macOS capture | ScreenCaptureKit API | Medium |
| Windows capture | Desktop Duplication API | Medium |
| Linux capture | X11/Wayland screenshot | Medium |

**Existing:** `get_screen_context` command already partially implemented.

### 3.2 On-Device OCR
| Item | Description | Effort |
|------|-------------|--------|
| macOS OCR | Apple Vision framework (best quality) | Medium |
| Cross-platform OCR | Tesseract via leptess crate | Medium |
| Text extraction pipeline | Screenshot → OCR → store | Small |
| Embedding generation | For semantic search (optional) | Large |

**New Rust module:** `platform/ocr.rs`

### 3.3 Context Grounding
| Item | Description | Effort |
|------|-------------|--------|
| Screen context in chat | Include recent OCR text in LLM prompts | Medium |
| "What's on my screen?" | Quick bar query that reads current screen | Medium |
| Smart context selection | Only include relevant screen content | Medium |

### 3.4 Browser Extension
| Item | Description | Effort |
|------|-------------|--------|
| Chrome extension | Manifest V3, content script | Large |
| Page text extraction | Send page content to desktop app | Medium |
| Native messaging | Communication with Tauri app | Medium |
| Privacy controls | User controls what pages are captured | Small |

**New workspace:** `apps/browser-extension/`

### 3.5 Universal Search
| Item | Description | Effort |
|------|-------------|--------|
| FTS5 virtual tables | Full-text search in SQLite | Medium |
| Cross-content search | Search transcriptions, meetings, captures, chat | Medium |
| Cmd+K search UI | Global keyboard shortcut, overlay search | Medium |
| Result previews | Show context snippets in results | Small |

**New database:**
```sql
screen_captures (id, app_name, window_title, ocr_text, captured_at)
-- FTS5 virtual tables for full-text search across all content types
```

### Phase 3 Completion Criteria
- [ ] Screen capture with OCR (macOS first)
- [ ] Screen context available in chat
- [ ] Browser extension sends page content
- [ ] Universal search across all content types
- [ ] Privacy controls for capture whitelist

---

## Phase 4: Productivity & Intelligence

**Goal:** Proactive AI that detects tasks, summarizes your day, and connects to your calendar.

### 4.1 Daily Overview
| Item | Description | Effort |
|------|-------------|--------|
| Daily summary dashboard | Aggregate from transcriptions, meetings, captures | Medium |
| AI-powered recap | LLM generates daily brief | Medium |
| Weekly/monthly views | Trend analysis over time | Medium |
| Native notifications | Daily summary push notification | Small |

### 4.2 Task Detection
| Item | Description | Effort |
|------|-------------|--------|
| Auto-detect from transcripts | LLM extracts tasks from dictation | Medium |
| Auto-detect from meetings | Extract action items with assignees | Medium |
| Task list UI | Status, priority, due dates | Medium |
| Reminders | Notification-based reminders | Small |
| One-click triage | Accept/dismiss detected tasks | Small |

### 4.3 Calendar Integration
| Item | Description | Effort |
|------|-------------|--------|
| Google Calendar OAuth | Connect calendar account | Medium |
| Upcoming meetings widget | Show next meetings in dashboard | Small |
| Meeting prep | Pull attendee info, past context | Medium |
| Auto-detect meeting start | Calendar event → prompt to record | Medium |
| Task → calendar sync | Detected tasks with due dates → calendar | Small |

### New Database Tables
```sql
tasks (id, title, description, status, source_type, source_id,
       assignee, due_at, completed_at, created_at)
task_reminders (id, task_id, remind_at, is_sent)
calendar_events (id, external_id, title, start_at, end_at,
                 attendees_json, meeting_id)
```

### Phase 4 Completion Criteria
- [ ] Daily overview dashboard with AI recap
- [ ] Task detection from transcriptions and meetings
- [ ] Task list with status management
- [ ] Google Calendar connected
- [ ] Meeting prep from calendar events

---

## Phase 5: Integrations & Ecosystem

**Goal:** Connect OSVoice to the tools people already use.

### 5.1 External Integrations
| Integration | What it does | Effort |
|-------------|-------------|--------|
| **Slack** | Import channel activity, post summaries | Large |
| **Notion** | Sync notes, export meeting summaries | Large |
| **Linear** | Create issues from action items | Medium |
| **GitHub** | PR context awareness, issue creation | Medium |
| **Jira** | Create tickets from tasks | Medium |

Each follows the repo pattern: `SlackIntegrationRepo`, `NotionIntegrationRepo`, etc.

### 5.2 MCP (Model Context Protocol)
| Item | Description | Effort |
|------|-------------|--------|
| MCP server | Expose OSVoice data to external tools | Large |
| Custom tool framework | Users create plugins | Large |
| Community library | Share custom actions/tools | Medium |

### 5.3 Shareable Content
| Item | Description | Effort |
|------|-------------|--------|
| Share links | Generate public links for meeting summaries | Medium |
| Selective sharing | Choose what sections to include | Small |
| Access control | Viewer permissions, link revocation | Medium |

### 5.4 Custom AI Actions
| Item | Description | Effort |
|------|-------------|--------|
| Action library | Reusable prompt templates beyond tones | Medium |
| Community actions | Share/import actions from others | Medium |
| Action chaining | Compose multiple actions in sequence | Large |

### Phase 5 Completion Criteria
- [ ] At least 2 external integrations (Slack + Notion)
- [ ] MCP server exposing core data
- [ ] Shareable meeting summary links
- [ ] Custom action creation UI

---

## Future Ideas & Advancements

### Voice & Audio
| Idea | Description | Impact |
|------|-------------|--------|
| **Real-time translation** | Speak in one language, output in another | High |
| **Voice cloning** | Generate audio responses in user's voice style | Medium |
| **Ambient listening mode** | Always-on background transcription (privacy-gated) | High |
| **Audio bookmarks** | Mark moments during recording for quick reference | Medium |
| **Multi-microphone** | Support for multi-mic setups (podcast, interview) | Medium |
| **Noise cancellation** | Local audio preprocessing before transcription | Medium |

### AI & Intelligence
| Idea | Description | Impact |
|------|-------------|--------|
| **AI agents** | Autonomous agents that take actions (email, calendar, code) | Very High |
| **Memory system** | Long-term user context (preferences, projects, relationships) | High |
| **Multi-modal chat** | Send images, PDFs, URLs to chat | High |
| **Code generation** | Generate code from voice descriptions | Medium |
| **Email drafting** | Compose emails from voice, context-aware | High |
| **Smart suggestions** | Proactive suggestions based on context | High |
| **Learning from corrections** | Improve transcription from user edits | Medium |

### Platform & UX
| Idea | Description | Impact |
|------|-------------|--------|
| **Mobile companion** | iOS/Android app for voice input on-the-go | Very High |
| **Web dashboard** | View transcriptions/meetings from browser | High |
| **Watch app** | Apple Watch / WearOS for quick voice capture | Medium |
| **Widgets** | macOS widgets, Windows widgets for quick access | Medium |
| **Spotlight/Alfred integration** | System search integration | Medium |
| **Multi-user/team** | Shared workspaces, team transcriptions | High |
| **Offline-first sync** | CRDTs for conflict-free sync between devices | Large |

### Enterprise
| Idea | Description | Impact |
|------|-------------|--------|
| **SSO/SAML** | Enterprise single sign-on | High |
| **Admin console** | Manage team settings, usage, billing | High |
| **Compliance** | HIPAA, SOC2, GDPR compliance modes | High |
| **On-premise deployment** | Self-hosted for regulated industries | Very High |
| **Audit logging** | Full audit trail of all AI interactions | Medium |
| **Data residency** | Choose where data is processed/stored | Medium |

### Competitive Moats
| Advantage | Description |
|-----------|-------------|
| **9 LLM providers** | More than any competitor (Highlight has 3) |
| **7 transcription providers** | Local + API + cloud flexibility |
| **Fully local mode** | Ollama + local Whisper = 100% offline |
| **App-specific intelligence** | Different tone/behavior per app (unique) |
| **Dictionary system** | Improves transcription accuracy (unique) |
| **Speaker diarization** | Highlight doesn't have this |
| **Cross-platform** | macOS + Windows + Linux (Highlight is macOS + Windows only) |
| **BYOK on free tier** | Bring your own API keys without paying |
| **Open architecture** | Repo pattern makes adding providers trivial |

---

## Technical Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│                    User Interface                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌───────────┐ │
│  │ Chat │ │ Home │ │Meets │ │Tasks │ │Quick Bar  │ │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └─────┬─────┘ │
├─────┼────────┼────────┼────────┼────────────┼───────┤
│     │     Actions Layer (Business Logic)     │       │
│  ┌──┴────────┴────────┴────────┴────────────┴─────┐ │
│  │  chat.actions  transcribe.actions  meeting...  │ │
│  └──┬────────────────────────────────────────┬────┘ │
├─────┼────────────────────────────────────────┼──────┤
│     │          Repository Layer               │      │
│  ┌──┴─────────────────────────────────────────┴───┐ │
│  │  ConversationRepo  TranscribeAudioRepo         │ │
│  │  GenerateTextRepo  MeetingRepo  TaskRepo       │ │
│  │  DiarizeAudioRepo  CalendarRepo  ...           │ │
│  └──┬─────────────────────────────────────────┬───┘ │
├─────┼─────────────────────────────────────────┼─────┤
│     │     Tauri Command Bridge (Rust API)     │     │
│  ┌──┴─────────────────────────────────────────┴───┐ │
│  │  76+ commands  │  invoke() from TypeScript     │ │
│  └──┬─────────────────────────────────────────┬───┘ │
├─────┼─────────────────────────────────────────┼─────┤
│     │          Rust Backend                    │     │
│  ┌──┴───┐  ┌────────┐  ┌──────────┐  ┌───────┴──┐ │
│  │SQLite│  │Whisper  │  │Platform  │  │ System   │ │
│  │  DB  │  │Inference│  │ (audio,  │  │(GPU,tray │ │
│  │      │  │(GPU)    │  │keyboard, │  │ models,  │ │
│  │52    │  │         │  │ a11y,    │  │ crypto)  │ │
│  │migr. │  │         │  │ window)  │  │          │ │
│  └──────┘  └────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────┘

AI Provider Layer (TypeScript, via @repo/voice-ai):
┌──────────────────────────────────────────────────────┐
│  Transcription: Local│Groq│OpenAI│Azure│Gemini│Aldea │
│  LLM: Groq│OpenAI│Claude│Gemini│DeepSeek│Azure│      │
│       OpenRouter│Ollama│Cloud                         │
│  Diarization: AssemblyAI (done)│Deepgram (future)     │
└──────────────────────────────────────────────────────┘
```

---

## Security Hardening (COMPLETE, merged to main)

A 5-agent architecture audit identified and resolved critical vulnerabilities:

| Fix | Severity | Commit |
|-----|----------|--------|
| Crypto: HMAC-SHA256 -> ChaCha20Poly1305 AEAD | CRITICAL | `c57b30f` |
| Content Security Policy headers in Tauri | CRITICAL | `c57b30f` |
| Sign-up input validation (Zod) | CRITICAL | `c57b30f` |
| Path traversal: audio_store.rs (canonicalize) | HIGH | `bd4a74f` |
| Path traversal: commands.rs transcription_audio_load | HIGH | `bd4a74f` |
| DB index on transcriptions(timestamp DESC) | HIGH | `bd4a74f` |
| Whisper cache: Mutex -> RwLock, bounded to 4 entries | HIGH | `bd4a74f` |
| Audio buffer: zero-copy with std::mem::take() | HIGH | `bd4a74f` |

### Remaining Security Items

| Item | Severity | Scope |
|------|----------|-------|
| String length validation on meeting fields | Medium | `commands.rs` |
| Time range validation on segments | Medium | `commands.rs` |
| Total audio duration cap | Medium | `commands.rs` |
| Firebase IDOR checks | Medium | Firebase functions |

---

## Architecture Debt

| Item | Scope | Effort |
|------|-------|--------|
| Decompose `commands.rs` (~1400 lines) | Split into `commands/transcription.rs`, `commands/meeting.rs`, `commands/chat.rs`, etc. | Large |
| Decompose `RootSideEffects.ts` (~300 lines) | Split into `useChatSideEffects`, `useMeetingSideEffects`, etc. | Medium |
| Pre-existing lint warnings (~17 files) | Not from recent work. Clean up incrementally. | Small |

---

## Phase Timeline (Estimated)

```
2026 Q1          Q2              Q3              Q4
├────────────┼───────────────┼───────────────┼──────────┤
│ Phase 1    │ Phase 2       │ Phase 3       │ Phase 4  │
│ AI Chat    │ Meeting       │ Screen        │ Tasks    │
│ Quick Bar  │ Recording     │ OCR/Search    │ Calendar │
│ Streaming  │ Diarization   │ Browser Ext   │ Daily    │
│ Context    │ Summaries     │ Universal     │ Overview │
│ Security   │ (Sys Audio    │ Search        │          │
├────────────┤  deferred)    │               │          │
│ ██████████ │ ██████████    │               │          │
│  COMPLETE  │ CORE COMPLETE │               │          │
└────────────┴───────────────┴───────────────┴──────────┘
                                              │
                                     Phase 5 (2027 Q1)
                                     Integrations
                                     MCP / Sharing
```

---

## Metrics & Success Criteria

| Metric | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|--------|---------|---------|---------|---------|---------|
| Daily active usage | Chat used 3x/day | 1 meeting/week recorded | Screen context in 50% of chats | Daily summary viewed | 1+ integration active |
| Response quality | <3s response time | <5m summary generation | Context improves relevance | Task detection >70% accuracy | Sync latency <30s |
| Stability | 0 crashes in chat | Recording survives 2h+ | OCR runs in background | Notifications reliable | OAuth flows work |
| Privacy | All local by default | Diarization API opt-in | Capture whitelist only | Calendar read-only | Per-integration permissions |
