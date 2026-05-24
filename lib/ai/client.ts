import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { ChatMessage, LlmCallOptions, LlmResponse } from "./types";

let _deepseek: OpenAI | null = null;
function getDeepSeek(): OpenAI {
  if (!_deepseek) {
    _deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || "",
      baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    });
  }
  return _deepseek;
}

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
  }
  return _anthropic;
}

const DEFAULT_MODELS: Record<string, string> = {
  analysis: "deepseek-chat",
  creative: "deepseek-chat",
};

export async function callLlm(options: LlmCallOptions): Promise<LlmResponse> {
  const provider = selectProvider(options.messages, options.responseFormat);

  if (provider === "claude") {
    return callClaude(options);
  }
  return callDeepSeek(options);
}

function selectProvider(
  messages: ChatMessage[],
  responseFormat?: "text" | "json_object"
): "deepseek" | "claude" {
  if (process.env.ANTHROPIC_API_KEY && responseFormat === "text") {
    return "claude";
  }
  return "deepseek";
}

async function callDeepSeek(options: LlmCallOptions): Promise<LlmResponse> {
  const model = options.model || DEFAULT_MODELS.analysis;
  const completion = await getDeepSeek().chat.completions.create({
    model,
    messages: options.messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096,
    response_format:
      options.responseFormat === "json_object"
        ? { type: "json_object" }
        : undefined,
  });

  const choice = completion.choices[0];
  return {
    content: choice.message.content || "",
    model: completion.model,
    usage: {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
    },
  };
}

async function callClaude(options: LlmCallOptions): Promise<LlmResponse> {
  const model = "claude-sonnet-4-20250514";
  const systemMsg = options.messages.find((m) => m.role === "system");
  const userMsgs = options.messages.filter((m) => m.role !== "system");

  const msg = await getAnthropic().messages.create({
    model,
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature ?? 0.3,
    system: systemMsg?.content,
    messages: userMsgs.map((m) => ({
      role: "user" as const,
      content: m.content,
    })),
  });

  const textBlock = msg.content.find((b) => b.type === "text");
  return {
    content: textBlock?.text || "",
    model: msg.model,
    usage: {
      promptTokens: msg.usage.input_tokens,
      completionTokens: msg.usage.output_tokens,
    },
  };
}

export async function callLlmStreaming(
  options: LlmCallOptions,
  onChunk: (chunk: string) => void
): Promise<LlmResponse> {
  const model = options.model || "deepseek-chat";
  const stream = await getDeepSeek().chat.completions.create({
    model,
    messages: options.messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096,
    stream: true,
  });

  let fullContent = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || "";
    if (delta) {
      fullContent += delta;
      onChunk(delta);
    }
  }

  return {
    content: fullContent,
    model,
    usage: { promptTokens: 0, completionTokens: 0 },
  };
}
