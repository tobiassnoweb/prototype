import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { ChatMessage, ChatResponse } from "../types/chat";
import { ChatService } from "../services/chat-service";
import { Intervention } from "../types/types";

interface ChatInterfaceProps {
  onInterventionSelected?: (intervention: any) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onInterventionSelected,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: ChatService.generateMessageId(),
      role: "assistant",
      content:
        "Hello! I'm here to help you find appropriate interventions for your symptoms. Please describe what you're experiencing.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpValues, setFollowUpValues] = useState<Record<string, string>>(
    {}
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: ChatService.generateMessageId(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const conversationHistory =
        ChatService.formatConversationHistory(messages);
      const aiResponse: ChatResponse = await ChatService.sendMessage(
        inputValue,
        conversationHistory
      );
      // safe check: extracted may be undefined, treat null/undefined as missing
      const severity = aiResponse.extracted?.severity ?? null;

      // Build a simple assistant textual reply from structured message
      let assistantText = "";
      if (
        !severity === null &&
        aiResponse.matched &&
        aiResponse.matched.length > 0
      ) {
        const names = aiResponse.matched
          .map((m) => m.record?.name || m.symptom)
          .join(", ");
        assistantText += `I found matches for: ${names}.`;
      }

      if (!severity === null && !assistantText)
        assistantText = "Here's what I found.";

      const assistantMessage: ChatMessage = {
        id: ChatService.generateMessageId(),
        role: "assistant",
        content: assistantText,
        timestamp: new Date(),
        metadata: {
          // collect interventions from matched entries for quick access
          interventions: (aiResponse.matched || []).flatMap(
            (m) => m.interventions || []
          ) as any,
          // preserve other metadata if present (best-effort)

          matched: aiResponse.matched,
          followUps: (aiResponse.followUps || []).map((s: any) => {
            if (typeof s === "string") return { description: s };
            return { description: s?.description || "", options: s?.options };
          }),
          // attach the per-message severity so rendering for this message is self-contained
          severity,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Sorry, I encountered an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  const handleFollowup = async (e: any, question: string, key: string) => {
    const val = e.target.value;
    const request = ` ${question} = ${val}`;
    setFollowUpValues((prev) => ({
      ...prev,
      [key]: val,
    }));

    // send selected option as a follow-up user message
    const userMessage: ChatMessage = {
      id: ChatService.generateMessageId(),
      role: "user",
      content: request,
      timestamp: new Date(),
    } as any;
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    try {
      const conversationHistory = ChatService.formatConversationHistory([
        ...messages,
        userMessage,
      ]);
      const aiResponse = await ChatService.sendMessage(
        request,
        conversationHistory
      );
      // follow-up responses can also lack severity; use per-message severity
      const severity = aiResponse.extracted?.severity ?? null;
      // Build assistant message from structured ChatResponse
      let assistantText = "";
      if (aiResponse.matched && aiResponse.matched.length > 0) {
        const names = aiResponse.matched
          .map((m) => m.record?.name || m.symptom)
          .join(", ");
        assistantText += `I found matches for: ${names}.`;
      } else {
        assistantText += `I need more information.`;
      }
      if (aiResponse.followUps && aiResponse.followUps.length > 0) {
        const followTexts = (aiResponse.followUps || []).map((f: any) =>
          typeof f === "string" ? f : f?.description || ""
        );
        assistantText += " " + followTexts.join(" ");
      }
      if (!assistantText) assistantText = "Here's what I found.";

      const assistantMessage: ChatMessage = {
        id: ChatService.generateMessageId(),
        role: "assistant",
        content: assistantText,
        timestamp: new Date(),
        metadata: {
          interventions: (aiResponse.matched || []).flatMap(
            (m: any) => m.interventions || []
          ),

          matched: aiResponse.matched,
          followUps: (aiResponse.followUps || []).map((s: any) =>
            typeof s === "string"
              ? { description: s }
              : { description: s?.description || "", options: s?.options }
          ),
          severity,
        },
      } as any;
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error sending follow-up option:", err);
      setError("Failed to send follow-up option");
    } finally {
      setIsLoading(false);
    }
  };
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === "user";
    const matched = message.metadata?.matched || [];
    // prefer per-message Severity; fallback to component-level state
    const severity = message.metadata?.severity;
    return (
      <Box
        key={message.id}
        display="flex"
        justifyContent={isUser ? "flex-end" : "flex-start"}
        mb={2}
      >
        <Paper
          elevation={1}
          sx={{
            p: 2,
            maxWidth: "70%",
            backgroundColor: isUser ? "primary.light" : "grey.100",
            color: isUser ? "primary.contrastText" : "text.primary",
          }}
        >
          <Box display="flex" alignItems="center" mb={1}>
            {isUser ? <PersonIcon /> : <PsychologyIcon />}
            <Typography variant="caption" sx={{ ml: 1 }}>
              {isUser ? "You" : "AI Assistant"}
            </Typography>
          </Box>

          <Typography variant="body1" paragraph>
            {message.content}
          </Typography>

          {/* Render matched symptoms and their interventions if present */}
          {matched !== null && matched!.length > 0 && (
            <Box mt={2}>
              <List dense>
                {matched!.map((m: any, idx: number) => (
                  <ListItem
                    key={`${message.id}-matched-${idx}`}
                    sx={{
                      mb: 1,
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <ListItemText
                      primary={m.record?.name || m.symptom}
                      secondary={m.record?.description || ""}
                    />
                    {severity &&
                      m.interventions &&
                      m.interventions.length > 0 && (
                        <Box mt={1} sx={{ width: "100%" }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Available Treatments:
                          </Typography>
                          <List disablePadding>
                            {m.interventions.map((iv: Intervention) => {
                              return iv.severity.includes(severity) ? (
                                <ListItem key={iv.id} sx={{ mb: 1 }}>
                                  <ListItemButton
                                    onClick={() => onInterventionSelected?.(iv)}
                                    sx={{
                                      border: 1,
                                      borderColor: "divider",
                                      borderRadius: 1,
                                      backgroundColor: "background.paper",
                                    }}
                                  >
                                    <ListItemText
                                      primary={iv.name}
                                      secondary={iv.description}
                                    />
                                    {iv.SOS && (
                                      <Chip
                                        label="SOS"
                                        color="error"
                                        size="small"
                                        icon={<WarningIcon />}
                                      />
                                    )}
                                  </ListItemButton>
                                </ListItem>
                              ) : null;
                            })}
                          </List>
                        </Box>
                      )}
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Render metadata */}
          {message.metadata && (
            <Box>
              {/* Render follow-up questions if provided by server */}
              {message.metadata.followUps &&
                message.metadata.followUps.length > 0 && (
                  <Box mt={2}>
                    {message.metadata.followUps.map((fq: any, i: number) => {
                      const key = `${message.id}-fq-${i}`;
                      return (
                        <Box key={key} sx={{ mt: 1 }}>
                          <Typography variant="body2" gutterBottom>
                            {fq.description}
                          </Typography>
                          {fq.options && fq.options.length > 0 ? (
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                              <InputLabel id={`label-${key}`}>
                                Choose
                              </InputLabel>
                              <Select
                                labelId={`label-${key}`}
                                value={followUpValues[key] ?? ""}
                                label="Choose"
                                onChange={async (e) =>
                                  handleFollowup(e, fq.description, key)
                                }
                              >
                                {fq.options.map((opt: string) => (
                                  <MenuItem key={opt} value={opt}>
                                    {opt}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : null}
                        </Box>
                      );
                    })}
                  </Box>
                )}
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Card sx={{ height: "600px", display: "flex", flexDirection: "column" }}>
      <CardContent
        sx={{
          flexGrow: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="h6" gutterBottom>
          AI Symptom Assistant
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
            mb: 2,
            p: 1,
          }}
        >
          {messages.map(renderMessage)}
          {isLoading && (
            <Box display="flex" justifyContent="flex-start" mb={2}>
              <Paper elevation={1} sx={{ p: 2, backgroundColor: "grey.100" }}>
                <Box display="flex" alignItems="center">
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2">AI is thinking...</Typography>
                </Box>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Describe your symptoms..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            sx={{ minWidth: "auto", px: 2 }}
          >
            <SendIcon />
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
