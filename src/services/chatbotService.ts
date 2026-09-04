// Clean, Natural Conversational AI Chatbot for SRH - Ghana
import { logger } from "@/utils/logger";
import { executeFrontendRagFallback } from "./frontendRagService";

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export interface UserDemographics {
  ageRange?: string;
  genderIdentity?: string;
  region?: string;
}

export interface ChatApiRequest {
  message: string;
  language: string;
  session_id: string;
}

export type ChatCitation = string | {
  title?: string;
  source?: string;
  excerpt?: string;
  text?: string;
  url?: string;
  page?: string | number;
  [key: string]: unknown;
};

export type SafetyFlag = string | {
  label?: string;
  reason?: string;
  severity?: string;
  message?: string;
  [key: string]: unknown;
};

export interface ChatApiResponse {
  session_id?: string;
  answer: string;
  citations: ChatCitation[];
  safety_flags: SafetyFlag[];
  language_detected: string;
  response_time_ms: number;
}

const CHAT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
const CHAT_ENDPOINT = '/v1/chat';
const BACKEND_TIMEOUT_MS = Number(import.meta.env.VITE_CHAT_TIMEOUT_MS) || 8000;

function buildChatUrl(path: string) {
  if (!CHAT_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required for chat requests.');
  }

  return new URL(path, CHAT_API_BASE_URL).toString();
}

function safeParseJson(value: string) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return value;
  }
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeChatResponse(payload: unknown, defaultLanguage: string): ChatApiResponse {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const answer = typeof record.answer === 'string'
    ? record.answer
    : typeof record.response === 'string'
      ? record.response
      : '';

  return {
    session_id: typeof record.session_id === 'string' ? record.session_id : undefined,
    answer,
    citations: normalizeArray<ChatCitation>(record.citations),
    safety_flags: normalizeArray<SafetyFlag>(record.safety_flags),
    language_detected: typeof record.language_detected === 'string' ? record.language_detected : defaultLanguage,
    response_time_ms: typeof record.response_time_ms === 'number' ? record.response_time_ms : 0,
  };
}

function isBackendBusyResponse(answer: string): boolean {
  const normalizedAnswer = answer.toLowerCase().replace(/\s+/g, ' ').trim();

  return normalizedAnswer.includes('currently busy') &&
    (normalizedAnswer.includes('try again shortly') || normalizedAnswer.includes('wait a moment'));
}

async function postChatCompletion(payload: ChatApiRequest, endpoint: string, timeoutMs: number = BACKEND_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildChatUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const bodyText = await response.text();
  const parsedBody = safeParseJson(bodyText);

  if (parsedBody && typeof parsedBody === 'object') {
    const record = parsedBody as Record<string, unknown>;

    if (typeof record.detail === 'string') {
      return record.detail;
    }

    if (Array.isArray(record.detail)) {
      return record.detail
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return String(item);
          }

          const detail = item as Record<string, unknown>;
          const location = Array.isArray(detail.loc) ? detail.loc.join('.') : '';
          const message = typeof detail.msg === 'string' ? detail.msg : 'Validation error';
          return location ? `${location}: ${message}` : message;
        })
        .join('; ');
    }

    if (typeof record.message === 'string') {
      return record.message;
    }
  }

  return bodyText || response.statusText || 'Chat API request failed';
}

