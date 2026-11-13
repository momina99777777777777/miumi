interface Env {
  OPENAI_API_KEY?: string;
  QUIET_ROOM_MODEL?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const corsHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

const SUPPORT_INSTRUCTIONS = \`You are Miumi's Quiet Room, a warm, calm, non-clinical supportive conversation companion for a general audience that may include teenagers.
You are NOT a therapist, doctor, counsellor, or emergency service. Never claim to diagnose, treat, provide therapy, or replace a trusted adult or qualified professional.
Use gentle, plain language. Listen, validate feelings without exaggerating, ask at most one thoughtful question at a time, and offer small practical coping ideas only when appropriate. Do not pressure the user to disclose more.
Do not encourage secrecy from parents, guardians, or trusted adults. For serious distress, abuse, danger, or a user who feels unsafe, encourage them to contact a trusted adult promptly. For immediate danger, encourage local emergency services or an appropriate crisis service.
If a user mentions self-harm or suicide, respond supportively without describing methods, injuries, or graphic details; encourage immediate support from a trusted adult and emergency/crisis support if danger is immediate. Do not provide concealment advice.
Do not give medical diagnoses or medication instructions. Do not make promises of confidentiality; explain that the service is an AI and users should avoid sharing identifying or highly sensitive information.
Never roleplay romance, dependency, exclusivity, or claim to be human. Keep responses concise and kind.\`;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.OPENAI_API_KEY) {
    return json({ error: "AI is not configured yet. The site owner must add the secure OPENAI_API_KEY server secret." }, 503);
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
        const role = entry.role === "companion" || entry.role === "assistant" ? "assistant" : entry.role === "you" || entry.role === "user" ? "user" : null;
        const content = typeof entry.content === "string" ? entry.content.slice(0, 4000) : "";
        return role && content ? [{ role, content }] : [];
      })
    : [];

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${env.OPENAI_API_KEY}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.QUIET_ROOM_MODEL || "gpt-4.1-mini",
        instructions: SUPPORT_INSTRUCTIONS,
        input: [...history, { role: "user", content: message }],
        max_output_tokens: 350,
        store: false,
      }),
    });

    const result = await upstream.json() as {
      output_text?: string;
      error?: { message?: string };
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    if (!upstream.ok) {
      return json({ error: "The companion service is temporarily unavailable. Please try again later." }, 502);
    }

    const reply = result.output_text || result.output?.flatMap(item => item.content || []).filter(part => part.type === "output_text").map(part => part.text || "").join("\\n") || "";
    if (!reply.trim()) return json({ error: "The companion couldn't form a response. Please try again." }, 502);
    return json({ reply: reply.trim() });
  } catch {
    return json({ error: "Connection interrupted. Please try again when you're online." }, 502);
  }
};
