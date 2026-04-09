import React, { useState, useRef, useCallback } from 'react';
import { Play, UploadCloud, FileText, Download, Zap, Send, X, FileAudio, FileVideo } from 'lucide-react';
import './App.css';

// ──────────────────────────────────────────────────────────────────────────────
// API helpers
// ──────────────────────────────────────────────────────────────────────────────

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }

  return res.json(); // { fileId, originalName, size, mimeType }
}

async function generateNotesRequest(fileId) {
  const res = await fetch('/api/generate-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Note generation failed' }));
    throw new Error(err.error || 'Note generation failed');
  }

  return res.json(); // { fileId, notes }
}

async function askQuestion(fileId, question) {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, question }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to get answer' }));
    throw new Error(err.error || 'Failed to get answer');
  }

  const data = await res.json();
  return data.answer;
}

function downloadPdf(fileId) {
  window.open(`/api/download-pdf/${fileId}`, '_blank');
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType) {
  if (mimeType?.startsWith('audio/')) return <FileAudio size={18} className="file-type-icon" />;
  if (mimeType?.startsWith('video/')) return <FileVideo size={18} className="file-type-icon" />;
  return <FileText size={18} className="file-type-icon" />;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main App
// ──────────────────────────────────────────────────────────────────────────────

function App() {
  const [step, setStep] = useState('upload'); // 'upload' | 'processing' | 'result'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [notes, setNotes] = useState([]);
  const [fileId, setFileId] = useState(null);
  const [error, setError] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [isAskingQa, setIsAskingQa] = useState(false);

  const fileInputRef = useRef(null);
  const qaEndRef = useRef(null);

  // ── File selection ────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    const allowed = ['audio/', 'video/'];
    if (!allowed.some((type) => file.type.startsWith(type))) {
      setError('Please upload an audio or video file (MP3, WAV, MP4, MOV, etc.).');
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleInputChange = (e) => handleFileSelect(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  // ── Generate notes flow ───────────────────────────────────────────────────

  const handleGenerateNotes = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setError(null);
    setStep('processing');

    try {
      // Step 1 – Upload
      setProcessingStatus('Uploading file...');
      const uploadData = await uploadFile(selectedFile);
      const newFileId = uploadData.fileId;
      setFileId(newFileId);

      // Step 2 – Transcribe + generate
      setProcessingStatus('Transcribing audio... this may take a moment.');
      const notesData = await generateNotesRequest(newFileId);

      setNotes(notesData.notes);
      setQaHistory([]);
      setStep('result');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('upload');
    }
  };

  // ── Q&A ───────────────────────────────────────────────────────────────────

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim() || isAskingQa) return;

    const question = currentQuestion.trim();
    const newHistory = [...qaHistory, { role: 'user', content: question }];
    setQaHistory(newHistory);
    setCurrentQuestion('');
    setIsAskingQa(true);

    try {
      const answer = await askQuestion(fileId, question);
      setQaHistory([...newHistory, { role: 'ai', content: answer }]);
    } catch (err) {
      setQaHistory([...newHistory, { role: 'ai', content: `Error: ${err.message}` }]);
    } finally {
      setIsAskingQa(false);
      setTimeout(() => qaEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setNotes([]);
    setFileId(null);
    setQaHistory([]);
    setError(null);
    setProcessingStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <Zap className="logo-icon" />
          <span className="logo-text">iRIS NoteGen</span>
        </div>
      </header>

      <main className="main-content">

        {/* Hero (upload state) */}
        {step === 'upload' && (
          <div className="hero animate-fade-in">
            <h1>Transform Media into Structured Notes.</h1>
            <p>Upload your audio or video file. Our AI instantly transcribes and organises it into clean, business-standard study notes with headings, subtopics, and definitions.</p>
          </div>
        )}

        <div className="card animate-fade-in">

          {/* ── UPLOAD STATE ── */}
          {step === 'upload' && (
            <div className="upload-section">
              {/* Error banner */}
              {error && (
                <div className="error-banner" role="alert">
                  <span>{error}</span>
                  <button className="error-close" onClick={() => setError(null)} aria-label="Dismiss error"><X size={16} /></button>
                </div>
              )}

              {/* Dropzone */}
              <div
                className={`upload-dropzone${isDragOver ? ' drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload media file"
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  id="media-file-input"
                  type="file"
                  accept="audio/*,video/*"
                  style={{ display: 'none' }}
                  onChange={handleInputChange}
                />

                <UploadCloud size={48} className="upload-icon" />

                {selectedFile ? (
                  <div className="file-selected">
                    <div className="file-badge">
                      {getFileIcon(selectedFile.type)}
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                    </div>
                    <p className="file-hint">Click or drag to change file</p>
                  </div>
                ) : (
                  <>
                    <h3>Drag &amp; drop media here</h3>
                    <p>Supports MP3, WAV, MP4, MOV (max 500 MB)</p>
                  </>
                )}
              </div>

              <div className="upload-actions">
                <button
                  id="browse-files-btn"
                  className="btn btn-secondary"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  Browse Files
                </button>
                <button
                  id="generate-notes-btn"
                  className="btn btn-primary"
                  onClick={handleGenerateNotes}
                  disabled={!selectedFile}
                >
                  <Zap size={18} /> Generate Notes
                </button>
              </div>
            </div>
          )}

          {/* ── PROCESSING STATE ── */}
          {step === 'processing' && (
            <div className="processing-section">
              <div className="loader-container">
                <div className="loader-ring">
                  <div className="loader-spinner" />
                </div>
                <h3>Processing Media...</h3>
                <p className="processing-status">{processingStatus || 'Preparing...'}</p>
              </div>
              <div className="processing-steps">
                <div className={`proc-step ${processingStatus.includes('Uploading') ? 'active' : 'done'}`}>
                  <span className="proc-dot" />Upload
                </div>
                <div className="proc-connector" />
                <div className={`proc-step ${processingStatus.includes('Transcrib') ? 'active' : processingStatus.includes('Uploading') ? '' : 'done'}`}>
                  <span className="proc-dot" />Transcribe
                </div>
                <div className="proc-connector" />
                <div className="proc-step">
                  <span className="proc-dot" />Generate Notes
                </div>
              </div>
            </div>
          )}

          {/* ── RESULT STATE ── */}
          {step === 'result' && (
            <div className="result-section">
              <div className="result-header">
                <h2>Generated Study Notes</h2>
                <button
                  id="export-pdf-btn"
                  className="btn btn-secondary"
                  onClick={() => downloadPdf(fileId)}
                >
                  <Download size={18} /> Export PDF
                </button>
              </div>

              {/* Notes */}
              <div className="notes-content">
                {notes.map((section, idx) => (
                  <div key={idx} className="note-block animate-fade-in">
                    <h3>{section.heading}</h3>

                    {section.subtopics?.map((sub, sIdx) => (
                      <div key={sIdx} className="subtopic">
                        <h4>{sub.title}</h4>
                        <p>{sub.content}</p>
                      </div>
                    ))}

                    {section.definitions?.map((def, dIdx) => (
                      <div key={dIdx} className="definition">
                        <strong>Definition — {def.term}:</strong>
                        <p>{def.definition}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Q&A */}
              <div className="qa-section">
                <h3>Follow-up Questions</h3>
                <div className="qa-history" id="qa-history">
                  {qaHistory.length === 0 && (
                    <p className="qa-empty">Ask the AI any questions about the notes...</p>
                  )}
                  {qaHistory.map((msg, index) => (
                    <div key={index} className={`qa-message ${msg.role}`}>
                      <strong>{msg.role === 'user' ? 'You' : 'iRIS'}:</strong> {msg.content}
                    </div>
                  ))}
                  {isAskingQa && <div className="qa-message ai thinking">iRIS is thinking<span className="dots">...</span></div>}
                  <div ref={qaEndRef} />
                </div>
                <div className="qa-input-container">
                  <input
                    id="qa-input"
                    type="text"
                    className="qa-input"
                    placeholder="Ask a follow-up question..."
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                    disabled={isAskingQa}
                  />
                  <button
                    id="qa-send-btn"
                    className="btn btn-primary qa-send-btn"
                    onClick={handleAskQuestion}
                    disabled={isAskingQa || !currentQuestion.trim()}
                    aria-label="Send question"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>

              <div className="result-actions">
                <button id="upload-another-btn" className="btn btn-primary" onClick={handleReset}>
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
