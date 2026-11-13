import { useEffect, useRef, useState } from "react";
import { MessageCircle, Mic, MicOff, Send, Volume2, VolumeX, ShieldCheck, Sparkles } from "lucide-react";

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

  const makePreviewReply = (value: string) => {
    const text = value.toLowerCase();
    if (["sad", "lonely", "cry", "upset", "hurt", "down"].some(word => text.includes(word)))
      return "That sounds like a lot to carry. Thank you for putting it into words. Would you like to tell me what part has felt hardest?";
    if (["stress", "overwhelm", "pressure", "anxious", "worry", "worried"].some(word => text.includes(word)))
      return "It can be difficult when so much is happening at once. What feels like the biggest thing asking for your attention right now?";
    if (["friend", "relationship", "argument", "fight"].some(word => text.includes(word)))
      return "Relationships can bring up complicated feelings. What happened, and what did it mean to you?";
    if (["happy", "excited", "proud", "good"].some(word => text.includes(word)))
      return "I'm glad you shared that. What do you think made this moment feel especially good?";
    return "I'm listening. Could you tell me a little more about what that has been like for you? We can take it one step at a time.";
  };

  const sendMessage = (value = draft) => {
    const clean = value.trim();
    if (!clean) return;
    const reply = makePreviewReply(clean);
    const id = Date.now();
    setMessages(previous => [...previous, { id, role: "you", text: clean }, { id: id + 1, role: "companion", text: reply }]);
    setDraft("");
    speak(reply);
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
        <div className="quiet-room-scene" aria-label="Illustrated companion sitting on a sofa in a peaceful room">
          <div className="quiet-window"><span /><i /><b /></div>
          <div className="quiet-plant"><i /><i /><i /><b /></div>
          <div className="quiet-lamp"><i /><b /></div>
          <div className="quiet-sofa">
            <div className="quiet-sofa-back" />
            <div className="quiet-cushion quiet-cushion-one" />
            <div className="quiet-cushion quiet-cushion-two" />
            <div className="quiet-character">
              <div className="quiet-hair" />
              <div className="quiet-head"><i /><b /></div>
              <div className="quiet-neck" />
              <div className="quiet-body"><i /><b /></div>
              <div className="quiet-arm quiet-arm-left" />
              <div className="quiet-arm quiet-arm-right" />
            </div>
            <div className="quiet-sofa-seat" />
            <div className="quiet-sofa-base" />
            <div className="quiet-sofa-leg quiet-leg-left" />
            <div className="quiet-sofa-leg quiet-leg-right" />
          </div>
          <div className="quiet-table"><i /></div>
          <div className="quiet-rug" />
          <div className="quiet-scene-caption"><span className={speaking ? "quiet-speaking-dot active" : "quiet-speaking-dot"} />{speaking ? " Your companion is speaking" : " A moment just for you"}</div>
        </div>
        <div className="quiet-chat-panel">
          <div className="quiet-chat-top">
            <div className="quiet-avatar"><MessageCircle size={18} /></div>
            <div><strong>Your Miumi companion</strong><span>Supportive reflection · Preview mode</span></div>
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
              <button type="submit" className="quiet-send-button" disabled={!draft.trim()}><Send size={16} /> Send</button>
            </div>
          </form>
          <div className="quiet-safety-note"><ShieldCheck size={15} /><span>This is an early demo, not therapy or a crisis service. Replies are scripted, not generated by a clinician or a live AI. Avoid sharing identifying or highly sensitive details. If you feel unsafe or need urgent help, contact a trusted person or local emergency support.</span></div>
        </div>
      </div>
      <div className="quiet-bottom-note"><Sparkles size={16} /><span>You can pause, leave, or switch to typing whenever you like. This demo does not save conversations.</span></div>
    </section>
  );
}
