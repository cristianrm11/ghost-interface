import type { ExtensionMessage, ExtensionResponse, UserProfile } from '../shared/types';

const PROFILE_KEY = 'ghost_profile';
const API_KEY_KEY = 'ghost_api_key';

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse: (r: ExtensionResponse) => void) => {
    // Only accept messages from this extension's own scripts
    if (sender.id !== chrome.runtime.id) return false;
    handleMessage(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ type: 'ERROR', message: String(err) }));
    return true; // keep channel open for async response
  },
);

async function handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  switch (message.type) {
    case 'GET_PROFILE': {
      const result = await chrome.storage.local.get(PROFILE_KEY);
      return { type: 'PROFILE', data: (result[PROFILE_KEY] as UserProfile) ?? null };
    }
    case 'SET_PROFILE': {
      await chrome.storage.local.set({ [PROFILE_KEY]: message.payload });
      return { type: 'PROFILE_SAVED' };
    }
    case 'GENERATE_OPEN_ENDED': {
      const { payload } = message;
      if (payload.variant !== 'detailed') {
        return { type: 'ERROR', message: 'Only detailed variant requires API call' };
      }
      try {
        const text = await generateDetailed(payload.question, payload.company, payload.role, payload.profileSummary);
        return { type: 'OPEN_ENDED_TEXT', text };
      } catch (err) {
        return { type: 'ERROR', message: String(err) };
      }
    }
    case 'LOG_DECISION': {
      const result = await chrome.storage.local.get('ghost_decisions');
      const log: unknown[] = (result['ghost_decisions'] as unknown[]) ?? [];
      // Limit individual payload size to prevent storage bloat
      const entry = JSON.stringify(message.payload).length < 4096 ? message.payload : null;
      if (entry) log.push(entry);
      if (log.length > 500) log.splice(0, log.length - 500);
      await chrome.storage.local.set({ ghost_decisions: log });
      return { type: 'DECISION_LOGGED' };
    }
    default:
      return { type: 'ERROR', message: 'Unknown message type' };
  }
}

async function generateDetailed(
  question: string,
  company: string,
  role: string,
  profileSummary: string,
): Promise<string> {
  const stored = await chrome.storage.local.get(API_KEY_KEY);
  const apiKey = stored[API_KEY_KEY] as string | undefined;
  if (!apiKey) throw new Error('Anthropic API key not set. Add it in the Ghost Interface popup.');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `You are helping a job applicant answer this question for ${company} (role: ${role}).

Question: "${question}"

Applicant profile: ${profileSummary}

Write a genuine, specific 3-4 paragraph answer. No filler phrases. Sound human.`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json() as { content: { text: string }[] };
  return data.content[0]?.text ?? '';
}
