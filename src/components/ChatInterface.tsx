import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, Clock, User, ShieldCheck, Volume2, Pause, ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import fetchSpeechAudio from '@/services/ttsService';

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { useApp } from "@/providers/AppProvider";
import { ChatCitation, requestChatCompletion } from "@/services/chatbotService";
import { FeedbackService } from "@/services/feedbackService";
import { ReportService } from "@/services/reportService";
import { SuggestionsService } from "@/services/suggestionsService";
import { UserEngagementService } from "@/services/userEngagementService";
import { RealAnalyticsService } from "@/services/realAnalyticsService";
import { safeStorage } from "@/utils/safeStorage";
import { logger } from "@/utils/logger";
import { TypewriterMessage } from "./TypewriterMessage";

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  options?: string[];
  followUpSuggestions?: string[];
  mode?: 'chatbot' | 'consultant';
  citations?: ChatCitation[];
  languageDetected?: string;
  responseTimeMs?: number;
  feedbackRating?: number;
  isReported?: boolean;
}

interface ChatInterfaceProps {
  clearTrigger?: number;
}

const CHATBOT_AVATAR_SRC = "/logo/3.png";

export function ChatInterface({ 
  clearTrigger = 0 
}: ChatInterfaceProps) {
  const { t, i18n } = useTranslation();
  const { nickname, botName, sessionId, setSessionId, consultantMode, sessionDuration, ageRange, genderIdentity, region, analyticsOptIn } = useApp();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [chatLanguage, setChatLanguage] = useState(i18n.resolvedLanguage?.split('-')[0] || i18n.language || 'en');
  const [completedBotMessages, setCompletedBotMessages] = useState<Set<string>>(new Set());
  const [, setSuggestions] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const STORAGE_KEY = `lydiacontactcenter_chat_${sessionId}`;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | undefined>(undefined);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  const langMap: Record<string, string> = { 'en': 'en-US', 'twi': 'en-GH', 'ewe': 'en-GH', 'ha': 'ha-NG' };

  const togglePlay = async (id: string, text: string, langCode?: string) => {
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      try { window.speechSynthesis.cancel(); } catch {}
      setPlayingId(undefined);
      return;
    }

    setPlayingId(id);
    const useRemote = import.meta.env.VITE_USE_REMOTE_TTS === 'true';
    if (useRemote) {
      try {
        const url = await fetchSpeechAudio(text, import.meta.env.VITE_TTS_VOICE || 'alloy');
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setPlayingId(undefined);
        await audio.play();
      } catch (e) {
        logger.error('Audio playback failed', e);
        setPlayingId(undefined);
      }
    } else {
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = langMap[langCode || chatLanguage] || 'en-US';
        utter.onend = () => setPlayingId(undefined);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch (e) {
        logger.error('Speech synthesis failed', e);
        setPlayingId(undefined);
      }
    }
  };

  const getInitialMessage = () => {
    const initialText = consultantMode ? t('chat.consultantMessage') : t('chat.initialMessage');
    const quickReplies = t('chat.quickReplies', { returnObjects: true }) as Record<string, string>;

    return {
      id: '1',
      text: initialText,
      sender: 'bot' as const,
      timestamp: new Date(),
      options: Object.values(quickReplies),
      mode: consultantMode ? 'consultant' as const : 'chatbot' as const,
    };
  };

  const getRetentionMs = (duration: string): number | null => {
    if (duration === 'logout') {
      return null;
    }

    const amount = Number.parseInt(duration, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      return 24 * 60 * 60 * 1000;
    }

    if (duration.endsWith('h')) {
      return amount * 60 * 60 * 1000;
    }

    if (duration.endsWith('d')) {
      return amount * 24 * 60 * 60 * 1000;
    }

    return 24 * 60 * 60 * 1000;
  };

  const applyRetentionPolicy = (existingMessages: Message[]) => {
    const retentionMs = getRetentionMs(sessionDuration);
    if (!retentionMs) {
      return existingMessages;
    }

    const cutoff = Date.now() - retentionMs;
    return existingMessages.filter((message) => {
      const timeValue = new Date(message.timestamp).getTime();
      return Number.isFinite(timeValue) && timeValue >= cutoff;
    });
  };

  const rebuildMessagesForLanguage = (existingMessages: Message[]) => {
    return existingMessages.map((message, index) => {
      // Keep the first bot greeting localized with localized quick replies.
      if (message.sender === 'bot' && (index === 0 || message.options?.length)) {
        return {
          ...message,
          ...getInitialMessage(),
          id: message.id,
          timestamp: message.timestamp,
          mode: message.mode || (consultantMode ? 'consultant' : 'chatbot'),
        };
      }

      return message;
    });
  };

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(STORAGE_KEY);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        const hydratedMessages = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));

        const retainedMessages = applyRetentionPolicy(hydratedMessages);

        if (retainedMessages.length > 0) {
          setMessages(retainedMessages);
          setCompletedBotMessages(
            new Set(retainedMessages.filter((message) => message.sender === 'bot').map((message) => message.id))
          );
          if (retainedMessages.length !== hydratedMessages.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(retainedMessages));
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          const initialMessage = getInitialMessage();
          setMessages([initialMessage]);
          setCompletedBotMessages(new Set([initialMessage.id]));
        }
      } else {
        const initialMessage = getInitialMessage();
        setMessages([initialMessage]);
        setCompletedBotMessages(new Set([initialMessage.id]));
      }
      setIsLoaded(true);
      setChatLanguage((i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]);
    } catch (error) {
      logger.error('Error loading chat history:', error);
      const initialMessage = getInitialMessage();
      setMessages([initialMessage]);
      setCompletedBotMessages(new Set([initialMessage.id]));
      setIsLoaded(true);
    }

    // Fetch conversation starter suggestions
    const fetchSuggestions = async () => {
      try {
        const languageCode = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
        const response = await SuggestionsService.getSuggestions({ language: languageCode });
        if (Array.isArray(response.suggestions)) {
          setSuggestions(response.suggestions);
        }
      } catch (error) {
        logger.error('Failed to fetch suggestions', error);
      }
    };

    fetchSuggestions();
  }, [STORAGE_KEY, clearTrigger, consultantMode, sessionDuration]);

  useEffect(() => {
    if (!isLoaded || messages.length === 0 || isTyping) {
      return;
    }

    const languageCode = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
    if (languageCode === chatLanguage) {
      return;
    }

    setMessages((prev) => rebuildMessagesForLanguage(prev));
    setChatLanguage(languageCode);
  }, [i18n.language, i18n.resolvedLanguage, isLoaded, isTyping, messages.length, chatLanguage]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, STORAGE_KEY]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      const langCodes: Record<string, string> = { 'en': 'en-US', 'twi': 'en-GH', 'ewe': 'en-GH', 'ha': 'ha-NG' };
      recognitionRef.current.lang = langCodes[i18n.language] || 'en-US';
      recognitionRef.current.onresult = (event: any) => { setInputValue(event.results[0][0].transcript); setIsListening(false); };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [i18n.language]);

  const handleSend = async (presetMessage?: string) => {
    const outgoingMessage = (presetMessage ?? inputValue).trim();
    if (!outgoingMessage) return;

    const normalizeSafetyFlag = (flag: unknown) => {
      if (typeof flag === 'string') {
        return flag.toLowerCase();
      }

      if (flag && typeof flag === 'object') {
        const record = flag as Record<string, unknown>;
        const label = typeof record.label === 'string' ? record.label : '';
        const reason = typeof record.reason === 'string' ? record.reason : '';
        const message = typeof record.message === 'string' ? record.message : '';
        const severity = typeof record.severity === 'string' ? record.severity : '';
        return `${label} ${reason} ${message} ${severity}`.toLowerCase();
      }

      return '';
    };

    const countSafetyFlags = (flags: unknown[], patterns: string[]) =>
      flags.reduce<number>((count, flag) => {
        const normalized = normalizeSafetyFlag(flag);
        return count + (patterns.some((pattern) => normalized.includes(pattern)) ? 1 : 0);
      }, 0);

    const userMsg: Message = { id: Date.now().toString(), text: outgoingMessage, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const languageCode = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
      UserEngagementService.logNonBlocking(
        UserEngagementService.logChatEvent({
          session_id: sessionId,
          event_type: 'message_sent',
          event_category: 'engagement',
          input_method: presetMessage ? 'quick_reply' : 'typed',
          metadata: {
            message_length: outgoingMessage.length,
            consultant_mode: consultantMode,
          },
        }),
        'Failed to log outgoing chat event',
      );

      const response = await requestChatCompletion({
        message: outgoingMessage,
        language: languageCode,
        session_id: sessionId,
      });

      // Sync to the backend-assigned session UUID so all messages land in the same conversation
      if (response.session_id && response.session_id !== sessionId) {
        setSessionId(response.session_id);
      }

      const answerText = response.answer.trim();

      if (answerText) {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: answerText,
          sender: 'bot',
          timestamp: new Date(),
          mode: consultantMode ? 'consultant' : 'chatbot',
          citations: response.citations,
          languageDetected: response.language_detected,
          responseTimeMs: response.response_time_ms,
        };

        setMessages(prev => [...prev, botMsg]);

        // // Fetch follow-up suggestions for this bot message
        // try {
        //   const languageCode = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
        //   const suggestionsResponse = await SuggestionsService.getSuggestions({ 
        //     language: languageCode,
        //     context: answerText
        //   });
          
        //   if (suggestionsResponse.suggestions && suggestionsResponse.suggestions.length > 0) {
        //     setMessages(prev => 
        //       prev.map(msg => 
        //         msg.id === botMsg.id 
        //           ? { ...msg, followUpSuggestions: suggestionsResponse.suggestions.slice(0, 3) }
        //           : msg
        //       )
        //     );
        //   }
        // } catch (err) {
        //   logger.error('Failed to fetch follow-up suggestions', err);
        // }

        UserEngagementService.logNonBlocking(
          UserEngagementService.logChatEvent({
            session_id: sessionId,
            event_type: 'bot_response_received',
            event_category: response.safety_flags.length ? 'safety' : 'engagement',
            input_method: 'system',
            metadata: {
              response_time_ms: response.response_time_ms,
              language_detected: response.language_detected,
              citations_count: response.citations.length,
              harm_count: response.safety_flags.length,
              self_harm_mentions: countSafetyFlags(response.safety_flags, ['self-harm', 'self_harm']),
              suicidal_ideation_mentions: countSafetyFlags(response.safety_flags, ['suicidal', 'suicidal_ideation']),
              risks_escalated_to_human: countSafetyFlags(response.safety_flags, ['consultant', 'escalat']),
              safety_flags_count: response.safety_flags.length,
            },
          }),
          'Failed to log bot response chat event',
        );
      } else {
        logger.warn('Chat API returned an empty answer.', response);
      }
    } catch (error) {
      logger.error('Chat API failed:', error);
    } finally {
      setIsTyping(false);
      // Post an incremental analytics snapshot so messages are recorded instantly
      try {
        if (analyticsOptIn) {
          const chatStorageKey = `lydiacontactcenter_chat_${sessionId}`;
          const storedMessagesRaw = safeStorage.getItem(chatStorageKey, '[]');
          let messagesExchanged = 0;
          try {
            const storedMessages = storedMessagesRaw ? JSON.parse(storedMessagesRaw) : [];
            messagesExchanged = Array.isArray(storedMessages) ? storedMessages.length : 0;
          } catch {}

          const startTs = Number(safeStorage.getItem('lydiacontactcenter_session_started_at')) || Date.now();
          const durationSeconds = Math.max(0, Math.round((Date.now() - startTs) / 1000));

          void RealAnalyticsService.recordSessionAnalytics({
            session_id: sessionId,
            user_id: nickname || undefined,
            age_range: ageRange,
            gender_identity: genderIdentity,
            region,
            language: (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0],
            start_time: new Date(startTs).toISOString(),
            end_time: new Date().toISOString(),
            duration_seconds: durationSeconds,
            messages_exchanged: messagesExchanged,
            topics_discussed: [],
            panic_button_used: safeStorage.getItem('lydiacontactcenter_panic_triggered') === 'true',
            crisis_support_accessed: false,
            story_modules_started: 0,
            story_modules_completed: 0,
            pharmacy_searches: 0,
            satisfaction_rating: undefined,
            would_return: true,
            safety_flags: safeStorage.getItem('lydiacontactcenter_panic_triggered') === 'true' ? ['panic-button'] : [],
          });
        }
      } catch (err) {
        // intentionally ignore analytics errors
      }
    }
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    try {
      await FeedbackService.submitFeedback({
        session_id: sessionId,
        message_id: messageId,
        rating,
      });

      // Update message with feedback rating
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, feedbackRating: rating } : msg
      ));

      logger.info(`Feedback submitted for message ${messageId}: ${rating}`);
    } catch (error) {
      logger.error('Failed to submit feedback', error);
    }
  };

  const handleReport = (messageId: string) => {
    setReportMessageId(messageId);
    setReportReason("");
    setReportModalOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!reportMessageId || !reportReason.trim()) return;

    try {
      await ReportService.submitReport({
        session_id: sessionId,
        message_id: reportMessageId,
        reason: reportReason,
      });

      // Mark message as reported
      setMessages(prev => prev.map(msg =>
        msg.id === reportMessageId ? { ...msg, isReported: true } : msg
      ));

      logger.info(`Message ${reportMessageId} reported`);

      // Close modal
      setReportModalOpen(false);
      setReportMessageId(null);
      setReportReason("");

      // Show success message
      alert(t('chat.reportSuccess', 'Thank you for your report. We will review it.'));
    } catch (error) {
      logger.error('Failed to submit report', error);
      alert(t('chat.reportError', 'Failed to submit report. Please try again.'));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8faff]">
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-8">
        <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
           <div className="rounded-3xl border border-[#CFE0FF] bg-gradient-to-r from-white to-[#EDF4FF] p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0048ff] to-[#00a3ff] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#0048ff]">{t('common.privacyFirst')}</p>
                    <p className="text-xs text-[#4A66A8]">{t('common.privacyNotice')}</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#4A66A8]">
                  <Clock className="w-3.5 h-3.5" />
                  {sessionDuration}
                </div>
              </div>
           </div>

          {/* Conversation starters moved to render below the welcome message */}

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <React.Fragment key={message.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm ${
                    message.sender === 'bot' 
                        ? (message.mode === 'consultant' ? 'bg-emerald-600' : 'bg-blue-600') 
                        : 'bg-white border border-slate-100'
                }`}>
                    {message.sender === 'bot' ? (
                      <img
                        src={CHATBOT_AVATAR_SRC}
                        alt={`${botName} avatar`}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : <User className="w-5 h-5 text-slate-400" />}
                </div>

                <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div className={`p-4 rounded-[24px] shadow-sm relative group ${
                    message.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : (message.mode === 'consultant' ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-tl-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none')
                  }`}>
                    {message.sender === 'bot' ? (
                      <TypewriterMessage
                        text={message.text}
                        speed={15}
                        isCompleted={completedBotMessages.has(message.id)}
                        onComplete={() => {
                          setCompletedBotMessages(prev => new Set([...prev, message.id]));
                        }}
                      />
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap chat-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {message.sender === 'bot' && (
                    <div className="mt-3 w-full space-y-2">
                      {(message.responseTimeMs !== undefined || message.languageDetected) && (
                        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                          {message.responseTimeMs !== undefined && `Answered in ${message.responseTimeMs} ms`}
                          {message.responseTimeMs !== undefined && message.languageDetected ? ' • ' : ''}
                          {message.languageDetected ? `Language: ${message.languageDetected}` : ''}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-1.5 flex items-center gap-2 px-1">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {message.sender === 'bot' ? (message.mode === 'consultant' ? `${botName} Consultant` : botName) : (nickname || t('chat.anonymous'))}
                      </span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => togglePlay(message.id, message.text, message.languageDetected || chatLanguage)}
                        className="ml-2 p-1 rounded-md hover:bg-slate-100 transition-colors"
                        aria-label="Play response audio"
                      >
                        {playingId === message.id ? (
                          <Pause className="w-4 h-4 text-slate-600" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {message.sender === 'bot' && (
                        <>
                          <button
                            onClick={() => handleFeedback(message.id, 5)}
                            className={`p-1 rounded-md transition-colors ${
                              message.feedbackRating === 5
                                ? 'bg-green-100 text-green-600'
                                : 'hover:bg-slate-100 text-slate-400'
                            }`}
                            aria-label="Helpful"
                            title="Helpful"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, 1)}
                            className={`p-1 rounded-md transition-colors ${
                              message.feedbackRating === 1
                                ? 'bg-red-100 text-red-600'
                                : 'hover:bg-slate-100 text-slate-400'
                            }`}
                            aria-label="Not helpful"
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReport(message.id)}
                            className={`p-1 rounded-md transition-colors ${
                              message.isReported
                                ? 'bg-orange-100 text-orange-600'
                                : 'hover:bg-slate-100 text-slate-400'
                            }`}
                            aria-label="Report message"
                            title="Report message"
                            disabled={message.isReported}
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                        </>
                      )}
                  </div>

                  {message.options && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {message.options.map((option, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => { handleSend(option); }}
                          className="rounded-xl border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white transition-all duration-200 text-xs py-1 h-9 font-semibold"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}

                  {message.sender === 'bot' && message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {message.followUpSuggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => { handleSend(suggestion); }}
                          className="rounded-xl border-emerald-600 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all duration-200 text-xs py-1 h-9 font-semibold"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                </motion.div>

                {/* Show conversation starters directly below the welcome message */}
                {/* {idx === 0 && messages.length <= 3 && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 w-full"
                  >
                    <p className="text-xs text-slate-500 font-medium px-1">
                      {t('chat.suggestionsLabel', 'Conversation starters:')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.slice(0, 4).map((suggestion, sidx) => (
                        <Button
                          key={sidx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSend(suggestion)}
                          className="rounded-xl border-blue-100 text-blue-600 bg-white hover:bg-blue-50 text-xs py-2 h-auto"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )} */}
              </React.Fragment>
            ))}
          </AnimatePresence>

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center shadow-sm">
                <img
                  src={CHATBOT_AVATAR_SRC}
                  alt={`${botName} avatar`}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="bg-white border border-slate-100 rounded-[24px] rounded-tl-none px-6 py-4 flex gap-1.5">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div
        className="bg-white border-t border-slate-100 p-3 pb-4 sm:p-6 sm:pb-8"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 sm:gap-4">
          <div className="flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('chat.placeholder')}
              className="h-11 sm:h-12 w-full rounded-full pl-4 sm:pl-5 pr-4 bg-white border border-slate-300 shadow-sm focus:bg-white focus:border-blue-500 transition-all text-sm font-medium placeholder:text-slate-500 placeholder:opacity-100 focus:placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={() => { if(!recognitionRef.current) return; isListening ? recognitionRef.current.stop() : (recognitionRef.current.start(), setIsListening(true)); }}
            className={`p-2 rounded-full transition-colors flex items-center justify-center flex-shrink-0 ${isListening ? 'bg-red-100 text-red-600' : 'text-slate-500 hover:text-blue-600'}`}
            aria-label="Toggle voice input"
          >
            <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
          </button>

          <Button
            onClick={() => { handleSend(); }}
            disabled={!inputValue.trim()}
            className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-blue-600 hover:bg-white text-white hover:text-blue-600 border border-blue-600 hover:border-blue-600 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="w-5 h-5 text-current" />
          </Button>
        </div>
        
      </div>
      
      {/* Report Message Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#241515]">
              {t('chat.reportTitle', 'Report Message')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-[#6D4A49]">
              {t('chat.reportPrompt', 'Please describe why you are reporting this message:')}
            </p>
            
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={t('chat.reportPlaceholder', 'Enter your reason here...')}
              className="w-full p-3 rounded-xl border border-[#F1D5D4] bg-white text-[#241515] placeholder-[#9A7A79] text-sm focus:outline-none focus:border-[#BE322D] focus:ring-1 focus:ring-[#BE322D] resize-none"
              rows={4}
            />
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setReportModalOpen(false);
                setReportReason("");
              }}
              className="rounded-xl"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleSubmitReport();
              }}
              disabled={!reportReason.trim()}
              className="rounded-xl bg-[#BE322D] hover:bg-[#A82B27] text-white"
            >
              {t('common.submit', 'Submit Report')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}