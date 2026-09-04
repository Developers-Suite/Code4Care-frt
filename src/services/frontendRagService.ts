import { ChatApiRequest, ChatApiResponse, ChatCitation, SafetyFlag, UserDemographics } from './chatbotService';
import { getMythBusters } from '@/data/mythBustersData';
import { logger } from '@/utils/logger';

// Open Model API configuration
const OPEN_MODEL_API_URL = import.meta.env.VITE_OPEN_MODEL_API_URL?.trim();
const OPEN_MODEL_API_KEY = import.meta.env.VITE_OPEN_MODEL_API_KEY?.trim();
const OPEN_MODEL_NAME = import.meta.env.VITE_OPEN_MODEL_NAME?.trim() || 'llama-3.3-70b-versatile';
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_CHAT_TIMEOUT_MS) || 8000;
const fallbackConversationHistory = new Map<string, string[]>();

function isResponsesApiEndpoint(url: string) {
  return /\/responses\/?$/.test(url);
}

// Knowledge Base Definition for RAG Retrieval
export interface KnowledgeTopic {
  id: string;
  category: string;
  keywords: string[];
  summary: string;
  details: string;
  ghanaSpecifics?: string;
  citations?: string[];
}

const GHANA_SRH_KNOWLEDGE_BASE: KnowledgeTopic[] = [
  {
    id: 'puberty',
    category: 'Puberty & Body Changes',
    keywords: ['puberty', 'pubescent', 'growing up', 'adolescent', 'body changing', 'voice', 'breast', 'period start', 'mmabunu', 'ɖekakpui', 'changes', 'wet dream', 'erection', 'acne', 'body odor'],
    summary: 'Puberty is the natural transition from childhood to adulthood where your body develops and changes.',
    details: 'During puberty, boys and girls undergo major physical and hormonal changes. Boys may experience voice deepening, muscle growth, facial hair, erections, and wet dreams. Girls experience breast development, wider hips, body hair, and the start of menstruation (periods). Emotional changes like mood shifts are also completely normal.',
    ghanaSpecifics: 'You can get confidential, youth-friendly guidance from Lydia Contact Center by calling 1221.',
    citations: ['Lydia Contact Center']
  },
  {
    id: 'menstruation',
    category: 'Menstrual Health & Hygiene',
    keywords: ['period', 'menstruat', 'monthly', 'cycle', 'bleeding', 'cramp', 'pad', 'tampon', 'pms', 'irregular', 'bosome', 'ɣletiɖoɖo', 'mensuration', 'spotting'],
    summary: 'Menstruation (a period) is a normal monthly release of blood and tissue from the uterus.',
    details: 'A normal menstrual cycle lasts between 21 to 35 days. Periods usually last 3 to 7 days. Managing cramps includes drinking warm water, using a warm compress, gentle exercise, or mild pain relievers like ibuprofen. It is essential to change sanitary pads or tampons every 4 to 6 hours to prevent infections. Periods are clean, natural, and nothing to feel ashamed about.',
    ghanaSpecifics: 'For personal guidance about periods or menstrual products, Lydia Contact Center is here for you on 1221.',
    citations: ['Lydia Contact Center']
  },
  {
    id: 'contraception',
    category: 'Contraception & Family Planning',
    keywords: ['contraception', 'birth control', 'condom', 'protection', 'prevent pregnancy', 'pill', 'inject', 'implant', 'iud', 'family planning', 'safe sex', 'awo si ano', 'fuvɔvɔ', 'contraceptive', 'morning after', 'emergency contraception'],
    summary: 'Contraception protects against unintended pregnancy and, in the case of condoms, against STIs.',
    details: 'Options include barrier methods (male and female condoms), hormonal methods (daily pills, 3-month injections like Depo-Provera, 3-5 year implants like Norplant/Jadelle), and emergency contraceptive pills (ECP, effective within 72-120 hours after unprotected sex). Male and female condoms are the ONLY method that protects against BOTH pregnancy and STIs.',
    ghanaSpecifics: 'For confidential guidance about contraception and product access, talk with Lydia Contact Center on 1221.',
    citations: ['Lydia Contact Center']
  },
  {
    id: 'sti',
    category: 'STIs & HIV Prevention',
    keywords: ['sti', 'std', 'disease', 'infection', 'hiv', 'aids', 'gonorrhea', 'chlamydia', 'syphilis', 'herpes', 'hpv', 'sexually transmitted', 'yadeɛ', 'dɔléle', 'discharge', 'burning', 'itching'],
    summary: 'Sexually Transmitted Infections (STIs) are infections passed through sexual contact.',
    details: 'Common STIs include Chlamydia, Gonorrhea, Syphilis, HPV, Herpes, and HIV. Many STIs show NO symptoms early on, which is why regular testing is vital. Symptoms when present include unusual discharge, painful urination, genital sores, or itching. Bacterial STIs are curable with antibiotics from a healthcare provider. Viral STIs like HIV can be managed effectively with antiretroviral therapy (ART). Condoms used correctly every time drastically reduce STI risk.',
    ghanaSpecifics: 'Lydia Contact Center can help you understand your next steps and connect you with appropriate care on 1221.',
    citations: ['Lydia Contact Center']
  },
  {
    id: 'pregnancy',
    category: 'Pregnancy & Maternal Health',
    keywords: ['pregnant', 'pregnancy', 'expecting', 'baby', 'conceive', 'prenatal', 'antenatal', 'abortion', 'missed period', 'morning sickness', 'nyinsɛn', 'fufɔfɔ', 'test'],
    summary: 'Pregnancy occurs when a fertilized egg implants in the uterus after unprotected intercourse.',
    details: 'Early signs of pregnancy include a missed period, morning nausea, breast tenderness, fatigue, and frequent urination. Pregnancy test kits are available at all pharmacies and give accurate results 14 days after sex or from the first day of a missed period. Antenatal care (ANC) should start as soon as pregnancy is confirmed to protect both mother and baby.',
    ghanaSpecifics: 'Ghana National Health Insurance Scheme (NHIS) covers free Maternal Health Care Services, including antenatal visits, delivery, and postnatal care.',
    citations: ['Ghana NHIS Free Maternal Care Scheme', 'Ministry of Health Ghana']
  },
  {
    id: 'consent',
    category: 'Consent, Rights & Relationships',
    keywords: ['consent', 'permission', 'rape', 'assault', 'abuse', 'force', 'say no', 'uncomfortable', 'pressure', 'relationship', 'boyfriend', 'girlfriend', 'mpene', 'lɔlɔ̃nu', 'age of consent', 'unhealthy', 'boundaries'],
    summary: 'Consent means a clear, voluntary, enthusiast, and continuous agreement to participate in sexual activity.',
    details: 'Consent cannot be given if someone is drunk, asleep, under pressure, or forced. You have the right to change your mind and say NO at any time, no matter your past relationship or agreement. In Ghana, the legal age of consent is 16 years. Sexual violence, forced intercourse, or harassment is illegal and punishable under Ghanaian law.',
    ghanaSpecifics: 'If you feel unsafe or someone has hurt or pressured you, contact Lydia Contact Center on 1221 for confidential support and guidance.',
    citations: ['Lydia Contact Center']
  },
  {
    id: 'mentalHealth',
    category: 'Mental Health & Emotional Well-being',
    keywords: ['stress', 'depress', 'anxiety', 'sad', 'worried', 'scared', 'mental', 'emotional', 'feeling', 'suicide', 'self harm', 'overwhelm', 'adwene', 'susu', 'lonely'],
    summary: 'Mental health encompasses your emotional, psychological, and social well-being.',
    details: 'Feeling overwhelmed, anxious, or down is common, especially during adolescence and young adulthood. Reaching out for support is a sign of strength. Helpful coping strategies include talking to a trusted peer, counselor, journaling, deep breathing exercises, and taking breaks from social media.',
    ghanaSpecifics: 'If things feel overwhelming, contact Lydia Contact Center on 1221 for confidential support and help figuring out your next step.',
    citations: ['Lydia Contact Center']
  },
  {
    id: 'clinics',
    category: 'Youth-Friendly Clinics & Services in Ghana',
    keywords: ['clinic', 'hospital', 'where to go', 'get tested', 'get help', 'find clinic', 'near me'],
    summary: 'Access youth-friendly, confidential sexual health services across Ghana.',
    details: 'Lydia Contact Center can help you find confidential, youth-friendly SRH support. Call 1221 and explain what you need; you will be met with care and no judgment.',
    ghanaSpecifics: 'Lydia Contact Center is available to help you figure out the right next step.',
    citations: ['Lydia Contact Center']
  }
];

