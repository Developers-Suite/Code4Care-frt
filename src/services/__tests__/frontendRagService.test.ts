import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeFrontendRagFallback, generateLocalBrowserRagResponse, retrieveRagContext } from '@/services/frontendRagService';
import { requestChatCompletion } from '@/services/chatbotService';

describe('Frontend RAG Fallback Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves relevant RAG context for contraception and Ghana clinics', () => {
    const rag = retrieveRagContext('Where can I get condoms and emergency contraceptive pills in Ghana?');
    expect(rag.topics.map(t => t.id)).toContain('contraception');
    expect(rag.contextText).toContain('Lydia Contact Center');
    expect(rag.contextText).toContain('1221');
  });

  it('generates a Gen Z styled in-browser local RAG response with emojis', () => {
    const res = generateLocalBrowserRagResponse({
      message: 'What changes happen during puberty for girls?',
      language: 'en',
      session_id: 'test-session-123'
    });

    expect(res.answer).toContain('bestie');
    expect(res.answer).toMatch(/✨|💬|🌿|💡|🙌|❤️/);
    expect(res.citations.length).toBeGreaterThan(0);
    expect(res.session_id).toBe('test-session-123');
  });

  it('handles urgent emergency queries with crisis helplines and safety flags', () => {
    const res = generateLocalBrowserRagResponse({
      message: 'Emergency help needed rape',
      language: 'en',
      session_id: 'urgent-123'
    });

    expect(res.answer).toContain('DOVVSU');
    expect(res.answer).toContain('055-1000-900');
    expect(res.safety_flags.length).toBeGreaterThan(0);
  });

  it('understands a short follow-up from the previous fallback turn', () => {
    const res = generateLocalBrowserRagResponse(
      {
        message: 'yes',
        language: 'en',
        session_id: 'follow-up-123'
      },
      undefined,
      [
        'User: What do you think about using a condom?',
        'Lydia: Condoms are a solid choice. Want me to walk you through how to use one?'
      ]
    );

    expect(res.answer).toContain('check the expiry date');
    expect(res.answer).toContain('use two together');
  });

  it('falls back seamlessly when backend API fails or times out', async () => {
    // Mock global fetch to fail (simulating backend down)
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error: Backend unreachable'));

    const response = await requestChatCompletion({
      message: 'Can I get pregnant during my period?',
      language: 'en',
      session_id: 'fallback-session'
    });

    expect(response.answer).toBeDefined();
    expect(response.answer).toContain('bestie');
    expect(response.citations.length).toBeGreaterThan(0);
  });
});
