# 🤖 AI Conversation Assistant - Setup Guide

## 🎯 Feature Overview

The AI Conversation Assistant helps dementia patients by:
- **Memory Support**: Remembers recent conversations and provides context
- **Gentle Reminders**: Detects repeated questions and provides caring responses
- **Time Orientation**: Helps patients stay oriented with current time and date
- **Personalized Responses**: Uses patient profile (name, family, interests) for personalized interaction
- **Indonesian Language**: Fully supports Bahasa Indonesia

---

## 🔑 API Key Setup

### Option 1: Groq (FREE - Recommended)

**Why Groq?**
- ✅ **100% FREE** up to 14,400 requests/day
- ✅ **Fastest inference** speed (instant responses)
- ✅ Uses Llama 3.1 70B model (high quality)
- ✅ Perfect for dementia care (low latency = better UX)

**How to get Groq API key:**

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with email (free, no credit card needed)
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy the key (starts with `gsk_...`)

**Limits:**
- 14,400 requests per day (free)
- 30 requests per minute
- More than enough for 1 patient

---

### Option 2: OpenAI (Paid, Best Quality)

**Cost:** ~$0.03 per 1K tokens (~$0.15 per day for moderate use)

**How to get OpenAI API key:**

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up and add payment method
3. Go to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)

**Model used:** GPT-4o-mini (fast and affordable)

---

### Option 3: Anthropic Claude (Paid)

**Cost:** ~$0.015 per 1K tokens (~$0.10 per day)

**How to get Claude API key:**

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up and add payment method
3. Go to **API Keys** section
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-...`)

**Model used:** Claude 3 Haiku (fast, efficient)

---

## 📋 Setup Instructions

### Step 1: Get Patient ID

1. Open **ARSIK Patient App** (port 5173)
2. Open browser console (F12)
3. Type: `localStorage.getItem('arsik_patient_id')`
4. Copy the patient ID (format: `patient_1234567890_abcdefgh`)

**Alternative:** Look at the URL or localStorage in DevTools

---

### Step 2: Configure AI in Caregiver App

1. Open **ARSIK_suster Caregiver App** (port 5174)
2. Click **👤 Profile** tab at bottom
3. Enter the **Patient ID** you copied
4. Click **🤖 Konfigurasi AI Assistant**

---

### Step 3: Enter Configuration

1. **Select Provider:**
   - Choose **Groq** (recommended for free)
   - Or **OpenAI** / **Claude** if you have paid keys

2. **Enter API Key:**
   - Paste your API key from the provider
   - Click **👁️** to show/hide the key

3. **Fill Patient Profile:**
   - Name: e.g., "Ibu Siti"
   - Age: e.g., 75
   - Interests: e.g., "memasak, berkebun, mendengarkan musik"
   - Common Questions: e.g., "Jam berapa sekarang?, Siapa nama cucu saya?"

4. **Click 💾 Simpan Konfigurasi**

5. **Click 🧪 Test Koneksi** to verify it works

---

### Step 4: Use AI Assistant

1. Go back to **ARSIK Patient App**
2. Click **💬 AI Assistant** tab
3. Start chatting!

**Features:**
- **Voice Input:** Click 🎤 to speak (uses Indonesian speech recognition)
- **Text Input:** Type messages manually
- **Voice Output:** AI responses are spoken aloud automatically
- **Repeated Question Detection:** AI notices when patient asks same question

---

## 💡 Usage Examples

### Example 1: Time Orientation
**Patient:** "Jam berapa sekarang?"
**AI:** "Saat ini pukul 14:30, Ibu Siti. Hari Selasa, 26 November 2025."

### Example 2: Family Reminder
**Patient:** "Siapa nama cucu saya?"
**AI:** "Cucu Ibu bernama Rina dan Budi, Ibu. Mereka sangat sayang kepada Ibu."

### Example 3: Repeated Question
**Patient:** "Jam berapa sekarang?"
*(asks again after 2 minutes)*
**AI:** "Seperti yang saya sebutkan tadi, Ibu, sekarang pukul 14:32. Tidak perlu khawatir, saya di sini untuk membantu Ibu."

### Example 4: Activity Suggestion
**Patient:** "Saya bosan, apa yang harus saya lakukan?"
**AI:** "Ibu suka berkebun, kan? Mungkin Ibu bisa menyiram tanaman di taman. Atau mendengarkan musik favorit Ibu?"

---

## 🔧 Technical Details

### Architecture
```
Patient App (ARSIK)
    ↓ (sends message)