export async function requestChatCompletion(
  payload: ChatApiRequest,
  demographics?: UserDemographics
): Promise<ChatApiResponse> {
  try {
    logger.info('Sending chat request to backend...');
    const response = await postChatCompletion(payload, CHAT_ENDPOINT);

    if (!response.ok) {
      const errorMessage = await readErrorMessage(response);
      throw new Error(`Backend Chat API failed (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    const normalized = normalizeChatResponse(data, payload.language);

    if (!normalized.answer || !normalized.answer.trim()) {
      throw new Error('Backend returned empty answer completion');
    }

    if (isBackendBusyResponse(normalized.answer)) {
      throw new Error('Backend returned a busy placeholder instead of an answer');
    }

    return normalized;
  } catch (error) {
    logger.warn('Backend Chat API failed or timed out. Initiating frontend RAG fallback...', error);
    // Multi-tier Fallback Execution (Option A -> Option B)
    return await executeFrontendRagFallback(payload, demographics);
  }
}

// Comprehensive SRH Knowledge Base (Ghana-Specific)
const knowledge = {
  puberty: {
    keywords: ['puberty', 'pubescent', 'growing up', 'teenager', 'adolescent', 'body changing', 'development', 'voice', 'breast', 'period start', 'mmabunu', 'ɖekakpui', 'changes', 'bodily changes'],
    male: ['boy', 'male', 'guy', 'man', 'penis', 'testicle', 'balls', 'erection', 'wet dream', 'voice deep', 'mmarima', 'ŋutsu'],
    female: ['girl', 'female', 'woman', 'lady', 'breast', 'boobs', 'period', 'menstruat', 'vagina', 'mmaa', 'nyɔnu']
  },
  menstruation: {
    keywords: ['period', 'menstruat', 'monthly', 'cycle', 'bleeding', 'cramp', 'pad', 'tampon', 'pms', 'irregular', 'bosome', 'ɣletiɖoɖo', 'mensuration']
  },
  contraception: {
    keywords: ['contraception', 'birth control', 'condom', 'protection', 'prevent pregnancy', 'pill', 'inject', 'implant', 'iud', 'family planning', 'safe sex', 'awo si ano', 'fuvɔvɔ', 'contraceptive']
  },
  sti: {
    keywords: ['sti', 'std', 'disease', 'infection', 'hiv', 'aids', 'gonorrhea', 'chlamydia', 'syphilis', 'herpes', 'hpv', 'sexually transmitted', 'yadeɛ', 'dɔléle']
  },
  pregnancy: {
    keywords: ['pregnant', 'pregnancy', 'expecting', 'baby', 'conceive', 'prenatal', 'antenatal', 'abortion', 'missed period', 'morning sickness', 'nyinsɛn', 'fufɔfɔ']
  },
  consent: {
    keywords: ['consent', 'permission', 'rape', 'assault', 'abuse', 'force', 'say no', 'uncomfortable', 'pressure', 'relationship', 'boyfriend', 'girlfriend', 'mpene', 'lɔlɔ̃nu', 'age of consent', 'unhealthy']
  },
  mentalHealth: {
    keywords: ['stress', 'depress', 'anxiety', 'sad', 'worried', 'scared', 'mental', 'emotional', 'feeling', 'suicide', 'self harm', 'overwhelm', 'adwene', 'susu']
  },
  clinics: {
    keywords: ['clinic', 'hospital', 'where to go', 'get tested', 'get help', 'ppag', 'marie stopes', 'find clinic', 'near me']
  },
  myths: {
    keywords: ['myth', 'is it true', 'i heard', 'someone said', 'can you get', 'first time', 'condom break']
  }
};

// Ghana-Specific High-Priority Resources
const ghanaResources = {
  en: {
    ppag: "PPAG: 0302-219-038",
    marieStopes: "Marie Stopes Ghana: 0302-234-040",
    dkt: "DKT Ghana: +233 30 277 2799",
    dovvsu: "DOVVSU (Domestic Violence & Victim Support): 055-1000-900",
    mentalHealth: "Mental Health Authority: 050-911-4396",
    emergency: "Emergency: 191 or 112",
    ageOfConsent: "16 years (Ghana law)"
  },
  twi: {
    ppag: "PPAG: 0302-219-038",
    marieStopes: "Marie Stopes Ghana: 0302-234-040",
    dkt: "DKT Ghana: +233 30 277 2799",
    dovvsu: "DOVVSU: 055-1000-900",
    mentalHealth: "Adwene Akwahosan: 050-911-4396",
    emergency: "Ntɛmpɛ Mmoa: 191 anaa 112",
    ageOfConsent: "Mfe 16 (Ghana mmara)"
  },
  ewe: {
    ppag: "PPAG: 0302-219-038",
    marieStopes: "Marie Stopes Ghana: 0302-234-040",
    dkt: "DKT Ghana: +233 30 277 2799",
    dovvsu: "DOVVSU: 055-1000-900",
    mentalHealth: "Susuŋudɔwɔha: 050-911-4396",
    emergency: "Kpakplikpakpli: 191 alo 112",
    ageOfConsent: "Ƒe 16 (Ghana ƒe se)"
  }
};

export class ChatbotSession {
  private history: string[] = [];
  private concerns: string[] = [];
  private depth: number = 0;
  private language: string;
  private demographics?: UserDemographics;

  constructor(language: string = 'en', demographics?: UserDemographics) {
    this.language = language;
    this.demographics = demographics;
  }

  public getResponse(message: string, consultantMode: boolean = false): string {
    try {
      logger.info('Chatbot session processing message:', { message, consultantMode, depth: this.depth });
      this.depth++;
      const understanding = this.understandMessage(message);
      
      if (understanding.isUrgent) return this.handleUrgent();
      if (understanding.isGreeting) return this.handleGreeting();
      if (understanding.topics.length === 0 && !understanding.needsClarification) return this.handleOffTopic();
      if (understanding.needsClarification) return this.askClarification();

      let response = '';
      for (const topic of understanding.topics) {
        response += this.generateTopicResponse(topic);
        response += '\n\n';
      }

      response += this.generateFollowUp();
      
      this.history.push(message);
      this.concerns.push(...understanding.topics);
      
      return response.trim();
    } catch (err) {
      logger.error('Chatbot error:', err);
      return this.getErrorResponse();
    }
  }

  private understandMessage(message: string) {
    const lower = message.toLowerCase();
    const topics: string[] = [];
    let isUrgent = false;
    let needsClarification = false;

    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'akwaaba', 'alo', 'maakye', 'yo'];
    const isGreeting = greetings.some(g => lower.startsWith(g) || lower === g);

    for (const [topic, data] of Object.entries(knowledge)) {
      if (data.keywords.some(kw => lower.includes(kw))) {
        topics.push(topic);
      }
    }

    // Context from history
    if (topics.length === 0 && this.history.length > 0 && this.concerns.length > 0) {
      const followUpIndicators = ['where', 'how', 'when', 'what about', 'tell me more', 'can you explain'];
      if (followUpIndicators.some(indicator => lower.includes(indicator))) {
        topics.push(this.concerns[this.concerns.length - 1]);
      }
    }

    if (lower.match(/\b(urgent|emergency|help me|scared|suicide|rape|abuse)\b/)) {
      isUrgent = true;
    }

    if (message.trim().split(' ').length < 3 && !isGreeting && topics.length === 0) {
      needsClarification = true;
    }

    return { topics, isUrgent, isGreeting, needsClarification };
  }

  private handleGreeting(): string {
    const responses = {
      en: "Hey bestie! I'm here for all your sexual and reproductive health questions, no judgment, no awkward vibes. This chat is private and confidential.\n\nWhat's on your mind today?",
      twi: "Akwaaba! Mewɔ ha sɛ meboa wo wɔ nsɛm a ɛfa nna ne awo ho akwahosan ho. Nea yɛka nyinaa yɛ kokoam.\n\nDɛn na wopɛ sɛ yɛka ho asɛm nnɛ?",
      ewe: "Alo! Mele afisia be makpe ɖe ŋuwò tso lãmesɛ ŋuti. Nu sia nu si míaƒo nu tso eŋu la nye ɣaɣla.\n\nNane pɔtee aɖe li si ŋuti nèdi be yeanya?"
    };
    const baseResponse = (responses as any)[this.language] || responses.en;
    return `${baseResponse}\n\n${this.getDemographicGuidanceIntro()}`;
  }

  private handleUrgent(): string {
    const res = (ghanaResources as any)[this.language] || ghanaResources.en;
    return `Hey bestie, this sounds urgent, so let's get you real support right now. Please contact professional help immediately:\n\nEmergency: ${res.emergency}\nDOVVSU: ${res.dovvsu}\nPPAG: ${res.ppag}\n\nYou are not alone, okay? Please reach out now.`;
  }

  private handleOffTopic(): string {
    return "Hey bestie, I’m mainly here for sexual and reproductive health (SRH) questions, like puberty, periods, contraception, and relationships. No stress if you’re not sure where to start. What’s on your mind?";
  }

  private askClarification(): string {
    return "I’ve got you, bestie. Could you share a little more about what you mean? You can ask about puberty, periods, contraception, relationships, or anything SRH-related.";
  }

  private generateTopicResponse(topic: string): string {
    return `Absolutely, bestie. Let’s talk about ${topic} in a clear, judgment-free way. I’m still building out the detailed guidance for this topic, but you can ask me anything and we’ll take it one step at a time.`;
  }

  private generateFollowUp(): string {
    return `\n\n${this.getDemographicFollowUpPrompt()}`;
  }

  private getDemographicGuidanceIntro(): string {
    const ageLine = this.getAgeToneLine();
    const genderLine = this.getGenderToneLine();

    if (!ageLine && !genderLine) {
      return "I’ll keep things clear, safe, and judgment-free, bestie.";
    }

    return [ageLine, genderLine].filter(Boolean).join(" ");
  }

  private getDemographicFollowUpPrompt(): string {
    const ageRange = this.demographics?.ageRange;
    if (ageRange === '10-14' || ageRange === '15-19') {
      return "Does that make sense, bestie? I can break it down step by step too, no pressure.";
    }

    return "Does that help, bestie? What else would you like to know?";
  }

  private getAgeToneLine(): string {
    const ageRange = this.demographics?.ageRange;
    if (ageRange === '10-14' || ageRange === '15-19') {
      return "I’ll keep things youth-friendly, practical, and easy to follow.";
    }
    if (ageRange === '20-24' || ageRange === '25+') {
      return "I’ll keep things practical, clear, and focused on what helps you.";
    }
    return "";
  }

  private getGenderToneLine(): string {
    const gender = this.demographics?.genderIdentity;
    if (gender === 'female') {
      return "I’ll include guidance relevant to women’s SRH concerns when useful.";
    }
    if (gender === 'male') {
      return "I’ll include guidance relevant to men’s SRH concerns when useful.";
    }
    if (gender === 'non-binary') {
      return "I’ll keep my language inclusive and avoid gender assumptions, always.";
    }
    return "";
  }

  private getErrorResponse(): string {
    const responses = {
      en: "Hey bestie, I’m still with you. Tell me a little more about what’s going on and we’ll work through it together.",
      twi: "Mesrɛ wo, mewɔ mfomsoɔ ketewa bi. Wobɛtumi abisa wo nsɛm no bio?",
      ewe: "Meɖe kuku, vodada sue aɖe dzɔ. Àte ŋu abia wò nyabiase la akea?"
    };
    return (responses as any)[this.language] || responses.en;
  }
}

/**
 * Factory function to create a new session
 */
export function createChatSession(language: string, demographics?: UserDemographics) {
  return new ChatbotSession(language, demographics);
}

/**
 * Legacy support for direct calls (not recommended for persistent chat)
 */
export function getBotResponse(
  message: string,
  language: string = 'en',
  consultantMode: boolean = false,
  demographics?: UserDemographics,
): string {
  const session = new ChatbotSession(language, demographics);
  return session.getResponse(message, consultantMode);
}

export const getFollowUpSuggestions = (language: string = 'en'): string[] => {
  const suggestions = {
    en: ["What changes happen during puberty?", "How do I take care of myself during my period?", "What contraceptives can I use?", "How can I prevent STIs?", "Where can I get help in Ghana?"],
    twi: ["Nsakrae bɛn na ɛba mmabunu mu?", "Sɛnea mɛhwɛ me ho wɔ me bosome bere mu?", "Awo si ano bɛn na metumi de adi dwuma?", "Sɛnea mɛsi yadeɛ ano?", "Ɛhe na metumi anya mmoa wɔ Ghana?"],
    ewe: ["Tɔtrɔ ka dzɔna le ɖekakpui me?", "Alesi malé ɖokuinye ɖo le ɣletiɖoɖo me?", "Fuvɔvɔ ka mate ŋu azã?", "Alesi mate ŋu aɖe dɔlélewo ɖa?", "Afi ka mate ŋu akpɔ kpekpeɖeŋu le Ghana?"]
  };
  return (suggestions as any)[language] || suggestions.en;
};
