# 🌟 Aira AI — Local AI Assistant

A modern, full-stack ChatGPT-style AI assistant with original branding, powered **100% locally by Ollama**.

> **Zero Cloud APIs • No OpenAI / Claude / Gemini • No API Keys Required • Total Privacy**

---

## 🏛️ Architecture

```
User (Browser)
      ▲
      │  (React UI / SSE Stream)
      ▼
Frontend (Vite + React)  ──[Proxy /api]──►  Local Backend (Node.js + Express)
                                                        │
                                                        │ (POST /api/chat stream)
                                                        ▼
                                             Ollama Local Service
                                            (http://localhost:11434)
                                                        │
                                                        ▼
                                                Local LLM Model
                                                  (llama3.2)
```

The frontend never calls Ollama directly. All communication is routed securely through the local Express backend, which manages conversation histories, streams responses using Server-Sent Events (SSE), and coordinates with Ollama.

---

## 🚀 Quick Start (Windows Setup)

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **Ollama**: Installed from [ollama.com](https://ollama.com)

### 2. Pull the Ollama Model
Open your terminal (PowerShell or Command Prompt) and pull `llama3.2`:

```powershell
ollama pull llama3.2
```

*(Ensure Ollama is running in the background. If needed, run `ollama serve`)*

---

### 3. Start the Backend Server

Open a new terminal window:

```powershell
cd backend
npm install
npm run dev
```

The backend starts at **`http://localhost:5000`**.

Backend `.env` configuration:
```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
PORT=5000
```

---

### 4. Start the Frontend Application

Open a second terminal window:

```powershell
cd frontend
npm install
npm run dev
```

The Vite dev server starts at **`http://localhost:5173`**.

Open your browser and navigate to **`http://localhost:5173`**.

---

## ✨ Features

### 💬 Basic Chat & Streaming
- **Real-Time Streaming**: Smooth token-by-token streaming from the local LLM.
- **Smart Shortcuts**: `Enter` to send message, `Shift + Enter` for a multi-line input, `Ctrl + K` / `Cmd + K` for New Chat.
- **Auto-Scroll**: Automatically scrolls during streaming, with an on-demand floating "Scroll to bottom" button when scrolling up.
- **Typing Cursor**: Visual pulsing cursor and typing indicator during generation.

### 🗂️ Chat Management & Local Storage
- **Automatic Titles**: Automatically generates meaningful chat titles based on your first message.
- **Chat History**: Full conversation history persisted securely in browser `localStorage`.
- **Search Conversations**: Instant real-time filtering of chats by title or message content.
- **Rename & Delete**: Inline renaming and delete confirmations for every conversation.
- **Clear Chat**: Clear all messages in current chat or wipe all conversations from settings.

### 🎛️ AI & User Controls
- **Stop Generation**: Immediately halts streaming on both frontend and local Ollama backend via `AbortController`.
- **Regenerate Response**: Re-runs the LLM prompt from any previous assistant message.
- **Edit & Resend**: Edit any past user message; Aira cleanly truncates subsequent messages and regenerates the conversation from that point onward.
- **Copy Message & Code**: One-click copy for complete responses and syntax-highlighted code blocks with visual feedback.

### 📝 Rich Markdown & Code Blocks
- **Markdown Elements**: Full support for Headings (H1-H4), Bold, Italic, Strikethrough, Ordered & Unordered Lists, Blockquotes, Links, and Tables.
- **Code Blocks**: Formatted with monospace typography, language banners, and one-click copy buttons.

### 🌓 Dark & Light Modes
- Seamless theme switching between an obsidian-inspired Dark theme and a crisp Light theme.
- Selected theme is preserved in `localStorage` across page reloads.

### 📱 Responsive Design
- Optimized for desktops, tablets, and smartphones.
- Collapsible sidebar drawer with smooth slide-in transition and backdrop overlay on mobile.

---

## 🔌 API Endpoints

The Express backend provides three primary endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Checks if local Ollama daemon is reachable and returns status |
| `GET` | `/api/models` | Lists all models currently installed in local Ollama |
| `POST` | `/api/chat` | Accepts conversation history `messages: [{ role, content }]` and streams response via Server-Sent Events (SSE) |

---

## 🛡️ Security & Privacy Guarantee

- **No Cloud Services**: All AI inference runs locally on your machine.
- **No API Keys**: There is no API key field and no cloud connection.
- **Local Storage**: Chat records remain strictly in your browser's `localStorage`.
- **Git Ignored**: `.env` and `node_modules` are excluded in `.gitignore`.

---

## 🛠️ Troubleshooting

### Ollama Not Running
If you see:
> *"Unable to connect to Ollama. Please start Ollama and try again."*

1. Verify Ollama is running in your Windows system tray.
2. Or start it manually from terminal:
   ```powershell
   ollama serve
   ```
3. Test connectivity by visiting `http://localhost:11434`.

### Model Not Installed
If you see:
> *"The selected Ollama model is not installed. Please install it using Ollama."*

Run:
```powershell
ollama pull llama3.2
```
Or select another installed model from the **Aira Settings** modal.
