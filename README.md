<div align="center">

<img src="docs/OsaBlack_Logo.png" alt="OS Voice by OSA" width="300" />

# Your keyboard is holding you back.

### Make voice your new keyboard. Type four times faster by using your voice.

<br/>

**[Visit our website →](https://osa.dev)**

</div>

OS Voice is an open-source, cross-platform speech-to-text application that lets you dictate into any desktop application, clean the transcript with AI, and keep your personal glossary in sync. **Fully local-first** - no account required, no cloud dependency.

## Highlights

- **Voice input everywhere:** Overlay, hotkeys, and system integrations work across macOS, Windows, and Linux
- **100% Local Option:** Run Whisper locally for transcription AND Ollama for AI post-processing - no internet required
- **Choose your engine:** Local Whisper (with GPU acceleration), Groq API, or Ollama for AI cleanup
- **AI text cleanup:** Remove filler words and false starts automatically with customizable tones
- **Personal dictionary:** Create glossary terms and replacement rules so recurring names and phrases stay accurate
- **Privacy-first:** All data stored locally in SQLite, encrypted API keys, no telemetry

## Local AI Setup (No API Key Required)

### Option 1: Fully Local (Recommended for Privacy)

Run everything on your machine with no external API calls.

#### Local Transcription (Whisper)

OS Voice includes built-in local Whisper support. Models download automatically on first use.

| Model | Size | RAM Required | Quality | Speed |
|-------|------|--------------|---------|-------|
| tiny | ~75 MB | 1 GB | Basic | Fastest |
| base | ~142 MB | 1 GB | Good | Fast |
| small | ~466 MB | 2 GB | Better | Medium |
| medium | ~1.5 GB | 5 GB | Great | Slower |
| large | ~2.9 GB | 10 GB | Best | Slowest |

**Recommended specs for local Whisper:**
- **Minimum:** 8GB RAM, any modern CPU (base model)
- **Recommended:** 16GB RAM, Apple Silicon or NVIDIA GPU (medium model)
- **Best:** 32GB RAM, M1 Pro/Max or RTX 3080+ (large model with GPU acceleration)

#### Local AI Post-Processing (Ollama)

Use Ollama for AI-powered transcript cleanup without any API key.

1. **Install Ollama:**
   ```bash
   # macOS
   brew install ollama

   # Or download from https://ollama.ai
   ```

2. **Pull a model:**
   ```bash
   # Recommended for most users (3.8GB)
   ollama pull llama3.2

   # Lighter option (2GB)
   ollama pull llama3.2:1b

   # Best quality (requires 16GB+ RAM)
   ollama pull llama3.1:8b
   ```

3. **Start Ollama:**
   ```bash
   ollama serve
   ```

4. **Configure in OS Voice:**
   - Open Settings → API Keys
   - Click "Add" → Select "Ollama"
   - Leave API key blank (it's optional)
   - Your installed models will auto-detect in the dropdown

**Recommended specs for Ollama:**
- **Minimum:** 8GB RAM (llama3.2:1b)
- **Recommended:** 16GB RAM, Apple Silicon or NVIDIA GPU (llama3.2)
- **Best:** 32GB+ RAM, M1 Pro/Max or RTX 3080+ (llama3.1:8b or larger)

### Option 2: Cloud API (Faster, Requires API Key)

For faster processing or lower-spec machines, use Groq's hosted API.

1. Get a free API key from [console.groq.com](https://console.groq.com)
2. Open OS Voice → Settings → API Keys
3. Click "Add" → Select "Groq"
4. Enter your API key

Groq provides:
- **Whisper Large v3 Turbo** for transcription (fastest cloud option)
- **Llama 4 Scout** for AI post-processing

## How to Access Settings

1. Open OS Voice
2. Click the **gear icon** in the sidebar (Settings)
3. Navigate to **API Keys** section
4. Add your preferred provider:
   - **Ollama** - Local AI (no key required, auto-detects models)
   - **Groq** - Cloud API (requires free API key)

To change transcription mode:
1. Go to Settings → **Transcription**
2. Select **Local** (uses Whisper) or **API** (uses Groq)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/Miosa-osa/OSVoice.git
cd OSVoice

# Install dependencies
npm install

# Run on macOS
npm run dev:mac --workspace apps/desktop

# Run on Windows
npm run dev:windows --workspace apps/desktop

# Run on Linux
npm run dev:linux --workspace apps/desktop
```

### Prerequisites

- Node.js 18+ and npm 10+
- Rust toolchain with `cargo` and `rustup`
- Tauri CLI: `cargo install tauri-cli`
- Platform dependencies for Tauri:
  - **Linux:** Run `apps/desktop/scripts/setup-linux.sh`
  - **Windows:** Run `powershell -ExecutionPolicy Bypass -File apps/desktop/scripts/setup-windows.ps1`

## Monorepo Layout

| Path | Description |
|------|-------------|
| `apps/desktop` | Tauri desktop app (Vite + React + Zustand) |
| `apps/desktop/src-tauri` | Rust API layer for native capabilities, SQLite, and Whisper |
| `apps/web` | Astro-powered marketing site |
| `packages/voice-ai` | Audio chunking + transcription utilities |
| `packages/types` | Shared domain models |
| `docs` | Architecture notes and guides |

## Architecture Overview

The desktop app follows a TypeScript-first design: Zustand maintains a single global store, while pure utility functions manage state. Repos abstract whether persistence happens locally (SQLite through Tauri commands) or via external APIs.

```
User input / system events
        ↓
React + Zustand state (TypeScript)
        ↓
Repos choose local vs. remote
        ↓
Tauri commands (Rust API bridge)
        ↓
SQLite, Whisper models, or Ollama/Groq APIs
```

Rust handles native integrations—audio capture, keyboard injection, GPU acceleration, encryption. TypeScript owns business logic and UI.

## Development Commands

```bash
# Build everything
npm run build

# Quality checks
npm run lint
npm run check-types
npm run test

# Platform-specific dev (pick one)
npm run dev:mac --workspace apps/desktop
npm run dev:windows --workspace apps/desktop
npm run dev:linux --workspace apps/desktop
npm run dev:linux:gpu --workspace apps/desktop  # With Vulkan GPU
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OSVOICE_WHISPER_DISABLE_GPU` | Force CPU-only Whisper inference |
| `OSVOICE_DESKTOP_PLATFORM` | Override platform detection (darwin/win32/linux) |
| `VITE_FLAVOR` | Environment flavor (dev/prod/emulators) |

## Documentation

- Desktop architecture: `docs/desktop-architecture.md`
- Release playbook: `docs/desktop-release.md`
- Contributor conventions: `AGENTS.md`

## License

OS Voice is released under the MIT License. See `LICENSE` for details.

---

<div align="center">
Made with ❤️ by <a href="https://osa.dev">OSA</a>
</div>
