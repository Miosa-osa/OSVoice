# Engineering Status & Handoff Guide

> Last updated: 2026-02-16
> Current branch: `feature/phase-2-meetings` (latest: `80d399c`)
> Main branch: `main` (latest: `5350611`, merged from dev)

This document captures all completed work, in-progress items, known issues, and remaining tasks. It serves as a handoff guide for agents picking up where the last session left off.

---

## Branch Topology

```
main (5350611)
 └── dev (558df8c) ── merged into main via PR #5
      └── feature/phase-2-meetings (80d399c) ── 1 commit ahead of origin
           Has: Phase 2 meeting infra + 7 MUST FIX items
      └── feature/phase-1-ai-chat (89972e3) ── merged into dev via PR #2
           Has: Phase 1 AI chat + quick bar
```

All Phase 1 and Phase 2 infrastructure code has been merged to `main`. The `feature/phase-2-meetings` branch has one unmerged commit: `80d399c` (7 MUST FIX items from code review).

---

## Completed Work

### Security Hardening (commits c57b30f, bd4a74f, e750a6d)

| Fix | Severity | File(s) | Details |
|-----|----------|---------|---------|
| Crypto upgrade to ChaCha20Poly1305 | CRITICAL | `system/crypto.rs` | Replaced HMAC-SHA256 with AEAD encryption |
| Content Security Policy | CRITICAL | `app.rs` | Added restrictive CSP headers to Tauri |
| Sign-up input validation | CRITICAL | Firebase functions | Added Zod validation to auth handlers |
| Path traversal in audio_store | HIGH | `system/audio_store.rs` | `fs::canonicalize()` before `starts_with()` |
| Path traversal in commands | HIGH | `commands.rs:389` | Same pattern for `transcription_audio_load` |
| DB performance index | HIGH | `migrations/050_performance_indexes.sql` | `idx_transcriptions_timestamp` on `transcriptions(timestamp DESC)` |
| Whisper cache bounds | HIGH | `platform/whisper.rs` | `Mutex` -> `RwLock`, `MAX_CONTEXT_CACHE_ENTRIES=4`, `cache.clear()` eviction |
| Audio buffer zero-copy | HIGH | `platform/audio.rs` | `std::mem::take()` replaces `clone()+clear()` in ChunkEmitter |

### Phase 1: AI Chat + Quick Bar (branch: feature/phase-1-ai-chat, MERGED)

| Feature | Commits | Status |
|---------|---------|--------|
| Conversations + messages DB tables | `5da6627` | Done (migration 049) |
| Rust domain, queries, 6 commands | `5da6627` | Done |
| Shared types (`@repo/types`) | `5da6627` | Done |
| TS repos, actions, state | `5da6627` | Done |
| ChatPage, messages, input, sidebar | `b05d094` | Done |
| Quick bar overlay | `dbbf90f` | Done |
| Glassy UI theme | `dbbf90f` | Done |
| Voice input in chat | `b05d094` | Done |
| Markdown rendering (rehype-sanitize) | `b05d094` | Done |
| Code review fixes | `89972e3` | Done |
| Streaming LLM responses (RAF batching) | `c25d7db` | Done |
| Streaming for Claude + Gemini | `7220626` | Done |
| Context attachment support | `7220626` | Done |
| Provider deduplication (openai-compat) | `8e00d75` | Done (~520 lines deduplicated) |
| useVoiceRecording hook extraction | `ca750f1` | Done |

#### Phase 1 Remaining

| Item | Priority | Effort | Notes |
|------|----------|--------|-------|
| @mention model selection in chat | Medium | Medium | Type `@claude` to switch model per-message |
| Global hotkey for quick bar | Medium | Small | Cmd+Shift+Space to toggle quick bar |
| Draggable quick bar | Low | Small | Save position to preferences |
| Conversation search | Low | Small | Filter sidebar by title |

### Phase 2: Meeting Intelligence (branch: feature/phase-2-meetings)

#### Infrastructure (commit 3f02c4e, 33 files)