Backend API (ARSIK_backend)
    ↓ (retrieves config + API key)
AI Provider (Groq/OpenAI/Claude)
    ↓ (returns response)
Patient App
    ↓ (speaks response via TTS)
```

### Security
- ✅ API keys stored on backend (not exposed to patient browser)
- ✅ Patient app only receives configuration, not the actual key
- ✅ All API calls go through backend proxy

### Storage
- **Backend:** API keys, patient profiles (in-memory, use DB in production)
- **Patient App:** Conversation history (localStorage, last 10 messages)

### API Endpoints Added

**Backend (port 3001):**
- `POST /api/ai-config` - Save AI configuration
- `GET /api/ai-config/:patientId` - Get AI configuration
- `POST /api/ai-test` - Test AI connection
- `POST /api/ai-chat` - Proxy for AI chat
- `GET /api/ai-summary/:patientId` - Get conversation summary

---

## 🚀 Quick Start

```bash
# 1. Start Backend
cd ARSIK_backend
npm start

# 2. Start Patient App
cd ARSIK
npm run dev

# 3. Start Caregiver App
cd ARSIK_suster
npm run dev

# 4. Get FREE Groq API key
# Visit: https://console.groq.com
# Create API key

# 5. Configure in Caregiver App
# Profile tab → Enter Patient ID → Configure AI
```

---

## 📊 Cost Estimation

### Groq (FREE)
- **Cost:** $0/month
- **Limit:** 14,400 requests/day
- **Usage:** ~480 conversations/day (each ~30 tokens)
- **Verdict:** ✅ Best for most cases

### OpenAI (Paid)
- **Cost:** ~$4.50/month
- **Usage:** 5,000 tokens/day average
- **Model:** GPT-4o-mini ($0.15/1M input, $0.60/1M output)
- **Verdict:** 💰 For highest quality

### Claude (Paid)
- **Cost:** ~$2.25/month
- **Usage:** 5,000 tokens/day average
- **Model:** Claude 3 Haiku ($0.25/1M input, $1.25/1M output)
- **Verdict:** 💰 For long conversations

---

## 🐛 Troubleshooting

### "AI belum dikonfigurasi"
**Solution:** Configure API key in caregiver app first

### "API Error: 401"
**Solution:** Invalid API key, check if you copied it correctly

### "API Error: 429"
**Solution:** Rate limit exceeded, wait a minute or upgrade plan

### No voice output
**Solution:** Check browser allows audio, test TTS in Settings

### Patient ID not found
**Solution:** Open patient app first to generate ID, then check localStorage

---

## 🎓 How It Works

### System Prompt
The AI is given a comprehensive system prompt that instructs it to:
1. Act as a compassionate dementia care assistant
2. Keep responses short (2-3 sentences)
3. Detect repeated questions and respond warmly
4. Use patient's name and family members in responses
5. Provide time/date orientation
6. Suggest activities based on interests

### Conversation History
- Keeps last 20 messages in memory
- Uses last 8 messages as context for AI
- Detects repeated questions with 70% similarity threshold
- Tracks timestamps for "minutes ago" reminders

### Response Length
- Limited to 150 tokens (~50-75 words)
- Keeps responses short for better comprehension
- Reduces costs and latency

---

## 📈 Future Enhancements

- [ ] Multi-patient support with profiles
- [ ] Emotion detection from voice tone
- [ ] Daily conversation summaries for caregivers
- [ ] Proactive reminders based on routine patterns
- [ ] Voice cloning for familiar voices
- [ ] Integration with calendar/medication reminders

---

## 🙏 Credits

Built for dementia patients and their caregivers
Using state-of-the-art LLM technology with compassion

**Models:**
- Llama 3.1 70B (Groq)
- GPT-4o-mini (OpenAI)
- Claude 3 Haiku (Anthropic)

**Technologies:**
- React 19
- Web Speech API (STT + TTS)
- face-api.js
- Express.js

---

## 📞 Support

For issues or questions, check:
1. Browser console for error messages
2. Backend terminal for API errors
3. Test connection in caregiver app
4. Verify API key is valid

---

**🎉 Enjoy helping your loved ones with AI-powered memory support!**
