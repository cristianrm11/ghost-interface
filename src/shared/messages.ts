import type { ExtensionMessage, ExtensionResponse } from './types';

export function sendToBackground(
  message: ExtensionMessage,
): Promise<ExtensionResponse> {
  return chrome.runtime.sendMessage(message);
}
