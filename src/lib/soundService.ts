/**
 * Sound Service for Notification Sounds
 * Provides Facebook-like notification sounds for the anxiety application
 */

export type SoundType = 'login' | 'registration' | 'archive' | 'unarchive' | 'schedule' | 'verified' | 'unverified' | 'message' | 'success' | 'error';

class SoundService {
  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private isEnabled: boolean = true;
  private volume: number = 0.8;

  constructor() {
    this.initializeAudioContext();
    this.loadSounds();
  }

  private initializeAudioContext() {
    try {
      // Create AudioContext for better browser compatibility
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  private async loadSounds() {
    // Generate notification sounds programmatically
    // This creates Facebook-like notification sounds without external files
    
    if (!this.audioContext) return;

    try {
      // Login sound - pleasant chime
      const loginSound = this.generateLoginSound();
      this.sounds.set('login', loginSound);

      // Registration sound - success tone
      const registrationSound = this.generateRegistrationSound();
      this.sounds.set('registration', registrationSound);

      // Archive sound - subtle notification
      const archiveSound = this.generateArchiveSound();
      this.sounds.set('archive', archiveSound);

      // Unarchive sound - restoration tone
      const unarchiveSound = this.generateUnarchiveSound();
      this.sounds.set('unarchive', unarchiveSound);

      // Schedule sound - appointment notification
      const scheduleSound = this.generateScheduleSound();
      this.sounds.set('schedule', scheduleSound);

      // Verified sound - approval chime
      const verifiedSound = this.generateVerifiedSound();
      this.sounds.set('verified', verifiedSound);

      // Unverified sound - attention tone
      const unverifiedSound = this.generateUnverifiedSound();
      this.sounds.set('unverified', unverifiedSound);

      // Message sound - gentle ping
      const messageSound = this.generateMessageSound();
      this.sounds.set('message', messageSound);

      // Success sound - positive chime
      const successSound = this.generateSuccessSound();
      this.sounds.set('success', successSound);

      // Error sound - attention tone
      const errorSound = this.generateErrorSound();
      this.sounds.set('error', errorSound);

      console.log('✅ Sound service initialized with all notification sounds');
    } catch (error) {
      console.error('❌ Error loading sounds:', error);
    }
  }

  private generateLoginSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6; // 600ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a pleasant login chime (C-E-G chord progression)
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3); // Decay envelope
      
      // Three-note chord: C4 (261.63Hz), E4 (329.63Hz), G4 (392Hz)
      const note1 = Math.sin(2 * Math.PI * 261.63 * t) * 0.3;
      const note2 = Math.sin(2 * Math.PI * 329.63 * t) * 0.25;
      const note3 = Math.sin(2 * Math.PI * 392 * t) * 0.2;
      
      data[i] = (note1 + note2 + note3) * envelope * 0.6;
    }