| Layer | Files | Status |
|-------|-------|--------|
| Rust domain (`meeting.rs`) | 1 | Done |
| DB migration (`051_meetings.sql`) | 1 | Done (meetings + meeting_segments tables) |
| Rust queries (`meeting_queries.rs`) | 1 | Done (CRUD + batch insert) |
| Rust commands (11 meeting commands) | `commands.rs` | Done |
| Meeting audio store (`meeting_audio_store.rs`) | 1 | Done (streaming WAV writer) |
| Shared types (`meeting.types.ts`) | 1 | Done |
| TS repo (`meeting.repo.ts`) | 1 | Done |
| TS diarize repo (`diarize.repo.ts`) | 1 | Done (AssemblyAI) |
| TS state (`meeting.state.ts`) | 1 | Done |
| TS actions (`meeting.actions.ts`) | 1 | Done |
| Meeting prompt utils | 1 | Done |
| UI: MeetingsPage, DetailPage, List, Timeline, Summary, ActionItems, EmptyState, RecordingBar, SpeakerRenameDialog | 9 | Done |
| Routing + dashboard nav | 2 | Done |

#### Code Review Fixes (commit 80d399c, NOT yet merged to main)

| Fix | Category | File | Details |
|-----|----------|------|---------|
| Memory leak in error path | Bug | `meeting.actions.ts` | `cleanupRecordingResources()` + `stop_recording` in catch |
| Flush race condition | Bug | `meeting.actions.ts` | `isFlushing` mutex flag |
| DoS: audio chunk size | Security | `commands.rs:1326` | Cap at 960K samples (~20s @ 48kHz) |
| DoS: segment batch size | Security | `commands.rs:1265` | Cap at 500 segments |
| Segment rollback on delete | Bug | `meeting.actions.ts` | Snapshot + restore segments on failure |
| Transaction on batch insert | Data integrity | `meeting_queries.rs` | `pool.begin()` / `tx.commit()` |
| Stale titleDraft | UI bug | `MeetingDetailPage.tsx` | `useEffect` syncs on `meeting.id` change |

---

## Remaining Work (Prioritized)

### P0: Merge the Phase 2 fixes

The `feature/phase-2-meetings` branch has commit `80d399c` (7 MUST FIX items) that needs to be merged to `dev` -> `main`.

### P1: SHOULD FIX from Phase 2 Code Review

These are quality and performance issues found during the review. None are blockers, but they should be addressed before the next feature push.

| Issue | File | What to Do |
|-------|------|-----------|
| State subscription perf | `MeetingTranscriptTimeline.tsx` | Subscribes to entire `segmentById` object. Re-renders on ANY segment change, not just current meeting. Fix: derive segments from `segmentIds` + `meetingId` filter in selector. |
| Array recreation every render | `MeetingsPage.tsx` | `meetings` selector creates new array on every state change. Fix: use `useCallback` or compute in action layer. |
| Missing error boundaries | `MeetingsPage.tsx` | Wrap meeting routes in React error boundary. |
| Incomplete i18n | Multiple meeting components | Hardcoded strings: "Summary", "Transcript", "Action Items", "Back". Should use `<FormattedMessage>`. |
| Duplicate retry buttons | `MeetingDetailPage.tsx:142-162` | "processing" and "failed" status both render identical retry button. Extract shared component. |
| Missing loading state | `MeetingDetailPage.tsx` | No loading indicator during `generateMeetingSummary`. |
| Array index as key | `MeetingActionItems.tsx` | Action items use array index as React key. Use stable ID or `task-assignee` composite. |

### P2: MEDIUM Security Items

| Issue | File | What to Do |
|-------|------|-----------|
| String length validation | `commands.rs` (meeting_create, meeting_update) | Add max length checks: title (500), summary (10K), action_items (10K), id (128). Create `validate_meeting()` helper. |
| Segment field validation | `commands.rs` (meeting_segments_create_batch) | Add max length: text (5K), speaker_name (100). Validate `start_ms >= 0`, `end_ms >= start_ms`. |
| Total audio duration cap | `commands.rs` (meeting_append_audio_chunk) | Track total samples in writer, reject after ~4 hours (691M samples @ 48kHz). |

