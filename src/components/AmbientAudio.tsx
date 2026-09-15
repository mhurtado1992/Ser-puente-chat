import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function AmbientAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  const toggleSound = () => {
    if (!isPlaying) {
      startRiverAudio();
    } else {
      stopRiverAudio();
    }
  };

  const startRiverAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // 1. Noise buffer for natural rushing water
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        // Pinkish / brown noise generation for soft water flow
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 2.5; // Gain compensation
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // 2. Resonant bandpass filter to sound like river flow through stones
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.Q.setValueAtTime(1.8, ctx.currentTime);
      filterNodeRef.current = filter;

      // 3. Low Frequency Oscillator (LFO) for wave swells
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.18, ctx.currentTime); // slow wave period ~5.5s
      lfoGain.gain.setValueAtTime(160, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      lfoRef.current = lfo;

      // 4. Master volume gain (gentle ambient level)
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 2.5);
      gainNodeRef.current = masterGain;

      noise.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);
      noise.start();

      setIsPlaying(true);
    } catch (e) {
      console.warn("Audio Context could not start:", e);
    }
  };

  const stopRiverAudio = () => {
    if (audioCtxRef.current && gainNodeRef.current) {
      try {
        const ctx = audioCtxRef.current;
        gainNodeRef.current.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        setTimeout(() => {
          ctx.close();
          audioCtxRef.current = null;
          setIsPlaying(false);
        }, 1300);
      } catch {
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <button
      id="ambient-sound-toggle-btn"
      onClick={toggleSound}
      type="button"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all duration-300 border ${
        isPlaying
          ? "bg-teal-950/60 border-teal-500/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
          : "bg-stone-900/50 border-stone-800/80 text-stone-400 hover:text-stone-300 hover:border-stone-700"
      }`}
      title={isPlaying ? "Silenciar rumor del río" : "Escuchar rumor del río"}
    >
      {isPlaying ? (
        <>
          <Volume2 className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span className="hidden sm:inline font-light tracking-wider">Rumor del agua activo</span>
          <span className="sm:hidden font-light">Audio</span>
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5 opacity-60" />
          <span className="hidden sm:inline font-light tracking-wider">Escuchar el río</span>
          <span className="sm:hidden font-light">Sonido</span>
        </>
      )}
    </button>
  );
}
