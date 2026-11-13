import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type QuietRoomMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type WorkersAI = {
  run: (
    model: string,
    input: {
      messages: QuietRoomMessage[];
      max_completion_tokens?: number;
      temperature?: number;
      stream?: boolean;
    },
  ) => Promise<unknown>;
};

type QuietRoomEnv = {
  AI?: WorkersAI;
};

const QUIET_ROOM_INSTRUCTIONS = `You are Miumi's Quiet Room, a warm, calm, non-clinical supportive conversation companion for a general audience that may include teenagers.
You are NOT a therapist, doctor, counsellor, or emergency service. Never claim to diagnose, treat, provide therapy, or replace a trusted adult or qualified professional.
Use gentle, plain language. Listen, validate feelings without exaggerating, ask at most one thoughtful question at a time, and offer small practical coping ideas only when appropriate. Do not pressure the user to disclose more.
Do not encourage secrecy from parents, guardians, or trusted adults. For serious distress, abuse, danger, or a user who feels unsafe, encourage them to contact a trusted adult promptly. For immediate danger, encourage local emergency services or an appropriate crisis service.
If a user mentions self-harm or suicide, respond supportively without describing methods, injuries, or graphic details; encourage immediate support from a trusted adult and emergency/crisis support if danger is immediate. Do not provide concealment advice.
Do not give medical diagnoses or medication instructions. Do not make promises of confidentiality; explain that the service is an AI and users should avoid sharing identifying or highly sensitive information.
Never roleplay romance, dependency, exclusivity, or claim to be human. Keep responses concise and kind.`;

function quietRoomJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readQuietRoomReply(result: unknown): string {
  if (!isRecord(result)) return "";

  if (typeof result.response === "string") return result.response.trim();
  if (typeof result.output_text === "string") return result.output_text.trim();

  const choices = Array.isArray(result.choices) ? result.choices : [];
  const firstChoice = choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) return "";

  const content = firstChoice.message.content;
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .flatMap((part) => (isRecord(part) && typeof part.text === "string" ? [part.text] : []))
      .join("")
      .trim();
  }

  return "";
}

async function handleQuietRoomApi(request: Request, rawEnv: unknown): Promise<Response> {
  const env = (isRecord(rawEnv) ? rawEnv : {}) as QuietRoomEnv;

  if (request.method === "GET") {
    return quietRoomJson({
      ok: true,
      service: "miumi-quiet-room",
      configured: Boolean(env.AI),
      provider: env.AI ? "cloudflare-workers-ai" : "guided-free-mode",
      mode: env.AI ? "ai" : "guided",
    });
  }

  if (request.method !== "POST") {
    return quietRoomJson({ error: "Method not allowed." }, 405);
  }

  let payload: { message?: unknown; history?: unknown };
  try {
    payload = await request.json() as { message?: unknown; history?: unknown };
  } catch {
    return quietRoomJson({ error: "Please send a valid message." }, 400);
  }

  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message || message.length > 4000) {
    return quietRoomJson({ error: "Messages must be between 1 and 4,000 characters." }, 400);
  }

  const history: QuietRoomMessage[] = Array.isArray(payload.history)
    ? payload.history.slice(-12).flatMap((item): QuietRoomMessage[] => {
        if (!isRecord(item)) return [];
        const role = item.role === "companion" || item.role === "assistant"
          ? "assistant"
          : item.role === "you" || item.role === "user"
            ? "user"
            : null;
        const content = typeof item.content === "string" ? item.content.slice(0, 4000) : "";
        return role && content ? [{ role, content }] : [];
      })
    : [];

  if (!env.AI) {
    return quietRoomJson({ reply: createGuidedReply(message, history), mode: "guided" });
  }

  try {
    const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
      messages: [
        { role: "system", content: QUIET_ROOM_INSTRUCTIONS },
        ...history,
        { role: "user", content: message },
      ],
      max_completion_tokens: 220,
      temperature: 0.65,
      stream: false,
    });

    const reply = readQuietRoomReply(result);
    if (!reply) {
      return quietRoomJson({ error: "The companion couldn't form a response. Please try again." }, 502);
    }

    return quietRoomJson({ reply, mode: "ai" });
  } catch (error) {
    console.error("Miumi Quiet Room AI request failed:", error);
    return quietRoomJson({ reply: createGuidedReply(message, history), mode: "guided" });
  }
}


