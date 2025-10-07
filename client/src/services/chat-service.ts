import axios from "axios";
import { ChatMessage, ChatResponse } from "../types/chat";
import { Symptom, Intervention } from "../types/types";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3030";

export class ChatService {
  static async sendMessage(
    message: string,
    conversationHistory: string[] = []
  ): Promise<ChatResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/aichat`,
        { message, conversationHistory },
        { timeout: 8000 }
      );

      // api returns { code, message } where message is the payload
      if (!response || !response.data)
        throw new Error("Empty response from AI");
      return response.data.message;
    } catch (error) {
      console.error("Error sending message to AI:", error);
      throw new Error("Failed to get AI response");
    }
  }

  static formatConversationHistory(messages: ChatMessage[]): string[] {
    return messages.map((msg) => `${msg.role}: ${msg.content}`);
  }

  static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
