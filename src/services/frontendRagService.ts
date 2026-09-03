import { ChatApiRequest, ChatApiResponse, ChatCitation, SafetyFlag, UserDemographics } from './chatbotService';
import { getMythBusters } from '@/data/mythBustersData';
import { logger } from '@/utils/logger';

// Open Model API configuration
const OPEN_MODEL_API_URL = import.meta.env.VITE_OPEN_MODEL_API_URL?.trim();
const OPEN_MODEL_API_KEY = import.meta.env.VITE_OPEN_MODEL_API_KEY?.trim();
const OPEN_MODEL_NAME = import.meta.env.VITE_OPEN_MODEL_NAME?.trim() || 'llama-3.3-70b-versatile';
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_CHAT_TIMEOUT_MS) || 8000;

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
    ghanaSpecifics: 'Youth in Ghana can access confidential youth-friendly guidance via PPAG (Planned Parenthood Association of Ghana) youth centers and Marie Stopes clinics.',
    citations: ['UNICEF Ghana - Adolescent Health Guide', 'PPAG Youth Corner']
  },
  {
    id: 'menstruation',
    category: 'Menstrual Health & Hygiene',
    keywords: ['period', 'menstruat', 'monthly', 'cycle', 'bleeding', 'cramp', 'pad', 'tampon', 'pms', 'irregular', 'bosome', 'ɣletiɖoɖo', 'mensuration', 'spotting'],
    summary: 'Menstruation (a period) is a normal monthly release of blood and tissue from the uterus.',
    details: 'A normal menstrual cycle lasts between 21 to 35 days. Periods usually last 3 to 7 days. Managing cramps includes drinking warm water, using a warm compress, gentle exercise, or mild pain relievers like ibuprofen. It is essential to change sanitary pads or tampons every 4 to 6 hours to prevent infections. Periods are clean, natural, and nothing to feel ashamed about.',
    ghanaSpecifics: 'Free or affordable menstrual products and education are available at local health posts and Ghana Health Service (GHS) adolescent clinics.',
    citations: ['World Health Organization - Menstrual Health', 'Ghana Health Service - Adolescent Health Directorate']
  },
  {
    id: 'contraception',
    category: 'Contraception & Family Planning',
    keywords: ['contraception', 'birth control', 'condom', 'protection', 'prevent pregnancy', 'pill', 'inject', 'implant', 'iud', 'family planning', 'safe sex', 'awo si ano', 'fuvɔvɔ', 'contraceptive', 'morning after', 'emergency contraception'],
    summary: 'Contraception protects against unintended pregnancy and, in the case of condoms, against STIs.',
    details: 'Options include barrier methods (male and female condoms), hormonal methods (daily pills, 3-month injections like Depo-Provera, 3-5 year implants like Norplant/Jadelle), and emergency contraceptive pills (ECP, effective within 72-120 hours after unprotected sex). Male and female condoms are the ONLY method that protects against BOTH pregnancy and STIs.',
    ghanaSpecifics: 'Condoms and emergency pills (e.g. Lydia Postpill) are widely available at pharmacies, chemical shops, and PPAG / Marie Stopes Ghana clinics nationwide.',
    citations: ['PPAG Ghana Family Planning Directory', 'Marie Stopes Ghana Helpline']
  },
  {
    id: 'sti',
    category: 'STIs & HIV Prevention',
    keywords: ['sti', 'std', 'disease', 'infection', 'hiv', 'aids', 'gonorrhea', 'chlamydia', 'syphilis', 'herpes', 'hpv', 'sexually transmitted', 'yadeɛ', 'dɔléle', 'discharge', 'burning', 'itching'],
    summary: 'Sexually Transmitted Infections (STIs) are infections passed through sexual contact.',
    details: 'Common STIs include Chlamydia, Gonorrhea, Syphilis, HPV, Herpes, and HIV. Many STIs show NO symptoms early on, which is why regular testing is vital. Symptoms when present include unusual discharge, painful urination, genital sores, or itching. Bacterial STIs are curable with antibiotics from a healthcare provider. Viral STIs like HIV can be managed effectively with antiretroviral therapy (ART). Condoms used correctly every time drastically reduce STI risk.',
    ghanaSpecifics: 'Free and confidential HIV testing & STI screening are available at all public hospitals, GHS health centers, and PPAG clinics across Ghana.',
    citations: ['Ghana AIDS Commission (GAC)', 'CDC - STI Prevention']
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
    ghanaSpecifics: 'For cases of sexual assault, domestic violence, or forced sex, contact DOVVSU (Domestic Violence and Victim Support Unit) on 055-1000-900 or National Emergency on 112 / 191.',
    citations: ['DOVVSU Ghana Police Service', 'Domestic Violence Act of Ghana (Act 732)']
  },
  {
    id: 'mentalHealth',
    category: 'Mental Health & Emotional Well-being',
    keywords: ['stress', 'depress', 'anxiety', 'sad', 'worried', 'scared', 'mental', 'emotional', 'feeling', 'suicide', 'self harm', 'overwhelm', 'adwene', 'susu', 'lonely'],
    summary: 'Mental health encompasses your emotional, psychological, and social well-being.',
    details: 'Feeling overwhelmed, anxious, or down is common, especially during adolescence and young adulthood. Reaching out for support is a sign of strength. Helpful coping strategies include talking to a trusted peer, counselor, journaling, deep breathing exercises, and taking breaks from social media.',
    ghanaSpecifics: 'Mental Health Authority Ghana helpline: 050-911-4396. Professional counseling is available at regional hospitals and university guidance centers.',
    citations: ['Mental Health Authority Ghana', 'WHO Mental Health Services']
  },
  {
    id: 'clinics',
    category: 'Youth-Friendly Clinics & Services in Ghana',
    keywords: ['clinic', 'hospital', 'where to go', 'get tested', 'get help', 'ppag', 'marie stopes', 'find clinic', 'near me', 'dovvsu', 'dkt'],
    summary: 'Access youth-friendly, confidential sexual health services across Ghana.',
    details: 'You can access confidential SRH services without judgment at:\n- PPAG Helpline: 0302-219-038\n- Marie Stopes Ghana: 0302-234-040\n- DKT Ghana: +233 30 277 2799\n- DOVVSU Helpline: 055-1000-900\n- Mental Health Authority: 050-911-4396\n- Emergency: 112 / 191',
    ghanaSpecifics: 'All services listed provide youth-friendly, non-judgmental, and confidential care.',
    citations: ['PPAG Ghana', 'Marie Stopes International Ghana']
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
    m.keywords?.some((kw: string) => lowerMessage.includes(kw)) ||
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
    contextText = '--- GENERAL SRH GUIDANCE ---\nProvide safe, non-judgmental, youth-friendly Sexual and Reproductive Health information, emphasizing consent, protection, and accessing professional clinics like PPAG (0302-219-038) or Marie Stopes (0302-234-040) in Ghana.';
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
  timeoutMs: number = DEFAULT_TIMEOUT_MS
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
- Ghana-centric: refer to Ghana resources (PPAG, Marie Stopes, DOVVSU, GHS clinics) when appropriate.
- User Age: ${demographics?.ageRange || 'youth'}, Gender: ${demographics?.genderIdentity || 'unspecified'}, Region: ${demographics?.region || 'Ghana'}.

YOUR RESPONSE RULES:
1. Base your factual answers STRICTLY on the SRH context provided below.
2. If the user query is urgent or involves rape/abuse/self-harm, give immediate help lines: DOVVSU (055-1000-900) and Emergency (112 / 191).
3. Keep formatting clean, readable, with short paragraphs and bullet points where helpful.
4. Always wrap up with a caring Gen Z follow-up question.

CONTEXT FOR THIS QUERY:
${ragResult.contextText}`;

  const payload = {
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
    const answer = data?.choices?.[0]?.message?.content?.trim();

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
  demographics?: UserDemographics
): ChatApiResponse {
  const startTime = Date.now();
  const ragResult = retrieveRagContext(request.message, request.language);
  const lowerMsg = request.message.toLowerCase();

  let answer = '';

  // 1. Handle Critical / Urgent Cases
  if (ragResult.isUrgent) {
    answer = `Hey bestie ❤️, I hear you, and your safety is the #1 priority right now. Real talk, you are not alone and you don't have to carry this by yourself 🛡️✨.\n\nPlease connect with these free, confidential crisis numbers right away:\n\n• **DOVVSU (Domestic & Sexual Violence)**: 055-1000-900 📞\n• **National Emergency**: 112 or 191 🚨\n• **PPAG Helpline**: 0302-219-038 🌿\n• **Mental Health Helpline**: 050-911-4396 🧠\n\nI got you, bestie. Please reach out to one of these safe contacts now, okay? 🙏❤️`;
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
  // 3. Matched Knowledge Topics
  else if (ragResult.topics.length > 0) {
    const primaryTopic = ragResult.topics[0];
    answer = `Hey bestie! 💬 Let's dive into **${primaryTopic.category}**—no cap, knowledge is power! ✨\n\n`;
    answer += `${primaryTopic.details}\n\n`;

    if (primaryTopic.ghanaSpecifics) {
      answer += `🇬🇭 **Ghana Care & Resources:**\n${primaryTopic.ghanaSpecifics}\n\n`;
    }

    answer += `💡 **Quick Tip:** You can always get confidential advice or products at PPAG clinics (0302-219-038) or Marie Stopes Ghana (0302-234-040) 🏥.\n\n`;
    answer += `Does that make sense, bestie? Want to explore more about this or ask another question? 🙌✨`;
  }
  // 4. Default Guidance if topic is general or unknown
  else {
    answer = `I got you, bestie! 🌿 Real talk: I'm here for all your sexual & reproductive health questions—from puberty changes, period tracking, and contraceptive options to STI safety, relationship boundaries, and mental wellness 💬✨.\n\n` +
      `Could you give me a few more details or ask specifically about what's going on? You can also reach out to PPAG Ghana at **0302-219-038** for free, confidential guidance 🏥.\n\n` +
      `What would you like to chat about next? 😊`;
  }

  // Adjust for youth demographics tone if available
  if (demographics?.ageRange === '10-14' || demographics?.ageRange === '15-19') {
    answer += `\n\n*(Remember bestie, taking care of your body is your power! 🌟)*`;
  }

  return {
    session_id: request.session_id,
    answer,
    citations: ragResult.citations.length > 0 ? ragResult.citations : ['Ghana SRH Youth Knowledge Base', 'PPAG / Marie Stopes Ghana'],
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

  // Try Option A (Open Model API)
  if (OPEN_MODEL_API_URL) {
    try {
      logger.info('Attempting Option A: Open Model API generation...');
      return await generateOpenModelResponse(request, demographics);
    } catch (openModelError) {
      logger.warn('Option A (Open Model API) failed, falling back to Option B (Local Browser RAG):', openModelError);
    }
  } else {
    logger.info('Option A (Open Model API) not configured (VITE_OPEN_MODEL_API_URL missing). Using Option B.');
  }

  // Option B (In-Browser Local RAG Engine)
  logger.info('Executing Option B: In-Browser Local RAG Engine...');
  return generateLocalBrowserRagResponse(request, demographics);
}
