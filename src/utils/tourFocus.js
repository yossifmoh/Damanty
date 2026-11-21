/**
 * Applies smooth background blur to non-focused elements during the interactive guided tour
 * and snaps focused spotlight elements into sharp focus without stacking-context bugs.
 */
export function getTourBlockClass(isFocused, tourActive, withRing = true) {
  if (!tourActive) return '';
  if (isFocused) {
    return withRing
      ? 'blur-0 opacity-100 relative z-20 ring-2 ring-emerald-400/80 shadow-[0_0_28px_rgba(16,185,129,0.28)] transition-all duration-300'
      : 'blur-0 opacity-100 relative z-20 transition-all duration-300';
  }
  return 'blur-[3px] opacity-40 pointer-events-none select-none transition-all duration-300';
}
