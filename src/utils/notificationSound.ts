/**
 * Web Audio API based notification sound synthesizer.
 * Generates a pleasant, crisp two-tone chime without external audio files.
 */

class NotificationSoundEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.audioCtx) {
      this.audioCtx = new AudioContextClass();
    }

    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  /**
   * Play a clean, modern two-tone notification chime (E5 -> A5)
   */
  public playChime() {
    if (this.isSoundMuted()) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      this.createTone(ctx, 659.25, now, 0.18, 0.15);

      // Note 2: A5 (880.00 Hz) slightly louder & longer ring
      this.createTone(ctx, 880.00, now + 0.12, 0.35, 0.22);
    } catch {
      // Audio playback may be suppressed by browser autoplay policy
    }
  }

  private createTone(ctx: AudioContext, freq: number, startTime: number, duration: number, volume: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Smooth envelope: quick attack, exponential decay
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('lydia_staff_sound_muted', muted ? 'true' : 'false');
    } catch {
      // Storage unavailable
    }
  }

  public isSoundMuted(): boolean {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lydia_staff_sound_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    }
    return this.isMuted;
  }
}

export const notificationSound = new NotificationSoundEngine();