    return buffer;
  }

  private generateRegistrationSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8; // 800ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a success registration sound (ascending notes)
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2.5);
      
      // Ascending melody: C4 -> E4 -> G4 -> C5
      let frequency = 261.63; // Start with C4
      if (t > 0.2) frequency = 329.63; // E4
      if (t > 0.4) frequency = 392; // G4
      if (t > 0.6) frequency = 523.25; // C5
      
      const wave = Math.sin(2 * Math.PI * frequency * t);
      data[i] = wave * envelope * 0.5;
    }

    return buffer;
  }

  private generateArchiveSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.4; // 400ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a subtle archive notification sound
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 4);
      
      // Single gentle tone
      const wave = Math.sin(2 * Math.PI * 440 * t); // A4
      data[i] = wave * envelope * 0.3;
    }

    return buffer;
  }

  private generateMessageSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3; // 300ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a gentle ping sound
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 6);
      
      // High frequency ping
      const wave = Math.sin(2 * Math.PI * 800 * t);
      data[i] = wave * envelope * 0.4;
    }

    return buffer;
  }

  private generateSuccessSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5; // 500ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a positive success sound
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3);
      
      // Major chord progression
      const note1 = Math.sin(2 * Math.PI * 523.25 * t) * 0.4; // C5
      const note2 = Math.sin(2 * Math.PI * 659.25 * t) * 0.35; // E5
      
      data[i] = (note1 + note2) * envelope * 0.6;
    }

    return buffer;
  }

  private generateErrorSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.4; // 400ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Create an attention-getting error sound
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 4);
      
      // Lower frequency for attention
      const wave = Math.sin(2 * Math.PI * 220 * t); // A3
      data[i] = wave * envelope * 0.4;
    }

    return buffer;
  }

  private generateUnarchiveSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.7; // 700ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Create an uplifting unarchive sound (rising melody)
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2.5);
      
      // Rising melody: G4 -> B4 -> D5 -> G5
      let frequency = 392; // Start with G4
      if (t > 0.2) frequency = 493.88; // B4
      if (t > 0.4) frequency = 587.33; // D5
      if (t > 0.6) frequency = 783.99; // G5
      
      const wave = Math.sin(2 * Math.PI * frequency * t);
      data[i] = wave * envelope * 0.45;
    }

    return buffer;
  }

  private generateScheduleSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5; // 500ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a professional schedule notification sound (two-tone chime)
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3.5);
      
      // Two-tone chime: F4 -> C5
      let frequency = 349.23; // F4
      if (t > 0.25) frequency = 523.25; // C5
      
      const wave = Math.sin(2 * Math.PI * frequency * t);
      data[i] = wave * envelope * 0.4;
    }

    return buffer;
  }

  private generateVerifiedSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8; // 800ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a positive verification sound (triumphant chord)
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2);
      
      // Triumphant major chord: C5, E5, G5
      const note1 = Math.sin(2 * Math.PI * 523.25 * t) * 0.35; // C5
      const note2 = Math.sin(2 * Math.PI * 659.25 * t) * 0.3; // E5
      const note3 = Math.sin(2 * Math.PI * 783.99 * t) * 0.25; // G5
      
      data[i] = (note1 + note2 + note3) * envelope * 0.55;
    }

    return buffer;
  }

  private generateUnverifiedSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6; // 600ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Create a cautionary unverified sound (descending tone)
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3);
      
      // Descending cautionary tone: E4 -> C4 -> A3
      let frequency = 329.63; // E4
      if (t > 0.2) frequency = 261.63; // C4
      if (t > 0.4) frequency = 220; // A3
      
      const wave = Math.sin(2 * Math.PI * frequency * t);
      data[i] = wave * envelope * 0.35;
    }

    return buffer;
  }

  /**
   * Play a notification sound
   */
  public async playSound(type: SoundType): Promise<void> {
    if (!this.isEnabled || !this.audioContext || !this.sounds.has(type)) {
      return;
    }

    try {
      // Resume AudioContext if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const buffer = this.sounds.get(type);
      if (!buffer) return;

      // Create audio source
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = this.volume;

      // Connect audio nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Play the sound
      source.start();

      console.log(`🔊 Playing ${type} notification sound`);
    } catch (error) {
      console.error(`❌ Error playing ${type} sound:`, error);
    }
  }

  /**
   * Play login notification sound
   */
  public playLoginSound(): Promise<void> {
    return this.playSound('login');
  }

  /**
   * Play registration notification sound
   */
  public playRegistrationSound(): Promise<void> {
    return this.playSound('registration');
  }

  /**
   * Play archive notification sound
   */
  public playArchiveSound(): Promise<void> {
    return this.playSound('archive');
  }

  /**
   * Play unarchive notification sound
   */
  public playUnarchiveSound(): Promise<void> {
    return this.playSound('unarchive');
  }

  /**
   * Play schedule notification sound
   */
  public playScheduleSound(): Promise<void> {
    return this.playSound('schedule');
  }

  /**
   * Play verified notification sound
   */
  public playVerifiedSound(): Promise<void> {
    return this.playSound('verified');
  }

  /**
   * Play unverified notification sound
   */
  public playUnverifiedSound(): Promise<void> {
    return this.playSound('unverified');
  }

  /**
   * Play message notification sound
   */
  public playMessageSound(): Promise<void> {
    return this.playSound('message');
  }

  /**
   * Play success notification sound
   */
  public playSuccessSound(): Promise<void> {
    return this.playSound('success');
  }

  /**
   * Play error notification sound
   */
  public playErrorSound(): Promise<void> {
    return this.playSound('error');
  }

  /**
   * Enable or disable sound notifications
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('soundNotifications', enabled.toString());
    console.log(`🔊 Sound notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if sound notifications are enabled
   */
  public isEnabledState(): boolean {
    return this.isEnabled;
  }

  /**
   * Set volume level (0.0 to 1.0)
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundVolume', this.volume.toString());
    console.log(`🔊 Sound volume set to ${Math.round(this.volume * 100)}%`);
  }

  /**
   * Get current volume level
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Initialize sound settings from localStorage
   */
  public loadSettings(): void {
    const savedEnabled = localStorage.getItem('soundNotifications');
    if (savedEnabled !== null) {
      this.isEnabled = savedEnabled === 'true';
    }

    const savedVolume = localStorage.getItem('soundVolume');
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }
  }

  /**
   * Test all notification sounds
   */
  public async testAllSounds(): Promise<void> {
    const soundTypes: SoundType[] = ['login', 'registration', 'archive', 'unarchive', 'schedule', 'verified', 'unverified', 'message', 'success', 'error'];
    
    for (let i = 0; i < soundTypes.length; i++) {
      const soundType = soundTypes[i];
      console.log(`🔊 Testing ${soundType} sound...`);
      await this.playSound(soundType);
      
      // Wait between sounds
      if (i < soundTypes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

// Create and export singleton instance
export const soundService = new SoundService();

// Load settings on initialization
soundService.loadSettings();

// Export the service for use in components
export default soundService;