/**
 * Retrieve relevant knowledge topics based on user message keywords and intent
 */
export function retrieveRagContext(userMessage: string, language: string = 'en'): {
  contextText: string;
  citations: ChatCitation[];
  topics: KnowledgeTopic[];
  isUrgent: boolean;
  safetyFlags: SafetyFlag[];
} {
  const lowerMessage = userMessage.toLowerCase();
  const matchedTopics: KnowledgeTopic[] = [];
  const citations: ChatCitation[] = [];
  const safetyFlags: SafetyFlag[] = [];

  // Emergency / Urgent keywords check
  const urgentKeywords = ['urgent', 'emergency', 'suicide', 'self harm', 'rape', 'assault', 'abuse', 'forced', 'poison'];
  const isUrgent = urgentKeywords.some(kw => lowerMessage.includes(kw));

  if (isUrgent) {
    safetyFlags.push({
      label: 'URGENT_SAFETY_ALERT',
      severity: 'CRITICAL',
      message: 'Urgent situation or safety concern detected in message',
    });
  }

  // Keyword match against GHANA_SRH_KNOWLEDGE_BASE
  for (const topic of GHANA_SRH_KNOWLEDGE_BASE) {
    if (topic.keywords.some(kw => lowerMessage.includes(kw))) {
      matchedTopics.push(topic);
      if (topic.citations) {
        citations.push(...topic.citations);
      }
    }
  }

  // Also check mythbusters
  const myths = getMythBusters(language);
  const matchedMyths = myths.filter(m =>
    lowerMessage.includes(m.category.toLowerCase()) ||
    m.myth.toLowerCase().split(' ').some(word => word.length > 4 && lowerMessage.includes(word))
  );

  let contextText = '';

  if (matchedTopics.length > 0) {
    contextText += '--- RELEVANT GHANA SRH KNOWLEDGE ---\n';
    matchedTopics.forEach(t => {
      contextText += `Topic: ${t.category}\nSummary: ${t.summary}\nDetails: ${t.details}\nGhana Context: ${t.ghanaSpecifics || 'N/A'}\n\n`;
    });
  }

  if (matchedMyths.length > 0) {
    contextText += '--- MYTH VS FACT GUIDANCE ---\n';
    matchedMyths.slice(0, 2).forEach(m => {
      contextText += `Myth: "${m.myth}"\nFact: "${m.fact}" (Source: ${m.source})\n\n`;
    });
  }

  if (!contextText) {
    // Default fallback context
    contextText = 'Provide safe, non-judgmental, youth-friendly Sexual and Reproductive Health information. Keep the answer conversational and invite the user to call Lydia Contact Center on 1221 for confidential support when they need personal guidance.';
  }

  return {
    contextText,
    citations: Array.from(new Set(citations)),
    topics: matchedTopics,
    isUrgent,
    safetyFlags,
  };
}

