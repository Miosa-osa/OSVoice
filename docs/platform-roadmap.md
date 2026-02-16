# OSVoice Platform Roadmap

> Last updated: 2026-02-16
> Branch: `feature/phase-2-meetings`
> Reference: `docs/gap-analysis-highlight-ai.md`

---

## Platform Overview

OSVoice is a local-first, cross-platform voice-to-text desktop app built with Tauri (Rust + TypeScript/React). It currently ships with **65+ Tauri commands**, **49 database migrations**, **7 transcription providers**, **9 LLM providers**, **4 overlay windows**, and full cross-platform support (macOS, Windows, Linux).

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

## Phase 1: AI Chat + Quick Bar (IN PROGRESS)

**Branch:** `feature/phase-1-ai-chat`
**Goal:** Transform OSVoice from dictation-only into a conversational AI assistant.

### Completed

| Feature | Files | Notes |
|---------|-------|-------|
| Conversations DB table | `049_conversations.sql` | conversations + messages, FK cascade, composite index |
| Rust domain + queries | `conversation.rs`, `conversation_queries.rs` | 6 queries, full CRUD |
| Rust commands | `commands.rs` | 6 commands, registered in `app.rs` |
| Shared types | `@repo/types/conversation.types.ts` | Conversation, Message, MessageRole, ChatMessage |
| TypeScript repo | `conversation.repo.ts` | BaseConversationRepo → LocalConversationRepo |
| Chat actions | `chat.actions.ts` | create, load, send, delete + optimistic updates |
| Chat state | `chat.state.ts` | Normalized entity maps + UI state |
| ChatPage | `ChatPage.tsx` | Two-panel layout, conversation + messages |
| ChatMessageList | `ChatMessageList.tsx` | Virtualized (react-virtuoso), auto-scroll, typing indicator |
| ChatMessageBubble | `ChatMessageBubble.tsx` | Markdown (react-markdown + rehype-sanitize), React.memo |
| ChatInput | `ChatInput.tsx` | Text + voice input, recording states |
| ChatConversationList | `ChatConversationList.tsx` | Sidebar, React.memo on items |
| ChatEmptyState | `ChatEmptyState.tsx` | Placeholder UI |
| Quick bar overlay | `QuickBarOverlayRoot.tsx` | Glassy bar, voice input, menu, event bridge |
| Quick bar window | `overlay.rs` | 320x250, focusable, bottom-center |
| Event flow | `RootSideEffects.ts` | quick-bar-query → state → ChatPage |
| Routing | `router.tsx` | /dashboard/chat route |
| Dashboard nav | `DashboardMenu.tsx` | Chat link with AI sparkle icon |
| Glassy UI theme | `theme.ts`, `mui.d.ts` | Glass palette vars, backdrop-filter blur |
| Audit fixes | Multiple | rehype-sanitize, React.memo, Virtuoso, shallow equality, composite DB index, input validation |

### Remaining

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| **Streaming responses** | High | Large | Token-by-token rendering as LLM generates. Requires `generateChatStream()` on all 9 providers + incremental UI rendering. |
| **Context attachment** | High | Large | Attach transcriptions, screen content, or files to chat messages. UI picker + `context_json` field in messages. |
| **@mention model selection** | Medium | Medium | Type `@claude` or `@gpt-4o` in chat to override the default model per-message. Parse input, swap provider. |
| **Global hotkey for quick bar** | Medium | Small | Register Cmd+Shift+Space (or similar) to toggle quick bar visibility. Wire into existing hotkey system. |
| **Draggable quick bar** | Low | Small | Save position to preferences, restore on startup. Use Tauri `startDragging()` (partially implemented). |
| **Conversation search** | Low | Small | Filter/search conversation list by title. Local string matching. |

### Phase 1 Completion Criteria
- [ ] Chat works end-to-end (send message → get AI response)
- [ ] Voice input works in chat
- [ ] Quick bar sends queries to chat
- [ ] Conversations persist across restarts
- [ ] Streaming responses show tokens in real-time
- [ ] Can attach context (at least transcriptions) to chat

---

## Phase 2: Meeting Intelligence

