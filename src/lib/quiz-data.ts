export type QuizId = "friendship" | "personality" | "this-or-that" | "bestie-challenge";

export type AnswerOption = {
  label: string;
  emoji: string;
  correct?: boolean;
  type?: "dreamer" | "sunshine" | "softie" | "sparkle";
};

export type QuizQuestion = {
  prompt: string;
  options: AnswerOption[];
};

export type QuizDefinition = {
  id: QuizId;
  title: string;
  subtitle: string;
  emoji: string;
  duration: string;
  questions: QuizQuestion[];
};

export const quizzes: QuizDefinition[] = [
  {
    id: "friendship",
    title: "Bestie knows best",
    subtitle: "How well does your bestie know you?",
    emoji: "🎀",
    duration: "5 little questions",
    questions: [
      {
        prompt: "What would make my perfect day?",
        options: [
          { label: "A cozy café date", emoji: "☕", correct: true },
          { label: "A spontaneous adventure", emoji: "🧺" },
          { label: "A movie marathon", emoji: "🍿" },
          { label: "A little shopping spree", emoji: "🛍️" },
        ],
      },
      {
        prompt: "Which treat can always cheer me up?",
        options: [
          { label: "Strawberry cake", emoji: "🍰", correct: true },
          { label: "Warm cookies", emoji: "🍪" },
          { label: "A big bowl of noodles", emoji: "🍜" },
          { label: "Chocolate, obviously", emoji: "🍫" },
        ],
      },
      {
        prompt: "What am I most likely to collect?",
        options: [
          { label: "Cute little trinkets", emoji: "🧸", correct: true },
          { label: "Books for my shelf", emoji: "📚" },
          { label: "Photos of us", emoji: "📸" },
          { label: "Way too many candles", emoji: "🕯️" },
        ],
      },
      {
        prompt: "My favorite way to spend a rainy day?",
        options: [
          { label: "Blanket, tea & a book", emoji: "📖", correct: true },
          { label: "Dancing in the rain", emoji: "☔" },
          { label: "Calling my bestie", emoji: "📞" },
          { label: "A little nap", emoji: "😴" },
        ],
      },
      {
        prompt: "Which word feels most like me?",
        options: [
          { label: "Thoughtful", emoji: "💌", correct: true },
          { label: "Adventurous", emoji: "🦋" },
          { label: "Silly", emoji: "🤭" },
          { label: "Dreamy", emoji: "🌙" },
        ],
      },
    ],
  },
  {
    id: "personality",
    title: "Your inner sparkle",
    subtitle: "A tiny quiz to meet your lovely self",
    emoji: "🌷",
    duration: "5 little questions",
    questions: [
      {
        prompt: "Pick your perfect little escape.",
        options: [
          { label: "A dreamy garden", emoji: "🌷", type: "dreamer" },
          { label: "A sunny beach", emoji: "🍋", type: "sunshine" },
          { label: "A cozy book nook", emoji: "📚", type: "softie" },
          { label: "A sparkly night out", emoji: "✨", type: "sparkle" },
        ],
      },
      {
        prompt: "Your friends would call you…",
        options: [
          { label: "A little daydreamer", emoji: "☁️", type: "dreamer" },
          { label: "Their happy place", emoji: "☀️", type: "sunshine" },
          { label: "The best listener", emoji: "🫶", type: "softie" },
          { label: "The life of the party", emoji: "🪩", type: "sparkle" },
        ],
      },
      {
        prompt: "Choose a tiny treasure to find.",
        options: [
          { label: "A pressed flower", emoji: "🌼", type: "dreamer" },
          { label: "A seashell in the sun", emoji: "🐚", type: "sunshine" },
          { label: "A handwritten note", emoji: "💌", type: "softie" },
          { label: "A vintage charm", emoji: "💎", type: "sparkle" },
        ],
      },
      {
        prompt: "When life gets busy, you…",
        options: [
          { label: "Make a wish and wander", emoji: "🦋", type: "dreamer" },
          { label: "Find the bright side", emoji: "🌈", type: "sunshine" },
          { label: "Check on your people", emoji: "🤍", type: "softie" },
          { label: "Add a little extra sparkle", emoji: "🎉", type: "sparkle" },
        ],
      },
      {
        prompt: "Pick a sweet little motto.",
        options: [
          { label: "Follow the butterflies", emoji: "🦋", type: "dreamer" },
          { label: "Let the light in", emoji: "🌞", type: "sunshine" },
          { label: "Soft hearts are strong", emoji: "💗", type: "softie" },
          { label: "Make ordinary magic", emoji: "✨", type: "sparkle" },
        ],
      },
    ],
  },
  {
    id: "this-or-that",
    title: "This or that?",
    subtitle: "Follow your heart, one choice at a time",
    emoji: "🍓",
    duration: "5 quick picks",
    questions: [
      { prompt: "A sweet little morning…", options: [{ label: "Slow & cozy", emoji: "☕" }, { label: "Bright & busy", emoji: "🌞" }] },
      { prompt: "Choose your flower…", options: [{ label: "Tulips", emoji: "🌷" }, { label: "Daisies", emoji: "🌼" }] },
      { prompt: "Your dreamy bestie date…", options: [{ label: "Picnic in the park", emoji: "🧺" }, { label: "Cute café corner", emoji: "🍰" }] },
      { prompt: "A tiny treat to keep…", options: [{ label: "Strawberry charm", emoji: "🍓" }, { label: "Little pink bow", emoji: "🎀" }] },
      { prompt: "The perfect sky…", options: [{ label: "Cotton-candy sunset", emoji: "🌅" }, { label: "Twinkly starry night", emoji: "🌙" }] },
    ],
  },
  {
    id: "bestie-challenge",
    title: "Bestie challenge",
    subtitle: "Little questions, big bestie energy",
    emoji: "🧸",
    duration: "5 bestie moments",
    questions: [
      {
        prompt: "What is your bestie most likely to text you?",
        options: [
          { label: "Look at this cute thing!", emoji: "🎀", correct: true },
          { label: "I have a new plan…", emoji: "🗺️" },
          { label: "Are you hungry?", emoji: "🍟" },
          { label: "Guess what happened!", emoji: "🤭" },
        ],
      },
      {
        prompt: "Your favorite shared memory is…",
        options: [
          { label: "That perfect little day out", emoji: "🧺", correct: true },
          { label: "The time we laughed forever", emoji: "😂" },
          { label: "Our late-night chats", emoji: "🌙" },
          { label: "Every single one", emoji: "💗" },
        ],
      },
      {
        prompt: "Your bestie picks your treat. What is it?",
        options: [
          { label: "A strawberry something", emoji: "🍓", correct: true },
          { label: "Salty & crunchy", emoji: "🥨" },
          { label: "A warm little pastry", emoji: "🥐" },
          { label: "A surprise!", emoji: "🎁" },
        ],
      },
      {
        prompt: "When you need a boost, your bestie…",
        options: [
          { label: "Sends the perfect voice note", emoji: "🎧", correct: true },
          { label: "Shows up with snacks", emoji: "🍪" },
          { label: "Makes you laugh", emoji: "😄" },
          { label: "Reminds you who you are", emoji: "🫶" },
        ],
      },
      {
        prompt: "Your friendship in one tiny word?",
        options: [
          { label: "Magic", emoji: "✨", correct: true },
          { label: "Home", emoji: "🏡" },
          { label: "Giggles", emoji: "💕" },
          { label: "Forever", emoji: "♾️" },
        ],
      },
    ],
  },
];

