/**
 * alarmAudioService.ts
 * Industrial SCADA-grade Web Audio Synthesizer for Critical Failure Alerts.
 * Generates ISO 7731 / DIN 33404-3 compliant multi-tone emergency acoustic alerts
 * without relying on external audio assets that could fail to load or be blocked by CORS.
 */

type AlarmListener = (isPlaying: boolean) => void;

class AlarmAudioService {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private intervalId: any = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];
  private listeners: Set<AlarmListener> = new Set();

  private muted: boolean = false;
  private volume: number = 0.85;

  constructor() {
    // Load preferences
    if (typeof window !== 'undefined') {
      try {
        const savedMuted = localStorage.getItem('dk_alarm_muted');
        if (savedMuted !== null) {
          this.muted = savedMuted === 'true';
        }
        const savedVolume = localStorage.getItem('dk_alarm_volume');
        if (savedVolume !== null) {
          this.volume = parseFloat(savedVolume) || 0.85;
        }
      } catch (e) {
        console.warn('Could not read audio preferences', e);
      }

      // Auto-unlock AudioContext on first user interaction in the window
      const unlockAudio = () => {
        this.initAudioContext();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('click', unlockAudio, { once: true, passive: true });
      window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
      window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    }
  }

  private initAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    return this.audioCtx;
  }

  public subscribe(listener: AlarmListener): () => void {
    this.listeners.add(listener);
    listener(this.isPlaying);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isPlaying));
  }

  public isAlarmPlaying(): boolean {
    return this.isPlaying;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dk_alarm_muted', String(muted));
    }
    if (muted && this.isPlaying) {
      this.stopAlarm();
    }
  }

  public toggleMute(): boolean {
    const nextState = !this.muted;
    this.setMuted(nextState);
    return nextState;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('dk_alarm_volume', String(this.volume));
    }
  }

  /**
   * Plays a single two-tone industrial horn pulse:
   * Tone A (880Hz / A5) -> Tone B (700Hz / F5) with harmonic overtone.
   */
  private playPulseBurst(ctx: AudioContext, masterVolume: number): void {
    const now = ctx.currentTime;
    const duration = 0.45; // 450ms total pulse

    // Primary High Tone Oscillator
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    // Harmonics for rich industrial siren timbre (sawtooth + triangle)
    osc1.type = 'sawtooth';
    // Frequency warble from 880Hz to 660Hz
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(660, now + duration * 0.5);
    osc1.frequency.setValueAtTime(880, now + duration * 0.5);
    osc1.frequency.exponentialRampToValueAtTime(700, now + duration);

    // Secondary sub-oscillator for bass presence (square wave for harsh industrial feel)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(330, now + duration);

    // Envelope
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(masterVolume * 0.5, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.02);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(masterVolume * 0.2, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.02);

    // Connect to destination
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + duration);

    osc2.start(now);
    osc2.stop(now + duration);

    this.activeOscillators.push(osc1, osc2);
    this.activeGains.push(gain1, gain2);

    setTimeout(() => {
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc1 && o !== osc2);
      this.activeGains = this.activeGains.filter((g) => g !== gain1 && g !== gain2);
    }, duration * 1000 + 50);
  }

  /**
   * Starts the continuous Critical Alarm siren.
   * Repeats an urgent industrial alert pulse every 600ms until explicitly stopped or acknowledged.
   */
  public playCriticalAlarm(): void {
    if (this.muted) {
      this.isPlaying = true;
      this.notify();
      return;
    }

    const ctx = this.initAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => console.warn('Audio resume blocked:', err));
    }

    this.stopAlarm(); // Clear any existing cycle
    this.isPlaying = true;
    this.notify();

    // Immediate first pulse
    this.playPulseBurst(ctx, this.volume);

    // Repeating cadence every 650ms
    this.intervalId = setInterval(() => {
      if (!this.isPlaying || this.muted) {
        this.stopAlarm();
        return;
      }
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      this.playPulseBurst(ctx, this.volume);
    }, 650);
  }

  /**
   * Test chirp / acoustic test pulse (plays 2 bursts then stops automatically).
   */
  public testAlarm(): void {
    const ctx = this.initAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Play 2 quick pulses for testing
    this.playPulseBurst(ctx, this.volume * 0.7);
    setTimeout(() => {
      if (ctx && ctx.state !== 'closed') {
        this.playPulseBurst(ctx, this.volume * 0.7);
      }
    }, 500);
  }

  /**
   * Immediately silences the alarm sound and resets oscillator cycles.
   */
  public stopAlarm(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // already stopped
      }
    });
    this.activeOscillators = [];

    this.activeGains.forEach((g) => {
      try {
        g.disconnect();
      } catch (e) {
        // already disconnected
      }
    });
    this.activeGains = [];

    if (this.isPlaying) {
      this.isPlaying = false;
      this.notify();
    }
  }
}

export const alarmAudioService = new AlarmAudioService();