### P3: Architecture Debt (from original audit)

| Issue | Scope | What to Do |
|-------|-------|-----------|
| God object: `commands.rs` | ~1400 lines, 70+ commands | Split into modules: `commands/transcription.rs`, `commands/meeting.rs`, `commands/chat.rs`, etc. Re-export from `commands/mod.rs`. |
| God object: `RootSideEffects.ts` | ~300 lines | Split into `useChatSideEffects`, `useMeetingSideEffects`, etc. |
| Firebase IDOR checks | Firebase functions | Verify resource ownership on all endpoints (e.g., user can only access their own transcriptions). |
| Pre-existing lint warnings | ~17 files | These exist from before our work. Not blockers but should be cleaned up eventually. |

### P4: Phase 2 Feature Gaps

These are features listed in the Phase 2 roadmap that are NOT yet implemented:

| Feature | Description | Effort |
|---------|-------------|--------|
| System audio capture | macOS ScreenCaptureKit for capturing app audio (not just mic) | Large |
| Meeting app detection | Detect Zoom/Teams/Meet, prompt to start recording | Medium |
| Local diarization | pyannote.audio or whisperX (currently API-only via AssemblyAI) | Very Large |
| Voice fingerprinting | Recurring speaker recognition across meetings | Large |
| Meeting Q&A | "What did we decide about X?" over past meetings | Medium |
| Shareable meeting summaries | Public links with selective access | Medium |

### P5: Phase 1 Feature Gaps

| Feature | Description | Effort |
|---------|-------------|--------|
| @mention model selection | `@claude`, `@gpt-4o` in chat input to switch model per-message | Medium |
| Global hotkey for quick bar | Cmd+Shift+Space to toggle quick bar | Small |
| Draggable quick bar | Save position to preferences, restore on startup | Small |
| Conversation search | Filter conversation list by title | Small |

---

## Architecture Audit Findings (Full Summary)

A comprehensive 5-agent architecture audit was run on the codebase. Here are the findings grouped by status:

### Resolved

- Path traversal (2 instances) - Fixed
- Weak crypto (HMAC-SHA256) - Upgraded to ChaCha20Poly1305
- Missing CSP - Added
- Missing DB indexes - Added
- Whisper cache unbounded - Bounded to 4, RwLock
- Audio buffer clone overhead - Zero-copy with `std::mem::take()`
- Meeting memory leaks - Cleanup function + error path handling
- Meeting flush race condition - Mutex flag
- Meeting DoS vectors - Size limits on chunks and batches
- Meeting segment transaction safety - Added begin/commit
- Meeting delete rollback incomplete - Segment snapshot + restore
- Meeting stale UI state - useEffect sync

### Unresolved (see P1-P4 above)

- God object decomposition (commands.rs, RootSideEffects.ts)
- Firebase IDOR checks
- String/time validation on meeting fields
- State subscription inefficiencies in 2 meeting components
- Missing error boundaries
- Incomplete i18n in meeting UI

---

## File Inventory (What Changed, All Sessions)

### Rust (src-tauri/src/)

| File | Status | Notes |
|------|--------|-------|
| `system/crypto.rs` | Modified | ChaCha20Poly1305 AEAD (c57b30f) |
| `system/audio_store.rs` | Modified | Path traversal fix (bd4a74f) |
| `system/meeting_audio_store.rs` | New | Streaming WAV writer, path validation (3f02c4e) |
| `platform/whisper.rs` | Modified | RwLock + cache bounds (bd4a74f) |
| `platform/audio.rs` | Modified | Zero-copy buffer drain (bd4a74f) |
| `commands.rs` | Modified | Path traversal fix, 11 meeting commands, DoS limits (bd4a74f, 3f02c4e, 80d399c) |
| `app.rs` | Modified | CSP headers, meeting commands registered (c57b30f, 3f02c4e) |
| `db/mod.rs` | Modified | Migrations 050 + 051, meeting_queries module (bd4a74f, 3f02c4e) |
| `db/migrations/050_performance_indexes.sql` | New | Transcription timestamp index (bd4a74f) |
| `db/migrations/051_meetings.sql` | New | meetings + meeting_segments tables (3f02c4e) |
| `db/meeting_queries.rs` | New | Full CRUD + transaction batch insert (3f02c4e, 80d399c) |
| `domain/meeting.rs` | New | Meeting + MeetingSegment structs (3f02c4e) |

