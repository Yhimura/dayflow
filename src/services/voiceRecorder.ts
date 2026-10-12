// Сервис записи звука и распознавания речи

// Декларация Web Speech API для TypeScript
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface VoiceRecorderCallbacks {
  onInterimText?: (text: string) => void;
  onVolumeChange?: (volume: number) => void;
  onError?: (errorMsg: string) => void;
}

export class VoiceRecorderService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private speechRecognizer: any = null;
  private animationFrameId: number | null = null;
  private finalTranscript = '';
  private isRecording = false;

  // Проверка поддержки Web Speech API
  public static isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && 
      (Boolean(window.SpeechRecognition) || Boolean(window.webkitSpeechRecognition));
  }

  // Старт записи и распознавания
  public async startRecording(callbacks: VoiceRecorderCallbacks): Promise<boolean> {
    try {
      this.finalTranscript = '';
      this.isRecording = true;

      // 1. Получаем доступ к микрофону для анализатора громкости (визуализации волны)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            this.audioContext = new AudioContextClass();
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 64;
            source.connect(this.analyser);

            this.trackAudioVolume(callbacks.onVolumeChange);
          }
        } catch (micErr) {
          console.warn('Microphone stream error (fallback mode):', micErr);
        }
      }

      // 2. Инициализируем Speech Recognition
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        this.speechRecognizer = new SpeechRecognitionClass();
        this.speechRecognizer.continuous = true;
        this.speechRecognizer.interimResults = true;
        this.speechRecognizer.lang = 'ru-RU';

        this.speechRecognizer.onresult = (event: any) => {
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              this.finalTranscript += ' ' + transcript;
            } else {
              interimText += transcript;
            }
          }

          const combined = (this.finalTranscript + ' ' + interimText).trim();
          callbacks.onInterimText?.(combined);
        };

        this.speechRecognizer.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error !== 'no-speech') {
            callbacks.onError?.(`Ошибка распознавания: ${event.error}`);
          }
        };

        this.speechRecognizer.start();
      } else {
        console.warn('Web Speech API is not supported in this environment');
      }

      return true;
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      callbacks.onError?.(err.message || 'Не удалось получить доступ к микрофону');
      this.stopRecording();
      return false;
    }
  }

  // Цикл отслеживания уровня громкости для анимации волны
  private trackAudioVolume(onVolumeChange?: (volume: number) => void): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (!this.isRecording || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Нормализуем в диапазон от 0 до 1
      const normalized = Math.min(1, average / 128);
      onVolumeChange?.(normalized);

      this.animationFrameId = requestAnimationFrame(update);
    };

    update();
  }

  // Остановка записи и получение финального текста
  public stopRecording(): string {
    this.isRecording = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.speechRecognizer) {
      try {
        this.speechRecognizer.stop();
      } catch (e) {
        // Ignore
      }
      this.speechRecognizer = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // Ignore
      }
      this.audioContext = null;
    }

    return this.finalTranscript.trim();
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const voiceRecorder = new VoiceRecorderService();
