import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
   ChevronLeft,
  Clock3,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
      { title: "miumi ♡ — your little friendship world" },
      { name: "description", content: "A dreamy little world of bestie quizzes, daily questions, and sweet discoveries." },
      { property: "og:title", content: "miumi ♡ — your little friendship world" },
      { property: "og:description", content: "Friendship, fun and little discoveries ♡" },
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
  | "dedicate"
  | "games"
  | "photo-studio";
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
      <div className="page-wrap">
        <header className="topbar">
          <button className="wordmark" onClick={() => navigate("home")} aria-label="miumi home">
            <span className="wordmark-bow">୨୧</span> miumi <span className="wordmark-heart">♡</span>
          </button>
          <span className="topbar-note"><Sparkles size={14} /> a little world for besties</span>
          <button className="top-heart" onClick={() => navigate("results")} aria-label="See your results"><Heart size={19} /></button>
        </header>

        <div className="app-layout">
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
    active={page === "photo-studio"}
    icon={<ImagePlus />}
    label="Photo Studio"
    onClick={() => navigate("photo-studio")}
  />

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
            {page === "photo-studio" && <PhotoStudioPage onNotice={setNotice} />}

          </div>
        </div>

       <nav className="mobile-nav" aria-label="Main navigation">
  <NavButton active={page === "home"} icon={<House />} label="Home" onClick={() => navigate("home")} />
  <NavButton active={page === "quizzes" || page === "play"} icon={<Sparkles />} label="Quizzes" onClick={() => navigate("quizzes")} />
  <NavButton active={page === "results" || page === "quiz-result"} icon={<Trophy />} label="Results" onClick={() => navigate("results")} />
  <NavButton active={page === "friendship"} icon={<Heart />} label="Friends" onClick={() => navigate("friendship")} />
  <NavButton active={page === "dedicate"} icon={<Gift />} label="Create" onClick={() => navigate("dedicate")} />
  <NavButton active={page === "games"} icon={<Gamepad2 />} label="Playroom" onClick={() => navigate("games")} />
  <NavButton active={page === "photo-studio"} icon={<ImagePlus />} label="Photos" onClick={() => navigate("photo-studio")} />
</nav>
        <div className="notice" role="status" aria-live="polite" data-visible={Boolean(notice)}>{notice}</div>
      </div>
    </main>
  );
}


type PhotoCardFormat = "postcard" | "folded";
type PhotoCardTemplate = "coquette" | "vintage" | "minimal" | "chaos" | "midnight" | "lavender";
type StudioPhoto = { id: string; src: string; name: string };

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
  const [customMode, setCustomMode] = useState(false);
  const [title, setTitle] = useState("little moments, forever");
  const [message, setMessage] = useState("Some memories deserve a place to stay. ♡");
  const [from, setFrom] = useState("with love,");
  const [accent, setAccent] = useState("#d99bb7");
  const activeTemplate = photoTemplates.find((item) => item.id === template) ?? photoTemplates[0];

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
    const photoMarkup = photos.map((photo) => '<img src="' + photo.src + '" alt="" />').join("");
    const safeTitle = escapeHtml(title || "A little memory");
    const safeMessage = escapeHtml(message);
    const safeFrom = escapeHtml(from);
    const accentColor = customMode ? accent : "#d99bb7";
    const cardClass = "print-" + template;
    const pageMarkup = format === "postcard"
      ? '<section class="print-page postcard ' + cardClass + '"><div class="print-photo-grid">' + photoMarkup + '</div><div class="print-copy"><p class="print-kicker">A LITTLE KEEPSAKE</p><h1>' + safeTitle + '</h1><p>' + safeMessage + '</p><small>' + safeFrom + '</small></div></section>'
      : '<section class="print-page folded outside ' + cardClass + '"><div class="fold-panel fold-back"><span>♡</span><small>made with miumi</small></div><div class="fold-panel fold-front"><div class="print-photo-grid">' + photoMarkup + '</div><h1>' + safeTitle + '</h1><small>' + safeFrom + '</small></div></section><section class="print-page folded inside ' + cardClass + '"><div class="fold-panel"><h2>' + safeTitle + '</h2><p>' + safeMessage + '</p><small>♡</small></div><div class="fold-panel"><div class="print-photo-grid">' + photoMarkup + '</div></div></section>';

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) { onNotice("Please allow pop-ups to print your card ♡"); return; }
    const styles = [
      "@page{size:" + (format === "postcard" ? "A6 landscape" : "A5 landscape") + ";margin:0}",
      "*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#665b65}",
      ".print-page{width:" + (format === "postcard" ? "148mm" : "210mm") + ";height:" + (format === "postcard" ? "105mm" : "148mm") + ";page-break-after:always;overflow:hidden;background:#fff9fc}",
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

        <div className="studio-section-heading studio-format-heading"><div><p className="garden-overline">STEP 03 · THE LOOK</p><h2>Choose a template</h2></div></div>
        <div className="studio-template-grid">{photoTemplates.map((item) => (
          <button type="button" key={item.id} className={"studio-template-option " + (template === item.id ? "is-selected" : "")} onClick={() => setTemplate(item.id)}>
            <span className={"studio-template-swatch " + item.className}>{item.emoji}</span><strong>{item.name}</strong><small>{item.detail}</small>
          </button>
        ))}</div>

        <div className="studio-section-heading studio-format-heading"><div><p className="garden-overline">STEP 04 · MAKE IT YOURS</p><h2>Add your words</h2></div>
          <button type="button" className={"studio-custom-toggle " + (customMode ? "is-active" : "")} onClick={() => setCustomMode((value) => !value)}>{customMode ? "Customising ✓" : "Customise"}</button>
        </div>
        <div className="studio-fields">
          <label>Card title<input value={title} maxLength={55} onChange={(event) => setTitle(event.target.value)} placeholder="A little memory..." /></label>
          <label>Your message<textarea value={message} maxLength={180} onChange={(event) => setMessage(event.target.value)} rows={3} placeholder="Write a little note..." /></label>
          <label>Sign-off<input value={from} maxLength={35} onChange={(event) => setFrom(event.target.value)} placeholder="With love," /></label>
          {customMode && <label className="studio-colour-field">Accent colour<input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} /></label>}
        </div>

        <div className="studio-section-heading studio-format-heading"><div><p className="garden-overline">YOUR LIVE PREVIEW</p><h2>A card taking shape</h2></div></div>
        <div className={"studio-live-card " + activeTemplate.className + (format === "folded" ? " is-folded" : "")} style={customMode ? { borderColor: accent } : undefined}>
          <div className="studio-live-photos">{photos.length ? photos.map((photo) => <img src={photo.src} alt="" key={photo.id} />) : <div className="studio-empty-photo">♡<small>Your photos will appear here</small></div>}</div>
          <div className="studio-live-copy"><span className="studio-live-kicker">A LITTLE KEEPSAKE</span><h3>{title || "A little memory"}</h3><p>{message || "Your message will appear here."}</p><small>{from || "with love,"}</small></div>
          <span className="studio-live-decoration">୨୧</span>
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
  return (
    <div className="home-page page-enter">
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