**Goal:** Capture, transcribe, and summarize meetings with speaker identification.

### 2.1 System Audio Capture
| Item | Description | Effort |
|------|-------------|--------|
| macOS audio capture | ScreenCaptureKit API for system audio | Large |
| Windows audio capture | WASAPI loopback capture | Large |
| Linux audio capture | PulseAudio monitor source | Medium |
| Long-running recording | Handle hours-long meetings, chunked transcription | Medium |
| Recording UI | Start/stop, duration timer, waveform | Medium |

**New Rust module:** `platform/system_audio.rs` (platform-specific implementations)

### 2.2 Meeting Detection
| Item | Description | Effort |
|------|-------------|--------|
| App detection | Detect Zoom, Teams, Meet, Slack huddle, Discord | Medium |
| Auto-start recording | Prompt user when meeting app detected | Small |
| Meeting metadata | Title, participants, duration, app source | Small |

**New Rust module:** `platform/meeting_detector.rs`

### 2.3 Speaker Diarization
| Item | Description | Effort |
|------|-------------|--------|
| API-based diarization | Deepgram or AssemblyAI (start here) | Medium |
| Local diarization | pyannote.audio or whisperX (future) | Very Large |
| Speaker naming | Manual assignment → learn over time | Medium |
| Voice fingerprinting | Recurring speaker recognition | Large |

**New repos:** `DiarizeAudioRepo` → `DeepgramDiarizeRepo`, `AssemblyAIDiarizeRepo`

### 2.4 Meeting Summaries
| Item | Description | Effort |
|------|-------------|--------|
| Auto-summary generation | LLM summarizes transcript when recording stops | Medium |
| Action item extraction | Detect tasks, assignees, deadlines | Medium |
| Key decisions | Extract decisions and topics | Small |
| Meeting Q&A | "What did we decide about X?" over past meetings | Medium |

### 2.5 Meeting UI
| Item | Description | Effort |
|------|-------------|--------|
| MeetingsPage | List view with search/filter | Medium |
| MeetingDetailView | Summary + transcript + timeline | Large |
| MeetingTranscriptTimeline | Speaker-labeled segments with timestamps | Large |
| ActionItemList | Extracted tasks with checkboxes | Small |

### New Database Tables
```sql
meetings (id, title, app_source, started_at, ended_at, duration_seconds,
          summary, status, audio_path)
meeting_segments (id, meeting_id, speaker_id, speaker_name, text,
                  start_ms, end_ms)
```

### Phase 2 Completion Criteria
- [ ] Can record system audio on macOS (at minimum)
- [ ] Meeting transcription with timestamps
- [ ] Speaker diarization (API-based)
- [ ] Auto-generated meeting summary
- [ ] Action items extracted
- [ ] Meeting list + detail UI

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
│  │  65+ commands  │  invoke() from TypeScript     │ │
│  └──┬─────────────────────────────────────────┬───┘ │
├─────┼─────────────────────────────────────────┼─────┤
│     │          Rust Backend                    │     │
│  ┌──┴───┐  ┌────────┐  ┌──────────┐  ┌───────┴──┐ │
│  │SQLite│  │Whisper  │  │Platform  │  │ System   │ │
│  │  DB  │  │Inference│  │ (audio,  │  │(GPU,tray │ │
│  │      │  │(GPU)    │  │keyboard, │  │ models,  │ │
│  │49    │  │         │  │ a11y,    │  │ crypto)  │ │
│  │migr. │  │         │  │ window)  │  │          │ │
│  └──────┘  └────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────┘

AI Provider Layer (TypeScript, via @repo/voice-ai):
┌──────────────────────────────────────────────────────┐
│  Transcription: Local│Groq│OpenAI│Azure│Gemini│Aldea │
│  LLM: Groq│OpenAI│Claude│Gemini│DeepSeek│Azure│      │
│       OpenRouter│Ollama│Cloud                         │
│  Diarization: Deepgram│AssemblyAI (Phase 2)          │
└──────────────────────────────────────────────────────┘
```

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
│            │               │ Search        │          │
├────────────┤               │               │          │
│ ██████░░░░ │               │               │          │
│ ~80% done  │               │               │          │
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
