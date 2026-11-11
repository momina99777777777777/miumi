import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
   ChevronLeft,
  Clock3,
  Gamepad2,
  Gift,
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

type Page =
  | "home"
  | "quizzes"
  | "results"
  | "play"
  | "quiz-result"
  | "friendship"
  | "dedicate"
  | "games";
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
    label="Mini Games"
    onClick={() => navigate("games")}
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
              <section className="feature-page">
                <div className="feature-hero">
                  <span className="feature-emoji">💌</span>
                  <p className="eyebrow">MADE WITH A LITTLE LOVE</p>
                  <h1>Create & Dedicate</h1>
                  <p>Make something special for someone who makes life brighter.</p>
                </div>
                <div className="feature-card">
                  <span>🎀</span>
                  <h2>Personalised dedications</h2>
                  <p>Create sweet messages and shareable dedication cards.</p>
                  <button onClick={() => setNotice("Your dedication studio is coming soon ♡")}>
                    Coming soon ♡
                  </button>
                </div>
              </section>
            )}

            {page === "games" && (
              <section className="feature-page">
                <div className="feature-hero">
                  <span className="feature-emoji">🎮</span>
                  <p className="eyebrow">A TINY BREAK FROM EVERYTHING</p>
                  <h1>Mini Games</h1>
                  <p>Little games, unexpected surprises and lots of fun.</p>
                </div>
                <div className="feature-card">
                  <span>🌷</span>
                  <h2>Coming to your wonderland</h2>
                  <p>We're preparing some playful little games for you.</p>
                  <button onClick={() => setNotice("More little games are coming soon ♡")}>
                    Stay tuned ♡
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>

       <nav className="mobile-nav" aria-label="Main navigation">
  <NavButton active={page === "home"} icon={<House />} label="Home" onClick={() => navigate("home")} />
  <NavButton active={page === "quizzes" || page === "play"} icon={<Sparkles />} label="Quizzes" onClick={() => navigate("quizzes")} />
  <NavButton active={page === "results" || page === "quiz-result"} icon={<Trophy />} label="Results" onClick={() => navigate("results")} />
  <NavButton active={page === "friendship"} icon={<Heart />} label="Friends" onClick={() => navigate("friendship")} />
  <NavButton active={page === "dedicate"} icon={<Gift />} label="Create" onClick={() => navigate("dedicate")} />
  <NavButton active={page === "games"} icon={<Gamepad2 />} label="Games" onClick={() => navigate("games")} />
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
