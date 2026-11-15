"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Bell, Check, ChevronRight, Clock3, Heart, Mic, MicOff, Moon, Plus, Settings2, Sparkles, Sun, Volume2, VolumeX, Waves } from "lucide-react";

type Routine = { id: string; title: string; time: string; done: boolean; category: string };
type SpeechRecognitionResultLike = { 0: { transcript: string }; isFinal: boolean };
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionResultLike> };
type Recognition = { lang: string; interimResults: boolean; continuous: boolean; onresult: ((event: SpeechRecognitionEventLike) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
type RecognitionWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

const starter: Routine[] = [
  { id: "r1", title: "Brush your teeth", time: "7:00 AM", done: false, category: "Self care" },
  { id: "r2", title: "Have a glass of water", time: "7:10 AM", done: false, category: "Wellness" },
  { id: "r3", title: "Take a proper bath", time: "7:30 AM", done: false, category: "Self care" },
  { id: "r4", title: "Eat breakfast", time: "8:00 AM", done: false, category: "Nutrition" }
];

export default function Home() {
  const [routines, setRoutines] = useState<Routine[]>(starter);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reply, setReply] = useState("Good morning. I'm glad you're here. Take a breath — we'll make today a little easier, one step at a time.");
  const [heard, setHeard] = useState("");
  const [mode, setMode] = useState<"demo" | "connected">("demo");
  const [now, setNow] = useState(new Date());
  const [notice, setNotice] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("voithreal-routines");
    if (saved) { try { setRoutines(JSON.parse(saved)); } catch { /* ignore invalid local state */ } }
    const tick = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => { localStorage.setItem("voithreal-routines", JSON.stringify(routines)); }, [routines]);

  const doneCount = routines.filter((r) => r.done).length;
  const progress = routines.length ? Math.round(doneCount / routines.length * 100) : 0;
  const greeting = useMemo(() => {
    const h = now.getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }, [now]);

  const speak = useCallback((text: string) => {
    if (muted || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [muted]);

  useEffect(() => { if (reply) speak(reply); }, []); // Initial greeting only.

  const answer = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setHeard(clean);
    setBusy(true);
    try {
      const context = "Today's local routine list: " + routines.map((r) => `${r.title} (${r.time}, ${r.done ? "completed" : "not completed"})`).join("; ");
      const res = await fetch("/api/companion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterance: clean, history: historyRef.current, context })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setReply(data.reply);
      setMode(data.mode);
      historyRef.current = [...historyRef.current, { role: "user", content: clean }, { role: "assistant", content: data.reply }].slice(-8);
      speak(data.reply);
      const lower = clean.toLowerCase();
      if (/i (did|have done|finished)|done with|completed/.test(lower)) {
        setRoutines((items) => {
          const next = items.find((r) => !r.done);
          return next ? items.map((r) => r.id === next.id ? { ...r, done: true } : r) : items;
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "I couldn't reach my thinking service.";
      setReply(message);
      speak(message);
    } finally { setBusy(false); }
  }, [routines, speak]);

  const startListening = () => {
    const w = window as RecognitionWindow;
    const Speech = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Speech) { setNotice("Voice recognition isn't supported in this browser. Please open VOITHREAL in Chrome."); return; }
    if (recognitionRef.current) recognitionRef.current.stop();
    const rec = new Speech();
    rec.lang = "en-NG";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result?.isFinal) void answer(result[0].transcript);
    };
    rec.onerror = () => { setListening(false); setNotice("I couldn't hear that clearly. Tap the microphone and try again."); };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    try { rec.start(); setListening(true); setNotice(""); } catch { setListening(false); setNotice("Microphone is busy. Try again in a moment."); }
  };

  const toggleRoutine = (id: string) => setRoutines((items) => items.map((r) => r.id === id ? { ...r, done: !r.done } : r));
  const addRoutine = () => {
    const title = window.prompt("What should I remind you to do?");
    if (!title?.trim()) return;
    const time = window.prompt("What time? (e.g. 6:30 PM)", "9:00 AM") || "Anytime";
    setRoutines((items) => [...items, { id: crypto.randomUUID(), title: title.trim(), time, done: false, category: "Personal" }]);
    setNotice("Added to your routine. Keep VOITHREAL open for local reminders.");
  };

  const enableReminders = async () => {
    if (!("Notification" in window)) { setNotice("This browser does not support notifications."); return; }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { setNotice("Notifications are blocked. You can enable them in browser settings."); return; }
    setRemindersEnabled(true);
    setNotice("Notifications enabled for this browser. Reminder delivery is best-effort while the app is open.");
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      const current = new Date();
      const label = current.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      routines.filter((r) => !r.done && r.time.toLowerCase() === label.toLowerCase()).forEach((r) => new Notification("A gentle nudge from VOITHREAL", { body: r.title }));
    }, 30000);
  };

  return (
    <main className="shell">
      <aside className="rail">
        <div className="brand-mark"><Waves size={22} strokeWidth={1.8} /></div>
        <div className="rail-spacer" />
        <button className="rail-button active" aria-label="Companion"><Heart size={19} /></button>
        <button className="rail-button" aria-label="Activity"><Activity size={19} /></button>
        <button className="rail-button" aria-label="Reminders" onClick={enableReminders}><Bell size={19} /></button>
        <div className="rail-spacer" />
        <button className="rail-button" aria-label="Settings" onClick={() => setNotice("Your personal data is currently stored on this device.")}><Settings2 size={19} /></button>
        <div className="avatar">V</div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="wordmark"><span className="wordmark-icon"><Waves size={17} /></span> VOITHREAL <span className="beta">EARLY ACCESS</span></div>
          <div className="top-actions">
            <span className="connection"><i /> {mode === "connected" ? "Intelligence connected" : "Local companion mode"}</span>
            <button className="icon-button" onClick={enableReminders} aria-label="Enable notifications"><Bell size={18} /></button>
            <button className="icon-button" onClick={() => setMuted((m) => !m)} aria-label="Toggle voice"><Volume2 size={18} />{muted && <span className="slash" />}</button>
          </div>
        </header>

        <div className="content-grid">
          <section className="main-column">
            <div className="welcome-row">
              <div><p className="eyebrow">{now.toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric" })}</p><h1>{greeting}<span className="period">.</span></h1><p className="subheading">Let's take today one step at a time.</p></div>
              <div className="weather-chip"><Sun size={16} /> <span>{now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></div>
            </div>

            <section className="companion-card">
              <div className="card-glow" />
              <div className="companion-head"><div className="online-label"><span className="pulse-dot" /> YOUR COMPANION</div><span className="session-tag">SESSION 01</span></div>
              <div className={`orb-wrap ${listening ? "is-listening" : ""} ${speaking ? "is-speaking" : ""} ${busy ? "is-thinking" : ""}`}>
                <div className="orb-ring ring-one" /><div className="orb-ring ring-two" /><div className="orb-core"><div className="orb-shine" /><Waves size={35} strokeWidth={1.4} /></div>
              </div>
              <div className="voice-status">{listening ? "I'm listening..." : busy ? "Let me think..." : speaking ? "Speaking with you" : "Here whenever you need me"}</div>
              <p className="companion-reply">{reply}</p>
              {heard && <p className="heard-line">YOU SAID · “{heard}”</p>}
              <div className="voice-controls">
                <button className={`mic-button ${listening ? "recording" : ""}`} onClick={listening ? () => recognitionRef.current?.stop() : startListening} disabled={busy} aria-label={listening ? "Stop listening" : "Start speaking"}>
                  {listening ? <MicOff size={23} /> : <Mic size={23} />}
                </button>
                <span>{listening ? "TAP TO STOP" : "TAP TO TALK"}</span>
                <button className="replay-button" onClick={() => speak(reply)} aria-label="Repeat response"><Volume2 size={17} /></button>
              </div>
              <p className="privacy-note"><Heart size={12} /> Your conversations stay in this session. Your routine is saved on this device.</p>
            </section>

            {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")}>Dismiss</button></div>}

            <section className="routine-section">
              <div className="section-heading"><div><p className="eyebrow">A LITTLE STRUCTURE</p><h2>Your daily rhythm</h2></div><button className="text-button" onClick={addRoutine}><Plus size={15} /> Add routine</button></div>
              <div className="progress-card"><div className="progress-copy"><span>Today's progress</span><strong>{doneCount}<small> / {routines.length} completed</small></strong></div><div className="progress-track"><div className="progress-fill" style={{ width: progress + "%" }} /></div><span className="progress-percent">{progress}%</span></div>
              <div className="routine-list">
                {routines.map((r) => <button className={`routine-item ${r.done ? "completed" : ""}`} key={r.id} onClick={() => toggleRoutine(r.id)}>
                  <span className="check-circle">{r.done && <Check size={14} />}</span><span className="routine-info"><strong>{r.title}</strong><small>{r.category}</small></span><span className="routine-time"><Clock3 size={13} /> {r.time}</span><ChevronRight className="routine-chevron" size={16} />
                </button>)}
                {!routines.length && <div className="empty-state">Your day is a blank page. Add a routine to get started.</div>}
              </div>
            </section>
          </section>

          <aside className="side-column">
            <section className="side-card day-card"><div className="side-card-title"><span className="mini-icon"><Sun size={16} /></span><span>Today, gently</span></div><h3>You don't have to do it all.</h3><p>Just take the next small step. Consistency grows from little things done with care.</p><div className="day-divider" /><div className="day-stat"><span>Daily rhythm</span><strong>{progress}%</strong></div><div className="mini-progress"><i style={{ width: progress + "%" }} /></div></section>
            <section className="side-card"><div className="side-card-title"><span className="mini-icon violet"><Sparkles size={16} /></span><span>A small reminder</span></div><p className="quote">“Rest is productive. Eating is productive. Taking care of yourself is productive.”</p><span className="quote-caption">A NOTE FROM VOITHREAL</span></section>
            <section className="side-card reminder-card"><div className="side-card-title"><span className="mini-icon green"><Bell size={16} /></span><span>Gentle reminders</span></div><p>Let your browser give you a nudge when it's time for the next thing.</p><button className="enable-button" onClick={enableReminders}>{remindersEnabled ? <Check size={15} /> : <Bell size={15} />}{remindersEnabled ? "Notifications enabled" : "Enable notifications"}</button><small>Best-effort while this app stays open.</small></section>
            <div className="side-footer"><span>MADE WITH CARE</span><Heart size={12} fill="currentColor" /><span>VOITHREAL © 2026</span></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
