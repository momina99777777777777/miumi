interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Env {
  AI?: {
    run(model: string, input: {
      messages: ChatMessage[];
      max_tokens?: number;
      temperature?: number;
      stream?: boolean;
    }): Promise<unknown>;
  };
}

const RESPONSE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: RESPONSE_HEADERS });
}

const SUPPORT_INSTRUCTIONS = `You are Miumi's Quiet Room, a warm, calm, non-clinical supportive conversation companion for a general audience that may include teenagers.
You are NOT a therapist, doctor, counsellor, or emergency service. Never claim to diagnose, treat, provide therapy, or replace a trusted adult or qualified professional.
Use gentle, plain language. Listen, validate feelings without exaggerating, ask at most one thoughtful question at a time, and offer small practical coping ideas only when appropriate. Do not pressure the user to disclose more.
Do not encourage secrecy from parents, guardians, or trusted adults. For serious distress, abuse, danger, or a user who feels unsafe, encourage them to contact a trusted adult promptly. For immediate danger, encourage local emergency services or an appropriate crisis service.
If a user mentions self-harm or suicide, respond supportively without describing methods, injuries, or graphic details; encourage immediate support from a trusted adult and emergency/crisis support if danger is immediate. Do not provide concealment advice.
Do not give medical diagnoses or medication instructions. Do not make promises of confidentiality; explain that the service is an AI and users should avoid sharing identifying or highly sensitive information.
Never roleplay romance, dependency, exclusivity, or claim to be human. Keep responses concise and kind.`;

function extractReply(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const result = value as {
    response?: unknown;
    output_text?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const candidate = result.choices?.[0]?.message?.content
    ?? result.response
    ?? result.output_text;
  return typeof candidate === "string" ? candidate.trim() : "";
}

export const onRequestGet = ({ env }: { env: Env }) => {
  return json({
    ok: true,
    service: "miumi-quiet-room",
    configured: Boolean(env.AI),
    provider: env.AI ? "cloudflare-workers-ai" : "not-configured",
  });
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!env.AI) {
    return json({
      error: "The free AI service is not connected yet. Add a Workers AI binding named AI in Cloudflare Pages Settings > Bindings, then redeploy.",
    }, 503);
  }

  let payload: { message?: unknown; history?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Please send a valid message." }, 400);
  }

  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message || message.length > 4000) {
    return json({ error: "Messages must be between 1 and 4,000 characters." }, 400);
  }

  const history = Array.isArray(payload.history)
    ? payload.history.slice(-12).flatMap((item): ChatMessage[] => {
        if (!item || typeof item !== "object") return [];
        const entry = item as Record<string, unknown>;
        const role = entry.role === "companion" || entry.role === "assistant"
          ? "assistant"
          : entry.role === "you" || entry.role === "user"
            ? "user"
            : null;
        const content = typeof entry.content === "string" ? entry.content.slice(0, 4000) : "";
        return role && content ? [{ role, content }] : [];
      })
    : [];

  try {
    const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
      messages: [
        { role: "system", content: SUPPORT_INSTRUCTIONS },
        ...history,
        { role: "user", content: message },
      ],
      max_tokens: 350,
      temperature: 0.65,
      stream: false,
    });

    const reply = extractReply(result);
    if (!reply) {
      return json({ error: "The companion couldn't form a response. Please try again." }, 502);
    }
    return json({ reply });
  } catch {
    return json({
      error: "The free AI service is temporarily unavailable or its daily free allowance has been reached. Please try again later.",
    }, 503);
  }
};
