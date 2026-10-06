import React from 'react';
import { Sparkles, Code2, BookOpen, FileText, Lightbulb, ShieldCheck } from 'lucide-react';

export default function WelcomeScreen({ onSelectPrompt }) {
  const exampleCards = [
    {
      icon: <Lightbulb size={20} className="card-icon text-amber" />,
      category: 'Explain a concept',
      prompt: 'Explain quantum computing in simple terms for a beginner'
    },
    {
      icon: <Code2 size={20} className="card-icon text-cyan" />,
      category: 'Help me write code',
      prompt: 'Write a JavaScript function to debounce an API call with proper cleanup'
    },
    {
      icon: <BookOpen size={20} className="card-icon text-indigo" />,
      category: 'Help me study',
      prompt: 'Create a 5-question quiz on world history with answer explanations'
    },
    {
      icon: <FileText size={20} className="card-icon text-emerald" />,
      category: 'Summarize something',
      prompt: 'Summarize the key principles of clean software architecture and design'
    }
  ];

  return (
    <div className="welcome-container">
      <div className="welcome-hero">
        <div className="aira-emblem-wrapper">
          <div className="aira-emblem-glow"></div>
          <div className="aira-emblem">
            <Sparkles size={32} className="aira-emblem-icon" />
          </div>
        </div>

        <h1 className="welcome-title">Aira AI</h1>
        <p className="welcome-subtitle">Your local AI assistant</p>
        <p className="welcome-tagline">Ask me anything...</p>

        <div className="welcome-badges">
          <div className="privacy-pill">
            <ShieldCheck size={14} />
            <span>100% Local & Private</span>
          </div>
          <div className="privacy-pill">
            <span className="dot-pulse"></span>
            <span>Powered by Ollama</span>
          </div>
        </div>
      </div>

      <div className="welcome-cards-grid">
        {exampleCards.map((card, idx) => (
          <button
            key={idx}
            className="welcome-card"
            onClick={() => onSelectPrompt(card.prompt)}
            type="button"
          >
            <div className="welcome-card-header">
              {card.icon}
              <span className="welcome-card-category">{card.category}</span>
            </div>
            <p className="welcome-card-prompt">"{card.prompt}"</p>
          </button>
        ))}
      </div>
    </div>
  );
}
