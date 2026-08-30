import { useState, useEffect, useRef } from "react";

function playChimeSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // Harmonic dinner bell chime
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.3, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 1.2);
    });
  } catch (err) {
    console.warn("Audio chime not supported:", err);
  }
}

export function CookingModeModal({ recipe, onClose }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const intervalRef = useRef(null);

  const steps = recipe?.instructions || ["Cook and enjoy."];
  const currentStep = steps[currentStepIndex];

  // Auto-detect timer duration in seconds from current step text
  useEffect(() => {
    if (!currentStep) return;
    const minMatch = currentStep.match(/(\d+)(?:-(\d+))?\s*(?:minute|min|mins)/i);
    const secMatch = currentStep.match(/(\d+)\s*(?:second|sec|secs)/i);

    if (minMatch) {
      const mins = parseInt(minMatch[2] || minMatch[1], 10);
      setTimerSeconds(mins * 60);
      setTimerRunning(false);
    } else if (secMatch) {
      setTimerSeconds(parseInt(secMatch[1], 10));
      setTimerRunning(false);
    } else {
      setTimerSeconds(null);
      setTimerRunning(false);
    }
  }, [currentStepIndex, currentStep]);

  // Timer countdown
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setTimerRunning(false);
            playChimeSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning, timerSeconds]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") nextStep();
      else if (e.key === "ArrowLeft") prevStep();
      else if (e.key === " ") {
        e.preventDefault();
        setTimerRunning((r) => !r);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStepIndex, steps.length]);

  function nextStep() {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }

  function prevStep() {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }

  function readStepAloud() {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Step ${currentStepIndex + 1}. ${currentStep}`);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function formatTime(totalSecs) {
    if (totalSecs === null || totalSecs === undefined) return "00:00";
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-[#1F3144] text-[#FBF0DF] flex flex-col justify-between overflow-y-auto">
      {/* Top Bar with Progress */}
      <div className="border-b border-[#334D66] bg-[#1A2837] px-6 py-4">
        {/* Progress Bar */}
        <div className="w-full bg-[#334D66] h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-[#E56960] h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-[#E56960] text-white text-xs font-bold font-typewriter uppercase tracking-wider">
              🔥 Hands-Free Cooking Mode
            </span>
            <span className="text-xs font-typewriter text-[#FFBDA6] hidden sm:inline truncate max-w-sm">
              {recipe.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={readStepAloud}
              className={`px-3 py-1.5 rounded-md text-xs font-typewriter font-bold flex items-center gap-1.5 transition-all ${
                isSpeaking
                  ? "bg-[#E56960] text-white animate-pulse"
                  : "bg-[#334D66] text-[#FBF0DF] hover:bg-[#4A6987]"
              }`}
            >
              <span>{isSpeaking ? "⏹ Stop Voice" : "🔊 Read Step"}</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-typewriter font-bold bg-[#334D66] text-[#FBF0DF] hover:bg-[#E56960] transition-colors"
            >
              ✕ Exit Mode
            </button>
          </div>
        </div>
      </div>

      {/* Main Step Center Display */}
      <div className="max-w-4xl mx-auto px-6 py-10 my-auto text-center space-y-8">
        {/* Step Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#334D66] text-[#FFBDA6] text-sm font-typewriter font-bold">
          <span>STEP {currentStepIndex + 1} OF {steps.length}</span>
        </div>

        {/* Big Step Instruction Text */}
        <p className="font-serif text-2xl sm:text-4xl lg:text-5xl leading-tight text-[#FBF0DF] transition-all">
          {currentStep}
        </p>

        {/* Smart Timer Display (if step has timing or preset) */}
        <div className="pt-4 flex flex-col items-center justify-center gap-3">
          {timerSeconds !== null ? (
            <div className="bg-[#1A2837] border border-[#334D66] rounded-loro-lg p-5 flex flex-col sm:flex-row items-center gap-5 shadow-loro">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{timerRunning ? "⏱️" : "⏳"}</span>
                <span className="font-typewriter text-4xl sm:text-5xl font-bold tracking-widest text-[#E56960]">
                  {formatTime(timerSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning((r) => !r)}
                  className={`px-5 py-2.5 rounded-lg text-xs font-typewriter font-bold uppercase tracking-wider text-white transition-all ${
                    timerRunning
                      ? "bg-[#636951] hover:bg-[#494E3B]"
                      : "bg-[#E56960] hover:bg-[#C94F46] shadow-loro-coral"
                  }`}
                >
                  {timerRunning ? "⏸ Pause" : "▶ Start Timer"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(60);
                  }}
                  className="px-3 py-2.5 rounded-lg text-xs font-typewriter font-bold bg-[#334D66] hover:bg-[#4A6987] text-[#FBF0DF]"
                >
                  +1m
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(180);
                  }}
                  className="px-3 py-2.5 rounded-lg text-xs font-typewriter font-bold bg-[#334D66] hover:bg-[#4A6987] text-[#FBF0DF]"
                >
                  +3m
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="px-3 py-2.5 rounded-lg text-xs font-typewriter font-bold bg-[#334D66] hover:bg-[#4A6987] text-[#8EA4B8]"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setTimerSeconds(180)}
              className="text-xs font-typewriter text-[#FFBDA6] hover:text-white underline underline-offset-4"
            >
              + Add 3-Minute Kitchen Timer for this step
            </button>
          )}
        </div>
      </div>

      {/* Bottom Large Nav Controls */}
      <div className="border-t border-[#334D66] bg-[#1A2837] px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className={`px-6 sm:px-10 py-4 rounded-loro text-sm sm:text-base font-bold font-typewriter uppercase tracking-wider transition-all flex items-center gap-2 ${
              currentStepIndex === 0
                ? "bg-[#334D66]/30 text-[#8EA4B8] cursor-not-allowed"
                : "bg-[#334D66] text-[#FBF0DF] hover:bg-[#4A6987] active:scale-95"
            }`}
          >
            <span>← Previous</span>
          </button>

          <span className="text-xs font-typewriter text-[#8EA4B8] hidden sm:inline">
            Tip: Press Space to toggle timer, Arrow keys to navigate
          </span>

          {currentStepIndex < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-8 sm:px-12 py-4 rounded-loro text-sm sm:text-base font-bold uppercase tracking-wider text-white bg-[#E56960] hover:bg-[#C94F46] shadow-loro-coral btn-shimmer transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Next Step →</span>
            </button>
          ) : (
            <button
              onClick={() => {
                playChimeSound();
                onClose();
              }}
              className="px-8 sm:px-12 py-4 rounded-loro text-sm sm:text-base font-bold uppercase tracking-wider text-white bg-[#636951] hover:bg-[#494E3B] shadow-loro transition-all active:scale-95 flex items-center gap-2"
            >
              <span>🎉 Feast Complete!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
