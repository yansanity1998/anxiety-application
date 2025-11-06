/**
 * Game Sound Service for Anxiety Relief Game
 * Provides calming, pleasant sounds that align with mindfulness and anxiety relief
 */

export type GameSoundType = 'collect' | 'avoid' | 'levelUp' | 'gameStart' | 'gameOver' | 'newHighScore' | 'combo';

class GameSoundService {
  private audioContext: AudioContext | null = null;
  private sounds: Map<GameSoundType, AudioBuffer> = new Map();
  private isEnabled: boolean = true;
  private volume: number = 0.6; // Slightly lower volume for calming effect

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
      // Collect positive items - gentle chime
      const collectSound = this.generateCollectSound();
      this.sounds.set('collect', collectSound);

      // Avoid negative items - soft warning
      const avoidSound = this.generateAvoidSound();
      this.sounds.set('avoid', avoidSound);

      // Level up - uplifting melody
      const levelUpSound = this.generateLevelUpSound();
      this.sounds.set('levelUp', levelUpSound);

      // Game start - welcoming tone
      const gameStartSound = this.generateGameStartSound();
      this.sounds.set('gameStart', gameStartSound);

      // Game over - calming resolution
      const gameOverSound = this.generateGameOverSound();
      this.sounds.set('gameOver', gameOverSound);

      // New high score - celebration
      const newHighScoreSound = this.generateNewHighScoreSound();
      this.sounds.set('newHighScore', newHighScoreSound);

      // Combo - energizing pulse
      const comboSound = this.generateComboSound();
      this.sounds.set('combo', comboSound);

      console.log('✅ Game sound service initialized');
    } catch (error) {
      console.error('❌ Error loading game sounds:', error);
    }
  }

  // Gentle chime for collecting positive items (like a wind chime)
  private generateCollectSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.4;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Soft bell-like tone with harmonics
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 5); // Quick decay like a bell
      
      // C6 (1046.5Hz) with harmonics for bell-like quality
      const fundamental = Math.sin(2 * Math.PI * 1046.5 * t) * 0.5;
      const harmonic1 = Math.sin(2 * Math.PI * 1046.5 * 2 * t) * 0.2;
      const harmonic2 = Math.sin(2 * Math.PI * 1046.5 * 3 * t) * 0.1;
      
      data[i] = (fundamental + harmonic1 + harmonic2) * envelope * 0.4;
    }

    return buffer;
  }

  // Soft warning for negative items (gentle, not harsh)
  private generateAvoidSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Soft descending tone (not harsh)
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 6);
      
      // Descending from E4 to C4
      const frequency = 329.63 - (t * 70); // Gentle slide down
      const wave = Math.sin(2 * Math.PI * frequency * t);
      
      data[i] = wave * envelope * 0.3; // Quieter for less stress
    }

    return buffer;
  }

  // Uplifting melody for level up
  private generateLevelUpSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.9;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Ascending major scale melody (C-D-E-G-C)
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2);
      
      let frequency = 523.25; // C5
      if (t > 0.15) frequency = 587.33; // D5
      if (t > 0.3) frequency = 659.25; // E5
      if (t > 0.45) frequency = 783.99; // G5
      if (t > 0.6) frequency = 1046.5; // C6
      
      const wave = Math.sin(2 * Math.PI * frequency * t);
      data[i] = wave * envelope * 0.5;
    }

    return buffer;
  }

  // Welcoming tone for game start
  private generateGameStartSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Warm major chord (C-E-G-C)
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2.5);
      
      const note1 = Math.sin(2 * Math.PI * 261.63 * t) * 0.3; // C4
      const note2 = Math.sin(2 * Math.PI * 329.63 * t) * 0.25; // E4
      const note3 = Math.sin(2 * Math.PI * 392 * t) * 0.2; // G4
      const note4 = Math.sin(2 * Math.PI * 523.25 * t) * 0.15; // C5
      
      data[i] = (note1 + note2 + note3 + note4) * envelope * 0.6;
    }

    return buffer;
  }

  // Calming resolution for game over
  private generateGameOverSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.0;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Gentle descending progression (not sad, just calming)
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 1.5);
      
      let frequency = 523.25; // C5
      if (t > 0.25) frequency = 392; // G4
      if (t > 0.5) frequency = 329.63; // E4
      if (t > 0.75) frequency = 261.63; // C4
      
      const wave = Math.sin(2 * Math.PI * frequency * t);
      data[i] = wave * envelope * 0.4;
    }

    return buffer;
  }

  // Celebration for new high score
  private generateNewHighScoreSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.2;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Triumphant ascending arpeggio
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 1.8);
      
      let frequency = 523.25; // C5
      if (t > 0.2) frequency = 659.25; // E5
      if (t > 0.4) frequency = 783.99; // G5
      if (t > 0.6) frequency = 1046.5; // C6
      if (t > 0.8) frequency = 1318.5; // E6
      
      const wave = Math.sin(2 * Math.PI * frequency * t);
      const harmonic = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
      
      data[i] = (wave + harmonic) * envelope * 0.6;
    }

    return buffer;
  }

  // Energizing pulse for combo
  private generateComboSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.25;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Quick energetic pulse
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      
      // High frequency pulse
      const wave = Math.sin(2 * Math.PI * 1200 * t);
      data[i] = wave * envelope * 0.35;
    }

    return buffer;
  }

  /**
   * Play a game sound
   */
  public async playSound(type: GameSoundType): Promise<void> {
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
  public playCollectSound(): Promise<void> {
    return this.playSound('collect');
  }

  public playAvoidSound(): Promise<void> {
    return this.playSound('avoid');
  }

  public playLevelUpSound(): Promise<void> {
    return this.playSound('levelUp');
  }

  public playGameStartSound(): Promise<void> {
    return this.playSound('gameStart');
  }

  public playGameOverSound(): Promise<void> {
    return this.playSound('gameOver');
  }

  public playNewHighScoreSound(): Promise<void> {
    return this.playSound('newHighScore');
  }

  public playComboSound(): Promise<void> {
    return this.playSound('combo');
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

// Create and export singleton instance
export const gameSoundService = new GameSoundService();

export default gameSoundService;
