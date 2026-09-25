import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, AlertCircle, ChevronLeft, ChevronRight, X, Bot, User, ShieldAlert, Send, Radio, Headphones, Clock } from 'lucide-react';
import { ExportButton } from './ExportButton';
import {
  StaffAccessService,
  StaffSession,
  AdminConversationListItem,
  AdminConversationDetail,
  AdminConversationMessage,
} from '@/services/staffAccessService';
import { RealAnalyticsService } from '@/services/realAnalyticsService';
import { getNumber } from '@/utils/analyticsUtils';
import { logger } from '@/utils/logger';

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

const TOPIC_COLORS = ['#006d77', '#BE322D', '#F59E0B', '#8b5cf6', '#22c55e', '#ec4899', '#0ea5e9', '#f97316'];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatUserDisplay(nickname?: string | null, platform?: string | null): string {
  if (!nickname || !nickname.trim()) return platform === 'whatsapp' ? 'WhatsApp User' : 'Anonymous';
  const clean = nickname.trim();
  const digits = clean.replace(/\D/g, '');
  if (digits.length >= 7 && (clean.startsWith('+') || /^\d+$/.test(clean) || digits.length >= clean.length * 0.7)) {
    return platform === 'whatsapp' ? 'WhatsApp User' : 'Anonymous';
  }
  return clean;
}

function formatSessionDisplay(sessionId: string): string {
  if (!sessionId) return '';
  if (sessionId.startsWith('whatsapp:') || sessionId.startsWith('wa:')) {
    const parts = sessionId.split(':');
    const val = parts[1] || '';
    if (val.startsWith('anon_')) return `wa:${val}`;
    return `wa:anon_${val.slice(-6)}`;
  }
  const digits = sessionId.replace(/\D/g, '');
  if (digits.length >= 7 && (sessionId.startsWith('+') || /^\d+$/.test(sessionId))) {
    return `anon_${digits.slice(-6)}`;
  }
  return `…${sessionId.slice(-8)}`;
}

// ── Conversation detail panel ────────────────────────────────────────────────

interface ConversationDetailPanelProps {
  conv: AdminConversationListItem;
  accessToken: string;
  onClose: () => void;
  onTakeoverSuccess?: (convId: string) => void;
  onReleaseSuccess?: (convId: string) => void;
}