/**
 * Option A: Call Open Model API (e.g. Groq, OpenRouter, OpenAI-compatible endpoint)
 */
export async function generateOpenModelResponse(
  request: ChatApiRequest,
  demographics?: UserDemographics,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  conversationHistory: string[] = []
): Promise<ChatApiResponse> {
  const startTime = Date.now();
  const ragResult = retrieveRagContext(request.message, request.language);

  if (!OPEN_MODEL_API_URL) {
    throw new Error('VITE_OPEN_MODEL_API_URL is not configured');
  }

  const systemPrompt = `You are Lydia, a supportive, relatable Gen Z youth-conversational peer AI assistant for Sexual and Reproductive Health (SRH) in Ghana.

YOUR PERSONALITY & TONE:
- Energetic, warm, peer-to-peer Gen Z vibe. Use terms like "bestie", "no cap", "I got you", "real talk", "vibe" naturally.
- Include expressive, friendly emojis in every response (e.g. 💬, ✨, 🌿, 💡, 🛡️, ❤️, 🌟, 🙌).
- Absolutely zero judgment, zero shame, pure safety and encouragement.
- Ghana-centric: refer users to Lydia Contact Center and its 1221 hotline when they need personal support.
- User Age: ${demographics?.ageRange || 'youth'}, Gender: ${demographics?.genderIdentity || 'unspecified'}, Region: ${demographics?.region || 'Ghana'}.

YOUR RESPONSE RULES:
1. Base your factual answers STRICTLY on the SRH context provided below.
2. If the user query is urgent or involves rape/abuse/self-harm, encourage the user to call Lydia Contact Center on 1221 immediately. For emergency sexual violence support, you may also mention DOVVSU (055-1000-900). Mention DKT only when the user needs urgent contraceptive product support.
3. Keep the response conversational, warm, and easy to read. Do not write it like a report or resource document.
4. Always wrap up with a caring Gen Z follow-up question.
5. Do not say you are unavailable, ask the user to wait or try again later, or add a generic medical disclaimer. Answer the user's question directly using the context.

CONTEXT FOR THIS QUERY:
${ragResult.contextText}

RECENT CONVERSATION:
${conversationHistory.length > 0 ? conversationHistory.join('\n') : 'No previous fallback conversation.'}
Use the recent conversation to understand short follow-ups like "yes", "okay", or "tell me more". Do not repeat the entire knowledge context when a brief, direct reply will answer the user.`;

  const payload = isResponsesApiEndpoint(OPEN_MODEL_API_URL)
    ? {
        model: OPEN_MODEL_NAME,
        instructions: systemPrompt,
        input: request.message,
        temperature: 0.7,
        max_output_tokens: 600,
      }
    : {
        model: OPEN_MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.message }
        ],
        temperature: 0.7,
        max_tokens: 600,
      };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (OPEN_MODEL_API_KEY) {
      headers['Authorization'] = `Bearer ${OPEN_MODEL_API_KEY}`;
    }

    const response = await fetch(OPEN_MODEL_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open Model API returned status ${response.status}`);
    }

    const data = await response.json();
    const answer = isResponsesApiEndpoint(OPEN_MODEL_API_URL)
      ? (typeof data?.output_text === 'string'
        ? data.output_text.trim()
        : data?.output
          ?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || [])
          ?.map((item: { text?: string }) => item.text || '')
          ?.join('')
          ?.trim())
      : data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error('Open Model API returned empty completion text');
    }

    return {
      session_id: request.session_id,
      answer,
      citations: ragResult.citations,
      safety_flags: ragResult.safetyFlags,
      language_detected: request.language || 'en',
      response_time_ms: Date.now() - startTime,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    logger.error('Open Model API request failed or timed out:', err);
    throw err;
  }
}

/**
 * Option B: In-Browser Local RAG Generator (Offline / Ultimate Fallback)
 * Formats a rich, Gen Z conversational response with emojis directly in the client.
 */
export function generateLocalBrowserRagResponse(
  request: ChatApiRequest,
  demographics?: UserDemographics,
  conversationHistory: string[] = []
): ChatApiResponse {
  const startTime = Date.now();
  const ragResult = retrieveRagContext(request.message, request.language);
  const lowerMsg = request.message.toLowerCase();
  const previousConversation = conversationHistory.join(' ').toLowerCase();
  const isAffirmativeFollowUp = /^(yes|yeah|yep|okay|ok|sure|please|yup|go ahead|tell me more)[.!?\s]*$/.test(lowerMsg);
  const isCondomQuestion = /\b(condom|condoms)\b/.test(lowerMsg) ||
    (isAffirmativeFollowUp && /\b(condom|condoms)\b/.test(previousConversation));
  const isCondomHowToFollowUp = isCondomQuestion &&
    (/\b(how|use|walk me through|steps|put it on)\b/.test(lowerMsg) || isAffirmativeFollowUp);
  const isCondomEmergency = /\b(broke|break|tore|torn|slipped|split|burst|unprotected)\b/.test(lowerMsg);

  let answer = '';

  // 1. Handle Critical / Urgent Cases
  if (ragResult.isUrgent) {
    answer = `Hey bestie ❤️, I hear you, and your safety is the #1 priority right now. You are not alone, and you do not have to handle this by yourself. Please call Lydia Contact Center on 1221 now for confidential support and guidance. For urgent sexual violence support, DOVVSU is available on 055-1000-900. If this is about urgent contraceptive product support, DKT Ghana can help on +233 30 277 2799. I got you, okay? 🛡️✨`;
  }
  // 2. Greetings
  else if (lowerMsg.match(/\b(hi|hello|hey|akwaaba|hola|maakye|good morning|good afternoon|good evening)\b/)) {
    const greetings = {
      en: `Hey bestie! ✨ Welcome to your safe, confidential SRH space. No judgment, no awkward vibes here—just real talk about puberty, periods, safe sex, contraception, and relationships 💬🌿.\n\nWhat's on your mind today? Ask me anything! 🙌`,
      twi: `Akwaaba bestie! ✨ Woeɔ ha wɔ baabi a wotumi bisa nsɛm a ɛfa wo ho akwahosan ne nna ho a obiara mbu wo atɛn 💬🌿.\n\nDɛn na wopɛ sɛ yɛka ho asɛm nnɛ?`,
      ewe: `Alo bestie! ✨ Míele afisia be míakpɔ kpekpeɖeŋu le lãmesɛ ne aɖaŋuɖoɖo nyuiwo ŋu 💬🌿.\n\nNukata nèdi be yáfo nu tso eŋu egbe?`
    };
    answer = (greetings as Record<string, string>)[request.language] || greetings.en;
  }
  // 3. Give condom questions a direct, practical answer instead of the full topic summary.
  else if (isCondomQuestion) {
    if (isCondomEmergency) {
      answer = `Hey bestie, no panic. If the condom broke, slipped, or you had sex without one, call Lydia Contact Center on 1221 as soon as you can for confidential next steps. They can talk you through emergency contraception, STI testing, and what to do next. If you were pressured or harmed, DOVVSU is available on 055-1000-900 too. ❤️`;
    } else if (isCondomHowToFollowUp) {
      answer = `Absolutely, bestie. Here’s the quick version: check the expiry date, open the packet carefully, and make sure the condom is the right way up. Pinch the tip, roll it all the way down before any genital contact, and hold the base while pulling out. Then tie it up and put it in the bin, not the toilet. Use a fresh one every time, and never use two together. 💛\n\nWant me to explain anything about choosing the right size or using lube?`;
    } else {
      answer = `Honestly, bestie? Condoms are a really solid choice. They help prevent pregnancy and are the only contraceptive that also helps protect against STIs. 💛\n\nUse a new one every time, check the expiry date, and put it on before any genital contact. Don’t use two at once, and add water- or silicone-based lube if you need it.\n\nWant me to walk you through how to use one, or are you choosing between condoms and another option?`;
    }
  }
  // 4. Matched Knowledge Topics
  else if (ragResult.topics.length > 0) {
    const primaryTopic = ragResult.topics[0];
    answer = `Hey bestie! 💬 Let's dive into **${primaryTopic.category}**—no cap, knowledge is power! ✨\n\n`;
    answer += `${primaryTopic.details}\n\n`;

    if (primaryTopic.ghanaSpecifics) {
      answer += `${primaryTopic.ghanaSpecifics}\n\n`;
    }

    answer += `Lydia Contact Center is also here on 1221 if you want to talk it through with someone. Does that make sense, bestie? 🙌✨`;
  }
  // 5. Default Guidance if topic is general or unknown
  else {
    answer = `I got you, bestie! 🌿 Real talk: I'm here for all your sexual & reproductive health questions—from puberty changes, period tracking, and contraceptive options to STI safety, relationship boundaries, and mental wellness 💬✨.\n\n` +
      `Could you give me a few more details about what’s going on? And if you’d rather talk it through, Lydia Contact Center is available on **1221** for confidential guidance.\n\n` +
      `What would you like to chat about next? 😊`;
  }

  // Adjust for youth demographics tone if available
  if (demographics?.ageRange === '10-14' || demographics?.ageRange === '15-19') {
    answer += `\n\n*(Remember bestie, taking care of your body is your power! 🌟)*`;
  }

  return {
    session_id: request.session_id,
    answer,
    citations: ragResult.citations.length > 0 ? ragResult.citations : ['Lydia Contact Center'],
    safety_flags: ragResult.safetyFlags,
    language_detected: request.language || 'en',
    response_time_ms: Date.now() - startTime,
  };
}

