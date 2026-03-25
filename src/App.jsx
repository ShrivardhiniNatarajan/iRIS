import React, { useState } from 'react';
import { Play, UploadCloud, FileText, Settings, Download, Zap } from 'lucide-react';
import './App.css';

function App() {
  const [step, setStep] = useState('upload'); // "upload", "processing", "result"

  const handleUpload = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('result');
    }, 2500); // Mock processing time
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
                  <button className="btn btn-primary" onClick={handleUpload}>
                    <Play size={18} /> Test Mock Upload
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
                <button className="btn btn-secondary">
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
              <div className="result-actions">
                <button className="btn btn-primary" onClick={() => setStep('upload')}>
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