export const personalityResults = {
  dreamer: { name: "The daydream darling", emoji: "🦋", note: "You find little bits of wonder wherever you go. Keep following those butterflies." },
  sunshine: { name: "The pocket sunshine", emoji: "☀️", note: "Your warmth makes ordinary days feel golden. Everyone is lucky to be in your orbit." },
  softie: { name: "The tender-hearted treasure", emoji: "💌", note: "You make people feel safe, seen, and very loved. That soft heart is your superpower." },
  sparkle: { name: "The sparkle maker", emoji: "✨", note: "You turn little moments into the best stories. Never dim your delightful, dazzling self." },
} as const;

export function calculateScore(answers: number[], questions: QuizQuestion[]) {
  const correct = answers.reduce((total, answer, index) => {
    return total + (questions[index]?.options[answer]?.correct ? 1 : 0);
  }, 0);
  return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
}

export function getPersonalityType(answers: number[], questions: QuizQuestion[]) {
  const counts: Record<keyof typeof personalityResults, number> = {
    dreamer: 0,
    sunshine: 0,
    softie: 0,
    sparkle: 0,
  };
  answers.forEach((answer, index) => {
    const type = questions[index]?.options[answer]?.type;
    if (type && type in counts) counts[type] += 1;
  });
  return (Object.entries(counts) as [keyof typeof counts, number][]).reduce(
    (winner, current) => current[1] > winner[1] ? current : winner,
  )[0];
}