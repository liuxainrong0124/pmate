export type ModelProvider = "deepseek" | "claude";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmCallOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json_object";
  stream?: boolean;
}

export interface LlmResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}