### TypeScript (apps/desktop/src/)

| File | Status | Notes |
|------|--------|-------|
| `actions/meeting.actions.ts` | New + Fixed | Recording, CRUD, summaries, cleanup, flush mutex (3f02c4e, 80d399c) |
| `actions/chat.actions.ts` | New | Chat CRUD + streaming (5da6627, c25d7db) |
| `state/meeting.state.ts` | New | Meeting UI state slice (3f02c4e) |
| `state/chat.state.ts` | New | Chat UI state slice (5da6627) |
| `repos/meeting.repo.ts` | New | Meeting repo with invoke() calls (3f02c4e) |
| `repos/diarize.repo.ts` | New | AssemblyAI diarization (3f02c4e) |
| `utils/meeting-prompt.utils.ts` | New | Summary prompt builder + parser (3f02c4e) |
| `components/meetings/*` | New (9 files) | Full meeting UI (3f02c4e) |
| `components/meetings/MeetingDetailPage.tsx` | Fixed | Stale title sync (80d399c) |
| `components/chat/*` | New (6 files) | Chat UI (5da6627, b05d094) |
| `components/overlay/QuickBarOverlayRoot.tsx` | New | Quick bar overlay (dbbf90f) |

### Shared Packages

| File | Status | Notes |
|------|--------|-------|
| `packages/types/src/meeting.types.ts` | New | Meeting, MeetingSegment, MeetingStatus (3f02c4e) |
| `packages/types/src/conversation.types.ts` | New | Conversation, Message types (5da6627) |
| `packages/voice-ai/src/openai-compat.utils.ts` | New | Shared OpenAI-compatible provider utils (8e00d75) |

---

## How to Continue

### For P0 (merge fixes):
```bash
git checkout dev
git merge feature/phase-2-meetings
git push origin dev
# Then PR dev -> main
```

### For P1 (SHOULD FIX items):
Work on `feature/phase-2-meetings` branch. The fixes are all in TypeScript UI components. Run `npx tsc --noEmit` to verify after changes.

### For P2 (security validation):
Work on `feature/phase-2-meetings` branch. Changes are in `commands.rs`. Run `cargo check` to verify.

### For P3 (architecture debt):
Create a new branch `refactor/commands-decomposition` from `main`. This is a large refactor that should be done independently.

### For P4/P5 (new features):
Follow the patterns established in the codebase:
- **Rust**: Domain struct -> queries -> commands -> register in app.rs
- **TypeScript**: Types -> repo -> actions -> state -> UI component
- See `CLAUDE.md` for full patterns and conventions

### Build & verify commands:
```bash
# Rust compilation check (~5s if only Rust changed)
cd apps/desktop/src-tauri && cargo check

# TypeScript type check
npx tsc --noEmit

# Full desktop dev (macOS)
npm run dev:mac

# Lint
npm run lint
```

---

## Key Patterns to Follow

1. **"Rust is the API, TypeScript is the Brain"** - All business logic in TS
2. **Optimistic updates** - Update UI state first, persist async, rollback on error
3. **Repo pattern** - `BaseXxxRepo` abstract -> `LocalXxxRepo` with `invoke()`
4. **State normalization** - Entity maps (`meetingById: Record<string, Meeting>`) + ID arrays
5. **Zustand shallow equality** - Use `shallow` from `zustand/shallow`, NOT lodash
6. **React.memo** - All list item components and detail views
7. **Tauri commands** - `#[tauri::command]` with `State<'_, T>`, errors as `String`
8. **Migrations** - Sequential `NNN_desc.sql`, register in `db/mod.rs`
