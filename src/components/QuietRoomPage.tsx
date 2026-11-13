import { useEffect, useRef, useState } from "react";
import { MessageCircle, Mic, MicOff, Send, Volume2, VolumeX, ShieldCheck, Sparkles } from "lucide-react";
import QuietRoomAvatar from "@/components/QuietRoomAvatar";

type Message = { id: number; role: "companion" | "you"; text: string };

export default function QuietRoomPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "companion", text: "Welcome. This is a gentle place to pause. What has been on your mind today?" },
  ]);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState("");
  const [sending, setSending] = useState(false);
  const recognition = useRef<any>(null);

  useEffect(() => () => {
    try { recognition.current?.stop(); } catch { /* microphone already stopped */ }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const speak = (text: string) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utterance.pitch = 1.02;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (value = draft) => {
    const clean = value.trim();
    if (!clean || sending) return;
    setDraft("");
    setVoiceNotice("");
    setMessages(previous => [...previous, { id: Date.now(), role: "you", text: clean }]);
    setSending(true);
    try {
      const response = await fetch("/api/quiet-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, history: messages.slice(-12).map(({ role, text }) => ({ role, content: text })) }),
      });
      const contentType = response.headers.get("content-type") || "";
      const responseText = await response.text();
      let data: { error?: string; reply?: string } = {};
      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error("Quiet Room received an invalid response. Please try again.");
        }
      } else {
        throw new Error("Quiet Room's API endpoint returned a webpage instead of JSON. The latest Cloudflare Pages deployment may not include the Quiet Room Function yet. Please redeploy the latest main-branch commit.");
      }
      if (!response.ok) throw new Error(data?.error || "The companion couldn't respond just now.");
      const reply = String(data.reply || "").trim();
      if (!reply) throw new Error("The companion returned an empty reply. Please try again.");
      setMessages(previous => [...previous, { id: Date.now() + 1, role: "companion", text: reply }]);
      speak(reply);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setVoiceNotice(message.includes("Workers AI binding") || message.includes("free AI service is not connected")
        ? "The free AI connection still needs to be enabled in Cloudflare Pages. Your message was not sent to the companion."
        : message + " It remains visible only in this open page; it was not sent successfully or saved to an account.");
    } finally {
      setSending(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceNotice("Voice input isn't supported in this browser. You can still type your message.");
      return;
    }
    try {
      const instance = new SpeechRecognition();
      instance.lang = navigator.language || "en-US";
      instance.interimResults = true;
      instance.continuous = false;
      instance.onresult = (event: any) => {
        const transcript = Array.from(event.results as any[]).map((result: any) => result[0].transcript).join("");
        setDraft(transcript);
        if (event.results[event.results.length - 1]?.isFinal) setListening(false);
      };
      instance.onerror = () => {
        setListening(false);
        setVoiceNotice("The microphone stopped. Check browser microphone permission and try again.");
      };
      instance.onend = () => setListening(false);
      recognition.current = instance;
      setVoiceNotice("Microphone is on. Speak naturally; your words will appear in the message box.");
      setListening(true);
      instance.start();
    } catch {
      setListening(false);
      setVoiceNotice("Couldn't start voice input. Please check microphone permission.");
    }
  };

  return (
    <section className="quiet-page page-enter">
      <div className="quiet-heading">
        <p className="eyebrow">A GENTLER PLACE TO PAUSE</p>
        <h1>The Quiet Room</h1>
        <p>A calm space to talk, reflect, and find your next small step.</p>
      </div>
      <div className="quiet-room-shell">
        <div className="quiet-room-scene quiet-room-3d-scene">
          <QuietRoomAvatar speaking={speaking} />
          <div className="quiet-scene-caption"><span className={speaking ? "quiet-speaking-dot active" : "quiet-speaking-dot"} />{speaking ? " Your companion is speaking" : " A moment just for you"}</div>
          <div className="quiet-scene-tag"><Sparkles size={13} /> YOUR LITTLE SANCTUARY</div>
        </div>
        <div className="quiet-chat-panel">
          <div className="quiet-chat-top">
            <div className="quiet-avatar"><MessageCircle size={18} /></div>
            <div><strong>Your Miumi companion</strong><span>Supportive AI conversation · Not therapy</span></div>
            <button className="quiet-sound-toggle" onClick={() => { setVoiceEnabled(value => !value); window.speechSynthesis?.cancel(); setSpeaking(false); }} aria-label={voiceEnabled ? "Mute companion voice" : "Enable companion voice"}>{voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
          </div>
          <div className="quiet-messages" aria-live="polite">
            {messages.map(message => (
              <div key={message.id} className={message.role === "you" ? "quiet-message quiet-message-you" : "quiet-message quiet-message-companion"}>
                {message.role === "companion" && <span className="quiet-message-label">MIUMI COMPANION</span>}
                <p>{message.text}</p>
                {message.role === "companion" && <button className="quiet-replay" onClick={() => speak(message.text)}><Volume2 size={13} /> Listen</button>}
              </div>
            ))}
          </div>
          {voiceNotice && <p className="quiet-voice-notice" role="status">{voiceNotice}</p>}
          <form className="quiet-composer" onSubmit={event => { event.preventDefault(); sendMessage(); }}>
            <textarea value={draft} onChange={event => setDraft(event.target.value)} placeholder="You can write whatever feels comfortable..." rows={2} aria-label="Write your message" />
            <div className="quiet-composer-actions">
              <button type="button" className={listening ? "quiet-mic-button is-listening" : "quiet-mic-button"} onClick={() => listening ? recognition.current?.stop() : startListening()} aria-label={listening ? "Stop listening" : "Speak your message"}>{listening ? <MicOff size={17} /> : <Mic size={17} />}<span>{listening ? "Stop" : "Speak"}</span></button>
              <button type="submit" className="quiet-send-button" disabled={!draft.trim() || sending}><Send size={16} /> {sending ? "Thinking…" : "Send"}</button>
            </div>
          </form>
          <div className="quiet-safety-note"><ShieldCheck size={15} /><span>Miumi is an AI support companion, not a therapist or crisis service. Avoid sharing identifying details. If you feel unsafe, reach out to a trusted adult or local emergency support.</span></div>
        </div>
      </div>
      <div className="quiet-bottom-note"><Sparkles size={16} /><span>You can pause, leave, or switch to typing whenever you like. Your conversation is not saved by this page. Microphone access is only used when you choose Speak.</span></div>
    </section>
  );
}