function ChatBubble({ msg }: { msg: AdminConversationMessage }) {
  const isUser = msg.sender === 'user';
  const isStaff = msg.sender === 'consultant' || msg.sender === 'staff';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5
        ${isUser ? 'bg-gray-400' : isStaff ? 'bg-emerald-600' : 'bg-[#006d77]'}`}>
        {isUser ? <User className="w-3.5 h-3.5" /> : isStaff ? 'C' : <Bot className="w-3.5 h-3.5" />}
      </div>

      <div className={`max-w-[80%] ${isUser ? 'items-start' : 'items-end'} flex flex-col gap-0.5`}>
        {/* Sender label */}
        <span className="text-[10px] text-gray-400 font-medium px-1">
          {isUser ? 'User' : isStaff ? 'Live Counselor' : 'AI Copilot'} · {formatDateTime(msg.created_at)}
        </span>

        {/* Bubble */}
        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
          ${isUser
            ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
            : isStaff
              ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-tr-sm'
              : 'bg-[#006d77] text-white rounded-tr-sm'
          }`}>
          {msg.content}
        </div>

        {/* Safety flags */}
        {msg.safety_flags && msg.safety_flags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {msg.safety_flags.map((flag) => (
              <span key={flag} className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
                <ShieldAlert className="w-2.5 h-2.5" />{flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationDetailPanel({
  conv,
  accessToken,
  onClose,
  onTakeoverSuccess,
  onReleaseSuccess,
}: ConversationDetailPanelProps) {
  const [detail, setDetail] = useState<AdminConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setDetail(null);
    StaffAccessService.getConversationDetail(conv.id, accessToken)
      .then((d) => { setDetail(d); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [conv.id, accessToken]);

  // Live polling for new incoming user/bot messages while drawer is open
  useEffect(() => {
    let active = true;
    const pollMessages = async () => {
      try {
        const d = await StaffAccessService.getConversationDetail(conv.id, accessToken);
        if (!active) return;
        setDetail((prev) => {
          if (!prev) return d;
          if (
            prev.messages.length !== d.messages.length ||
            prev.is_human_takeover !== d.is_human_takeover ||
            prev.is_escalated !== d.is_escalated
          ) {
            return d;
          }
          return prev;
        });
      } catch {
        // silent background polling
      }
    };

    const interval = setInterval(pollMessages, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [conv.id, accessToken]);

  useEffect(() => {
    if (detail) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail]);

  const handleTakeover = async () => {
    setIsTakingOver(true);
    try {
      await StaffAccessService.takeoverConversation(conv.id, accessToken);
      setDetail((prev) => prev ? { ...prev, is_human_takeover: true, is_escalated: false, interim_ai_active: false } : prev);
      onTakeoverSuccess?.(conv.id);
    } catch (err) {
      logger.error('Failed to take over conversation', err);
    } finally {
      setIsTakingOver(false);
    }
  };

  const handleRelease = async () => {
    setIsReleasing(true);
    try {
      await StaffAccessService.releaseConversation(conv.id, accessToken);
      setDetail((prev) => prev ? { ...prev, is_human_takeover: false, is_escalated: false } : prev);
      onReleaseSuccess?.(conv.id);
    } catch (err) {
      logger.error('Failed to release conversation', err);
    } finally {
      setIsReleasing(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSendingReply) return;
    const text = replyText.trim();
    setIsSendingReply(true);
    try {
      const newMsg = await StaffAccessService.replyToConversation(conv.id, text, accessToken);
      setDetail((prev) => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
      setReplyText('');
    } catch (err) {
      logger.error('Failed to send counselor reply', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {formatUserDisplay(conv.user_nickname, conv.platform)}
              </p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{formatSessionDisplay(conv.session_id)}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {conv.platform && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    conv.platform === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {conv.platform === 'whatsapp' ? 'WhatsApp' : 'Web'}
                  </span>
                )}
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                  {conv.language ?? 'en'}
                </span>
                {/* Status badge */}
                {(() => {
                  const isHumanTakeoverActive = Boolean(detail?.is_human_takeover ?? conv.is_human_takeover);
                  const needsTakeover = Boolean((detail?.is_escalated ?? conv.is_escalated) && !isHumanTakeoverActive);

                  if (isHumanTakeoverActive) {
                    return (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Counselor Active
                      </span>
                    );
                  }
                  if (needsTakeover) {
                    return (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse shadow-sm">
                        <Headphones className="w-3 h-3 text-white" />
                        Takeover Needed
                      </span>
                    );
                  }
                  if (detail?.interim_ai_active) {
                    return (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        Queue Bridge (AI)
                      </span>
                    );
                  }
                  return (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      AI Bot Active
                    </span>
                  );
                })()}
                {(conv.crisis_types ?? []).map((ct) => (
                  <span key={ct} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 capitalize">
                    {ct.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Started {formatDateTime(conv.created_at)} · {conv.message_count} messages
              </p>
            </div>
            <button onClick={onClose} className="flex-shrink-0 ml-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Urgent Takeover Banner if escalated and not yet taken over */}
          {Boolean((detail?.is_escalated ?? conv.is_escalated) && !(detail?.is_human_takeover ?? conv.is_human_takeover)) && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-rose-900 shadow-sm animate-pulse">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-rose-900 flex items-center gap-1.5">
                  Live Counselor Takeover Requested
                </p>
                <p className="text-rose-700 mt-0.5">
                  This user requested to speak with a human counselor or triggered safety triage escalation. Click Take Over Now to start chatting directly.
                </p>
              </div>
            </div>
          )}

          {/* Takeover Control Bar */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            {Boolean(detail?.is_human_takeover ?? conv.is_human_takeover) ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  Live takeover in progress
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRelease}
                  disabled={isReleasing}
                  className="text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-7"
                >
                  {isReleasing ? 'Releasing...' : 'Release to Bot'}
                </Button>
              </div>
            ) : Boolean((detail?.is_escalated ?? conv.is_escalated) && !(detail?.is_human_takeover ?? conv.is_human_takeover)) ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  Live takeover requested
                </span>
                <Button
                  size="sm"
                  onClick={handleTakeover}
                  disabled={isTakingOver}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold h-8 px-3.5 shadow-sm animate-pulse flex items-center gap-1.5"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  {isTakingOver ? 'Taking over...' : 'Take Over Now'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-gray-500">Bot is responding automatically</span>
                <Button
                  size="sm"
                  onClick={handleTakeover}
                  disabled={isTakingOver}
                  className="text-xs bg-[#006d77] hover:bg-[#005a63] text-white font-medium h-7"
                >
                  {isTakingOver ? 'Taking over...' : 'Take Over Chat'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`flex gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                  <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                  <div className={`h-10 rounded-2xl bg-gray-100 animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-sm text-red-500">{error}</div>
          )}

          {detail && detail.messages.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">No messages in this conversation</div>
          )}

          {detail?.messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Counselor Reply Box */}
        {Boolean(detail?.is_human_takeover ?? conv.is_human_takeover) ? (
          <form onSubmit={handleSendReply} className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Send message to ${conv.platform === 'whatsapp' ? 'WhatsApp user' : 'client'} as counselor...`}
              className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006d77] bg-white"
              disabled={isSendingReply}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSendingReply || !replyText.trim()}
              className="bg-[#006d77] hover:bg-[#005a63] text-white text-xs px-3 h-8 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              {isSendingReply ? 'Sending' : 'Send'}
            </Button>
          </form>
        ) : (
          <div className="p-3 border-t border-gray-100 bg-slate-50 text-center text-xs text-gray-500">
            Click <strong className="text-[#006d77] cursor-pointer" onClick={handleTakeover}>Take Over Chat</strong> above to message this client directly.
          </div>
        )}
      </motion.div>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

interface ConversationsPageProps {
  session: StaffSession;
}

export function ConversationsPage({ session }: ConversationsPageProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [analytics, setAnalytics] = useState<any>(null);
  const [convs, setConvs] = useState<AdminConversationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterTab, setFilterTab] = useState<'all' | 'takeover' | 'crisis' | 'normal'>('all');
  const [loading, setLoading] = useState(true);
  const [convLoading, setConvLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<AdminConversationListItem | null>(null);

  const pageSize = 20;

  const fetchConvs = useCallback(async (isInitial = false) => {
    if (isInitial) setConvLoading(true);

    const isEscalatedParam = filterTab === 'takeover' ? true : undefined;
    const isHumanTakeoverParam = filterTab === 'takeover' ? false : undefined;
    const hasCrisisParam = filterTab === 'crisis' ? true : filterTab === 'normal' ? false : undefined;

    try {
      const r = await StaffAccessService.listConversations(
        {
          page,
          page_size: pageSize,
          is_escalated: isEscalatedParam,
          is_human_takeover: isHumanTakeoverParam,
          has_crisis: hasCrisisParam,
        },
        session.accessToken,
      );
      setConvs(r.conversations ?? []);
      setTotal(r.total ?? 0);
    } catch (e) {
      logger.error('conversations polling', e);
    } finally {
      if (isInitial) setConvLoading(false);
    }
  }, [page, filterTab, session.accessToken]);

  // Real-time live conversation refresh (every 4s)
  useEffect(() => {
    void fetchConvs(true);
    const interval = setInterval(() => {
      void fetchConvs(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchConvs]);

  const fetchAnalytics = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const d = await RealAnalyticsService.getAnalyticsSummary({ period }, session.accessToken);
      const normalized = RealAnalyticsService.normalizeAnalyticsSummary(d);
      setAnalytics(normalized);
    } catch (e) {
      logger.error('analytics polling', e);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [period, session.accessToken]);

  // Real-time live analytics refresh (every 12s)
  useEffect(() => {
    void fetchAnalytics(true);
    const interval = setInterval(() => {
      void fetchAnalytics(false);
    }, 12000);

    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const handleTakeoverSuccess = (convId: string) => {
    setConvs((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, is_human_takeover: true, is_escalated: false } : c
      )
    );
    setSelectedConv((prev) =>
      prev && prev.id === convId ? { ...prev, is_human_takeover: true, is_escalated: false } : prev
    );
    void fetchConvs(false);
  };

  const handleReleaseSuccess = (convId: string) => {
    setConvs((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, is_human_takeover: false, is_escalated: false } : c
      )
    );
    setSelectedConv((prev) =>
      prev && prev.id === convId ? { ...prev, is_human_takeover: false, is_escalated: false } : prev
    );
    void fetchConvs(false);
  };

  const totalPages = Math.ceil(total / pageSize);

  const topicData = useMemo(() => {
    const topics = analytics?.engagement?.topics ?? analytics?.engagement?.topicEngagement ?? [];
    return (topics as any[])
      .map((t: any) => ({ name: String(t.topic ?? '').replace(/_/g, ' '), value: Number(t.inquiries ?? t.count ?? 0) }))
      .filter((t) => t.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [analytics]);

  const totalMessages = getNumber(analytics?.summary ?? {}, 'total_messages');
  const messagesInPeriod = getNumber(analytics?.summary ?? {}, 'messages_in_period');
  const convsInPeriod = getNumber(analytics?.summary ?? {}, 'conversations_in_period');
  const avgMsgPerConv = convsInPeriod > 0 ? Math.round(messagesInPeriod / convsInPeriod) : 0;
  const avgResponseMs = getNumber(analytics?.performance ?? {}, 'avgResponseTime');
  const takeoverNeededCount = convs.filter((c) => c.is_escalated && !c.is_human_takeover).length;
  const periodLabel =
    period === 'today' ? 'Today' :
    period === 'week' ? 'This Week' :
    period === 'month' ? 'This Month' :
    period === 'year' ? 'This Year' : 'All Time';

  return (
    <>
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Conversations & Chat</h1>
              <p className="text-sm text-gray-500 mt-0.5">Message volume, topic engagement and conversation log</p>
            </div>
            <div className="flex gap-1 bg-white border border-[#E8ECFF] rounded-lg p-1">
              {([
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
                { id: 'year', label: 'Year' },
                { id: 'all', label: 'All Time' },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setPeriod(id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    period === id ? 'bg-[#BE322D] text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Conversations', value: total.toLocaleString(), icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
            {
              label: 'Takeover Needed',
              value: takeoverNeededCount,
              icon: Headphones,
              color: takeoverNeededCount > 0 ? 'text-rose-600' : 'text-gray-400',
              bg: takeoverNeededCount > 0 ? 'bg-rose-50 border border-rose-200' : 'bg-gray-50',
              highlight: takeoverNeededCount > 0,
            },
            { label: 'Total Messages', value: totalMessages.toLocaleString(), icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: `Messages (${periodLabel})`, value: messagesInPeriod.toLocaleString(), icon: MessageSquare, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Avg Msgs / Conv', value: avgMsgPerConv > 0 ? String(avgMsgPerConv) : 'None', icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className={`p-4 bg-white ${item.highlight ? 'border-rose-300 ring-2 ring-rose-100' : 'border-[#E8ECFF]'}`}>
                {loading ? (
                  <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-14" /></div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${item.bg} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${item.color} ${item.highlight ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                        {item.label}
                        {item.highlight && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                      </p>
                      <p className={`text-xl font-bold ${item.highlight ? 'text-rose-700' : 'text-gray-900'}`}>{item.value}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>


        {/* Conversation Table */}
        <Card className="border-[#E8ECFF] bg-white overflow-hidden">
          <div className="p-5 border-b border-[#E8ECFF] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <h3 className="font-semibold text-gray-900 text-sm">Conversation Log</h3>
              {takeoverNeededCount > 0 && (
                <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[11px] font-bold flex items-center gap-1 animate-pulse">
                  <Headphones className="w-3 h-3 text-rose-600" />
                  {takeoverNeededCount} Need Takeover
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ExportButton
                data={{
                  title: 'Conversation Log',
                  filename: 'conversations',
                  headers: ['User', 'Session ID', 'Started', 'Last Active', 'Messages', 'Language', 'Status'],
                  rows: convs.map((c) => [
                    formatUserDisplay(c.user_nickname, c.platform),
                    formatSessionDisplay(c.session_id),
                    new Date(c.created_at).toLocaleString('en-GB'),
                    new Date(c.last_active_at).toLocaleString('en-GB'),
                    String(c.message_count),
                    c.language ?? 'en',
                    c.ended_at ? 'Ended' : 'Active',
                  ]),
                }}
              />
              {([
                { id: 'all' as const, label: 'All' },
                { id: 'takeover' as const, label: 'Takeover Needed', count: takeoverNeededCount },
                { id: 'crisis' as const, label: 'Crisis' },
                { id: 'normal' as const, label: 'Normal' },
              ]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setFilterTab(opt.id); setPage(1); }}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 ${
                    filterTab === opt.id
                      ? opt.id === 'takeover'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-[#BE322D] text-white border-[#BE322D]'
                      : opt.id === 'takeover' && (opt.count ?? 0) > 0
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.id === 'takeover' && <Headphones className="w-3 h-3" />}
                  {opt.label}
                  {opt.count !== undefined && opt.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      filterTab === opt.id ? 'bg-white text-rose-700' : 'bg-rose-600 text-white animate-pulse'
                    }`}>
                      {opt.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#E8ECFF]">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">User</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Started</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Last Active</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Messages</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Language</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {convLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#E8ECFF]">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-3 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : convs.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No conversations found</td></tr>
                ) : (
                  convs.map((conv) => {
                    const needsTakeover = conv.is_escalated && !conv.is_human_takeover;
                    return (
                      <tr
                        key={conv.id}
                        className={`transition-colors cursor-pointer ${
                          needsTakeover
                            ? 'bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-500 border-b border-rose-100'
                            : conv.is_human_takeover
                            ? 'bg-emerald-50/40 hover:bg-emerald-100/40 border-l-4 border-l-emerald-500 border-b border-emerald-100'
                            : 'border-b border-[#E8ECFF] hover:bg-blue-50/40'
                        }`}
                        onClick={() => setSelectedConv(conv)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold text-gray-900">{formatUserDisplay(conv.user_nickname, conv.platform)}</p>
                            {needsTakeover && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                <Headphones className="w-3 h-3 text-rose-600" />
                                Takeover Needed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 font-mono">{formatSessionDisplay(conv.session_id)}</p>
                          {conv.platform && (
                            <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              conv.platform === 'whatsapp' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {conv.platform === 'whatsapp' ? 'WhatsApp' : 'Web'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          <div>{formatDate(conv.created_at)}</div>
                          <div className="text-gray-400">{formatTime(conv.created_at)}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          <div>{formatDate(conv.last_active_at)}</div>
                          <div className="text-gray-400">{formatTime(conv.last_active_at)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{conv.message_count}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs font-normal capitalize">{conv.language ?? 'en'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {needsTakeover ? (
                              <Badge className="text-xs bg-rose-600 text-white font-bold border-none hover:bg-rose-700 flex items-center gap-1 shadow-sm animate-pulse">
                                <Headphones className="w-3 h-3" />
                                Live Takeover Needed
                              </Badge>
                            ) : conv.is_human_takeover ? (
                              <>
                                <Badge className="text-xs bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Counselor Active
                                </Badge>
                                {(() => {
                                  const inactiveMins = Math.floor((Date.now() - new Date(conv.last_active_at).getTime()) / 60000);
                                  if (inactiveMins >= 7) {
                                    return (
                                      <Badge className="text-[10px] bg-red-100 text-red-700 border-red-300 font-semibold flex items-center gap-1 animate-pulse">
                                        🚨 Inactive {inactiveMins}m (Auto-releasing)
                                      </Badge>
                                    );
                                  }
                                  if (inactiveMins >= 4) {
                                    return (
                                      <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-300 font-medium flex items-center gap-1">
                                        ⚠️ Inactive {inactiveMins}m
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()}
                              </>
                            ) : conv.interim_ai_active ? (
                              <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">
                                Bridge (AI)
                              </Badge>
                            ) : null}
                            {conv.ended_at ? (
                              <Badge className="text-xs bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">Ended</Badge>
                            ) : (
                              <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Active</Badge>
                            )}
                            {(conv.crisis_types ?? []).map((ct) => (
                              <Badge key={ct} className="text-xs bg-red-100 text-red-700 border-red-200 hover:bg-red-100 capitalize">
                                <AlertCircle className="w-3 h-3 mr-1" />{ct.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                            {conv.has_panic && (
                              <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Panic</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#E8ECFF] flex items-center justify-between text-sm">
              <span className="text-gray-500 text-xs">Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-7 w-7 p-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1 text-xs text-gray-600 font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-7 w-7 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>

    {/* Chat detail slide-over */}
    <AnimatePresence>
      {selectedConv && (
        <ConversationDetailPanel
          key={selectedConv.id}
          conv={selectedConv}
          accessToken={session.accessToken}
          onClose={() => setSelectedConv(null)}
          onTakeoverSuccess={handleTakeoverSuccess}
          onReleaseSuccess={handleReleaseSuccess}
        />
      )}
    </AnimatePresence>
    </>
  );
}
