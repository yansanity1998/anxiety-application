/**
 * Memory Game Sound Service for Brain Training Game
 * Provides focused, cognitive-enhancing sounds for memory matching gameplay
 */

export type MemorySoundType = 'flip' | 'match' | 'mismatch' | 'levelComplete' | 'gameStart' | 'gameComplete' | 'newHighScore';

class MemorySoundService {
  private audioContext: AudioContext | null = null;
  private sounds: Map<MemorySoundType, AudioBuffer> = new Map();
  private isEnabled: boolean = true;
  private volume: number = 0.5; // Moderate volume for concentration

  constructor() {
    this.initializeAudioContext();
    this.loadSounds();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  private async loadSounds() {
    if (!this.audioContext) return;

    try {
      // Flip card - soft click
      const flipSound = this.generateFlipSound();
      this.sounds.set('flip', flipSound);

      // Match found - positive chime
      const matchSound = this.generateMatchSound();
      this.sounds.set('match', matchSound);

      // Mismatch - gentle feedback
      const mismatchSound = this.generateMismatchSound();
      this.sounds.set('mismatch', mismatchSound);

      // Level complete - achievement
      const levelCompleteSound = this.generateLevelCompleteSound();
      this.sounds.set('levelComplete', levelCompleteSound);

      // Game start - focus tone
      const gameStartSound = this.generateGameStartSound();
      this.sounds.set('gameStart', gameStartSound);

      // Game complete - victory
      const gameCompleteSound = this.generateGameCompleteSound();
      this.sounds.set('gameComplete', gameCompleteSound);

      // New high score - celebration
      const newHighScoreSound = this.generateNewHighScoreSound();
      this.sounds.set('newHighScore', newHighScoreSound);

      console.log('✅ Memory game sound service initialized');
    } catch (error) {
      console.error('❌ Error loading memory game sounds:', error);
    }
  }

  // Soft click for card flip
  private generateFlipSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Quick soft click
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 20);
      
      // High frequency click
      const wave = Math.sin(2 * Math.PI * 1500 * t);
      data[i] = wave * envelope * 0.2;
    }

    return buffer;
  }

  // Positive chime for successful match
  private generateMatchSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Pleasant major third interval
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 4);
      
      // C5 and E5 harmony
      const note1 = Math.sin(2 * Math.PI * 523.25 * t) * 0.4;
      const note2 = Math.sin(2 * Math.PI * 659.25 * t) * 0.35;
      const harmonic = Math.sin(2 * Math.PI * 1046.5 * t) * 0.15; // C6 overtone
      
      data[i] = (note1 + note2 + harmonic) * envelope * 0.5;
    }

    return buffer;
  }

  // Gentle feedback for mismatch (not discouraging)
  private generateMismatchSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.25;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Soft neutral tone
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 7);
      
      // Single gentle tone
      const wave = Math.sin(2 * Math.PI * 400 * t);
      data[i] = wave * envelope * 0.25;
    }

    return buffer;
  }

  // Achievement sound for level completion
  private generateLevelCompleteSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.0;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Ascending major arpeggio
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2);
      
      // C-E-G-C progression
      let frequency = 523.25; // C5
      if (t > 0.2) frequency = 659.25; // E5
      if (t > 0.4) frequency = 783.99; // G5
      if (t > 0.6) frequency = 1046.5; // C6
      
      const wave = Math.sin(2 * Math.PI * frequency * t);
      const harmonic = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.2;
      
      data[i] = (wave + harmonic) * envelope * 0.55;
    }

    return buffer;
  }

  // Focus-inducing tone for game start
  private generateGameStartSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.7;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Clear, focused tone
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2.5);
      
      // Perfect fifth interval (C-G)
      const note1 = Math.sin(2 * Math.PI * 523.25 * t) * 0.4; // C5
      const note2 = Math.sin(2 * Math.PI * 783.99 * t) * 0.3; // G5
      
      data[i] = (note1 + note2) * envelope * 0.5;
    }

    return buffer;
  }

  // Victory fanfare for game completion
  private generateGameCompleteSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.5;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Triumphant melody
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 1.5);
      
      // Victory progression: G-C-E-G-C
      let frequency = 783.99; // G5
      if (t > 0.25) frequency = 1046.5; // C6
      if (t > 0.5) frequency = 1318.5; // E6
      if (t > 0.75) frequency = 1568; // G6
      if (t > 1.0) frequency = 2093; // C7
      
      const wave = Math.sin(2 * Math.PI * frequency * t);
      const harmonic = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.25;
      
      data[i] = (wave + harmonic) * envelope * 0.6;
    }

    return buffer;
  }

  // Celebration for new high score
  private generateNewHighScoreSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.8;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Extended celebration with sparkle
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 1.2);
      
      // Ascending sparkle: C-E-G-C-E-G-C
      let frequency = 523.25; // C5
      if (t > 0.2) frequency = 659.25; // E5
      if (t > 0.4) frequency = 783.99; // G5
      if (t > 0.6) frequency = 1046.5; // C6
      if (t > 0.8) frequency = 1318.5; // E6
      if (t > 1.0) frequency = 1568; // G6
      if (t > 1.2) frequency = 2093; // C7
      
      const wave = Math.sin(2 * Math.PI * frequency * t);
      const sparkle = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.15; // High harmonic
      
      data[i] = (wave + sparkle) * envelope * 0.65;
    }

    return buffer;
  }

  /**
   * Play a memory game sound
   */
  public async playSound(type: MemorySoundType): Promise<void> {
    if (!this.isEnabled || !this.audioContext || !this.sounds.has(type)) {
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const buffer = this.sounds.get(type);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = this.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      console.error(`❌ Error playing ${type} sound:`, error);
    }
  }

  // Convenience methods
  public playFlipSound(): Promise<void> {
    return this.playSound('flip');
  }

  public playMatchSound(): Promise<void> {
    return this.playSound('match');
  }

  public playMismatchSound(): Promise<void> {
    return this.playSound('mismatch');
  }

  public playLevelCompleteSound(): Promise<void> {
    return this.playSound('levelComplete');
  }

  public playGameStartSound(): Promise<void> {
    return this.playSound('gameStart');
  }

  public playGameCompleteSound(): Promise<void> {
    return this.playSound('gameComplete');
  }

  public playNewHighScoreSound(): Promise<void> {
    return this.playSound('newHighScore');
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

// Create and export singleton instance
export const memorySoundService = new MemorySoundService();

export default memorySoundService;
