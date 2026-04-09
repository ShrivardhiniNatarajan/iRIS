# 🚀 iRIS NoteGen

iRIS NoteGen is a comprehensive, AI-powered application designed for taking large amounts of knowledge (like audio or video recordings) and distilling them into high-quality generated notes. The tool features custom interactions for Q&A and seamless exporting capabilities into PDF formats.

## 🌟 Key Features
- **🎙️ Upload & Transcribe:** Upload media to transcribe spoken words into structured text seamlessly.
- **📝 Automated Note Generation:** Automatically generate structured and organized notes from content using cutting-edge AI models.
- **💬 Interactive Q&A:** Send contextual questions to the AI about your notes or transcribed content.
- **📄 Export to PDF:** Download cleanly formatted PDF copies of your notes for studying or archival.

## 🛠️ Tech Stack
- **Frontend:** React, Vite (located in `./iRIS`)
- **Backend:** Node.js, Express, Multer for file streaming (located in `./backend`)
- **AI Model:** Google Gemini API (`@google/generative-ai`)

## 📋 Prerequisites
Before you begin, ensure you have the following installed:
1. **[Node.js](https://nodejs.org/en/download/)** (v18 or higher recommended)
2. **npm** (comes installed with Node.js)
3. A **Google Gemini API Key** (for processing AI operations)

---

## ⚙️ Setup & Installation

**1. Clone the repository**
```bash
git clone https://github.com/ShrivardhiniNatarajan/iRIS.git
cd iRIS
```

**2. Configure Environment Variables**
Navigate into the backend directory and set up your environment keys. There is a `.env.example` file provided:
```bash
cd backend
cp .env.example .env
```
Open `.env` in a text editor and paste your actual Gemini key:
`GEMINI_API_KEY=your_google_gemini_api_key_here`

*(Note: Leaving the API key blank runs the app in "mock mode," but will not generate authentic AI data.)*

---

## 🚀 How to Run 

### 🍏 Mac OS & 🐧 Linux 
We provide a convenient bash wrapper script that will automatically install dependencies and boot both the Frontend and Backend servers simultaneously!

Simply run:
```bash
./run.sh
```
*(Use `Ctrl + C` inside the terminal to safely shut down both servers.)*

### 🪟 Windows

**Option A: Using Git Bash or WSL**
If you have Git Bash, WSL (Windows Subsystem for Linux), or a POSIX-compliant terminal installed, you can still use the wrapper:
```bash
./run.sh
```

**Option B: Using Native Command Prompt / PowerShell**
If you prefer running natively, open **two separate terminal windows**:

*Terminal 1: Start the Backend*
```powershell
cd backend
npm install
npm start
```
*(The backend runs on http://localhost:3001)*

*Terminal 2: Start the Frontend*
```powershell
cd iRIS
npm install
npm run dev
```
*(The frontend runs on http://localhost:5173)*

---

## 🌐 Accessing the App
Once started, the application will automatically be hosted at **`http://localhost:5173`**. Open this URL in any modern web browser to interact with iRIS NoteGen.

## 📄 License
MIT License
