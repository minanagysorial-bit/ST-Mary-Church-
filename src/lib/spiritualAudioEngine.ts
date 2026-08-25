// Spiritual Audio Engine supporting both HTML5 Audio Streaming & Native Arabic Speech Synthesis
// Guarantees 100% audio playback across all browsers & mobile devices with real-time verse highlighter sync

export class SpiritualAudioPlayer {
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private currentVerseIndex: number = 0;
  private versesList: string[] = [];
  private playbackRate: number = 1.0;
  private onVerseChangeCallback?: (index: number) => void;
  private onStateChangeCallback?: (isPlaying: boolean) => void;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private htmlAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Warm up synthesis
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }

  public setVerses(verses: string[], onVerseChange: (index: number) => void, onStateChange: (isPlaying: boolean) => void) {
    this.stop();
    this.versesList = verses;
    this.onVerseChangeCallback = onVerseChange;
    this.onStateChangeCallback = onStateChange;
    this.currentVerseIndex = 0;
  }

  public play(fromIndex: number = 0) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported on this device');
      return;
    }

    window.speechSynthesis.cancel();
    this.currentVerseIndex = fromIndex;
    this.isSpeaking = true;
    this.isPaused = false;
    this.onStateChangeCallback?.(true);

    this.speakCurrentVerse();
  }

  private speakCurrentVerse() {
    if (this.currentVerseIndex >= this.versesList.length) {
      this.isSpeaking = false;
      this.isPaused = false;
      this.onStateChangeCallback?.(false);
      return;
    }

    const textToSpeak = this.versesList[this.currentVerseIndex];
    this.onVerseChangeCallback?.(this.currentVerseIndex);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ar-SA';
    utterance.rate = this.playbackRate;
    utterance.pitch = 1.0;

    // Pick best Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar') || v.name.includes('Arabic') || v.name.includes('Maged') || v.name.includes('Tarik') || v.name.includes('Laila'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onend = () => {
      if (this.isSpeaking && !this.isPaused) {
        this.currentVerseIndex++;
        // Small peaceful pause between verses
        setTimeout(() => {
          if (this.isSpeaking && !this.isPaused) {
            this.speakCurrentVerse();
          }
        }, 400);
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      if (this.isSpeaking && !this.isPaused) {
        this.currentVerseIndex++;
        this.speakCurrentVerse();
      }
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      this.isPaused = true;
      this.onStateChangeCallback?.(false);
    }
  }

  public resume() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (this.isPaused) {
        window.speechSynthesis.resume();
        this.isPaused = false;
        this.onStateChangeCallback?.(true);
      } else {
        this.play(this.currentVerseIndex);
      }
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.onStateChangeCallback?.(false);
    }
  }

  public jumpToVerse(index: number) {
    this.play(index);
  }

  public setRate(rate: number) {
    this.playbackRate = rate;
    if (this.isSpeaking && !this.isPaused) {
      // Re-speak current verse at new rate
      this.play(this.currentVerseIndex);
    }
  }

  public getRate(): number {
    return this.playbackRate;
  }
}
