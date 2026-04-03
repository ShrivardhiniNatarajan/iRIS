import React, { useState } from 'react';
import { Play, UploadCloud, FileText, Settings, Download, Zap, Send } from 'lucide-react';
import './App.css';

function App() {
  const [step, setStep] = useState('upload'); // "upload", "processing", "result"
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [isAskingQa, setIsAskingQa] = useState(false);

  // --- BACKEND INTEGRATION STUBS ---
  // TODO (Backend): Replace these stubs with actual fetch/axios calls to your endpoints

  const uploadFileToBackend = async (file) => {
    // e.g. const formData = new FormData(); formData.append('file', file);
    // return await axios.post('/api/upload', formData);
    console.log("Mock upload file to backend");
  };

  const generateNotesFromBackend = async () => {
    // e.g. return await axios.post('/api/generate-notes', { fileId });
    console.log("Mock generate notes from backend");
  };

  const downloadPdfFromBackend = async () => {
    // e.g. window.open('/api/download-pdf', '_blank');
    console.log("Mock download PDF from backend");
  };

  const askFollowUpQuestionToBackend = async (question) => {
    // e.g. return await axios.post('/api/ask', { question });
    console.log("Mock asking question:", question);
    return "This is a mock answer from the AI based on your generated notes. Your backend will replace this.";
  };

  // --- END BACKEND STUBS ---

  const handleGenerateNotes = async () => {
    setStep('processing');
    
    // You can hook up your backend here:
    // await uploadFileToBackend(null); 
    // await generateNotesFromBackend();

    setTimeout(() => {
      setStep('result');
    }, 2500); // Mock processing delay
  };

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim() || isAskingQa) return;
    
    const newHistory = [...qaHistory, { role: 'user', content: currentQuestion }];
    setQaHistory(newHistory);
    setCurrentQuestion('');
    setIsAskingQa(true);

    try {
      const answer = await askFollowUpQuestionToBackend(currentQuestion);
      setQaHistory([...newHistory, { role: 'ai', content: answer }]);
    } catch (error) {
      console.error("Error asking question:", error);
    } finally {
      setIsAskingQa(false);
    }
  };

  return (
    <div className="app-container">
      {/* Premium Header */}
      <header className="header">
        <div className="logo-container">
          <Zap className="logo-icon" />
          <span className="logo-text">iRIS NoteGen</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        
        {step === 'upload' && (
          <div className="hero animate-fade-in">
            <h1>Transform Media into Structured Notes.</h1>
            <p>Upload your audio or video file. Our AI instantly transcribes and organizes it into clean, business-standard study notes with headings, subtopics, and definitions.</p>
          </div>
        )}

        <div className="card animate-fade-in">
          {step === 'upload' && (
            <div className="upload-section">
              <div className="upload-dropzone">
                <UploadCloud size={48} className="upload-icon" />
                <h3>Drag & drop media here</h3>
                <p>Supports MP3, WAV, MP4, MOV (max 500MB)</p>
                <div className="upload-actions">
                  <button className="btn btn-secondary">Browse Files</button>
                  <button className="btn btn-primary" onClick={handleGenerateNotes}>
                    <Zap size={18} /> Generate Notes
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="processing-section">
              <div className="loader-container">
                <div className="loader-spinner"></div>
                <h3>Processing Media...</h3>
                <p>Transcribing and generating structural insights.</p>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="result-section">
              <div className="result-header">
                <h2>Generated Study Notes</h2>
                <button className="btn btn-secondary" onClick={downloadPdfFromBackend}>
                  <Download size={18} /> Export PDF
                </button>
              </div>
              <div className="notes-content">
                <div className="note-block">
                  <h3>1. Introduction to AI Models</h3>
                  <div className="subtopic">
                    <h4>1.1 Subtopic: Machine Learning Overview</h4>
                    <p>Machine learning provides systems the ability to automatically learn and improve from experience without being explicitly programmed.</p>
                  </div>
                  <div className="definition">
                    <strong>Definition - Neural Network:</strong>
                    <p>A series of algorithms that endeavors to recognize underlying relationships in a set of data through a process that mimics the way the human brain operates.</p>
                  </div>
                </div>
              </div>
              <div className="qa-section">
                <h3>Follow-up Questions</h3>
                <div className="qa-history">
                  {qaHistory.length === 0 && <p className="qa-empty">Ask the AI any questions about the notes...</p>}
                  {qaHistory.map((msg, index) => (
                    <div key={index} className={`qa-message ${msg.role}`}>
                      <strong>{msg.role === 'user' ? 'You' : 'iRIS'}:</strong> {msg.content}
                    </div>
                  ))}
                  {isAskingQa && <div className="qa-message ai">Thinking...</div>}
                </div>
                <div className="qa-input-container">
                  <input 
                    type="text" 
                    className="qa-input" 
                    placeholder="Ask a follow up question..." 
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  />
                  <button className="btn btn-primary qa-send-btn" onClick={handleAskQuestion} disabled={isAskingQa}>
                    <Send size={18} />
                  </button>
                </div>
              </div>

              <div className="result-actions" style={{ marginTop: '2rem' }}>
                <button className="btn btn-primary" onClick={() => {
                  setStep('upload');
                  setQaHistory([]);
                }}>
                  Upload Another File
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
