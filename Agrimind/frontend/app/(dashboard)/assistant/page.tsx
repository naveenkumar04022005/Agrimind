"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import api, { FarmData } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  Bot,
  Send,
  User,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

const SUGGESTED_PROMPTS = [
  "What should I do today?",
  "Should I irrigate?",
  "Will it rain tomorrow?",
  "How is my crop doing?",
  "When is my harvest?",
];

// Helper to structure AI responses into Answer, Why, Recommended Action
function parseAiResponse(text: string) {
  // Check if text already has Answer / Why / Action keywords
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  let answer = "";
  let why = "";
  let action = "";
  let details: string[] = [];

  let currentSection = "answer";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith("why:") || lower.startsWith("**why**") || lower.startsWith("reason:")) {
      currentSection = "why";
      why += line.replace(/^(why:|reason:|\*\*why\*\*:?)/i, "").trim() + " ";
    } else if (
      lower.startsWith("recommended action:") ||
      lower.startsWith("**recommended action**") ||
      lower.startsWith("action:")
    ) {
      currentSection = "action";
      action += line.replace(/^(recommended action:|action:|\*\*recommended action\*\*:?)/i, "").trim() + " ";
    } else if (lower.startsWith("details:") || lower.startsWith("**details**")) {
      currentSection = "details";
    } else {
      if (currentSection === "answer") answer += line + " ";
      else if (currentSection === "why") why += line + " ";
      else if (currentSection === "action") action += line + " ";
      else details.push(line);
    }
  }

  // If the backend returned a flat paragraph without tags, gently separate
  if (!why && !action && lines.length >= 2) {
    answer = lines[0];
    if (lines.length > 1) why = lines[1];
    if (lines.length > 2) action = lines.slice(2).join(" ");
  } else if (!why && !action) {
    answer = text;
  }

  return {
    answer: answer.trim() || text,
    why: why.trim(),
    action: action.trim(),
    details,
  };
}

export default function AssistantPage() {
  const { user } = useAuth();
  const { error: toastError } = useToast();

  const [farm, setFarm] = useState<FarmData | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Welcome to Agrimind. I am your farm-aware agronomy advisor. Ask me anything regarding today's field actions, irrigation, or weather considerations.",
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Load farm & conversations list
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [farmData, convs] = await Promise.allSettled([
          api.getFarm(),
          api.getConversations(),
        ]);
        if (farmData.status === "fulfilled" && farmData.value) {
          setFarm(farmData.value);
        }
        if (convs.status === "fulfilled" && Array.isArray(convs.value)) {
          setConversations(convs.value);
        }
      } catch (err) {
        console.error("Failed to load assistant data:", err);
      }
    }
    loadData();
  }, [user]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    setInputMessage("");
    const userMsgId = Math.random().toString(36).substring(7);
    const updatedMessages = [
      ...messages,
      { id: userMsgId, role: "user" as const, content: text },
    ];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      const res = await api.sendAssistantMessage({
        message: text,
        conversation_id: activeConversationId || undefined,
        farm_id: farm?.id,
      });

      if (res && res.response) {
        if (res.conversation_id && !activeConversationId) {
          setActiveConversationId(res.conversation_id);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            role: "assistant",
            content: res.response,
            created_at: res.created_at,
          },
        ]);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to retrieve response.";
      toastError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content:
            "I apologize, I am temporarily unable to connect to the agronomy knowledge engine. Please check that the local server is running.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([
      {
        id: "initial",
        role: "assistant",
        content:
          "New consultation started. How can I assist with your fields today?",
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
            Agrimind Assistant
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Your farm-aware AI advisor. Calibrated on your soil, weather, and active crop.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleStartNewChat}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Chat
        </Button>
      </div>

      {/* Suggested Prompts Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] text-neutral-400 font-medium whitespace-nowrap pl-1">
          Suggestions:
        </span>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={isSending}
            className="px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-xs text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 whitespace-nowrap transition-colors shadow-subtle disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Clean Chat Window */}
      <Card className="min-h-[460px] max-h-[600px] flex flex-col justify-between shadow-card overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
          {messages.map((m) => {
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-lg p-3.5 px-4 rounded-2xl bg-neutral-900 text-white text-xs sm:text-sm">
                    {m.content}
                  </div>
                </div>
              );
            }

            // Assistant Message with Clean Structured Presentation: Answer, Why, Recommended Action
            const structured = parseAiResponse(m.content);

            return (
              <div key={m.id} className="flex items-start gap-3 max-w-2xl">
                <div className="w-7 h-7 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-700 shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-neutral-50/80 border border-neutral-200 text-xs sm:text-sm">
                  {/* Answer */}
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-primary-700 block mb-0.5">
                      Answer
                    </span>
                    <p className="text-neutral-900 font-medium leading-relaxed">
                      {structured.answer}
                    </p>
                  </div>

                  {/* Why */}
                  {structured.why && (
                    <div className="pt-2 border-t border-neutral-200/60">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 block mb-0.5">
                        Reason
                      </span>
                      <p className="text-neutral-600 leading-relaxed text-xs">
                        {structured.why}
                      </p>
                    </div>
                  )}

                  {/* Recommended Action */}
                  {structured.action && (
                    <div className="pt-2 border-t border-neutral-200/60">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-primary-700 block mb-0.5">
                        Recommended Action
                      </span>
                      <div className="flex items-start gap-1.5 text-neutral-800 font-medium text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 shrink-0 mt-0.5" />
                        <span>{structured.action}</span>
                      </div>
                    </div>
                  )}

                  {/* Optional details */}
                  {structured.details && structured.details.length > 0 && (
                    <div className="pt-2 border-t border-neutral-200/60 text-[11px] text-neutral-500">
                      {structured.details.join(" ")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-start gap-3 max-w-lg">
              <div className="w-7 h-7 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-700 shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-500 space-y-1.5 w-64">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3.5 bg-neutral-50/70 border-t border-neutral-100 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask your agricultural advisor... (e.g. Should I irrigate?)"
            className="flex-1 bg-white border border-neutral-200 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors"
          />

          <Button
            type="button"
            size="sm"
            onClick={() => handleSendMessage()}
            isLoading={isSending}
            disabled={!inputMessage.trim()}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}