function createGuidedReply(message: string, history: QuietRoomMessage[]): string {
  const text = message.toLowerCase();
  const containsAny = (items: string[]) => items.some((item) => text.includes(item));

  if (containsAny([
    "hurt myself", "harm myself", "kill myself", "suicide", "want to die",
    "don't want to live", "do not want to live", "end my life",
  ])) {
    return "I'm really sorry things feel this difficult right now. You deserve support from a real person, not to handle this alone. Please tell a trusted adult near you now, such as a parent, guardian, teacher, or another adult you trust. If you may be in immediate danger, ask them to contact local emergency help and stay with you. Are you with a trusted person right now?";
  }

  if (containsAny(["hello", "hi", "hey", "good morning", "good evening"])) {
    return "Hi. I'm here to give you a calm space to sort through what's on your mind. How has today been for you so far?";
  }

  if (containsAny(["exam", "school", "college", "homework", "assignment", "study", "studying", "test"])) {
    return "It sounds like studies are taking up a lot of space in your mind. You don't have to solve everything at once. What is the one study-related thing that feels most important or difficult today?";
  }

  if (containsAny(["stress", "stressed", "overwhelmed", "pressure", "too much", "can't cope"])) {
    return "That sounds like a lot to carry at once. Let's make the next few minutes simpler: pause, let your shoulders relax, and choose just one small thing that needs your attention first. What's been creating the most pressure today?";
  }

  if (containsAny(["anxious", "anxiety", "nervous", "panic", "worried", "scared", "afraid"])) {
    return "Feeling worried can make everything seem louder. Try noticing your feet on the floor and taking one slow, comfortable breath out. You don't need to force the feeling away. What's the main thing your mind keeps returning to?";
  }

  if (containsAny(["lonely", "alone", "no friends", "ignored", "left out", "nobody cares"])) {
    return "Feeling left out or alone can really hurt. You deserve kindness and connection. Would you like to tell me what happened, or what you wish someone around you understood?";
  }

  if (containsAny(["sad", "upset", "crying", "hurt", "disappointed", "bad day", "feeling down"])) {
    return "I'm sorry today feels heavy. You don't have to pretend everything is fine here. What happened that has been weighing on you the most?";
  }

  if (containsAny(["happy", "excited", "proud", "good news", "great day", "amazing"])) {
    return "That sounds like a lovely moment. I'm glad you shared it. What part of it made you feel happiest?";
  }

  if (containsAny(["thank you", "thanks"])) {
    return "You're welcome. And remember, you can take things one step at a time. What would feel helpful to focus on next?";
  }

  const previousCompanionMessages = history.filter((item) => item.role === "assistant").length;
  const prompts = [
    "I'm listening. What feels most important for me to understand about that?",
    "That sounds worth taking a moment with. What happened just before you started feeling this way?",
    "Let's take this one step at a time. What would you most like to feel clearer about?",
    "Thank you for putting that into words. What kind of support would feel useful right now: being heard, sorting out the situation, or thinking of one small next step?",
  ];
  return prompts[previousCompanionMessages % prompts.length];
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // TanStack Start is deployed as an advanced-mode Pages Worker. In that mode
      // Cloudflare ignores the separate /functions directory, so handle this API
      // directly in the same Worker before forwarding normal requests to TanStack.
      if (url.pathname === "/api/quiet-room") {
        return await handleQuietRoomApi(request, env);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