/**
 * Execute Multi-Tier Frontend RAG Fallback Chain:
 * 1. Attempt Option A (Open Model API) if configured.
 * 2. If Option A fails, is unconfigured, or times out -> Failover to Option B (In-Browser RAG Generator).
 */
export async function executeFrontendRagFallback(
  request: ChatApiRequest,
  demographics?: UserDemographics
): Promise<ChatApiResponse> {
  logger.info('Executing Frontend RAG Fallback sequence...');
  const conversationHistory = fallbackConversationHistory.get(request.session_id) || [];

  const rememberFallbackTurn = (response: ChatApiResponse) => {
    const updatedHistory = [
      ...conversationHistory,
      `User: ${request.message}`,
      `Lydia: ${response.answer}`,
    ].slice(-8);
    fallbackConversationHistory.set(request.session_id, updatedHistory);
    return response;
  };

  // Try Option A (Open Model API)
  if (OPEN_MODEL_API_URL) {
    try {
      logger.info('Attempting Option A: Open Model API generation...');
      return rememberFallbackTurn(await generateOpenModelResponse(request, demographics, DEFAULT_TIMEOUT_MS, conversationHistory));
    } catch (openModelError) {
      logger.warn('Option A (Open Model API) failed, falling back to Option B (Local Browser RAG):', openModelError);
    }
  } else {
    logger.info('Option A (Open Model API) not configured (VITE_OPEN_MODEL_API_URL missing). Using Option B.');
  }

  // Option B (In-Browser Local RAG Engine)
  logger.info('Executing Option B: In-Browser Local RAG Engine...');
  return rememberFallbackTurn(generateLocalBrowserRagResponse(request, demographics, conversationHistory));
}
