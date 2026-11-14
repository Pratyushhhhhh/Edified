/**
 * ChatPage.jsx  —  /chat
 * Full-page AI News Assistant accessible from the navbar ("RAG Chatbot" link).
 * Generous, readable editorial layout matching The Edified's design system.
 */

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { ChatMessage, ChatInput, useChat } from "../components/rag/ChatCore";

const GREETING = "Hello! I'm The Edified's news assistant.\n\nAsk me anything about recent news — politics, technology, sports, world events, and more. I'll answer from verified articles in our database and cite my sources.";

const SUGGESTED = [
  "What's the latest in Indian politics?",
  "Any tech news today?",
  "What is happening in the economy?",
  "Show me today's top story",
];

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get("q");
  const { messages, input, setInput, loading, bottomRef, sendMessage, clearChat } = useChat(GREETING);
  const handledQueryRef = useRef(false);

  useEffect(() => {
    if (queryParam && !handledQueryRef.current && messages.length === 1 && !loading) {
      handledQueryRef.current = true;
      sendMessage(queryParam);
    }
  }, [queryParam, messages.length, loading]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <style>{`
        @keyframes ragDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <main style={{ flex: 1, maxWidth: 960, margin: "0 auto", width: "100%", padding: "48px 24px 60px", animation: "fadeUp 0.35s ease both" }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 32, borderBottom: "2px solid var(--c-on-surface)", paddingBottom: 22 }}>
          <div style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--c-secondary)", marginBottom: 10 }}>
            AI News Assistant
          </div>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(32px, 5.5vw, 48px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.025em", margin: 0 }}>
            Ask The Edified
          </h1>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 15, color: "var(--c-on-surface-variant)", lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}>
            Grounded answers synthesized from{" "}
            <strong style={{ color: "var(--c-on-surface)" }}>verified news articles</strong> across 30+ outlets in our database — no hallucinations, cited sources only.
          </p>
        </div>

        {/* ── Suggested questions (only shown before any user message) ── */}
        {messages.length === 1 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--c-outline)", marginBottom: 14 }}>
              Try asking
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {SUGGESTED.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  style={{
                    textAlign: "left", background: "var(--c-surface-container)",
                    border: "1px solid var(--c-outline-variant)", borderRadius: 12,
                    padding: "16px 18px", fontFamily: "'Public Sans', sans-serif",
                    fontSize: 14, fontWeight: 500, color: "var(--c-on-surface)", cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s, transform 0.15s", lineHeight: 1.45,
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--c-surface-high)"; e.currentTarget.style.borderColor = "var(--c-outline)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--c-surface-container)"; e.currentTarget.style.borderColor = "var(--c-outline-variant)"; }}
                >
                  <span>{q}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--c-outline)", flexShrink: 0 }}>arrow_forward</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Chat messages container ── */}
        <div style={{
          background: "var(--c-surface-low)", border: "1px solid var(--c-outline-variant)",
          borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          {/* Messages scroll area */}
          <div style={{ padding: "26px 24px 12px", minHeight: 380, maxHeight: "64vh", overflowY: "auto" }}>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}

            {/* Clear button after conversation starts */}
            {messages.length > 2 && (
              <div style={{ textAlign: "center", paddingBottom: 8, paddingTop: 8 }}>
                <button onClick={() => clearChat(GREETING)}
                  style={{ background: "none", border: "none", fontSize: 11, color: "var(--c-outline)", cursor: "pointer", fontFamily: "'Public Sans', sans-serif", letterSpacing: "0.08em" }}>
                  Clear conversation
                </button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => sendMessage()}
            loading={loading}
            placeholder="Ask about today's news…"
            autoFocus={false}
          />
        </div>

        {/* ── Disclaimer ── */}
        <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 12, color: "var(--c-on-surface-variant)", marginTop: 16, lineHeight: 1.55, opacity: 0.75 }}>
          Answers are grounded strictly in articles from The Edified's database. The assistant cites sources inline and will acknowledge when it doesn't have enough information.
        </p>

      </main>

      <Footer />
    </div>
  );
}
