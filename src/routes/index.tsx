import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode, type CSSProperties } from "react";
import {
  ArrowRight,
  Check,
   ChevronLeft,
  Clock3,
  CalendarDays,
  Users,
  Gamepad2,
  Gift,
  ImagePlus,
  Heart,
  House,
  Printer,
  RotateCcw,
  Trash2,
  Share2,
  Sparkles,
  Trophy,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import InBetweenGame from "@/components/game/InBetweenGame";
import QuietRoomPage from "@/components/QuietRoomPage";

import {
  calculateScore,
  getPersonalityType,
  personalityResults,
  quizzes,
  type QuizDefinition,
  type QuizId,
} from "@/lib/quiz-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Miumi — Your world, all in one place." },
      { name: "description", content: "Miumi is your all-in-one digital space to create, explore, play, plan, and keep what matters." },
      { property: "og:title", content: "Miumi — Your world, all in one place." },
      { property: "og:description", content: "Create, explore, play, plan, and keep what matters — all in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MiumiHome,
});

type Page =
  | "home"
  | "quizzes"
  | "results"
  | "play"
  | "quiz-result"
  | "friendship"
  | "calendar"
  | "duo"
  | "dedicate"
  | "games"
  | "photo-studio"
  | "museum"
  | "in-between"
  | "quiet-room";
type CompletedQuiz = {
  quizId: QuizId;
  answers: number[];
  correct: number;
  total: number;
  personalityType?: keyof typeof personalityResults;
};

const dailyQuestions = [
  { prompt: "What tiny thing always makes your day a little brighter?", options: ["A kind text", "A sweet treat", "A sunny moment", "A big hug"] },
  { prompt: "If today had a color, what would it be?", options: ["Blush pink", "Butter yellow", "Soft lilac", "Mint green"] },
  { prompt: "What would you save for a perfect bestie day?", options: ["A picnic date", "A cozy movie", "A little adventure", "A café catch-up"] },
  { prompt: "Choose a little thing to wish for today.", options: ["A happy surprise", "A long laugh", "A peaceful hour", "A lovely note"] },
  { prompt: "Which little treat sounds like you today?", options: ["Strawberry cake", "Warm cookies", "A fruity drink", "Chocolate bites"] },
  { prompt: "What's your favorite way to say 'I'm here for you'?", options: ["A voice note", "A warm hug", "A silly meme", "Just showing up"] },
  { prompt: "Pick a tiny bit of magic for your day.", options: ["A flower to keep", "A song I love", "A wish come true", "A friend nearby"] },
];

const quizById = (id: QuizId | null) => quizzes.find((quiz) => quiz.id === id) ?? null;

