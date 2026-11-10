import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock3,
  Heart,
  House,
  RotateCcw,
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

type Page = "home" | "quizzes" | "results" | "play" | "quiz-result";
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
            <NavButton active={page === "home"} icon={<House />} label="Home" onClick={() => navigate("home")} />
            <NavButton active={page === "quizzes" || page === "play"} icon={<Sparkles />} label="Quizzes" onClick={() => navigate("quizzes")} />
            <NavButton active={page === "results" || page === "quiz-result"} icon={<Trophy />} label="My results" onClick={() => navigate("results")} />
            <div className="nav-little-note">made with<br /><span>♡ for besties ♡</span></div>
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
          </div>
        </div>

        <nav className="mobile-nav" aria-label="Main navigation">
          <NavButton active={page === "home"} icon={<House />} label="Home" onClick={() => navigate("home")} />
          <NavButton active={page === "quizzes" || page === "play"} icon={<Sparkles />} label="Quizzes" onClick={() => navigate("quizzes")} />
          <NavButton active={page === "results" || page === "quiz-result"} icon={<Trophy />} label="Results" onClick={() => navigate("results")} />
        </nav>
        <div className="notice" role="status" aria-live="polite" data-visible={Boolean(notice)}>{notice}</div>
      </div>
    </main>
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
          
          <span className="art-caption">a little sweetness<br />for you & your bestie</span>
        </div>
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
    <section className="catalog-page page-enter">
      <p className="eyebrow"><span className="eyebrow-flower">✿</span> pick a little adventure</p>
      <h1 className="page-title">The quiz garden</h1>
      <p className="page-intro">A few sweet questions can make a lovely memory.</p>
      <div className="catalog-list">
        {quizzes.map((quiz, index) => (
          <article className="catalog-item" key={quiz.id}>
            <span className={`catalog-emoji catalog-color-${index}`}>{quiz.emoji}</span>
            <div className="catalog-copy"><h2>{quiz.title}</h2><p>{quiz.subtitle}</p><span><Clock3 size={13} /> {quiz.duration}</span></div>
            <Button variant="outline" className="catalog-start" onClick={() => onStart(quiz)}>Play <ArrowRight size={15} /></Button>
          </article>
        ))}
      </div>
      <div className="catalog-note"><span>୨୧</span> Pick your favorite, pass the phone, and make a little memory. <span>♡</span></div>
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
  const pickedAnswers = useMemo(() => quiz.questions.map((question, index) => question.options[result.answers[index]]), [quiz, result]);
  return (
    <section className="result-page page-enter">
      <div className="result-confetti" aria-hidden="true">✧　♡　✿　˚　✧</div>
      <div className="result-seal">{personality ? personality.emoji : isThisOrThat ? "🍓" : "🎀"}</div>
      <p className="eyebrow">your little result is here</p>
      {personality ? <h1>{personality.name}</h1> : isThisOrThat ? <h1>Your lovely little picks</h1> : <h1>{result.correct} out of {result.total}!</h1>}
      <p className="result-description">{personality?.note ?? (isThisOrThat ? "A handful of little choices, all very you." : scoreMessage)}</p>
      {!isThisOrThat && !personality && (
        <div className="score-display"><strong>{Math.round((result.correct / result.total) * 100)}<small>%</small></strong><span>bestie magic</span></div>
      )}
      {isThisOrThat ? (
        <div className="picked-list">
          {pickedAnswers.map((option, index) => option && <div className="picked-row" key={`${index}-${option.label}`}><span className="picked-label">{quiz.questions[index]?.prompt}</span><span className="picked-choice">{option.emoji} {option.label}</span></div>)}
        </div>
      ) : personality ? (
        <div className="personality-card"><span>{personality.emoji}</span><p>Keep being your one-of-a-kind, lovely self.</p><div>♡　✧　♡</div></div>
      ) : (
        <div className="score-hearts" aria-label={`${result.correct} correct answers`}>{Array.from({ length: result.total }, (_, index) => <Heart key={index} size={22} fill={index < result.correct ? "currentColor" : "none"} />)}</div>
      )}
      <div className="result-actions">
        <Button className="result-share" onClick={onShare}><Share2 size={17} /> Share your result</Button>
        <Button variant="outline" className="result-restart" onClick={onRestart}><RotateCcw size={16} /> Play again</Button>
      </div>
      <Button variant="ghost" className="result-more" onClick={onQuizzes}>Explore more quizzes <ArrowRight size={15} /></Button>
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
