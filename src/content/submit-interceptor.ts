import type { ConfidenceScore } from '../shared/types';
import { isBlocking } from '../shared/confidence';

type BlockCallback = (blockingFields: string[]) => void;

export function attachSubmitInterceptor(
  form: HTMLFormElement,
  getScores: () => Map<string, ConfidenceScore>,
  onBlocked: BlockCallback,
): () => void {
  function handleSubmit(e: Event) {
    const scores = getScores();
    const blocking = Array.from(scores.entries())
      .filter(([, s]) => isBlocking(s))
      .map(([key]) => key);

    if (blocking.length > 0) {
      e.preventDefault();
      e.stopImmediatePropagation();
      onBlocked(blocking);
    }
  }

  form.addEventListener('submit', handleSubmit, { capture: true });
  return () => form.removeEventListener('submit', handleSubmit, { capture: true });
}