function MiumiHome() {
  const [showBrandSplash, setShowBrandSplash] = useState(true);
    useEffect(() => {
    const handleMagicClick = (event: MouseEvent) => {
      const particles = ["💗", "✨", "🌸", "⭐", "🦋"];

      const particle = document.createElement("span");
      particle.className = "magic-click-particle";
      particle.textContent =
        particles[Math.floor(Math.random() * particles.length)];

      particle.style.left = `${event.clientX}px`;
      particle.style.top = `${event.clientY}px`;

      document.body.appendChild(particle);

      window.setTimeout(() => {
        particle.remove();
      }, 1200);
    };

    window.addEventListener("click", handleMagicClick);

    return () => {
      window.removeEventListener("click", handleMagicClick);
    };
  }, []);
  const [page, setPage] = useState<Page>("home");
  useEffect(() => {
    const splashTimer = window.setTimeout(() => setShowBrandSplash(false), 1450);
    return () => window.clearTimeout(splashTimer);
  }, []);
  const [activeQuizId, setActiveQuizId] = useState<QuizId | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [completedResult, setCompletedResult] = useState<CompletedQuiz | null>(null);
  const [history, setHistory] = useState<CompletedQuiz[]>([]);
  const [dailyQuestionIndex, setDailyQuestionIndex] = useState(0);
  const [dailyAnswer, setDailyAnswer] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const quiz = quizById(activeQuizId);
  const question = quiz?.questions[questionIndex];
  const daily = dailyQuestions[dailyQuestionIndex] ?? dailyQuestions[0];

  useEffect(() => {
    const day = Math.floor(Date.now() / 86_400_000);
    setDailyQuestionIndex(day % dailyQuestions.length);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const startQuiz = (definition: QuizDefinition) => {
    setActiveQuizId(definition.id);
    setQuestionIndex(0);
    setAnswers([]);
    setCompletedResult(null);
    setPage("play");
  };

  const restartQuiz = () => {
    if (quiz) startQuiz(quiz);
  };

  const chooseAnswer = (answerIndex: number) => {
    if (!quiz) return;
    const nextAnswers = [...answers.slice(0, questionIndex), answerIndex];
    setAnswers(nextAnswers);
    if (questionIndex < quiz.questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      return;
    }
    const score = calculateScore(nextAnswers, quiz.questions);
    const result: CompletedQuiz = {
      quizId: quiz.id,
      answers: nextAnswers,
      correct: score.correct,
      total: score.total,
      ...(quiz.id === "personality" ? { personalityType: getPersonalityType(nextAnswers, quiz.questions) } : {}),
    };
    setCompletedResult(result);
    setHistory((previous) => [result, ...previous]);
    setPage("quiz-result");
  };

  const navigate = (next: Page) => {
    setNotice("");
    setPage(next);
    if (next !== "play" && next !== "quiz-result") setActiveQuizId(null);
  };

  const goBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      setAnswers(answers.slice(0, -1));
    } else {
      setActiveQuizId(null);
      setPage("quizzes");
    }
  };

  const shareResult = async (result: CompletedQuiz) => {
    const definition = quizById(result.quizId);
    const personality = result.personalityType ? personalityResults[result.personalityType] : null;
    const text = result.quizId === "this-or-that"
      ? `My little picks in miumi ♡: ${result.answers.map((answer, index) => `${definition?.questions[index]?.options[answer]?.emoji ?? "♡"} ${definition?.questions[index]?.options[answer]?.label ?? ""}`).join(" · ")}`
      : personality
        ? `I'm ${personality.name} ${personality.emoji} — find your inner sparkle in miumi ♡!`
        : `My bestie scored ${result.correct}/${result.total} on ${definition?.title ?? "a miumi quiz"} 🎀 Try it with your bestie!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "miumi ♡", text });
      } else {
        await navigator.clipboard.writeText(text);
        setNotice("Your result is copied, lovely! ♡");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        setNotice("Your result is copied, lovely! ♡");
      } catch {
        setNotice("Sharing isn't available just now. ♡");
      }
    }
  };

  const selectedPersonality = completedResult?.personalityType
    ? personalityResults[completedResult.personalityType]
    : null;

  return (
    <main className="miumi-app">
      {showBrandSplash && (
        <div className="miumi-brand-splash" role="status" aria-label="Loading Miumi">
          <div className="miumi-brand-splash-glow" />
          <img src="/brand/miumi_infinite_window_symbol_transparent.png" alt="" className="miumi-brand-splash-symbol" />
          <img src="/brand/miumi_horizontal_logo_transparent.png" alt="Miumi" className="miumi-brand-splash-wordmark" />
          <p>Your world, all in one place.</p>
          <div className="miumi-brand-splash-loader"><span /></div>
        </div>
      )}
      <div className="page-wrap">
        <header className="topbar">
          <button className="wordmark" onClick={() => navigate("home")} aria-label="Miumi home">
            <img className="wordmark-logo" src="/brand/miumi_horizontal_logo_transparent.png" alt="Miumi — Your world, all in one place." />
          </button>
          <span className="topbar-note"><Sparkles size={14} /> Your world, all in one place.</span>
          <Link
            to="/shop"
            aria-label="Visit Miumi Picks"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "9px 15px",
              borderRadius: 999,
              border: "1px solid #efd4df",
              background: "linear-gradient(135deg, #fff2f7, #f8efff)",
              color: "#895d73",
              fontSize: 13,
              fontWeight: 800,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            🎀 Miumi Picks
          </Link>
          <div className="topbar-actions">
            <button className="top-heart" onClick={() => navigate("results")} aria-label="See your results"><Heart size={19} /></button>
            <MiumiBunnyGuide onNavigate={navigate} />
          </div>
        </header>

        <div className={"app-layout" + (page === "home" ? " has-home-font-studio" : "")}>
         <aside className="side-nav" aria-label="Main navigation">
  <NavButton
    active={page === "home"}
    icon={<House />}
    label="Home"
    onClick={() => navigate("home")}
  />

  <NavButton
    active={page === "quizzes" || page === "play"}
    icon={<Sparkles />}
    label="Quizzes"
    onClick={() => navigate("quizzes")}
  />

  <NavButton
    active={page === "results" || page === "quiz-result"}
    icon={<Trophy />}
    label="My results"
    onClick={() => navigate("results")}
  />

  <NavButton
    active={page === "friendship"}
    icon={<Heart />}
    label="Friendship Universe"
    onClick={() => navigate("friendship")}
  />

  <NavButton active={page === "calendar"} icon={<CalendarDays />} label="Miumi Calendar" onClick={() => navigate("calendar")} />
  <NavButton active={page === "duo"} icon={<Users />} label="Miumi Duo" onClick={() => navigate("duo")} />

  <NavButton
    active={page === "dedicate"}
    icon={<Gift />}
    label="Create & Dedicate"
    onClick={() => navigate("dedicate")}
  />

  <NavButton
    active={page === "games"}
    icon={<Gamepad2 />}
    label="Playroom"
    onClick={() => navigate("games")}
  />

  <NavButton
    active={page === "in-between"}
    icon={<Sparkles />}
    label="THE IN-BETWEEN"
    onClick={() => navigate("in-between")}
  />

  <NavButton
    active={page === "photo-studio"}
    icon={<ImagePlus />}
    label="Photo Studio"
    onClick={() => navigate("photo-studio")}
  />

  <NavButton active={page === "museum"} icon={<Landmark />} label="Museum of Us" onClick={() => navigate("museum")} />
  <NavButton active={page === "quiet-room"} icon={<MessageCircle />} label="The Quiet Room" onClick={() => navigate("quiet-room")} />

  <div className="nav-little-note">
    made with<br />
    <span>♡ for besties ♡</span>
  </div>
</aside>

          <div className="content-column" key={page}>
            {page === "home" && (
              <HomePage
                daily={daily}
                dailyAnswer={dailyAnswer}
                onDailyAnswer={(answer) => { setDailyAnswer(answer); setNotice("Your little answer is tucked away ♡"); }}
                onBrowse={() => navigate("quizzes")}
                onStart={startQuiz}
              />
            )}
            {page === "quizzes" && <QuizCatalog onStart={startQuiz} />}
            {page === "results" && <ResultsPage history={history} onStart={startQuiz} onShare={shareResult} />}
            {page === "play" && quiz && question && (
              <QuizPlayer
                quiz={quiz}
                questionIndex={questionIndex}
                selectedAnswer={answers[questionIndex]}
                onChoose={chooseAnswer}
                onBack={goBack}
                onRestart={restartQuiz}
              />
            )}
            {page === "quiz-result" && quiz && completedResult && (
              <QuizResultPage
                quiz={quiz}
                result={completedResult}
                personality={selectedPersonality}
                onRestart={restartQuiz}
                onShare={() => shareResult(completedResult)}
                onQuizzes={() => navigate("quizzes")}
              />
                       )}

            {page === "friendship" && (
              <section className="feature-page">
                <div className="feature-hero">
                  <span className="feature-emoji">💗</span>
                  <p className="eyebrow">A LITTLE WORLD OF CONNECTION</p>
                  <h1>Friendship Universe</h1>
                  <p>Every friendship has its own little magic. Discover yours!</p>
                </div>
                <div className="feature-card">
                  <span>✨</span>
                  <h2>Friendship identities</h2>
                  <p>Discover the kind of friendship you share through fun questions.</p>
                  <button onClick={() => navigate("quizzes")}>
                    Explore quizzes →
                  </button>
                </div>
              </section>
            )}

            
{page === "calendar" && <MiumiCalendarPage onNotice={setNotice} />}
            {page === "duo" && <MiumiDuoPage onNotice={setNotice} />}

            {page === "dedicate" && (
  <section className="feature-page dedicate-page page-enter">
    <div className="feature-hero dedicate-hero">
      <span className="feature-emoji">💌</span>
      <p className="eyebrow">MADE WITH A LITTLE LOVE</p>
      <h1>Create & Dedicate</h1>
      <p>
        Little words can make someone's whole day.
        Create something lovely for someone special.
      </p>
      <span className="dedicate-handwriting">a little note, a lot of love ♡</span>
    </div>

    <div className="dedicate-studio">
      <div className="dedicate-studio-heading">
        <div>
          <p className="garden-overline">YOUR LITTLE CREATIVE CORNER</p>
          <h2>A letter waiting to bloom</h2>
        </div>
        <span>୨୧</span>
      </div>

      <div className="dedicate-preview">
        <div className="dedicate-paper">
          <div className="dedicate-stamp">✿<small>MIUMI</small></div>
          <p className="dedicate-paper-label">A LITTLE LETTER FOR YOU</p>
          <h3>Dear someone special,</h3>
          <p className="dedicate-paper-message">
            You make ordinary days feel a little more magical.
            Here's a tiny reminder that you are appreciated.
          </p>
          <p className="dedicate-paper-sign">with love, ♡</p>
          <span className="dedicate-paper-flower">✿</span>
        </div>
        <div className="dedicate-preview-caption">
          <span>♡</span> imagine your own little message here
        </div>
      </div>

      <div className="dedicate-features">
        <div className="dedicate-feature">
          <span>✉️</span>
          <h3>Sweet letters</h3>
          <p>Write something heartfelt and meaningful.</p>
        </div>
        <div className="dedicate-feature">
          <span>🎀</span>
          <h3>Pretty cards</h3>
          <p>Turn little messages into lovely keepsakes.</p>
        </div>
        <div className="dedicate-feature">
          <span>🌷</span>
          <h3>Made for someone</h3>
          <p>Celebrate friendships and special moments.</p>
        </div>
      </div>

      <div className="dedicate-coming">
        <span className="dedicate-coming-icon">🧸</span>
        <div>
          <p className="garden-overline">A LITTLE SOMETHING IS COMING</p>
          <h2>Your dedication studio is on its way!</h2>
          <p>We're preparing a lovely little space for your words and memories.</p>
          <button onClick={() => setNotice("Your dedication studio is coming soon ♡")}>
            Coming soon <span>♡</span>
          </button>
        </div>
      </div>
    </div>
  </section>
)}

           
{page === "games" && <PlayroomPage />}
            {page === "in-between" && <InBetweenGame />}
            {page === "photo-studio" && <PhotoStudioPage onNotice={setNotice} />}
            {page === "museum" && <MiumiMuseumPage onNotice={setNotice} />}
            {page === "quiet-room" && <QuietRoomPage />}

          </div>
          {page === "home" && (
            <aside className="home-font-studio-rail" aria-label="Home font studio">
              <FontStudio />
            </aside>
          )}
        </div>

       <nav className="mobile-nav" aria-label="Main navigation">
  <NavButton active={page === "home"} icon={<House />} label="Home" onClick={() => navigate("home")} />
  <NavButton active={page === "quizzes" || page === "play"} icon={<Sparkles />} label="Quizzes" onClick={() => navigate("quizzes")} />
  <NavButton active={page === "results" || page === "quiz-result"} icon={<Trophy />} label="Results" onClick={() => navigate("results")} />
  <NavButton active={page === "friendship"} icon={<Heart />} label="Friends" onClick={() => navigate("friendship")} />
  <NavButton active={page === "calendar"} icon={<CalendarDays />} label="Calendar" onClick={() => navigate("calendar")} />
  <NavButton active={page === "duo"} icon={<Users />} label="Duo" onClick={() => navigate("duo")} />
  <NavButton active={page === "dedicate"} icon={<Gift />} label="Create" onClick={() => navigate("dedicate")} />
  <NavButton active={page === "games"} icon={<Gamepad2 />} label="Playroom" onClick={() => navigate("games")} />
  <NavButton active={page === "in-between"} icon={<Sparkles />} label="In-Between" onClick={() => navigate("in-between")} />
  <NavButton active={page === "photo-studio"} icon={<ImagePlus />} label="Photos" onClick={() => navigate("photo-studio")} />
  <NavButton active={page === "museum"} icon={<Landmark />} label="Museum" onClick={() => navigate("museum")} />
  <NavButton active={page === "quiet-room"} icon={<MessageCircle />} label="Quiet Room" onClick={() => navigate("quiet-room")} />
</nav>
        <div className="notice" role="status" aria-live="polite" data-visible={Boolean(notice)}>{notice}</div>
      </div>
    </main>
  );
}




type CalendarMemory = { id: number; title: string; date: string; kind: string; note: string };
const calendarKinds = ["Birthday", "Friendship anniversary", "Plan together", "Memory", "Reminder"];

function MiumiCalendarPage({ onNotice }: { onNotice: (message: string) => void }) {
  const [memories, setMemories] = useState<CalendarMemory[]>(() => {
    try { const saved = window.localStorage.getItem("miumi-calendar-memories"); return saved ? JSON.parse(saved) as CalendarMemory[] : []; }
    catch { return []; }
  });
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState(calendarKinds[0]);
  const [note, setNote] = useState("");
  useEffect(() => {
    try { window.localStorage.setItem("miumi-calendar-memories", JSON.stringify(memories)); }
    catch { onNotice("Your browser could not save this calendar on this device."); }
  }, [memories]);
  const addMemory = () => {
    if (!title.trim() || !date) { onNotice("Add a title and date first ♡"); return; }
    setMemories((items) => [...items, { id: Date.now(), title: title.trim(), date, kind, note: note.trim() }].sort((a,b) => a.date.localeCompare(b.date)));
    setTitle(""); setDate(""); setNote(""); setKind(calendarKinds[0]); onNotice("Your little date has been added ♡");
  };
  const shareCalendar = async () => {
    const text = memories.length ? "Our Miumi Calendar ♡\\n" + memories.map((item) => item.date + " · " + item.title + " (" + item.kind + ")").join("\\n") : "Our Miumi Calendar is waiting for its first memory ♡";
    try { if (navigator.share) await navigator.share({ title: "Miumi Calendar", text }); else { await navigator.clipboard.writeText(text); onNotice("Calendar list copied ♡"); } }
    catch { onNotice("Sharing isn't available right now ♡"); }
  };
  return (
    <section className="feature-page miumi-calendar-page page-enter">
      <div className="feature-hero"><span className="feature-emoji">🗓️</span><p className="eyebrow">LITTLE DATES, BIG MEMORIES</p><h1>Miumi Calendar</h1><p>Keep birthdays, plans and the tiny moments you never want to forget.</p></div>
      <div className="miumi-tool-panel">
        <div className="miumi-tool-heading"><div><p className="garden-overline">YOUR LITTLE MEMORY BOARD</p><h2>Add a special date</h2></div><span>♡</span></div>
        <div className="miumi-calendar-form">
          <label>What's the occasion?<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Our first café day" maxLength={70} /></label>
          <label>When is it?<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>Choose a category<select value={kind} onChange={(event) => setKind(event.target.value)}>{calendarKinds.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>A note (optional)<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a detail you'll want to remember…" maxLength={220} /></label>
          <button type="button" className="miumi-primary-button" onClick={addMemory}>＋ Add to our calendar</button>
        </div>
      </div>
      <div className="miumi-tool-panel miumi-calendar-list">
        <div className="miumi-tool-heading"><div><p className="garden-overline">THE LITTLE THINGS WE'LL REMEMBER</p><h2>Our dates & memories</h2></div><button type="button" className="miumi-soft-button" onClick={shareCalendar}>Share list ↗</button></div>
        {memories.length === 0 ? <div className="miumi-empty-state"><span>🌷</span><h3>Your calendar is waiting</h3><p>Add your first birthday, friendship date or plan together.</p></div> : <div className="miumi-memory-list">{memories.map((item) => (
          <article className="miumi-memory-item" key={item.id}><div className="miumi-memory-date"><strong>{new Date(item.date + "T12:00:00").getDate()}</strong><span>{new Date(item.date + "T12:00:00").toLocaleDateString(undefined, { month: "short" })}</span></div><div className="miumi-memory-copy"><span>{item.kind}</span><h3>{item.title}</h3>{item.note && <p>{item.note}</p>}</div><button type="button" className="miumi-remove-button" onClick={() => setMemories((items) => items.filter((memory) => memory.id !== item.id))} aria-label={"Delete " + item.title}>×</button></article>
        ))}</div>}
      </div>
      <p className="miumi-local-note">♡ Dates are saved in this browser on this device. Shared syncing across two devices will need an online database and friend invite system.</p>
    </section>
  );
}

const duoQuestions = [
  { prompt: "Your ideal bestie day looks like…", options: [{ label: "A spontaneous little adventure", type: 0 }, { label: "A cosy day with snacks", type: 1 }, { label: "A creative project together", type: 2 }, { label: "Laughing until it's chaotic", type: 3 }] },
  { prompt: "When plans suddenly change, you…", options: [{ label: "Find a new adventure", type: 0 }, { label: "Keep things calm", type: 1 }, { label: "Make a clever new plan", type: 2 }, { label: "Turn it into a funny story", type: 3 }] },
  { prompt: "Pick a friendship superpower.", options: [{ label: "Bringing the sunshine", type: 0 }, { label: "Being the safe place", type: 1 }, { label: "Noticing every detail", type: 2 }, { label: "Making anything fun", type: 3 }] },
  { prompt: "Choose your perfect little aesthetic.", options: [{ label: "Golden sunshine", type: 0 }, { label: "Soft blankets and rain", type: 1 }, { label: "Books, stars and playlists", type: 2 }, { label: "Glitter, stickers and colour", type: 3 }] },
  { prompt: "Your friends would describe you as…", options: [{ label: "Bright and bold", type: 0 }, { label: "Gentle and thoughtful", type: 1 }, { label: "Dreamy and observant", type: 2 }, { label: "Funny and unpredictable", type: 3 }] },
];
const duoTypes = [
  { name: "Sunshine", emoji: "☀️", note: "You bring warmth, energy and a little sparkle." },
  { name: "Soft Cloud", emoji: "☁️", note: "You bring comfort, calm and a feeling of being understood." },
  { name: "Moon Dreamer", emoji: "🌙", note: "You bring imagination, thoughtful details and quiet magic." },
  { name: "Happy Chaos", emoji: "🎉", note: "You bring laughter, surprises and stories worth retelling." },
];
function MiumiDuoPage({ onNotice }: { onNotice: (message: string) => void }) {
  const [names, setNames] = useState(["Friend one", "Friend two"]);
  const [player, setPlayer] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<number[][]>([[], []]);
  const [revealed, setRevealed] = useState(false);
  const answer = (type: number) => {
    const next = [...scores]; next[player] = [...next[player], type]; setScores(next);
    if (questionIndex < duoQuestions.length - 1) setQuestionIndex(questionIndex + 1);
    else if (player === 0) { setPlayer(1); setQuestionIndex(0); onNotice("Pass the phone to friend two ♡"); }
    else setRevealed(true);
  };
  const getType = (values: number[]) => { const counts = [0,0,0,0]; values.forEach((value) => { counts[value] = (counts[value] ?? 0) + 1; }); return duoTypes[counts.indexOf(Math.max(...counts))] ?? duoTypes[0]; };
  const first = getType(scores[0]); const second = getType(scores[1]);
  const pair = first.name === second.name ? "The matching mirrors" : first.name === "Sunshine" && second.name === "Soft Cloud" || first.name === "Soft Cloud" && second.name === "Sunshine" ? "Sunshine × Soft Cloud" : first.name + " × " + second.name;
  const restart = () => { setPlayer(0); setQuestionIndex(0); setScores([[],[]]); setRevealed(false); };
  const share = async () => { const text = names[0] + " & " + names[1] + " are " + pair + " on Miumi ♡"; try { if (navigator.share) await navigator.share({ title: "Miumi Duo", text }); else { await navigator.clipboard.writeText(text); onNotice("Your duo identity was copied ♡"); } } catch { onNotice("Sharing isn't available right now ♡"); } };
  return (
    <section className="feature-page miumi-duo-page page-enter">
      <div className="feature-hero"><span className="feature-emoji">🫶</span><p className="eyebrow">TWO HEARTS, ONE LITTLE DISCOVERY</p><h1>Miumi Duo</h1><p>Answer separately, then reveal the lovely little duo you make together.</p></div>
      {!revealed ? <div className="miumi-tool-panel miumi-duo-quiz">
        <div className="miumi-tool-heading"><div><p className="garden-overline">FRIEND {player + 1} OF 2 · QUESTION {questionIndex + 1} OF {duoQuestions.length}</p><h2>{names[player]}'s turn</h2></div><span>{player === 0 ? "☀️" : "🌙"}</span></div>
        {player === 0 && questionIndex === 0 && <div className="miumi-name-fields"><label>Friend one<input value={names[0]} onChange={(event) => setNames([event.target.value,names[1]])} maxLength={24} /></label><label>Friend two<input value={names[1]} onChange={(event) => setNames([names[0],event.target.value])} maxLength={24} /></label></div>}
        <div className="miumi-duo-progress"><span style={{width: ((questionIndex + 1) / duoQuestions.length * 100) + "%"}} /></div>
        <div className="miumi-duo-question"><span>0{questionIndex + 1}</span><h2>{duoQuestions[questionIndex].prompt}</h2></div>
        <div className="miumi-duo-options">{duoQuestions[questionIndex].options.map((option) => <button type="button" key={option.label} onClick={() => answer(option.type)}>{option.label}<span>↗</span></button>)}</div>
        <p className="miumi-local-note">{player === 0 ? "Only friend one should answer for now. Pass the phone after the final question." : "Friend two is answering now. Friend one's answers stay hidden."}</p>
      </div> : <div className="miumi-tool-panel miumi-duo-result">
        <p className="garden-overline">YOUR MIUMI DUO IDENTITY</p><div className="miumi-duo-characters"><div><span>{first.emoji}</span><strong>{names[0] || "Friend one"}</strong><small>{first.name}</small></div><b>×</b><div><span>{second.emoji}</span><strong>{names[1] || "Friend two"}</strong><small>{second.name}</small></div></div>
        <h2>{pair}</h2><p>{first.note} {second.note}</p><div className="miumi-duo-footer">different little worlds, one lovely friendship ♡</div>
        <div className="miumi-duo-actions"><button type="button" className="miumi-primary-button" onClick={share}>Share our duo ↗</button><button type="button" className="miumi-soft-button" onClick={restart}>Play again</button></div>
      </div>}
    </section>
  );
}


type MuseumRoom = "Firsts" | "Inside jokes" | "Our eras" | "Future";
type MuseumExhibit = { id: number; sourceId?: number; title: string; room: MuseumRoom; date: string; story: string; emoji: string; image?: string };
const museumRooms: { name: MuseumRoom; emoji: string; description: string }[] = [
  { name: "Firsts", emoji: "🌷", description: "The beginnings and little milestones" },
  { name: "Inside jokes", emoji: "🤭", description: "The moments only you two understand" },
  { name: "Our eras", emoji: "🎞️", description: "The photos, phases and memories of each year" },
  { name: "Future", emoji: "💌", description: "Wishes and notes for the days ahead" },
];

function MiumiMuseumPage({ onNotice }: { onNotice: (message: string) => void }) {
  const [exhibits, setExhibits] = useState<MuseumExhibit[]>(() => {
    try { const saved = window.localStorage.getItem("miumi-museum-exhibits"); return saved ? JSON.parse(saved) as MuseumExhibit[] : []; }
    catch { return []; }
  });
  const [room, setRoom] = useState<MuseumRoom | "All">("All");
  const [title, setTitle] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<MuseumRoom>("Firsts");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [story, setStory] = useState("");
  const [emoji, setEmoji] = useState("🌸");
  const [image, setImage] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    try { window.localStorage.setItem("miumi-museum-exhibits", JSON.stringify(exhibits)); }
    catch { onNotice("This browser is running low on storage. Try removing a large photo."); }
  }, [exhibits]);

  const visible = room === "All" ? exhibits : exhibits.filter((item) => item.room === room);
  const importCalendar = () => {
    try {
      const saved = window.localStorage.getItem("miumi-calendar-memories");
      const calendarItems = saved ? JSON.parse(saved) as { id: number; title: string; date: string; kind: string; note: string }[] : [];
      const existing = new Set(exhibits.map((item) => item.sourceId).filter((id): id is number => typeof id === "number"));
      const additions = calendarItems.filter((item) => !existing.has(item.id)).map((item) => ({
        id: Date.now() + item.id, sourceId: item.id, title: item.title, room: "Firsts" as MuseumRoom, date: item.date,
        story: [item.kind, item.note].filter(Boolean).join(" · "), emoji: "🗓️",
      }));
      if (!additions.length) { onNotice(calendarItems.length ? "Your calendar dates are already in the museum ♡" : "Add a date in Miumi Calendar first ♡"); return; }
      setExhibits((items) => [...items, ...additions].sort((a,b) => b.date.localeCompare(a.date)));
      onNotice(additions.length + " calendar memories added to your museum ♡");
    } catch { onNotice("Your calendar memories could not be imported."); }
  };
  const addExhibit = () => {
    if (!title.trim()) { onNotice("Give your exhibit a little title first ♡"); return; }
    setExhibits((items) => [{ id: Date.now(), title: title.trim(), room: selectedRoom, date, story: story.trim(), emoji, ...(image ? { image } : {}) }, ...items]);
    setTitle(""); setStory(""); setImage(""); setEmoji("🌸"); setShowForm(false); onNotice("A new little exhibit has joined your museum ♡");
  };
  const shareMuseum = async () => {
    const text = "Our Museum of Us ♡\\n" + exhibits.map((item) => item.emoji + " " + item.title + " · " + item.room + " · " + item.date).join("\\n");
    try { if (navigator.share) await navigator.share({ title: "Miumi Museum of Us", text }); else { await navigator.clipboard.writeText(text); onNotice("Your museum guide was copied ♡"); } }
    catch { onNotice("Sharing isn't available right now ♡"); }
  };
  return (
    <section className="feature-page miumi-museum-page page-enter">
      <div className="feature-hero miumi-museum-hero">
        <span className="feature-emoji">🏛️</span>
        <p className="eyebrow">A PLACE FOR YOUR LITTLE FOREVER MOMENTS</p>
        <h1>Museum of Us</h1>
        <p>Every friendship has a thousand tiny stories. Give each one a place to live.</p>
        <span className="miumi-museum-script">curated by the two of you ♡</span>
      </div>
      <div className="miumi-museum-toolbar">
        <div><p className="garden-overline">YOUR LITTLE COLLECTION</p><h2>{exhibits.length} {exhibits.length === 1 ? "memory" : "memories"} on display</h2></div>
        <div className="miumi-museum-actions">
          <button className="miumi-soft-button" type="button" onClick={importCalendar}>＋ Import calendar</button>
          <button className="miumi-primary-button" type="button" onClick={() => setShowForm((value) => !value)}>＋ Add an exhibit</button>
        </div>
      </div>
      {showForm && <div className="miumi-tool-panel miumi-museum-form">
        <div className="miumi-tool-heading"><div><p className="garden-overline">A NEW PIECE OF YOUR STORY</p><h2>Create an exhibit</h2></div><span>✧</span></div>
        <label>Exhibit title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="The day we laughed for hours" maxLength={65} /></label>
        <div className="miumi-museum-fields">
          <label>Room<select value={selectedRoom} onChange={(event) => setSelectedRoom(event.target.value as MuseumRoom)}>{museumRooms.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
          <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>Little symbol<input value={emoji} onChange={(event) => setEmoji(event.target.value.slice(0, 4))} maxLength={4} /></label>
        </div>
        <label>Tell the story<textarea value={story} onChange={(event) => setStory(event.target.value)} placeholder="What happened? Why does this moment matter?" maxLength={500} /></label>
        <label className="miumi-museum-upload">Add a photo (optional)<input type="file" accept="image/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > 900000) { onNotice("Choose a photo smaller than 900 KB so it can save on this device."); event.target.value = ""; return; }
          const reader = new FileReader();
          reader.onload = () => setImage(typeof reader.result === "string" ? reader.result : "");
          reader.readAsDataURL(file);
        }} /></label>
        {image && <div className="miumi-museum-image-preview"><img src={image} alt="Exhibit preview" /><button type="button" onClick={() => setImage("")}>Remove photo</button></div>}
        <div className="miumi-duo-actions"><button className="miumi-primary-button" type="button" onClick={addExhibit}>Place in the museum ♡</button><button className="miumi-soft-button" type="button" onClick={() => setShowForm(false)}>Cancel</button></div>
      </div>}
      <div className="miumi-museum-room-grid">
        {museumRooms.map((item) => <button type="button" key={item.name} className={"miumi-museum-room " + (room === item.name ? "is-active" : "")} onClick={() => setRoom(room === item.name ? "All" : item.name)}>
          <span>{item.emoji}</span><strong>{item.name}</strong><small>{item.description}</small><b>{exhibits.filter((memory) => memory.room === item.name).length} exhibits</b>
        </button>)}
      </div>
      <div className="miumi-museum-gallery-heading"><div><p className="garden-overline">WANDER THROUGH YOUR STORY</p><h2>{room === "All" ? "All the little things" : room}</h2></div><button type="button" onClick={() => setRoom("All")}>View all ↗</button></div>
      {visible.length ? <div className="miumi-museum-gallery">{visible.map((item) => <article className="miumi-museum-exhibit" key={item.id}>
        {item.image ? <img className="miumi-museum-exhibit-image" src={item.image} alt={item.title} /> : <div className="miumi-museum-exhibit-art"><span>{item.emoji}</span><small>{item.room}</small></div>}
        <div className="miumi-museum-exhibit-copy"><span>{item.room} · {item.date || "A timeless moment"}</span><h3>{item.title}</h3>{item.story && <p>{item.story}</p>}<button type="button" onClick={() => setExhibits((items) => items.filter((memory) => memory.id !== item.id))}>Remove exhibit ×</button></div>
      </article>)}</div> : <div className="miumi-museum-empty"><span>🪞</span><h3>This room is waiting for its first story</h3><p>Add a memory or bring dates over from your Miumi Calendar.</p><button className="miumi-primary-button" type="button" onClick={() => { setSelectedRoom(room === "All" ? "Firsts" : room); setShowForm(true); }}>Create the first exhibit ♡</button></div>}
      <div className="miumi-museum-bottom"><div><span>✦</span><h2>A little museum, made by you</h2><p>Your exhibits stay in this browser on this device. You can share a text guide or print your collection as a keepsake.</p></div><div className="miumi-duo-actions"><button className="miumi-soft-button" type="button" onClick={shareMuseum} disabled={!exhibits.length}>Share museum ↗</button><button className="miumi-primary-button" type="button" onClick={() => window.print()} disabled={!exhibits.length}>Print the collection ⎙</button></div></div>
      <p className="miumi-local-note">Photos and exhibits are saved locally in this browser. They are not synced with another person's device yet. ♡</p>
    </section>
  );
}

type PhotoCardFormat = "postcard" | "folded";
type PhotoCardTemplate = "coquette" | "vintage" | "minimal" | "chaos" | "midnight" | "lavender";
type StudioPhoto = { id: string; src: string; name: string };
type PhotoStickerId = "kitty" | "sleepy-kitty" | "paw-prints" | "pink-bow" | "milk-carton" | "daisy" | "love-note" | "sparkles";
type PhotoSticker = { id: PhotoStickerId; label: string; art: string; kind: string };
const photoStickers: PhotoSticker[] = [
  { id: "kitty", label: "Sweet kitty", art: "🐱", kind: "cat" },
  { id: "sleepy-kitty", label: "Sleepy kitty", art: "😽", kind: "cat" },
  { id: "paw-prints", label: "Tiny paws", art: "🐾", kind: "paw" },
  { id: "pink-bow", label: "Baby bow", art: "🎀", kind: "bow" },
  { id: "milk-carton", label: "Milk time", art: "🥛", kind: "sweet" },
  { id: "daisy", label: "Little daisy", art: "🌼", kind: "flower" },
  { id: "love-note", label: "Love note", art: "💌", kind: "love" },
  { id: "sparkles", label: "Magic sparkles", art: "✨", kind: "shine" },
];
type PhotoFilterId = "original" | "golden" | "film" | "noir" | "rose" | "dream" | "chrome" | "faded" | "sunset" | "flash";
const photoFilters: { id: PhotoFilterId; name: string; vibe: string; css: string; emoji: string }[] = [
  { id: "original", name: "Original", vibe: "True-to-life colour", css: "none", emoji: "✧" },
  { id: "golden", name: "Golden Hour", vibe: "Warm sunlight glow", css: "sepia(.22) saturate(1.28) contrast(1.04) brightness(1.08)", emoji: "☀️" },
  { id: "film", name: "1998 Film", vibe: "Nostalgic disposable camera", css: "sepia(.32) saturate(.82) contrast(.92) brightness(1.08)", emoji: "🎞️" },
  { id: "noir", name: "Velvet Noir", vibe: "Deep black & white drama", css: "grayscale(1) contrast(1.28) brightness(.9)", emoji: "🖤" },
  { id: "rose", name: "Rose Milk", vibe: "Soft rosy pink tint", css: "sepia(.12) saturate(1.12) hue-rotate(315deg) brightness(1.08) contrast(.94)", emoji: "🌸" },
  { id: "dream", name: "Cloud Bloom", vibe: "Hazy, airy daydream", css: "brightness(1.16) saturate(.78) contrast(.82)", emoji: "☁️" },
  { id: "chrome", name: "Chrome Flash", vibe: "Cool silver editorial", css: "grayscale(.58) contrast(1.24) brightness(1.08) saturate(.72)", emoji: "🪩" },
  { id: "faded", name: "Memory Fade", vibe: "Washed-out old print", css: "sepia(.2) saturate(.7) contrast(.78) brightness(1.14)", emoji: "📼" },
  { id: "sunset", name: "Peach Sunset", vibe: "Peachy pink evening tones", css: "sepia(.18) saturate(1.38) hue-rotate(338deg) brightness(1.05)", emoji: "🌅" },
  { id: "flash", name: "Party Flash", vibe: "Bright direct-flash look", css: "contrast(1.2) saturate(1.22) brightness(1.12)", emoji: "💫" },
];

const photoTemplates: { id: PhotoCardTemplate; name: string; detail: string; className: string; emoji: string }[] = [
  { id: "coquette", name: "Coquette Memories", detail: "Soft pink, bows & little hearts", className: "studio-coquette", emoji: "🎀" },
  { id: "vintage", name: "Vintage Film", detail: "Warm tones & film-inspired frames", className: "studio-vintage", emoji: "📷" },
  { id: "minimal", name: "Minimal Memories", detail: "Clean, calm & timeless", className: "studio-minimal", emoji: "🤍" },
  { id: "chaos", name: "Cute Chaos", detail: "Playful stickers & happy colours", className: "studio-chaos", emoji: "🌈" },
  { id: "midnight", name: "Midnight", detail: "Moody, dark & cinematic", className: "studio-midnight", emoji: "🌙" },
  { id: "lavender", name: "Lavender Dreams", detail: "Dreamy lilac & delicate details", className: "studio-lavender", emoji: "🪻" },
];

function PhotoStudioPage({ onNotice }: { onNotice: (message: string) => void }) {
  const [photos, setPhotos] = useState<StudioPhoto[]>([]);
  const [format, setFormat] = useState<PhotoCardFormat>("postcard");
  const [template, setTemplate] = useState<PhotoCardTemplate>("coquette");
  const [filter, setFilter] = useState<PhotoFilterId>("original");
  const [customMode, setCustomMode] = useState(false);
  const [title, setTitle] = useState("little moments, forever");
  const [message, setMessage] = useState("Some memories deserve a place to stay. ♡");
  const [from, setFrom] = useState("with love,");
  const [accent, setAccent] = useState("#d99bb7");
  const [stickerIds, setStickerIds] = useState<PhotoStickerId[]>([]);
  const activeTemplate = photoTemplates.find((item) => item.id === template) ?? photoTemplates[0];
  const activeFilter = photoFilters.find((item) => item.id === filter) ?? photoFilters[0];
  const selectedStickers = photoStickers.filter((sticker) => stickerIds.includes(sticker.id));

  const toggleSticker = (id: PhotoStickerId) => {
    if (stickerIds.includes(id)) {
      setStickerIds((previous) => previous.filter((stickerId) => stickerId !== id));
      return;
    }
    if (stickerIds.length >= 6) {
      onNotice("Your card can have up to 6 little stickers ♡");
      return;
    }
    setStickerIds((previous) => [...previous, id]);
  };

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const imageFiles = selected.filter((file) => file.type.startsWith("image/"));
    const remaining = Math.max(0, 6 - photos.length);
    const accepted = imageFiles.slice(0, remaining);
    if (selected.length !== imageFiles.length) onNotice("Please choose image files only ♡");
    if (imageFiles.length > remaining) onNotice("You can add up to 6 photos in one card ♡");
    if (!accepted.length) { event.target.value = ""; return; }

    Promise.all(accepted.map((file) => new Promise<StudioPhoto>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: file.name + "-" + file.lastModified + "-" + Math.random().toString(36).slice(2),
        src: String(reader.result),
        name: file.name,
      });
      reader.onerror = () => reject(new Error("This photo could not be read."));
      reader.readAsDataURL(file);
    })))
      .then((newPhotos) => {
        setPhotos((previous) => [...previous, ...newPhotos].slice(0, 6));
        onNotice(newPhotos.length + " photo" + (newPhotos.length === 1 ? "" : "s") + " added to your card ♡");
      })
      .catch(() => onNotice("One of those photos could not be opened. Please try another."));
    event.target.value = "";
  };

  const removePhoto = (id: string) => setPhotos((previous) => previous.filter((photo) => photo.id !== id));
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);

  const printCard = () => {
    if (photos.length < 2) { onNotice("Add at least 2 photos before printing your card ♡"); return; }
    const photoMarkup = photos.map((photo) => '<img src="' + photo.src + '" alt="" style="filter:' + activeFilter.css + '" />').join("");
    const stickerMarkup = selectedStickers.map((sticker, index) => '<span class="print-sticker print-sticker-' + index + '">' + escapeHtml(sticker.art) + '</span>').join("");
    const safeTitle = escapeHtml(title || "A little memory");
    const safeMessage = escapeHtml(message);
    const safeFrom = escapeHtml(from);
    const accentColor = customMode ? accent : "#d99bb7";
    const cardClass = "print-" + template;
    const pageMarkup = format === "postcard"
      ? '<section class="print-page postcard ' + cardClass + '"><div class="print-photo-grid">' + photoMarkup + '</div>' + stickerMarkup + '<div class="print-copy"><p class="print-kicker">A LITTLE KEEPSAKE</p><h1>' + safeTitle + '</h1><p>' + safeMessage + '</p><small>' + safeFrom + '</small></div></section>'
      : '<section class="print-page folded outside ' + cardClass + '"><div class="fold-panel fold-back"><span>♡</span><small>made with miumi</small></div><div class="fold-panel fold-front"><div class="print-photo-grid">' + photoMarkup + '</div><h1>' + safeTitle + '</h1><small>' + safeFrom + '</small></div>' + stickerMarkup + '</section><section class="print-page folded inside ' + cardClass + '"><div class="fold-panel"><h2>' + safeTitle + '</h2><p>' + safeMessage + '</p><small>♡</small></div><div class="fold-panel"><div class="print-photo-grid">' + photoMarkup + '</div></div>' + stickerMarkup + '</section>';

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) { onNotice("Please allow pop-ups to print your card ♡"); return; }
    const styles = [
      "@page{size:" + (format === "postcard" ? "A6 landscape" : "A5 landscape") + ";margin:0}",
      "*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#665b65}",
      ".print-page{position:relative;width:" + (format === "postcard" ? "148mm" : "210mm") + ";height:" + (format === "postcard" ? "105mm" : "148mm") + ";page-break-after:always;overflow:hidden;background:#fff9fc}",
      ".print-sticker{position:absolute;z-index:8;display:grid;place-items:center;width:12mm;height:12mm;border:1mm solid rgba(255,255,255,.96);border-radius:4mm;background:rgba(255,255,255,.92);box-shadow:0 1mm 3mm rgba(80,55,75,.18);font-size:22pt;line-height:1}",
      ".print-sticker-0{left:4%;top:4%;transform:rotate(-12deg)}.print-sticker-1{left:38%;top:4%;transform:rotate(10deg)}.print-sticker-2{right:4%;top:4%;transform:rotate(12deg)}.print-sticker-3{right:4%;bottom:7%;transform:rotate(-10deg)}.print-sticker-4{left:42%;bottom:5%;transform:rotate(8deg)}.print-sticker-5{left:4%;bottom:7%;transform:rotate(-8deg)}",
      ".postcard{display:grid;grid-template-columns:55% 45%;padding:7mm;gap:5mm}",
      ".print-photo-grid{display:grid;grid-template-columns:repeat(2,1fr);grid-auto-rows:1fr;gap:2mm;min-height:0;overflow:hidden}",
      ".print-photo-grid img{width:100%;height:100%;min-height:0;object-fit:cover;border-radius:2mm}",
      ".print-copy{display:flex;flex-direction:column;justify-content:center;padding:3mm;border-left:1px solid " + accentColor + "}",
      ".print-kicker{font-size:7pt;letter-spacing:2px;color:" + accentColor + "}h1{font-size:19pt;line-height:1.2;overflow-wrap:anywhere}",
      ".print-copy p:not(.print-kicker){font-size:9pt;line-height:1.6}.print-copy small{margin-top:7mm;color:" + accentColor + "}",
      ".folded{display:grid;grid-template-columns:1fr 1fr}.fold-panel{width:105mm;height:148mm;padding:10mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}",
      ".fold-back{background:#fff9fc;color:" + accentColor + "}.fold-back span{font-size:35pt}.fold-back small{margin-top:5mm}",
      ".fold-front{background:#fff3f8}.fold-front .print-photo-grid{width:82mm;height:82mm}.fold-front h1{margin:5mm 0 2mm;font-size:17pt}.fold-front small{color:" + accentColor + "}",
      ".inside .fold-panel:first-child{background:#fffdfd}.inside .fold-panel:first-child h2{font-size:19pt;color:" + accentColor + "}.inside .fold-panel:first-child p{max-width:75mm;font-size:11pt;line-height:1.8}",
      ".inside .fold-panel:last-child{background:#fff8fb}.inside .print-photo-grid{width:82mm;height:95mm}",
      ".print-vintage{background:#f5ead9;color:#66503f}.print-minimal{background:#fff;color:#555}.print-chaos{background:#fff6e9;color:#8c6480}.print-midnight{background:#20202a;color:#f5eaf3}.print-lavender{background:#f4efff;color:#75618e}.print-coquette{background:#fff3f8;color:#8e6379}",
      "@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}"
    ].join("");
    printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Miumi Photo Card</title><style>' + styles + '</style></head><body>' + pageMarkup + '<script>window.onload=()=>setTimeout(()=>window.print(),500);</script></body></html>');
    printWindow.document.close();
  };

  return (
    <section className="photo-studio-page page-enter">
      <div className="feature-hero photo-studio-hero">
        <span className="feature-emoji">📸</span><p className="eyebrow">YOUR LITTLE MEMORY MAKER</p>
        <h1>Miumi Photo Studio</h1><p>Turn your favourite moments into a little card worth keeping.</p>
        <span className="photo-studio-handwriting">a tiny keepsake, made by you ♡</span>
      </div>
      <div className="studio-workspace">
        <div className="studio-section-heading"><div><p className="garden-overline">STEP 01 · YOUR PHOTOS</p><h2>Pick your little moments</h2></div><span>{photos.length}/6</span></div>
        <label className={"studio-upload " + (photos.length >= 6 ? "is-full" : "")}>
          <input type="file" accept="image/*" multiple disabled={photos.length >= 6} onChange={addPhotos} />
          <span className="studio-upload-icon">＋</span><strong>{photos.length ? "Add more photos" : "Upload your photos"}</strong>
          <small>Choose 2–6 photos · JPG, PNG or WEBP</small>
        </label>
        {photos.length > 0 && <div className="studio-uploaded-grid">{photos.map((photo, index) => (
          <div className="studio-uploaded-photo" key={photo.id}><img src={photo.src} alt={photo.name} /><span>{index + 1}</span>
            <button type="button" onClick={() => removePhoto(photo.id)} aria-label={"Remove " + photo.name}><Trash2 size={14} /></button>
          </div>
        ))}</div>}

        <div className="studio-section-heading studio-format-heading"><div><p className="garden-overline">STEP 02 · CARD SHAPE</p><h2>Choose your format</h2></div></div>
        <div className="studio-format-grid">
          <button type="button" className={"studio-format-option " + (format === "postcard" ? "is-selected" : "")} onClick={() => setFormat("postcard")}><span className="studio-format-art postcard-art">✉</span><strong>Postcard</strong><small>A6 · one-sided keepsake</small></button>
          <button type="button" className={"studio-format-option " + (format === "folded" ? "is-selected" : "")} onClick={() => setFormat("folded")}><span className="studio-format-art folded-art">♡</span><strong>Folded card</strong><small>A5 landscape · folds to A6</small></button>
        </div>

        <div className="studio-section-heading studio-format-heading"><div><p className="garden-overline">STEP 03 · THE CARD DESIGN</p><h2>Choose a template</h2></div></div>
        <div className="studio-template-grid">{photoTemplates.map((item) => (
          <button type="button" key={item.id} className={"studio-template-option " + (template === item.id ? "is-selected" : "")} onClick={() => setTemplate(item.id)}>
            <span className={"studio-template-swatch " + item.className}>{item.emoji}</span><strong>{item.name}</strong><small>{item.detail}</small>
          </button>
        ))}</div>

        <div className="studio-section-heading studio-format-heading"><div><p className="garden-overline">STEP 04 · PHOTO MAGIC</p><h2>Give your photos a feeling</h2></div><span className="studio-filter-count">{photoFilters.length} looks</span></div>
        <div className="studio-filter-grid">{photoFilters.map((item) => (
          <button type="button" key={item.id} className={"studio-filter-option " + (filter === item.id ? "is-selected" : "")} onClick={() => setFilter(item.id)}>
            <span className="studio-filter-sample"><span className={"studio-filter-sample-art filter-art-" + item.id}>{item.emoji}</span></span>
            <strong>{item.name}</strong><small>{item.vibe}</small>
          </button>
        ))}</div>
        <p className="studio-filter-note">The selected look is applied to your preview and your printed card.</p>

        <div className="studio-section-heading studio-format-heading"><div><p className="garden-overline">STEP 05 · MAKE IT YOURS</p><h2>Add your words</h2></div>
          <button type="button" className={"studio-custom-toggle " + (customMode ? "is-active" : "")} onClick={() => setCustomMode((value) => !value)}>{customMode ? "Customising ✓" : "Customise"}</button>
        </div>
        <div className="studio-fields">
          <label>Card title<input value={title} maxLength={55} onChange={(event) => setTitle(event.target.value)} placeholder="A little memory..." /></label>
          <label>Your message<textarea value={message} maxLength={180} onChange={(event) => setMessage(event.target.value)} rows={3} placeholder="Write a little note..." /></label>
          <label>Sign-off<input value={from} maxLength={35} onChange={(event) => setFrom(event.target.value)} placeholder="With love," /></label>
          {customMode && <label className="studio-colour-field">Accent colour<input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} /></label>}
        </div>

        <div className="studio-section-heading studio-format-heading">
          <div><p className="garden-overline">STEP 06 · THE LITTLE EXTRAS</p><h2>Dress it up with stickers</h2></div>
          <span className="studio-sticker-count">{selectedStickers.length}/6 on your card</span>
        </div>
        <p className="studio-sticker-instructions">Tap a sticker to add it. Tap it again to take it off. ♡</p>
        <div className="studio-sticker-grid">
          {photoStickers.map((item) => {
            const isSelected = stickerIds.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                className={"studio-sticker-option " + (isSelected ? "is-selected" : "")}
                onClick={() => toggleSticker(item.id)}
                aria-pressed={isSelected}
              >
                <span className={"studio-sticker-art sticker-kind-" + item.kind} aria-hidden="true">{item.art}</span>
                <span className="studio-sticker-label">{item.label}</span>
                {isSelected && <span className="studio-sticker-check" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
        {selectedStickers.length > 0 && (
          <button type="button" className="studio-clear-stickers" onClick={() => setStickerIds([])}>Clear all stickers ×</button>
        )}
        <div className="studio-section-heading studio-format-heading"><div><p className="garden-overline">YOUR LIVE PREVIEW</p><h2>A card taking shape</h2></div></div>
        <div className={"studio-live-card " + activeTemplate.className + (format === "folded" ? " is-folded" : "")} style={customMode ? { borderColor: accent } : undefined}>
          <div className="studio-live-photos">{photos.length ? photos.map((photo) => <img src={photo.src} alt="" key={photo.id} style={{ filter: activeFilter.css }} />) : <div className="studio-empty-photo">♡<small>Your photos will appear here</small></div>}</div>
          <div className="studio-live-copy"><span className="studio-live-kicker">A LITTLE KEEPSAKE</span><h3>{title || "A little memory"}</h3><p>{message || "Your message will appear here."}</p><small>{from || "with love,"}</small></div>
          <span className="studio-live-decoration">୨୧</span>
          {selectedStickers.map((item, index) => (
            <span key={item.id} className={"studio-card-sticker studio-card-sticker-" + index} aria-hidden="true">{item.art}</span>
          ))}
        </div>
        <div className="studio-print-actions"><p>{photos.length < 2 ? "Add at least 2 photos to unlock printing." : photos.length + " photos ready · " + (format === "postcard" ? "A6 postcard" : "A5 folded card")}</p>
          <button type="button" onClick={printCard} disabled={photos.length < 2}><Printer size={17} /> Print / Save as PDF</button>
        </div>
        <p className="studio-privacy-note">🔒 Your photos stay in this browser session. They aren't uploaded to Miumi.</p>
      </div>
    </section>
  );
}

type PlayroomGameId = "this-or-that" | "never-have-i-ever" | "truth-or-dare" | "two-truths";

const playroomGames: { id: PlayroomGameId; title: string; emoji: string; description: string; color: string; categories: string[] }[] = [
  { id: "this-or-that", title: "This or That", emoji: "🦋", description: "Two choices, one very-you answer.", color: "blue", categories: ["Everyday", "Aesthetic", "Dreams", "Friendship"] },
  { id: "never-have-i-ever", title: "Never Have I Ever", emoji: "🙈", description: "Funny little things you may or may not have done.", color: "pink", categories: ["Everyday", "School", "Friendship", "Funny"] },
  { id: "truth-or-dare", title: "Truth or Dare", emoji: "🎀", description: "Pick a truth or a harmless little challenge.", color: "lilac", categories: ["Funny", "Friendship", "Creative", "Chill"] },
  { id: "two-truths", title: "Two Truths & One Lie", emoji: "🕵️", description: "Can everyone spot the made-up statement?", color: "peach", categories: ["Random Facts", "Everyday", "Animals"] },
];

const playroomDecks: Record<PlayroomGameId, Record<string, any[]>> = {
  "this-or-that": {
    Everyday: [
      { prompt: "Your perfect little afternoon?", options: ["A cozy movie night 🍿", "A spontaneous outing 🌷"] },
      { prompt: "Pick your everyday treat.", options: ["Iced coffee 🧋", "A fruity smoothie 🍓"] },
      { prompt: "Which sounds more like you?", options: ["Plan everything 📖", "Go with the flow 🦋"] },
      { prompt: "Choose your ideal weekend.", options: ["A quiet reset ☁️", "A day full of plans 🎉"] },
    ],
    Aesthetic: [
      { prompt: "Choose your dreamy palette.", options: ["Blush pink 🎀", "Powder blue 🫧"] },
      { prompt: "Which room would you pick?", options: ["Cozy cottage 🌷", "Modern city loft 🌃"] },
      { prompt: "Your perfect weather?", options: ["Rainy and cozy 🌧️", "Sunny and breezy ☀️"] },
    ],
    Dreams: [
      { prompt: "A dream trip?", options: ["A peaceful beach 🏝️", "A magical old city 🏰"] },
      { prompt: "Choose a big adventure.", options: ["See the northern lights 🌌", "Explore a rainforest 🌿"] },
      { prompt: "Your dream home?", options: ["A cottage by the sea 🐚", "A little apartment in Paris 🥐"] },
    ],
    Friendship: [
      { prompt: "A perfect bestie hangout?", options: ["Deep talks at midnight 🌙", "Laughing until you cry 😂"] },
      { prompt: "How do you show you care?", options: ["Thoughtful little gifts 🎁", "Being there whenever needed 💗"] },
      { prompt: "Your favorite friend tradition?", options: ["Inside jokes 🤭", "Long catch-up calls ☎️"] },
    ],
  },
  "never-have-i-ever": {
    Everyday: [
      { text: "Never have I ever stayed up way too late watching a series." },
      { text: "Never have I ever forgotten why I walked into a room." },
      { text: "Never have I ever waved back at someone who wasn't waving at me." },
      { text: "Never have I ever laughed at a joke I didn't understand." },
    ],
    School: [
      { text: "Never have I ever decorated my notes instead of studying." },
      { text: "Never have I ever forgotten what I was about to say in class." },
      { text: "Never have I ever packed my bag at the very last minute." },
    ],
    Friendship: [
      { text: "Never have I ever made a playlist for a friend." },
      { text: "Never have I ever laughed so hard with a friend that I couldn't speak." },
      { text: "Never have I ever planned a surprise for someone." },
    ],
    Funny: [
      { text: "Never have I ever walked into the wrong room confidently." },
      { text: "Never have I ever practiced a conversation in my head first." },
      { text: "Never have I ever sung the wrong lyrics with complete confidence." },
    ],
  },
  "truth-or-dare": {
    Funny: [
      { type: "truth", text: "What's the funniest misunderstanding you've ever had?" },
      { type: "dare", text: "Describe your day like a dramatic movie trailer." },
      { type: "truth", text: "What's a tiny thing you take way too seriously?" },
      { type: "dare", text: "Invent a silly name for the person to your left." },
    ],
    Friendship: [
      { type: "truth", text: "What's one quality you appreciate most in a friend?" },
      { type: "dare", text: "Give someone in the group a sincere, specific compliment." },
      { type: "truth", text: "What's a favorite memory you share with a friend?" },
    ],
    Creative: [
      { type: "truth", text: "If you could create anything, what would it be?" },
      { type: "dare", text: "Draw a tiny animal in 20 seconds and show everyone." },
      { type: "truth", text: "Which fictional world would you visit for one day?" },
    ],
    Chill: [
      { type: "truth", text: "What's something small that always improves your mood?" },
      { type: "dare", text: "Take three slow breaths and share one thing you're grateful for." },
      { type: "truth", text: "What's a skill you'd love to learn?" },
    ],
  },
  "two-truths": {
    "Random Facts": [
      { statements: ["Octopuses have three hearts.", "Honey can last for a very long time when stored well.", "Goldfish have a memory of only three seconds."], lie: 2, explanation: "Goldfish can remember things for much longer than three seconds." },
      { statements: ["Bananas are berries in botanical terms.", "A group of flamingos is called a flamboyance.", "Penguins can fly long distances."], lie: 2, explanation: "Penguins are flightless birds." },
      { statements: ["The Eiffel Tower can become slightly taller in hot weather.", "A day on Venus is longer than its year.", "The Moon makes its own light."], lie: 2, explanation: "The Moon reflects sunlight; it does not produce its own light." },
    ],
    Everyday: [
      { statements: ["A week has seven days.", "A triangle has four sides.", "There are 60 minutes in an hour."], lie: 1, explanation: "A triangle has three sides." },
      { statements: ["Water freezes at 0°C under standard conditions.", "The Sun is a star.", "Humans have five lungs."], lie: 2, explanation: "Humans normally have two lungs." },
    ],
    Animals: [
      { statements: ["Dolphins are mammals.", "Butterflies taste using their feet.", "All snakes have legs."], lie: 2, explanation: "Snakes do not have legs." },
      { statements: ["A baby kangaroo is called a joey.", "Bats are mammals.", "Polar bears live naturally in Antarctica."], lie: 2, explanation: "Polar bears live in the Arctic, not Antarctica." },
    ],
  },
};

function PlayroomPage() {
  const [activeGame, setActiveGame] = useState<PlayroomGameId | null>(null);
  const [mode, setMode] = useState("Solo");
  const [category, setCategory] = useState("Everyday");
  const [round, setRound] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [responses, setResponses] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const totalRounds = 10;
  const [seen, setSeen] = useState<number[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [truthOrDare, setTruthOrDare] = useState<"truth" | "dare" | null>(null);
  const [truthDarePrompt, setTruthDarePrompt] = useState<any>(null);
  const [truthDareSeen, setTruthDareSeen] = useState<number[]>([]);
  const [customStatements, setCustomStatements] = useState(["", "", ""]);
  const [customLie, setCustomLie] = useState(0);
  const [usingCustom, setUsingCustom] = useState(false);

  const selectedGame = playroomGames.find((game) => game.id === activeGame);
  const categories = selectedGame?.categories ?? [];
  const deck = activeGame ? (playroomDecks[activeGame][category] ?? Object.values(playroomDecks[activeGame])[0] ?? []) : [];
  const prompt = deck[round] ?? deck[0];
 const startGame = (id: PlayroomGameId) => {
  const game = playroomGames.find((item) => item.id === id);
  setActiveGame(id);
  setCategory(game?.categories[0] ?? "Everyday");
  setRound(0);
  setRoundNumber(1);
  setResponses([]);
  setFinished(false);
  setSeen([0]);
  setChoice(null);
  setRevealed(false);
  setScore(0);
  setTruthOrDare(null);
  setTruthDarePrompt(null);
  setTruthDareSeen([]);
  setUsingCustom(false);
};
  const currentResponse = () => {
    if (activeGame === "this-or-that" && prompt && choice !== null) return prompt.prompt + " — " + prompt.options[choice];
    if (activeGame === "never-have-i-ever" && prompt && choice !== null) return prompt.text + " — " + (choice === 0 ? "I've done this" : "Never have I ever");
    if (activeGame === "truth-or-dare" && truthOrDare && truthDarePrompt) return truthOrDare.toUpperCase() + " — " + truthDarePrompt.text;
    if (activeGame === "two-truths" && prompt && choice !== null) return "Statement " + (choice + 1) + (choice === (usingCustom ? customLie : prompt.lie) ? " — correct" : " — incorrect");
    return "";
  };
  const finishGame = () => {
    const finalResponse = currentResponse();
    setResponses(finalResponse ? [...responses, finalResponse] : responses);
    setFinished(true);
  };
 const nextPrompt = () => {
  if (!deck.length || roundNumber >= totalRounds) return;

  const finalResponse = currentResponse();

  if (finalResponse) {
    setResponses((previous) => [...previous, finalResponse]);
  }

  // Find questions that have NOT been shown yet.
  const availableQuestions = deck
    .map((_: unknown, index: number) => index)
    .filter((index: number) => !seen.includes(index));

  // If every question in this category has been used,
  // finish the game instead of repeating a question.
  if (availableQuestions.length === 0) {
    setFinished(true);
    return;
  }

  // Randomly select an unused question.
  const nextIndex =
    availableQuestions[
      Math.floor(Math.random() * availableQuestions.length)
    ];

  setSeen((previous) => [...previous, nextIndex]);
  setRound(nextIndex);
  setRoundNumber((value) => value + 1);

  setChoice(null);
  setRevealed(false);
  setTruthOrDare(null);
  setTruthDarePrompt(null);
  setUsingCustom(false);
};
const changeCategory = (value: string) => {
  setCategory(value);
  setRound(0);
  setRoundNumber(1);
  setResponses([]);
  setFinished(false);
  setSeen([0]);
  setChoice(null);
  setRevealed(false);
  setScore(0);
  setUsingCustom(false);
};
  const resetGame = () => {
    setRound(0); setRoundNumber(1); setResponses([]); setFinished(false); setSeen([]); setChoice(null); setRevealed(false); setScore(0); setTruthOrDare(null); setUsingCustom(false);
  };
  const shareResult = async () => {
    const summary = selectedGame?.title + " — Miumi Playroom ♡\n" + responses.join("\n") + (activeGame === "two-truths" ? "\nScore: " + score + "/" + totalRounds : "");
    try {
      if (navigator.share) await navigator.share({ title: "My Miumi Playroom result", text: summary });
      else if (navigator.clipboard) await navigator.clipboard.writeText(summary);
    } catch { /* Sharing is optional. */ }
  };
  const sharePrompt = async () => {
    const text = selectedGame && prompt ? selectedGame.title + " on Miumi Playroom ♡ " + (prompt.text ?? prompt.prompt ?? prompt.statements?.join(" / ") ?? "") : "Come play on Miumi Playroom ♡";
    try {
      if (navigator.share) await navigator.share({ title: "Miumi Playroom", text });
      else if (navigator.clipboard) await navigator.clipboard.writeText(text);
    } catch { /* Sharing is optional. */ }
  };
  const submitCustomRound = () => {
    if (customStatements.every((statement) => statement.trim().length > 0)) {
      setUsingCustom(true); setChoice(null); setRevealed(false);
    }
  };

  if (!activeGame || !selectedGame) {
    return (
      <section className="feature-page playroom-page page-enter">
        <div className="feature-hero playroom-hero">
          <span className="feature-emoji">🎀</span>
          <p className="eyebrow">A LITTLE SPACE TO PLAY TOGETHER</p>
          <h1>Miumi Playroom</h1>
          <p>Pick a game, choose your vibe, and make a little memory.</p>
          <span className="games-handwriting">little games, lovely company ♡</span>
        </div>
        <div className="playroom-intro-row"><div><p className="garden-overline">THE SOCIAL GAME COLLECTION</p><h2>What shall we play?</h2></div><span>୨୧</span></div>
        <div className="playroom-game-grid">
          {playroomGames.map((game) => (
            <button type="button" className={"playroom-game-card playroom-" + game.color} key={game.id} onClick={() => startGame(game.id)}>
              <span className="playroom-card-icon">{game.emoji}</span><span className="playroom-card-label">READY TO PLAY</span>
              <strong>{game.title}</strong><span className="playroom-card-description">{game.description}</span>
              <span className="playroom-card-link">Let's play <span>↗</span></span>
            </button>
          ))}
        </div>
        <div className="playroom-note"><span>🧸</span><div><strong>Your little hangout</strong><p>Play solo, pass the phone around, or take turns with your favorite people. No account needed.</p></div></div>
        <p className="games-footer-note"><span>୨୧</span> little breaks make lovely memories <span>୨୧</span></p>
      </section>
    );
  }


  if (finished && selectedGame) {
    const chosenOptions = responses.filter((item) => item.includes(" — ")).map((item) => item.split(" — ")[1]);
    const optionCounts = chosenOptions.reduce<Record<string, number>>((counts, option) => {
      counts[option] = (counts[option] ?? 0) + 1;
      return counts;
    }, {});
    const favoriteChoice = Object.entries(optionCounts).sort((a, b) => b[1] - a[1])[0];
    const completedCount = responses.length;
    const resultTitle = activeGame === "this-or-that"
      ? "That's so you! ♡"
      : activeGame === "never-have-i-ever"
        ? "Your little life recap"
        : activeGame === "truth-or-dare"
          ? "You made it through!"
          : score >= 8 ? "Incredible detective!" : score >= 5 ? "Sharp eyes!" : "Nice try, detective!";
    return (
      <section className="feature-page playroom-page page-enter">
        <div className="playroom-results-card">
          <span className="playroom-results-sparkle">{selectedGame.emoji}</span>
          <p className="garden-overline">MIUMI PLAYROOM · RESULTS</p>
          <h1>{resultTitle}</h1>
          <p className="playroom-results-subtitle">You completed {completedCount} of {totalRounds} rounds of {selectedGame.title}.</p>
          <div className="playroom-results-stat">
            <strong>{activeGame === "two-truths" ? score + "/" + totalRounds : completedCount}</strong>
            <span>{activeGame === "two-truths" ? "correct guesses" : "rounds played"}</span>
          </div>
          {activeGame === "this-or-that" && favoriteChoice && (
            <div className="playroom-result-highlight"><span>YOUR MOST-PICKED ANSWER</span><strong>{favoriteChoice[0]}</strong><small>Chosen {favoriteChoice[1]} {favoriteChoice[1] === 1 ? "time" : "times"}</small></div>
          )}
          {activeGame === "never-have-i-ever" && (
            <div className="playroom-result-highlight"><span>YOUR LITTLE RECAP</span><strong>{responses.filter((item) => item.endsWith("I've done this")).length} things you've tried</strong><small>Every round is a story to tell — only share what you want.</small></div>
          )}
          {activeGame === "truth-or-dare" && (
            <div className="playroom-result-highlight"><span>YOUR PLAY STYLE</span><strong>{responses.filter((item) => item.startsWith("TRUTH")).length} truths · {responses.filter((item) => item.startsWith("DARE")).length} dares</strong><small>Thanks for bringing the fun and keeping it kind.</small></div>
          )}
          {activeGame === "two-truths" && (
            <div className="playroom-result-highlight"><span>YOUR DETECTIVE SCORE</span><strong>{score >= 8 ? "Brilliant!" : score >= 5 ? "Well spotted!" : "Keep practising!"}</strong><small>{Math.round((score / totalRounds) * 100)}% correct this game</small></div>
          )}
        </div>
        <div className="playroom-results-history">
          <div className="playroom-results-history-heading"><h2>Your game recap</h2><span>{completedCount} rounds</span></div>
          {responses.map((response, index) => <div className="playroom-result-row" key={index}><span>{String(index + 1).padStart(2, "0")}</span><p>{response}</p></div>)}
        </div>
        <div className="playroom-controls">
          <button type="button" className="playroom-secondary-button" onClick={shareResult}>↗ Share result</button>
          <button type="button" className="playroom-primary-button" onClick={() => startGame(activeGame)}>Play again ↻</button>
        </div>
        <button type="button" className="playroom-back-to-games" onClick={() => { setActiveGame(null); setFinished(false); }}>Back to all games</button>
      </section>
    );
  }

  return (
    <section className="feature-page playroom-page page-enter">
      <div className="playroom-topline">
        <button type="button" className="playroom-back" onClick={() => setActiveGame(null)}>← All games</button>
        <button type="button" className="playroom-reset" onClick={resetGame}>↻ Restart</button>
      </div>
      <div className="playroom-game-heading"><span>{selectedGame.emoji}</span><p className="garden-overline">MIUMI PLAYROOM</p><h1>{selectedGame.title}</h1><p>{selectedGame.description}</p></div>
      <div className="playroom-settings">
        <div className="playroom-setting"><label htmlFor="playroom-mode">Playing mode</label><select id="playroom-mode" value={mode} onChange={(event) => setMode(event.target.value)}><option>Solo</option><option>Friends</option><option>Couples</option><option>Group</option></select></div>
        <div className="playroom-setting"><label htmlFor="playroom-category">Question pack</label><select id="playroom-category" value={category} onChange={(event) => changeCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
      </div>
      <div className="playroom-mode-hint">{mode === "Solo" ? "A little you-time. Play at your own pace. ♡" : mode === "Couples" ? "Take turns together and see what you discover. 💌" : mode === "Friends" ? "Pass the phone to a friend after each turn. 👯" : "Gather everyone around and take turns. 🎉"}</div>
      <div className="playroom-round-card" key={activeGame + "-" + category + "-" + round + "-" + usingCustom}>
        <div className="playroom-round-meta"><span>ROUND {roundNumber} / {totalRounds}</span><span>{selectedGame.emoji} A LITTLE ADVENTURE</span></div><div className="playroom-progress"><span style={{ width: ((roundNumber / totalRounds) * 100) + "%" }} /></div>
        {activeGame === "this-or-that" && prompt && <>
          <h2 className="playroom-question">{prompt.prompt}</h2>
          <div className="playroom-choice-grid">{prompt.options.map((option: string, index: number) => <button type="button" key={option} className={"playroom-choice " + (choice === index ? "is-picked" : "")} onClick={() => setChoice(index)}><span className="playroom-choice-number">0{index + 1}</span><strong>{option}</strong>{choice === index && <span className="playroom-picked-mark">✓ Your pick</span>}</button>)}</div>
          <p className="playroom-feedback">{choice === null ? "There are no wrong answers. Pick the one that feels like you. ♡" : "You picked " + prompt.options[choice] + ". Lovely choice! ♡"}</p>
        </>}
        {activeGame === "never-have-i-ever" && prompt && <>
          <span className="playroom-big-emoji">🙈</span><h2 className="playroom-question">{prompt.text}</h2>
          <div className="playroom-choice-grid">
            <button type="button" className={"playroom-choice " + (choice === 0 ? "is-picked" : "")} onClick={() => setChoice(0)}><strong>I've done this ✋</strong>{choice === 0 && <span className="playroom-picked-mark">That's me!</span>}</button>
            <button type="button" className={"playroom-choice " + (choice === 1 ? "is-picked" : "")} onClick={() => setChoice(1)}><strong>Never have I ever 🙅</strong>{choice === 1 && <span className="playroom-picked-mark">Not me!</span>}</button>
          </div>
          <p className="playroom-feedback">Share only what you're comfortable sharing. Passing is always okay. ♡</p>
        </>}
        {activeGame === "truth-or-dare" && prompt && <>
          <div className="playroom-choice-grid playroom-truth-dare">
            <button type="button" className={"playroom-choice " + (truthOrDare === "truth" ? "is-picked" : "")} onClick={() => { const pool = playroomDecks["truth-or-dare"][category].map((item: any, index: number) => ({ item, index })).filter(({ item }: any) => item.type === "truth"); const available = pool.filter(({ index }: any) => !truthDareSeen.includes(index)); const source = available.length ? available : pool; const pick = source[Math.floor(Math.random() * source.length)]; if (pick) { setTruthDarePrompt(pick.item); setTruthDareSeen((previous) => available.length ? [...previous, pick.index] : [pick.index]); setTruthOrDare("truth"); setRevealed(true); } }}><span className="playroom-big-emoji">💬</span><strong>Truth</strong><span>Answer a question</span></button>
            <button type="button" className={"playroom-choice " + (truthOrDare === "dare" ? "is-picked" : "")} onClick={() => { const pool = playroomDecks["truth-or-dare"][category].map((item: any, index: number) => ({ item, index })).filter(({ item }: any) => item.type === "dare"); const available = pool.filter(({ index }: any) => !truthDareSeen.includes(index)); const source = available.length ? available : pool; const pick = source[Math.floor(Math.random() * source.length)]; if (pick) { setTruthDarePrompt(pick.item); setTruthDareSeen((previous) => available.length ? [...previous, pick.index] : [pick.index]); setTruthOrDare("dare"); setRevealed(true); } }}><span className="playroom-big-emoji">✨</span><strong>Dare</strong><span>Try a harmless challenge</span></button>
          </div>
          {revealed && truthOrDare && <div className="playroom-prompt-reveal"><span>{truthOrDare === "truth" ? "YOUR TRUTH" : "YOUR DARE"}</span><p>{truthDarePrompt?.text ?? "Choose another round for a new prompt."}</p></div>}
          <p className="playroom-feedback">Keep it kind, comfortable and optional. You can always pass. ♡</p>
        </>}
        {activeGame === "two-truths" && prompt && <>
          <h2 className="playroom-question">Which statement is the lie?</h2>
          <div className="playroom-statement-list">{(usingCustom ? customStatements : prompt.statements).map((statement: string, index: number) => <button type="button" key={index + "-" + statement} className={"playroom-statement " + (choice === index ? "is-picked " : "") + (revealed && index === (usingCustom ? customLie : prompt.lie) ? "is-correct " : "") + (revealed && choice === index && index !== (usingCustom ? customLie : prompt.lie) ? "is-wrong" : "")} onClick={() => !revealed && setChoice(index)}><span>{index + 1}</span><strong>{statement}</strong>{revealed && index === (usingCustom ? customLie : prompt.lie) && <em>THE LIE</em>}</button>)}</div>
          {!revealed ? <button type="button" className="playroom-primary-button" disabled={choice === null} onClick={() => { setRevealed(true); if (choice === (usingCustom ? customLie : prompt.lie)) setScore((value) => value + 1); }}>Reveal the answer ✨</button> : <div className="playroom-prompt-reveal"><span>{choice === (usingCustom ? customLie : prompt.lie) ? "YOU GOT IT! ♡" : "THE LIE WAS NUMBER " + ((usingCustom ? customLie : prompt.lie) + 1)}</span><p>{usingCustom ? "Nice round! Your friends made that one tricky." : prompt.explanation}</p></div>}
          <p className="playroom-feedback">Correct guesses this session: {score}</p>
          <div className="playroom-custom"><button type="button" className="playroom-custom-toggle" onClick={() => setUsingCustom((value) => !value)}>✎ Make your own round</button>
            {usingCustom && <div className="playroom-custom-form"><p>Write three statements and choose which one is the lie.</p>
              {customStatements.map((statement, index) => <input key={index} value={statement} onChange={(event) => setCustomStatements((values) => values.map((value, i) => i === index ? event.target.value : value))} placeholder={"Statement " + (index + 1)} maxLength={110} />)}
              <label htmlFor="custom-lie">Which one is the lie?</label><select id="custom-lie" value={customLie} onChange={(event) => setCustomLie(Number(event.target.value))}><option value={0}>Statement 1</option><option value={1}>Statement 2</option><option value={2}>Statement 3</option></select>
              <button type="button" className="playroom-primary-button" onClick={submitCustomRound} disabled={!customStatements.every((statement) => statement.trim())}>Use my round</button>
            </div>}
          </div>
        </>}
      </div>
      <div className="playroom-controls"><button type="button" className="playroom-secondary-button" onClick={sharePrompt}>↗ Share prompt</button>{roundNumber < totalRounds ? <button type="button" className="playroom-primary-button" disabled={activeGame === "two-truths" ? !revealed : activeGame === "truth-or-dare" ? !truthOrDare : choice === null} onClick={nextPrompt}>Next round <span>→</span></button> : <button type="button" className="playroom-primary-button" disabled={activeGame === "two-truths" ? !revealed : activeGame === "truth-or-dare" ? !truthOrDare : choice === null} onClick={finishGame}>See my results ✨</button>}</div>
      <p className="playroom-closing-note">୨୧ made for good company and gentle fun ♡</p>
    </section>
  );
}


type BunnyLook = { colour: string; bow: string; outfit: string };
const bunnyLooks: BunnyLook = { colour: "#F4BBD2", bow: "#C98BB7", outfit: "#F7E7F0" };

function MiumiBunnyGuide({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [open, setOpen] = useState(false);
  const [customising, setCustomising] = useState(false);
  const [look, setLook] = useState<BunnyLook>(() => {
    try {
      const saved = window.localStorage.getItem("miumi-bunny-look");
      return saved ? { ...bunnyLooks, ...JSON.parse(saved) as Partial<BunnyLook> } : bunnyLooks;
    } catch { return bunnyLooks; }
  });
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ from: "bunny" | "visitor"; text: string; target?: Page }[]>([
    { from: "bunny", text: "Hiii! I'm your Miumi Bunny guide. Ask me where something is, or how to use a feature. ♡" },
  ]);
  useEffect(() => {
    try { window.localStorage.setItem("miumi-bunny-look", JSON.stringify(look)); } catch { /* keep this session's look */ }
  }, [look]);

  const pages: { page: Page; name: string; aliases: string[]; description: string }[] = [
    { page: "home", name: "Home", aliases: ["home", "homepage", "start"], description: "Your Miumi home page has the daily question and featured quizzes." },
    { page: "quizzes", name: "Quizzes", aliases: ["quiz", "quizzes", "personality quiz"], description: "Browse the quiz collection and choose one to play." },
    { page: "results", name: "My results", aliases: ["result", "results", "score", "history"], description: "Your completed quiz results live here." },
    { page: "friendship", name: "Friendship Universe", aliases: ["friendship", "universe", "friendship universe"], description: "Explore your friendship world and identities." },
    { page: "calendar", name: "Miumi Calendar", aliases: ["calendar", "birthday", "anniversary", "date"], description: "Save birthdays, friendship anniversaries, plans, reminders and memories." },
    { page: "duo", name: "Miumi Duo", aliases: ["duo", "compatibility", "two people", "friendship test"], description: "Answer separately with a friend and reveal your duo result together." },
    { page: "dedicate", name: "Create & Dedicate", aliases: ["dedicate", "letter", "card", "message", "gift"], description: "This is the creative dedication area; the full studio is still marked as coming soon." },
    { page: "games", name: "Playroom", aliases: ["game", "games", "playroom", "truth or dare", "never have i ever"], description: "Find the mini-games: This or That, Never Have I Ever, Truth or Dare, and Two Truths & One Lie." },
    { page: "photo-studio", name: "Photo Studio", aliases: ["photo", "photos", "photo studio", "print", "postcard", "folded card"], description: "Make a printable photo postcard or folded card, add 2–6 photos, and customise a template." },
    { page: "museum", name: "Museum of Us", aliases: ["museum", "museum of us", "exhibit", "memory room"], description: "Keep friendship memories in the Firsts, Inside Jokes, Our Eras and Future rooms." },
  ];

  const findAnswer = (raw: string): { text: string; target?: Page } => {
    const q = raw.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\\s+/g, " ").trim();
    if (!q) return { text: "Try asking me something like “Where is Photo Studio?” or “How do I print a card?” ♡" };
    if (/(print|printing|pdf)/.test(q)) return { text: "Open Photo Studio, choose postcard or folded card, add your photos and customise the design. Then press the print button to open your browser's print dialog. ♡", target: "photo-studio" };
    if (/(upload|add photos|add a photo)/.test(q)) return { text: "You can add 2–6 photos in Photo Studio. Your photos stay in your browser session and aren't uploaded to a Miumi server. ♡", target: "photo-studio" };
    if (/(save|add birthday|add date|reminder)/.test(q)) return { text: "Miumi Calendar is where you can add birthdays, anniversaries, plans, reminders and little memories. ♡", target: "calendar" };
    if (/(inside joke|memory|museum|exhibit)/.test(q)) return { text: "Visit Museum of Us! It has four rooms for your firsts, inside jokes, different eras and future wishes. ♡", target: "museum" };
    if (/(two truth|truth|dare|never have|this or that|mini game)/.test(q)) return { text: "The mini-games are all together in the Playroom. Pick a game and start a round! ♡", target: "games" };
    if (/(how.*duo|duo.*work|play.*friend)/.test(q)) return { text: "Miumi Duo is a pass-the-phone experience: each person answers their questions, then you reveal your shared result. ♡", target: "duo" };
    const match = pages.find((item) => item.aliases.some((alias) => q.includes(alias)));
    if (match) return { text: `${match.name} is in your main navigation. ${match.description}`, target: match.page };
    if (/(where|find|locate|tab|feature|section)/.test(q)) return { text: "I can help you find Home, Quizzes, My Results, Friendship Universe, Miumi Calendar, Miumi Duo, Create & Dedicate, Playroom, Photo Studio or Museum of Us. Which one are you looking for? ♡" };
    return { text: "I'm still learning the Miumi map! I can guide you around the tabs and explain the features. Try asking “Where is Miumi Calendar?” ♡" };
  };

  const send = (value = question) => {
    const clean = value.trim();
    if (!clean) return;
    const answer = findAnswer(clean);
    setMessages((items) => [...items, { from: "visitor", text: clean }, { from: "bunny", text: answer.text, ...(answer.target ? { target: answer.target } : {}) }]);
    setQuestion("");
  };
  const colourOptions = [{ label: "Strawberry pink", value: "#F4BBD2" }, { label: "Lavender", value: "#D8C9F2" }, { label: "Mint", value: "#C5E6D8" }, { label: "Buttercream", value: "#F3E1A8" }, { label: "Cloud blue", value: "#C9DDF3" }];
  return (
    <div className="miumi-bunny-guide">
      {open && (
        <section className="miumi-bunny-chat" aria-label="Miumi Bunny guide">
          <div className="miumi-bunny-chat-head">
            <div className="miumi-bunny-mini" style={{ "--bunny-colour": look.colour, "--bunny-bow": look.bow } as CSSProperties}>🐰</div>
            <div><strong>Miumi Bunny</strong><small>Your little website guide ♡</small></div>
            <button type="button" aria-label="Close guide" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="miumi-bunny-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div className={`miumi-bunny-message ${message.from === "visitor" ? "is-visitor" : "is-bunny"}`} key={index}>
                <p>{message.text}</p>
                {message.target && <button type="button" onClick={() => { onNavigate(message.target!); setOpen(false); }}>Take me there <span>→</span></button>}
              </div>
            ))}
          </div>
          <div className="miumi-bunny-quick">
            {["Where is Photo Studio?", "How do I print a card?", "What is Museum of Us?"].map((prompt) => <button type="button" key={prompt} onClick={() => send(prompt)}>{prompt}</button>)}
          </div>
          {customising && (
            <div className="miumi-bunny-customiser">
              <label>My bunny's colour<select value={look.colour} onChange={(event) => setLook((old) => ({ ...old, colour: event.target.value }))}>{colourOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
              <label>Bow colour<select value={look.bow} onChange={(event) => setLook((old) => ({ ...old, bow: event.target.value }))}><option value="#C98BB7">Rose</option><option value="#9B83C7">Lilac</option><option value="#83BCA5">Mint</option><option value="#D6A64E">Honey</option></select></label>
              <label>Outfit<select value={look.outfit} onChange={(event) => setLook((old) => ({ ...old, outfit: event.target.value }))}><option value="#F7E7F0">Pink dress</option><option value="#E9E2FA">Lavender dress</option><option value="#E2F1E9">Mint dress</option><option value="#F7EFD8">Cream dress</option></select></label>
            </div>
          )}
          <div className="miumi-bunny-compose">
            <button type="button" className="miumi-bunny-customise" onClick={() => setCustomising((value) => !value)} aria-label="Customise your bunny">🎀</button>
            <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); }} placeholder="Ask your bunny..." aria-label="Ask Miumi Bunny" />
            <button type="button" onClick={() => send()} aria-label="Send question">➤</button>
          </div>
        </section>
      )}
      <button type="button" className="miumi-bunny-launcher" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close Miumi Bunny guide" : "Open Miumi Bunny guide"}>
        <span className="miumi-bunny-launcher-art" style={{ "--bunny-colour": look.colour, "--bunny-bow": look.bow, "--bunny-outfit": look.outfit } as React.CSSProperties}>🐰</span>
        <span className="miumi-bunny-launcher-label">Need a little help?</span>
        <span className="miumi-bunny-launcher-sparkle">✦</span>
      </button>
    </div>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className={`nav-button${active ? " nav-button-active" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

function MysteryBox({
  quizzes,
  onStart,
}: {
  quizzes: QuizDefinition[];
  onStart: (quiz: QuizDefinition) => void;
}) {
  const [opened, setOpened] = useState(false);
const [opening, setOpening] = useState(false);
  const mysteryIndex = quizzes.length
    ? Math.floor(Date.now() / 86400000) % quizzes.length
    : 0;

  const mystery = quizzes[mysteryIndex];

  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <p className="eyebrow">psst... there's a surprise inside</p>
          <h2>Mystery Quiz Box 🎁</h2>
        </div>
      </div>

      <article className="quiz-card quiz-card-rose">
        {!opened ? (
          <div className="text-center">
            <div className={`mystery-box-3d${opening ? " opening" : ""}`}>
  <div className="mystery-gift">🎁</div>
</div>
            <h3>A little surprise is waiting!</h3>
            <p>Open your mystery box to discover today's quiz.</p>
                        <Button
              className="hero-cta"
              onClick={() => {
                setOpening(true);
                window.setTimeout(() => setOpened(true), 800);
              }}
            >
              Open my mystery box ✨
            </Button>
          </div>
        ) : mystery ? (
          <div className="text-center">
            <div className="text-5xl mb-4">💗</div>
            <h3>{mystery.title}</h3>
            <p>A mystery quiz has been picked just for today!</p>
            <Button className="hero-cta" onClick={() => onStart(mystery)}>
              Play mystery quiz 💗
            </Button>
          </div>
        ) : (
          <p>No quizzes available right now. Come back soon!</p>
        )}
      </article>
    </section>
  );
}

function Wonderland() {
  const [activeWorld, setActiveWorld] = useState("home");
  const [stars, setStars] = useState(0);
  const [flowers, setFlowers] = useState(0);
  const [treasureFound, setTreasureFound] = useState(false);
  const [stickers, setStickers] = useState<string[]>([]);
  const [roomDecor, setRoomDecor] = useState<string[]>([]);
const [roomTheme, setRoomTheme] = useState("pink");

  const worlds = [
    { id: "pet", emoji: "🐰", name: "Pet Paradise", description: "Visit your tiny fluffy friend!" },
    { id: "room", emoji: "🏡", name: "My Little Room", description: "Decorate your magical bedroom!" },
    { id: "garden", emoji: "🌷", name: "Magic Garden", description: "Grow a garden full of magic!" },
    { id: "treasure", emoji: "💎", name: "Treasure Hunt", description: "Find a hidden surprise!" },
    { id: "stickers", emoji: "🎀", name: "Sticker World", description: "Collect your cute rewards!" },
  ];

  function collectSticker(name: string) {
    setStickers((current) =>
      current.includes(name) ? current : [...current, name]
    );
  }

  return (
    <section className="wonderland-world">
      <div className="wonderland-sky">
        <span className="wonderland-star star-one">✦</span>
        <span className="wonderland-star star-two">✧</span>
        <span className="wonderland-star star-three">✦</span>

        <p className="wonderland-label">✧ a magical place made for you ✧</p>
        <h2>Welcome to MIUMI Wonderland! 🏰</h2>
        <p>Explore little worlds, collect stars and discover surprises.</p>

        <div className="wonderland-score">⭐ {stars} magical stars</div>
      </div>

      {activeWorld === "home" ? (
        <div className="wonderland-doors">
          {worlds.map((world) => (
            <button
              key={world.id}
              className="wonderland-door"
              onClick={() => setActiveWorld(world.id)}
            >
              <span className="wonderland-door-emoji">{world.emoji}</span>
              <strong>{world.name}</strong>
              <span>{world.description}</span>
              <small>Enter world ✨</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="wonderland-adventure">
          <button
            className="wonderland-back"
            onClick={() => setActiveWorld("home")}
          >
            ← Back to Wonderland
          </button>

          {activeWorld === "pet" && (
            <>
              <h3>🐰 Pet Paradise</h3>
              <div className="wonderland-big-emoji">🐰</div>
              <p>Your bunny is waiting for you!</p>
              <button onClick={() => { setStars(stars + 1); collectSticker("Bunny Bestie"); }}>
                Give bunny a treat 🥕
              </button>
              <p>Feed your bunny to earn a star!</p>
            </>
          )}
          

          {activeWorld === "room" && (
            <>
              <h3>🏡 My Little Room</h3>
              <p>Welcome to your tiny dream bedroom!</p>

              
              <div className={`little-room room-theme-${roomTheme}`}>
                <div className="room-window">🌙 ✨</div>
                <div className="room-lamp">💡</div>
                <div className="room-bed">🛏️</div>
                <div className="room-rug">🧸</div>
                <div className="room-plant">🪴</div>

                {roomDecor.includes("teddy") && (
                  <div className="room-extra room-extra-teddy">🧸</div>
                )}

                {roomDecor.includes("flowers") && (
                  <div className="room-extra room-extra-flowers">🌸</div>
                )}

                {roomDecor.includes("stars") && (
                  <div className="room-extra room-extra-stars">✨ ⭐ ✨</div>
                )}
              </div>

              <p>Choose decorations for your room!</p>
              
              <p>Choose your dream room colour! 🎨</p>

              <div className="room-decorations">
                <button onClick={() => setRoomTheme("pink")}>
                  🎀 Pink Dream
                </button>

                <button onClick={() => setRoomTheme("purple")}>
                  💜 Lavender
                </button>

                <button onClick={() => setRoomTheme("blue")}>
                  🩵 Cloud Blue
                </button>
              </div>


              
              <div className="room-decorations">
                <button onClick={() => {
                  setRoomDecor([...roomDecor, "teddy"]);
                  setStars(stars + 1);
                  collectSticker("Teddy Collector");
                }}>
                  🧸 Add teddy
                </button>

                <button onClick={() => {
                  setRoomDecor([...roomDecor, "flowers"]);
                  setStars(stars + 1);
                  collectSticker("Flower Lover");
                }}>
                  🌸 Add flowers
                </button>

                <button onClick={() => {
                  setRoomDecor([...roomDecor, "stars"]);
                  setStars(stars + 1);
                  collectSticker("Star Collector");
                }}>
                  ⭐ Add stars
                </button>
              </div>

            </>
          )}

          {activeWorld === "garden" && (
            <>
              <h3>🌷 Magic Garden</h3>
              <div className="wonderland-big-emoji">
                {flowers === 0 ? "🌱" : "🌸".repeat(Math.min(flowers, 8))}
              </div>
              <p>Your garden has {flowers} flowers!</p>
              <button onClick={() => { setFlowers(flowers + 1); setStars(stars + 1); collectSticker("Flower Fairy"); }}>
                Plant a magical flower 🌷
              </button>
            </>
          )}

          {activeWorld === "treasure" && (
            <>
              <h3>💎 Treasure Hunt</h3>
              <div className="wonderland-big-emoji">
                {treasureFound ? "👑" : "🎁"}
              </div>
              <p>{treasureFound ? "You found the royal treasure!" : "A secret treasure is hiding here..."}</p>
              {!treasureFound && (
                <button onClick={() => { setTreasureFound(true); setStars(stars + 5); collectSticker("Treasure Explorer"); }}>
                  Open the mystery treasure 🎁
                </button>
              )}
            </>
          )}

          {activeWorld === "stickers" && (
            <>
              <h3>🎀 Sticker Collection</h3>
              <div className="wonderland-stickers">
                {stickers.length === 0
                  ? "Your collection is waiting for its first sticker!"
                  : stickers.map((sticker) => <span key={sticker}>✨ {sticker}</span>)}
              </div>
              <p>Explore the other worlds to earn stickers!</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
function DearYou() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [song, setSong] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [artist, setArtist] = useState("");
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("pink");

  const [status, setStatus] = useState("");
  const [receivedCard, setReceivedCard] = useState<any>(null);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const savedCard = params.get("dear-you");

  if (savedCard) {
    try {
      setReceivedCard(JSON.parse(savedCard));
    } catch {
      setStatus("This dedication link is invalid. 💗");
    }
  }
}, []);

  async function createCard() {
    if (!to.trim() || !song.trim() || !message.trim()) {
      setStatus("Please fill in the recipient, song and message! 💗");
      return;
    }

  const dedication = {
  to,
  from,
  song,
  artist,
  songUrl,
  message,
  theme,
};

    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set(
      "dear-you",
      JSON.stringify(dedication)
    );

    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      setStatus("Your dedication link has been copied! 💌");
    } catch {
      setStatus("Couldn't copy the link. Please try again!");
    }
  }

  return (
    <section className="dear-you">
  {receivedCard ? (
    <div className={`dear-you-preview dear-theme-${receivedCard.theme}`}>
      <span>♡ A LITTLE GIFT FOR YOU ♡</span>
      <h3>Dear, {receivedCard.to}...</h3>
      <div>🎵</div>
      <h2>{receivedCard.song}</h2>
<p>{receivedCard.artist}</p>

{receivedCard.songUrl && (
  <a
    href={receivedCard.songUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="dear-you-listen"
  >
    🎧 Listen to this song
  </a>
)}

<p>{receivedCard.message}</p>
      <small>With love, {receivedCard.from} ♡</small>
    </div>
   ) : (
    <>
      <div className="dear-you-heading">
        <span>💌 🎧 ✨</span>
        <p>A SONG, A FEELING, A LITTLE MESSAGE</p>
        <h2>Dear, You ♡</h2>
        <p>Turn a special song into a little gift for someone.</p>
      </div>

      <div className="dear-you-form">
        <label>Who is this for?</label>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Your friend's nickname"
        />

        <label>Your nickname</label>
        <input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From..."
        />

        <label>Song title</label>
        <input
          value={song}
          onChange={(e) => setSong(e.target.value)}
          placeholder="A song that reminds you of them"
        />
<input
  value={songUrl}
  onChange={(e) => setSongUrl(e.target.value)}
  placeholder="Spotify or YouTube song link (optional)"
/>
        <label>Artist</label>
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist name"
        />

        <label>Your message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a little something..."
          rows={4}
        />

        <label>Choose your card colour</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="pink">Pink Dream 🎀</option>
          <option value="purple">Lavender 💜</option>
          <option value="blue">Cloud Blue 🩵</option>
        </select>

        <div className={`dear-you-preview dear-theme-${theme}`}>
          <span>♡ A LITTLE GIFT FOR YOU ♡</span>
          <h3>Dear, {to || "Someone Special"}...</h3>
          <div>🎵</div>
          <h2>{song || "Your favourite song"}</h2>
          <p>{artist || "Artist name"}</p>
          <p>{message || "Your beautiful message will appear here..."}</p>
          <small>With love, {from || "Someone"} ♡</small>
        </div>
<button type="button" onClick={createCard}>
  Create my card 💌
</button>

{status && <p className="dear-you-status">{status}</p>}
      
         </div>
    </>
    )}
    </section>
  );
}

function MiumiBunny() {
  const [bunnyColor, setBunnyColor] = useState("pink");
  const [bunnyName, setBunnyName] = useState("Mochi");
  const [accessory, setAccessory] = useState("bow");

  const colors: Record<string, string> = {
    pink: "#ffb8d2",
    lavender: "#cdb8ff",
    cream: "#ffe5b5",
    mint: "#aee9d3",
    blue: "#afdfff",
  };

  return (
    <section className="miumi-bunny">
      <div className="bunny-heading">
        <span>🐰 YOUR LITTLE COMPANION</span>
        <h2>Meet your MIUMI Bunny!</h2>
        <p>Create a little character that's completely yours ♡</p>
      </div>

      <div className="bunny-creator">
        <div className="bunny-stage">
          <div
            className="bunny-character"
            style={{ background: colors[bunnyColor] }}
          >
            <div className="bunny-ear bunny-ear-left" />
            <div className="bunny-ear bunny-ear-right" />

            <div className="bunny-face">
              <span className="bunny-eye bunny-eye-left">●</span>
              <span className="bunny-eye bunny-eye-right">●</span>
              <span className="bunny-cheek bunny-cheek-left" />
              <span className="bunny-cheek bunny-cheek-right" />
              <span className="bunny-nose">♥</span>
            </div>

            {accessory === "bow" && (
              <div className="bunny-accessory">🎀</div>
            )}
            {accessory === "crown" && (
              <div className="bunny-accessory">👑</div>
            )}
            {accessory === "flower" && (
              <div className="bunny-accessory">🌸</div>
            )}
            {accessory === "none" && null}
          </div>

          <div className="bunny-shadow" />
          <p className="bunny-name">{bunnyName || "Your Bunny"} ♡</p>
        </div>

        <div className="bunny-options">
          <label>Name your bunny</label>
          <input
            value={bunnyName}
            onChange={(e) => setBunnyName(e.target.value)}
            placeholder="Enter a cute name..."
            maxLength={18}
          />

          <label>Choose a colour</label>
          <div className="bunny-color-options">
            {Object.keys(colors).map((color) => (
              <button
                key={color}
                type="button"
                className={bunnyColor === color ? "selected" : ""}
                style={{ background: colors[color] }}
                onClick={() => setBunnyColor(color)}
                aria-label={color}
              />
            ))}
          </div>

          <label>Choose an accessory</label>
          <div className="bunny-accessory-options">
            {[
              ["bow", "🎀"],
              ["crown", "👑"],
              ["flower", "🌸"],
              ["none", "♡"],
            ].map(([item, emoji]) => (
              <button
                key={item}
                type="button"
                className={accessory === item ? "selected" : ""}
                onClick={() => setAccessory(item)}
              >
                {emoji}
              </button>
            ))}
          </div>

          <p className="bunny-hint">
            Your little friend is waiting for you! ✨
          </p>
        </div>
      </div>
    </section>
  );
}
function MiumiJournal() {
  const articles = [
    {
      category: "FRIENDSHIP",
      title: "Little Things That Make Friendships Special",
      description: "Simple ways to make your favourite people feel appreciated.",
      emoji: "🌷",
      color: "pink",
      read: "4 min read",
    },
    {
      category: "COLLEGE LIFE",
      title: "Your Guide to a Fresh College Start",
      description: "Making friends, finding confidence and enjoying new beginnings.",
      emoji: "🎀",
      color: "lavender",
      read: "5 min read",
    },
    {
      category: "FUN LISTS",
      title: "25 Questions to Ask Your Best Friend",
      description: "Cute, funny and meaningful questions for your next conversation.",
      emoji: "💌",
      color: "peach",
      read: "3 min read",
    },
    {
      category: "SELF GROWTH",
      title: "A Little Reminder to Believe in Yourself",
      description: "Small steps towards becoming a more confident you.",
      emoji: "🦋",
      color: "mint",
      read: "4 min read",
    },
  ];
const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  return (
    <section className="miumi-journal">
      {selectedArticle !== null ? (
        <div className="journal-reading">
          <button
            className="journal-back"
            onClick={() => setSelectedArticle(null)}
          >
            ← Back to Journal
          </button>

          <div className="journal-reading-content">
            <span>{articles[selectedArticle].category}</span>
            <h2>{articles[selectedArticle].title}</h2>
            <p>{articles[selectedArticle].description}</p>

            <div className="journal-reading-decoration">🌷 ✨ 💌</div>

           {selectedArticle === 0 ? (
  <>
    <h3>A little introduction 🌷</h3>
    <p>
      Friendship is built through small moments of kindness,
      trust and understanding. You don't need expensive gifts
      or grand gestures to make someone feel special.
    </p>

    <h3>Little things that matter</h3>
    <ul>
      <li>Remember the little details your friends share.</li>
      <li>Check in and ask how their day went.</li>
      <li>Celebrate their achievements.</li>
      <li>Listen without judging.</li>
      <li>Make time for meaningful conversations.</li>
    </ul>

    <h3>One little challenge ♡</h3>
    <p>
      Send a friend a kind message today. A few sincere
      words can make an ordinary day brighter.
    </p>
  </>
) : selectedArticle === 1 ? (
  <>
    <h3>A fresh beginning 🎀</h3>
    <p>
      Starting college can feel exciting and unfamiliar.
      Remember that you don't have to figure everything
      out on your first day. Give yourself time.
    </p>

    <h3>Make your college experience special</h3>
    <ul>
      <li>Introduce yourself to someone new.</li>
      <li>Keep track of assignments and important dates.</li>
      <li>Join activities that genuinely interest you.</li>
      <li>Ask questions whenever you need help.</li>
      <li>Make time for studies, rest and hobbies.</li>
    </ul>

    <h3>Your little reminder ♡</h3>
    <p>
      You belong in every room where you are learning
      and growing. You don't need to be perfect to begin.
    </p>
  </>
) : selectedArticle === 2 ? (
  <>
    <h3>Let's start a conversation 💌</h3>
    <p>
      Sometimes the best conversations begin with
      unexpected questions. Try these with your best friend!
    </p>

    <h3>25 questions to ask</h3>
    <ul>
      <li>What is your happiest childhood memory?</li>
      <li>What's your dream travel destination?</li>
      <li>What always makes you laugh?</li>
      <li>What's your favourite comfort food?</li>
      <li>Which fictional world would you visit?</li>
      <li>What's your dream career?</li>
      <li>What's one skill you'd love to learn?</li>
      <li>What song describes your mood today?</li>
      <li>What's your favourite season?</li>
      <li>What's your funniest memory?</li>
      <li>What's one thing on your bucket list?</li>
      <li>Which movie could you watch again and again?</li>
      <li>What makes you feel appreciated?</li>
      <li>What's your favourite way to relax?</li>
      <li>What's something you're proud of?</li>
      <li>What would your perfect weekend look like?</li>
      <li>Which animal would you choose as a pet?</li>
      <li>What's your favourite childhood game?</li>
      <li>What's one thing you want to try this year?</li>
      <li>Who inspires you?</li>
      <li>What's your favourite little tradition?</li>
      <li>What's something people misunderstand about you?</li>
      <li>What makes a friendship meaningful?</li>
      <li>What's one thing you're looking forward to?</li>
      <li>What's one memory you'd love to make together?</li>
    </ul>

    <h3>One little challenge ♡</h3>
    <p>
      Pick five questions and take turns answering them.
      No rushing — enjoy the conversation!
    </p>
  </>
) : (
  <>
    <h3>Growing at your own pace 🦋</h3>
    <p>
      Self-growth isn't about becoming someone else.
      It's about discovering your strengths, learning
      from experiences and becoming more comfortable
      with who you are.
    </p>

    <h3>Small steps towards confidence</h3>
    <ul>
      <li>Try something new, even if it feels unfamiliar.</li>
      <li>Celebrate progress instead of chasing perfection.</li>
      <li>Learn to say no respectfully.</li>
      <li>Spend time on hobbies you enjoy.</li>
      <li>Be kind to yourself when you make mistakes.</li>
    </ul>

    <h3>A little reminder ♡</h3>
    <p>
      You don't have to compare your journey with anyone
      else's. Every small step forward counts.
    </p>
  </>
)}
          </div>
        </div>
      ) : (
        <>
      <div className="journal-hero">
        <span className="journal-sparkle">✦ a little corner of inspiration ✦</span>
        <h2>MIUMI's Little Journal</h2>
        <p>Stories, little ideas and lovely things to make your days brighter.</p>
        <span className="journal-decoration">🌸 🧸 🌷</span>
      </div>

      <div className="journal-heading">
        <div>
          <span>THE LITTLE LIBRARY</span>
          <h3>Something lovely to read</h3>
        </div>
        <span className="journal-flower">✿</span>
      </div>

      <div className="journal-grid">
        {articles.map((article, index) => (
          <article
  className={`journal-card ${article.color}`}
  key={index}
  onClick={() => setSelectedArticle(index)}
  role="button"
  tabIndex={0}
>
            <div className="journal-card-top">
              <span>{article.category}</span>
              <span className="journal-emoji">{article.emoji}</span>
            </div>
            <h3>{article.title}</h3>
            <p>{article.description}</p>
            <div className="journal-card-bottom">
              <span>♡ {article.read}</span>
              <span>Coming soon ✨</span>
            </div>
          </article>
        ))}
      </div>

      <p className="journal-footer">made with a little magic and lots of love ♡</p>
                  </>
      )}
    </section>
  );
}
function MiumiScrapbook() {
  const [title, setTitle] = useState("Our Little Memories");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [memory, setMemory] = useState("");
  const [theme, setTheme] = useState("pink");
  const [decoration, setDecoration] = useState("🎀");

  const themes: Record<string, string> = {
    pink: "pink",
    lavender: "lavender",
    peach: "peach",
    mint: "mint",
  };

  const createScrapbook = () => {
    const book = {
      title,
      from,
      to,
      memory,
      theme,
      decoration,
    };

    const url = new URL(window.location.href);
    url.searchParams.set(
      "scrapbook",
      btoa(encodeURIComponent(JSON.stringify(book)))
    );

    navigator.clipboard.writeText(url.toString())
      .then(() => alert("Your scrapbook link has been copied! 💗"))
      .catch(() => alert("Please copy the scrapbook link from your browser address bar."));
  };

  const params = new URLSearchParams(window.location.search);
  const sharedBook = params.get("scrapbook");

  let receivedBook: typeof bookPlaceholder | null = null;

  const bookPlaceholder = {
    title: "",
    from: "",
    to: "",
    memory: "",
    theme: "pink",
    decoration: "🎀",
  };

  try {
    if (sharedBook) {
      receivedBook = JSON.parse(
        decodeURIComponent(atob(sharedBook))
      );
    }
  } catch {
    receivedBook = null;
  }

  if (receivedBook) {
    return (
      <section className={`miumi-scrapbook ${themes[receivedBook.theme] || "pink"}`}>
        <div className="scrapbook-page">
          <div className="scrapbook-decoration">{receivedBook.decoration}</div>
          <p className="scrapbook-label">A LITTLE BOOK OF MEMORIES</p>
          <h2>{receivedBook.title}</h2>
          <div className="scrapbook-heart">♡</div>
          <p className="scrapbook-names">
            Made by {receivedBook.from || "Someone special"}
            <br />
            For {receivedBook.to || "Someone lovely"}
          </p>
          <div className="scrapbook-memory">
            <h3>Our special memory</h3>
            <p>{receivedBook.memory}</p>
          </div>
          <p className="scrapbook-ending">some moments deserve their own little book ♡</p>
        </div>
      </section>
    );
  }

  return (
    <section className="miumi-scrapbook">
      <div className="scrapbook-intro">
        <span>✦ YOUR LITTLE MEMORY STUDIO ✦</span>
        <h2>MIUMI Scrapbook Studio</h2>
        <p>Turn your favourite memories into a little digital keepsake.</p>
      </div>

      <div className="scrapbook-editor">
        <div className="scrapbook-form">
          <label>Scrapbook title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />

          <label>Your name</label>
          <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Made by..." />

          <label>Friend's name</label>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="For someone special..." />

          <label>Your favourite memory</label>
          <textarea
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
            placeholder="Write a little memory here..."
            rows={5}
          />

          <label>Choose a theme</label>
          <div className="scrapbook-themes">
            {Object.keys(themes).map((item) => (
              <button
                key={item}
                className={theme === item ? "selected" : ""}
                onClick={() => setTheme(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <label>Choose a decoration</label>
          <div className="scrapbook-decorations">
            {["🎀", "🌷", "🦋", "💗", "⭐", "🧸"].map((item) => (
              <button
                key={item}
                className={decoration === item ? "selected" : ""}
                onClick={() => setDecoration(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            className="scrapbook-create"
            disabled={!memory.trim()}
            onClick={createScrapbook}
          >
            Create & Share My Scrapbook ♡
          </button>
        </div>

        <div className={`scrapbook-preview ${theme}`}>
          <span className="preview-decoration">{decoration}</span>
          <small>A LITTLE BOOK OF MEMORIES</small>
          <h3>{title || "Our Little Memories"}</h3>
          <div className="preview-heart">♡</div>
          <p>{from || "Your name"} & {to || "Your favourite person"}</p>
          <div className="preview-memory">
            {memory || "Your favourite memory will appear here..."}
          </div>
          <span className="preview-footer">made with love ♡</span>
        </div>
      </div>
    </section>
  );
}

const homeCopySymbols = [
  "⋆‧°𓏲ּ𝄢",
  "⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹",
  "𝜗𝜚⋆₊˚",
  "˙⋆✮",
  "‧₊ ♪˚⊹",
  "⊹ ࣪ ˖꒰ঌ ໒꒱.⋆˚࿔",
  "⋆˙⟡",
  "𐙚",
  "୨୧",
  "⋆｡°✩",
  "꒰ა ♡ ໒꒱",
  "♡₊˚",
  "｡ﾟ☁︎｡",
] as const;

function HomePage({
  daily,
  dailyAnswer,
  onDailyAnswer,
  onBrowse,
  onStart,
}: {
  daily: { prompt: string; options: string[] };
  dailyAnswer: string | null;
  onDailyAnswer: (answer: string) => void;
  onBrowse: () => void;
  onStart: (definition: QuizDefinition) => void;
}) {
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  const copySymbol = async (symbol: string) => {
    try {
      await navigator.clipboard.writeText(symbol);
      setCopiedSymbol(symbol);
      setCopyFailed(false);
      window.setTimeout(() => {
        setCopiedSymbol((current) => current === symbol ? null : current);
      }, 1500);
    } catch {
      setCopyFailed(true);
      setCopiedSymbol(null);
      window.setTimeout(() => setCopyFailed(false), 2200);
    }
  };

  return (
    <div className="home-page page-enter">
      <section className="home-symbol-library" aria-label="Copy cute symbols">
        <div className="home-symbol-heading">
          <div>
            <p className="eyebrow">a tiny touch of pretty</p>
            <h2>Little symbols to copy ♡</h2>
          </div>
          <span className="home-symbol-sparkle" aria-hidden="true">✧</span>
        </div>
        <div className="home-symbol-row" role="group" aria-label="Choose a symbol to copy">
          {homeCopySymbols.map((symbol, index) => {
            const isCopied = copiedSymbol === symbol;
            return (
              <button
                type="button"
                key={index}
                className={"home-symbol-copy-button" + (isCopied ? " is-copied" : "")}
                onClick={() => void copySymbol(symbol)}
                title={"Copy " + symbol}
                aria-label={isCopied ? "Symbol copied" : "Copy symbol " + (index + 1)}
              >
                <span className="home-symbol-glyph">{symbol}</span>
                <span className="home-symbol-copy-label">{isCopied ? "Copied!" : "Copy"}</span>
              </button>
            );
          })}
        </div>
        <p className="home-symbol-feedback" aria-live="polite">
          {copyFailed ? "Clipboard access wasn't available. Please try again. ♡" : copiedSymbol ? "Copied to your clipboard! ♡" : "Tap any symbol to copy it"}
        </p>
      </section>
      <section className="welcome-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-flower">✿</span> your happy place</p>
          <h1>Welcome to your<br /><span>little world!</span></h1>
          <p className="hero-subtitle">Friendship, fun and little discoveries ♡</p>
          <Button className="hero-cta" onClick={onBrowse}>Find a little quiz <ArrowRight /></Button>
          <span className="hero-doodle" aria-hidden="true">˚₊‧꒰ა ♡ ໒꒱ ‧₊˚</span>
        </div>
       <div className="hero-art-wrap">
  <span className="art-spark art-spark-one">✧</span>
  <span className="art-spark art-spark-two">♡</span>

  <div className="sky-cloud cloud-one">☁</div>
  <div className="sky-cloud cloud-two">☁</div>

  <div className="postcard">
    <div className="postcard-stamp">♡</div>
    <div className="postcard-flower">✿</div>
    <div className="postcard-lines">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div className="postcard-message">hello, lovely!</div>
    <div className="postcard-envelope">✉</div>
  </div>

  <span className="art-caption">
    a little sweetness<br />for you & your bestie
  </span>
</div>
      </section>
      <DearYou />
      <MiumiBunny />
      <MiumiJournal />
      <MiumiScrapbook />
            <Wonderland />
            <section className="section-block text-center">
        <p className="eyebrow">your tiny new friend ♡</p>
        <h2>Meet your little MIUMI pet! 🧸</h2>

        <div
          className="miumi-pet"
          onClick={(event) => {
            event.currentTarget.classList.remove("miumi-pet-happy");
            void event.currentTarget.offsetWidth;
            event.currentTarget.classList.add("miumi-pet-happy");
          }}
        >
          🐰
        </div>

        <p>Tap your bunny to make it happy! 💗</p>
      </section>

      <section className="section-block quiz-section">
        <div className="section-heading">
          <div><p className="eyebrow">a little fun for two</p><h2>Choose your adventure</h2></div>
          <Button variant="ghost" className="text-link" onClick={onBrowse}>See all <ArrowRight size={16} /></Button>
        </div>
        <div className="quiz-grid">
          {quizzes.map((definition, index) => <QuizCard key={definition.id} quiz={definition} index={index} onStart={() => onStart(definition)} />)}
        </div>
      </section>
      <MysteryBox quizzes={quizzes} onStart={onStart} />

      <section className="daily-section">
        <div className="daily-left">
          <div className="daily-icon"><span>☁</span><span className="daily-heart">♡</span></div>
          <div><p className="eyebrow">a tiny daily ritual</p><h2>Today's little question</h2><p className="daily-prompt">{daily.prompt}</p></div>
        </div>
        <div className="daily-options" role="group" aria-label="Choose your answer">
          {daily.options.map((option) => (
            <Button key={option} variant="outline" className={`daily-option${dailyAnswer === option ? " daily-option-picked" : ""}`} onClick={() => onDailyAnswer(option)} aria-pressed={dailyAnswer === option}>
              {dailyAnswer === option && <Check size={15} />}{option}
            </Button>
          ))}
        </div>
        <p className="daily-footnote">{dailyAnswer ? "Your answer is as lovely as you are ♡" : "Pick the one that feels like you ♡"}</p>
      </section>
      
            <section className="section-block friendship-corner">
        <div className="section-heading">
          <div>
            <p className="eyebrow">little notes for the heart</p>
            <h2>The Friendship Corner ♡</h2>
          </div>
        </div>

        <div className="quiz-grid">
          <article className="quiz-card quiz-card-rose">
            <h3>Listen with kindness</h3>
            <p>Sometimes being a good friend simply means listening without judging or interrupting.</p>
          </article>

          <article className="quiz-card quiz-card-lilac">
            <h3>Celebrate little wins</h3>
            <p>Be happy for your friends, whether they achieve something big or make a small step forward.</p>
          </article>

          <article className="quiz-card quiz-card-peach">
            <h3>Make time for each other</h3>
            <p>A thoughtful message or a little catch-up can remind someone that they matter.</p>
          </article>

          <article className="quiz-card quiz-card-mint">
            <h3>Respect differences</h3>
            <p>Good friends don't have to agree on everything. Respect and understanding help friendships grow.</p>
          </article>
        </div>
      </section>
            <section className="section-block friendship-fun">
        <div className="section-heading">
          <div>
            <p className="eyebrow">a little something to explore</p>
            <h2>Friendship Facts & Fun ♡</h2>
          </div>
        </div>

        <div className="quiz-grid">
          <article className="quiz-card quiz-card-rose">
            <h3>💌 A little kindness</h3>
            <p>Small acts of kindness can make friendships feel stronger and more meaningful.</p>
          </article>

          <article className="quiz-card quiz-card-lilac">
            <h3>✨ Did you know?</h3>
            <p>Shared experiences, from little adventures to funny memories, can bring friends closer.</p>
          </article>

          <article className="quiz-card quiz-card-peach">
            <h3>🌷 Conversation starter</h3>
            <p>If we could travel anywhere together, where would we go?</p>
          </article>

          <article className="quiz-card quiz-card-mint">
            <h3>🧸 Bestie question</h3>
            <p>What's one memory with your friend that always makes you smile?</p>
          </article>
        </div>
      </section>
            <section className="section-block friendship-question">
        <div className="section-heading">
          <div>
            <p className="eyebrow">a question for you & your bestie</p>
            <h2>Today's Question to Share ♡</h2>
          </div>
        </div>

        <article className="quiz-card quiz-card-rose">
          <span className="quiz-emoji">💌</span>
          <h3>{daily.prompt}</h3>
          <p>Ask your bestie and see what they say!</p>
          <Button
            className="hero-cta"
            onClick={() => {
              const message = `Today's question from miumi ♡: ${daily.prompt}`;
              if (navigator.share) {
                void navigator.share({ title: "miumi ♡", text: message });
              } else {
                void navigator.clipboard.writeText(message);
              }
            }}
          >
            <Share2 size={16} /> Share with a friend
          </Button>
        </article>
      </section>
      <footer className="page-footer">
  <p>a soft little corner of the internet <span>♡</span></p>
  <div style={{ display: "flex", justifyContent: "center", gap: "18px", flexWrap: "wrap", marginTop: "14px" }}>
    <a href="/about.html">About Us</a>
    <a href="/privacy.html">Privacy Policy</a>
    <a href="/contact.html">Contact Us</a>
  </div>
</footer>
    </div>
  );
}


type UnicodeFontId =
  | "normal"
  | "bold"
  | "italic"
  | "boldItalic"
  | "script"
  | "boldScript"
  | "fraktur"
  | "doubleStruck"
  | "monospace"
  | "sans"
  | "sansBold";

const unicodeFontStyles: {
  id: UnicodeFontId;
  label: string;
  description: string;
}[] = [
  { id: "normal", label: "Classic", description: "Simple & clean" },
  { id: "bold", label: "Bold", description: "A little louder" },
  { id: "italic", label: "Italic", description: "Soft & slanted" },
  { id: "boldItalic", label: "Bold italic", description: "Extra emphasis" },
  { id: "script", label: "Script", description: "Pretty handwriting" },
  { id: "boldScript", label: "Bold script", description: "Flowy & strong" },
  { id: "fraktur", label: "Gothic", description: "Vintage lettering" },
  { id: "doubleStruck", label: "Double-struck", description: "Outlined look" },
  { id: "monospace", label: "Monospace", description: "Typewriter style" },
  { id: "sans", label: "Sans serif", description: "Modern & neat" },
  { id: "sansBold", label: "Sans bold", description: "Clean & bold" },
];

const unicodeFontRanges: Partial<Record<UnicodeFontId, { upper: number; lower: number; digits?: number }>> = {
  bold: { upper: 0x1D400, lower: 0x1D41A, digits: 0x1D7CE },
  italic: { upper: 0x1D434, lower: 0x1D44E },
  boldItalic: { upper: 0x1D468, lower: 0x1D482 },
  script: { upper: 0x1D49C, lower: 0x1D4B6 },
  boldScript: { upper: 0x1D4D0, lower: 0x1D4EA },
  fraktur: { upper: 0x1D504, lower: 0x1D51E },
  doubleStruck: { upper: 0x1D538, lower: 0x1D552, digits: 0x1D7D8 },
  monospace: { upper: 0x1D670, lower: 0x1D68A, digits: 0x1D7F6 },
  sans: { upper: 0x1D5A0, lower: 0x1D5BA, digits: 0x1D7E2 },
  sansBold: { upper: 0x1D5D4, lower: 0x1D5EE, digits: 0x1D7EC },
};

const unicodeFontExceptions: Partial<Record<UnicodeFontId, Record<string, string>>> = {
  italic: { h: "ℎ" },
  script: {
    B: "ℬ", E: "ℰ", F: "ℱ", H: "ℋ", I: "ℐ", L: "ℒ", M: "ℳ", R: "ℛ",
    e: "ℯ", g: "ℊ", o: "ℴ",
  },
  fraktur: { C: "ℭ", H: "ℌ", I: "ℑ", R: "ℜ" },
  doubleStruck: {
    C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ",
  },
};

function convertUnicodeFont(value: string, font: UnicodeFontId) {
  if (font === "normal") return value;
  const ranges = unicodeFontRanges[font];
  if (!ranges) return value;

  return Array.from(value, (character) => {
    const exception = unicodeFontExceptions[font]?.[character];
    if (exception) return exception;

    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint >= 65 && codePoint <= 90) {
      return String.fromCodePoint(ranges.upper + codePoint - 65);
    }
    if (codePoint >= 97 && codePoint <= 122) {
      return String.fromCodePoint(ranges.lower + codePoint - 97);
    }
    if (ranges.digits && codePoint >= 48 && codePoint <= 57) {
      return String.fromCodePoint(ranges.digits + codePoint - 48);
    }
    return character;
  }).join("");
}

function FontStudio() {
  const [draft, setDraft] = useState("");
  const [selectedFont, setSelectedFont] = useState<UnicodeFontId>("script");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const convertedText = convertUnicodeFont(draft, selectedFont);
  const selectedFontLabel = unicodeFontStyles.find((style) => style.id === selectedFont)?.label ?? "Classic";

  const copyConvertedText = async () => {
    if (!convertedText.trim()) return;
    try {
      await navigator.clipboard.writeText(convertedText);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1700);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2400);
    }
  };

  return (
    <section className="home-font-studio" aria-label="Font converter">
      <div className="font-studio-deco font-studio-deco-top" aria-hidden="true">୨୧</div>
      <div className="font-studio-heading">
        <span className="font-studio-icon" aria-hidden="true">Aa</span>
        <p className="eyebrow">your little writing corner</p>
        <h2>Font Studio</h2>
        <p>Pick a style, type your words, and watch them change.</p>
      </div>

      <label className="font-studio-input-label" htmlFor="miumi-font-style">01 · CHOOSE A FONT</label>
      <div className="font-studio-select-wrap">
        <select
          id="miumi-font-style"
          className="font-studio-select"
          value={selectedFont}
          onChange={(event) => {
            setSelectedFont(event.target.value as UnicodeFontId);
            setCopyState("idle");
          }}
        >
          {unicodeFontStyles.map((style) => (
            <option key={style.id} value={style.id}>{style.label} — {style.description}</option>
          ))}
        </select>
        <span aria-hidden="true">⌄</span>
      </div>

      <label className="font-studio-input-label" htmlFor="miumi-font-input">02 · TYPE YOUR WORDS</label>
      <textarea
        id="miumi-font-input"
        className="font-studio-input"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setCopyState("idle");
        }}
        maxLength={240}
        rows={3}
        placeholder="Start typing here..."
        aria-describedby="miumi-font-live-hint"
      />
      <div className="font-studio-input-meta">
        <span>♡ Your text changes as you type</span>
        <span>{draft.length}/240</span>
      </div>

      <div className="font-studio-output font-studio-live-output">
        <div className="font-studio-output-top">
          <span>03 · LIVE PREVIEW</span>
          <span>{selectedFontLabel} ♡</span>
        </div>
        <div className="font-studio-preview-canvas" aria-live="polite">
          <p className="font-studio-live-hint" id="miumi-font-live-hint">
            {draft.trim() ? "Your converted text:" : "Your styled text will appear here"}
          </p>
          <p className="font-studio-output-text" aria-label="Converted text preview">
            {convertedText || "Your pretty words will bloom here..."}
          </p>
        </div>
        <button
          type="button"
          className="font-studio-copy-button"
          onClick={() => void copyConvertedText()}
          disabled={!convertedText.trim()}
        >
          <span aria-hidden="true">{copyState === "copied" ? "✓" : "▢"}</span>
          {copyState === "copied" ? "Copied!" : copyState === "error" ? "Couldn't copy — try again" : "Copy converted text"}
        </button>
      </div>
      <p className="font-studio-footnote">
        The preview is the exact Unicode text copied to your clipboard. Some characters may look different in other apps.
      </p>
      <div className="font-studio-deco font-studio-deco-bottom" aria-hidden="true">♡ ⋆</div>
    </section>
  );
}

function QuizCard({ quiz, index, onStart }: { quiz: QuizDefinition; index: number; onStart: () => void }) {
  const accents = ["quiz-card-rose", "quiz-card-lilac", "quiz-card-peach", "quiz-card-mint"];
  const blurbs: Record<QuizId, string> = {
    friendship: "See how well your bestie knows your heart.",
    personality: "Meet the lovely little sparkle that is you.",
    "this-or-that": "Follow your heart through five sweet picks.",
    "bestie-challenge": "Share a giggle with your favorite person.",
  };
  return (
    <article className={`quiz-card ${accents[index % accents.length]}`}>
      <div className="quiz-card-top"><span className="quiz-emoji">{quiz.emoji}</span><span className="quiz-card-spark">✧</span></div>
      <h3>{quiz.title}</h3><p>{blurbs[quiz.id]}</p>
      <div className="quiz-card-bottom"><span><Clock3 size={13} /> {quiz.duration}</span><Button variant="ghost" className="round-arrow" onClick={onStart} aria-label={`Start ${quiz.title}`}><ArrowRight size={18} /></Button></div>
    </article>
  );
}


function QuizCatalog({ onStart }: { onStart: (definition: QuizDefinition) => void }) {
  return (
    <section className="quiz-garden page-enter">
      <div className="quiz-garden-hero">
        <span className="garden-decoration garden-flower">✿</span>
        <span className="garden-decoration garden-star">✧</span>
        <span className="garden-decoration garden-heart">♡</span>

        <p className="eyebrow">
          <span className="eyebrow-flower">✿</span> YOUR LITTLE QUIZ COLLECTION
        </p>

        <h1 className="page-title">
          The quiz <span>garden</span>
        </h1>

        <p className="page-intro">
          Little questions, lovely discoveries, and memories waiting to bloom.
        </p>

        <div className="garden-bottom-note">
          ✧ choose a little adventure ✧
        </div>
      </div>

      <div className="garden-section-heading">
        <div>
          <p className="garden-overline">A LITTLE SOMETHING FOR YOU</p>
          <h2>Find your next favorite</h2>
        </div>
        <span className="garden-bow">୨୧</span>
      </div>

      <div className="catalog-list quiz-garden-list">
        {quizzes.map((quiz, index) => (
          <article className="catalog-item garden-quiz-card" key={quiz.id}>
            <div className={`catalog-emoji catalog-color-${index}`}>
              {quiz.emoji}
            </div>

            <div className="catalog-copy garden-quiz-copy">
              <span className="garden-quiz-number">
                LITTLE ADVENTURE {String(index + 1).padStart(2, "0")}
              </span>
              <h2>{quiz.title}</h2>
              <p>{quiz.subtitle}</p>
              <span className="garden-duration">
                <Clock3 size={13} /> {quiz.duration}
              </span>
            </div>

            <Button
              variant="outline"
              className="catalog-start garden-play-button"
              onClick={() => onStart(quiz)}
            >
              Play <ArrowRight size={15} />
            </Button>
          </article>
        ))}
      </div>

      <div className="catalog-note garden-closing-note">
        <span>୨୧</span>
        Pick your favorite, pass the phone, and make a little memory.
        <span>♡</span>
      </div>
    </section>
  );
}


function QuizPlayer({
  quiz,
  questionIndex,
  selectedAnswer,
  onChoose,
  onBack,
  onRestart,
}: {
  quiz: QuizDefinition;
  questionIndex: number;
  selectedAnswer: number | undefined;
  onChoose: (answerIndex: number) => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  const question = quiz.questions[questionIndex];
  const progress = ((questionIndex + 1) / quiz.questions.length) * 100;
  return (
    <section className="player-page page-enter">
      <div className="player-actions">
        <Button variant="ghost" className="back-button" onClick={onBack}><ChevronLeft size={18} /> Back</Button>
        <Button variant="ghost" size="icon" className="restart-button" onClick={onRestart} aria-label="Restart quiz" title="Start over"><RotateCcw size={17} /></Button>
      </div>
      <div className="player-heading"><span className="player-emoji">{quiz.emoji}</span><p className="eyebrow">a little moment together</p><h1>{quiz.title}</h1><p>{quiz.id === "friendship" || quiz.id === "bestie-challenge" ? "Pass your phone to your bestie ♡" : quiz.subtitle}</p></div>
      <div className="progress-meta"><span>little question {questionIndex + 1} of {quiz.questions.length}</span><span>{Math.round(progress)}%</span></div>
      <div className="progress-track" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>
      <div className="question-card" key={`${quiz.id}-${questionIndex}`}>
        <span className="question-number">0{questionIndex + 1}</span>
        <h2>{question.prompt}</h2>
        <div className={`answer-list${quiz.id === "this-or-that" ? " answer-list-duo" : ""}`}>
          {question.options.map((option, index) => (
            <Button key={`${option.label}-${index}`} variant="outline" className={`answer-option${selectedAnswer === index ? " answer-selected" : ""}`} onClick={() => onChoose(index)} aria-pressed={selectedAnswer === index}>
              <span className="answer-emoji">{option.emoji}</span><span>{option.label}</span><ArrowRight className="answer-arrow" size={16} />
            </Button>
          ))}
        </div>
      </div>
      <p className="player-footnote">{quiz.id === "this-or-that" ? "No wrong answers, just your lovely taste ♡" : "Choose the answer that feels just right ♡"}</p>
    </section>
  );
}

function QuizResultPage({
  quiz,
  result,
  personality,
  onRestart,
  onShare,
  onQuizzes,
}: {
  quiz: QuizDefinition;
  result: CompletedQuiz;
  personality: (typeof personalityResults)[keyof typeof personalityResults] | null;
  onRestart: () => void;
  onShare: () => void;
  onQuizzes: () => void;
}) {
  const scoreMessage = result.correct === result.total
    ? "A perfect little match! Your bestie knows your heart by heart."
    : result.correct >= 3
      ? "Such a sweet connection! Your bestie knows you so well."
      : "Aww, a few more little chats and you'll know each other even better.";

  const isThisOrThat = result.quizId === "this-or-that";

  const pickedAnswers = useMemo(
    () => quiz.questions.map((question, index) => question.options[result.answers[index]]),
    [quiz, result]
  );

  return (
    <section className="result-page result-postcard-page page-enter">
      <div className="result-decoration result-decoration-one">✿</div>
      <div className="result-decoration result-decoration-two">✧</div>
      <div className="result-decoration result-decoration-three">♡</div>

      <div className="result-postcard">
        <div className="result-top-note">
          <span>MIUMI POST OFFICE</span>
          <span>♡ A LITTLE MEMORY ♡</span>
        </div>

        <div className="result-seal">
          {personality ? personality.emoji : isThisOrThat ? "🍓" : "🎀"}
        </div>

        <p className="eyebrow">YOUR LITTLE RESULT IS HERE</p>

        {personality ? (
          <h1>{personality.name}</h1>
        ) : isThisOrThat ? (
          <h1>Your lovely little picks</h1>
        ) : (
          <h1>{result.correct} out of {result.total}!</h1>
        )}

        <p className="result-description">
          {personality?.note ?? (isThisOrThat
            ? "A handful of little choices, all very you."
            : scoreMessage)}
        </p>

        {!isThisOrThat && !personality && (
          <div className="score-display">
            <strong>
              {Math.round((result.correct / result.total) * 100)}
              <small>%</small>
            </strong>
            <span>bestie magic</span>
          </div>
        )}

        <div className="result-divider">
          <span>✧</span>
          <span></span>
          <span>♡</span>
        </div>

        {isThisOrThat ? (
          <div className="picked-list">
            {pickedAnswers.map((option, index) => option && (
              <div className="picked-row" key={`${index}-${option.label}`}>
                <span className="picked-label">
                  {quiz.questions[index]?.prompt}
                </span>
                <span className="picked-choice">
                  {option.emoji} {option.label}
                </span>
              </div>
            ))}
          </div>
        ) : personality ? (
          <div className="personality-card">
            <span>{personality.emoji}</span>
            <p>Keep being your one-of-a-kind, lovely self.</p>
            <div>♡　✧　♡</div>
          </div>
        ) : (
          <div
            className="score-hearts"
            aria-label={`${result.correct} correct answers`}
          >
            {Array.from({ length: result.total }, (_, index) => (
              <Heart
                key={index}
                size={22}
                fill={index < result.correct ? "currentColor" : "none"}
              />
            ))}
          </div>
        )}

        <div className="result-postcard-footer">
          <span>made with a little love</span>
          <span>୨୧</span>
        </div>
      </div>

      <div className="result-actions">
        <Button className="result-share" onClick={onShare}>
          <Share2 size={17} /> Share your result
        </Button>

        <Button variant="outline" className="result-restart" onClick={onRestart}>
          <RotateCcw size={16} /> Play again
        </Button>
      </div>

      <Button variant="ghost" className="result-more" onClick={onQuizzes}>
        Explore more quizzes <ArrowRight size={15} />
      </Button>
    </section>
  );
}


function ResultsPage({
  history,
  onStart,
  onShare,
}: {
  history: CompletedQuiz[];
  onStart: (definition: QuizDefinition) => void;
  onShare: (result: CompletedQuiz) => void;
}) {
  return (
    <section className="history-page page-enter">
      <p className="eyebrow"><span className="eyebrow-flower">✿</span> all your happy little moments</p>
      <h1 className="page-title">Your result shelf</h1>
      <p className="page-intro">Every quiz leaves a little sparkle behind.</p>
      {history.length === 0 ? (
        <div className="empty-results"><span className="empty-illustration">🎀</span><h2>A little shelf, waiting for you</h2><p>Take your first quiz and your sweet results will show up here.</p><Button onClick={() => onStart(quizzes[0]!)}>Find your first quiz <ArrowRight size={16} /></Button></div>
      ) : (
        <div className="history-list">
          {history.map((result, index) => {
            const definition = quizById(result.quizId);
            const personality = result.personalityType ? personalityResults[result.personalityType] : null;
            return (
              <article className="history-item" key={`${result.quizId}-${index}`}>
                <span className="history-emoji">{personality?.emoji ?? definition?.emoji ?? "♡"}</span>
                <div className="history-copy"><h2>{definition?.title ?? "Little quiz"}</h2><p>{personality?.name ?? (result.quizId === "this-or-that" ? "Your lovely little picks" : `${result.correct} / ${result.total} bestie points`)}</p></div>
                <Button variant="ghost" size="icon" onClick={() => onShare(result)} aria-label={`Share ${definition?.title ?? "quiz"} result`} title="Share result"><Share2 size={17} /></Button>
              </article>
            );
          })}
        </div>
      )}
      <section className="try-more"><div><span>୨୧</span><div><p className="eyebrow">one more?</p><h2>There's always room for a little fun.</h2></div></div><div className="try-more-actions">{quizzes.slice(0, 2).map((quiz) => <Button key={quiz.id} variant="outline" onClick={() => onStart(quiz)}>{quiz.emoji} {quiz.title}</Button>)}</div></section>
    </section>
  );
}
