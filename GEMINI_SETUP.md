# 🤖 AI Conversation Setup (Gemini Only)

## Quick Setup

### 1. Get Gemini API Key (FREE)
1. Visit: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Login with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### 2. Configure Backend

**Create `.env` file in `ARSIK_backend/` folder:**

```bash
cd ARSIK_backend
```

Create `.env` file:
```
GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Backend

```bash
npm start
```

You should see:
```
🤖 Gemini API: ✅ Configured
```

### 5. Use AI Assistant

1. Open ARSIK patient app (port 5173)
2. Click **💬 AI Assistant** tab
3. Start chatting!

---

## Features

✅ **Gemini 1.5 Flash** - Fast, multilingual AI
✅ **FREE tier** - 1,500 requests/day
✅ **Indonesian language** - Optimized for Bahasa
✅ **Context memory** - Remembers last 8 messages
✅ **Repeated question detection** - Smart reminders
✅ **Voice I/O** - Speech recognition + TTS

---

## No More Manual Configuration!

- ❌ No caregiver configuration UI needed
- ❌ No per-patient API keys
- ✅ Single API key in `.env` file
- ✅ Automatic for all patients
- ✅ Simpler, more secure

---

## Troubleshooting

**"API belum dikonfigurasi"**
→ Check `.env` file exists and has correct `GEMINI_API_KEY`

**"Error generating response"**
→ Check API key is valid at [aistudio.google.com](https://aistudio.google.com/app/apikey)

**Backend shows "❌ Not configured"**
→ Restart backend after creating `.env` file

---

## Cost

**FREE**: 1,500 requests/day
- ~50 conversations/day (30 messages each)
- Perfect for home use with 1-2 patients

---

**That's it! The AI assistant is ready to help dementia patients.** 🎉
