import { useDialog } from "../lib/useDialog.js";
import { cookingSessions, updateCookingSession, timerSeconds as remainingTimer, stepDuration } from "../lib/cookingProgress.js";
import { cookbookOwner } from "../lib/savedRecipes.js";
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

export function CookingModeModal({ recipe, onClose, onComplete, sessionId }) {
  const [owner] = useState(cookbookOwner);
  const [restored] = useState(() => { try { return sessionId ? cookingSessions(owner).find(s => s.sessionId === sessionId) : null; } catch { return null; } });
  const [currentStepIndex, setCurrentStepIndex] = useState(restored?.currentStepIndex || 0);
  const [timer, setTimer] = useState(restored?.timer || { remainingSeconds: stepDuration(recipe?.instructions?.[restored?.currentStepIndex || 0]), deadline: null });
  const [now, setNow] = useState(Date.now);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progressError, setProgressError] = useState('');
  const dialog = useDialog(onClose);
  const previousStep = useRef(currentStepIndex);
  const steps = recipe?.instructions || [];
  const currentStep = steps[currentStepIndex];
  const timerSeconds = remainingTimer(timer, now);
  const timerRunning = timer.deadline !== null;
  function setTimerSeconds(value) {
    setTimer(prior => { const seconds = typeof value === 'function' ? value(remainingTimer(prior)) : value;
      return { remainingSeconds: seconds === null ? null : Math.min(86400, Math.max(0, seconds)), deadline: prior.deadline !== null && seconds > 0 ? Date.now() + seconds * 1000 : null }; });
    setNow(Date.now());
  }
  function setTimerRunning(value) {
    setTimer(prior => { const seconds = remainingTimer(prior), running = typeof value === 'function' ? value(prior.deadline !== null) : value;
      return { remainingSeconds: seconds, deadline: running && seconds > 0 ? Date.now() + seconds * 1000 : null }; });
    setNow(Date.now());
  }
  useEffect(() => {
    if (previousStep.current === currentStepIndex) return;
    previousStep.current = currentStepIndex;
    setTimer({ remainingSeconds: stepDuration(currentStep), deadline: null });
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); setIsSpeaking(false);
  }, [currentStepIndex, currentStep]);
  useEffect(() => {
    if (timer.deadline === null) return;
    const tick = () => { const time = Date.now(); setNow(time); if (remainingTimer(timer, time) === 0) { setTimer({ remainingSeconds: 0, deadline: null }); playChimeSound(); } };
    tick(); const interval = setInterval(tick, 250); return () => clearInterval(interval);
  }, [timer.deadline]);
  useEffect(() => {
    if (!sessionId) return;
    try { updateCookingSession(sessionId, { currentStepIndex, timer }, owner); setProgressError(''); }
    catch { setProgressError('Cooking continues, but progress could not be saved on this device.'); }
  }, [sessionId, currentStepIndex, timer, owner]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target instanceof HTMLElement && e.target.closest("input, select, textarea, button")) return;
      if (e.key === "ArrowRight") nextStep();
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
      setTimer({ remainingSeconds: stepDuration(steps[currentStepIndex + 1]), deadline: null });
      setCurrentStepIndex((prev) => prev + 1);
    }
  }

  function prevStep() {
    if (currentStepIndex > 0) {
      setTimer({ remainingSeconds: stepDuration(steps[currentStepIndex - 1]), deadline: null });
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
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Cooking mode" className="cooking-mode fixed inset-0 z-50 bg-[#100E0C] text-[#F5E6CC] flex flex-col justify-between overflow-y-auto">
      {/* Top Bar with Progress */}
      <div className="border-b border-[#201B17] bg-[#17120F] px-6 py-4">
        {/* Progress Bar */}
        <div className="w-full bg-[#201B17] h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-[#F2382F] h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="max-w-5xl mx-auto flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-[#F2382F] text-white text-xs font-bold font-typewriter uppercase tracking-wider">
              🔥 Hands-Free Cooking Mode
            </span>
            <span className="text-xs font-typewriter text-[#F3C694] hidden sm:inline truncate max-w-sm">
              {recipe.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={readStepAloud}
              className={`px-3 py-1.5 rounded-md text-xs font-typewriter font-bold flex items-center gap-1.5 transition-all ${
                isSpeaking
                  ? "bg-[#F2382F] text-white animate-pulse"
                  : "bg-[#201B17] text-[#F5E6CC] hover:bg-[#5E4A3D]"
              }`}
            >
              <span>{isSpeaking ? "⏹ Stop Voice" : "🔊 Read Step"}</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-typewriter font-bold bg-[#201B17] text-[#F5E6CC] hover:bg-[#F2382F] transition-colors"
            >
              ✕ Exit Mode
            </button>
          </div>
        </div>
      </div>

      {progressError && <p role="alert" className="px-6 py-2">{progressError}</p>}
      {/* Main Step Center Display */}
      <div className="max-w-4xl w-full mx-auto px-6 py-10 my-auto text-center space-y-8">
        {/* Step Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#201B17] text-[#F3C694] text-sm font-typewriter font-bold">
          <span>STEP {currentStepIndex + 1} OF {steps.length}</span>
        </div>

        {/* Big Step Instruction Text */}
        <p className="font-serif break-words text-2xl sm:text-4xl lg:text-5xl leading-tight text-[#F5E6CC] transition-all">
          {currentStep}
        </p>

        {/* Smart Timer Display (if step has timing or preset) */}
        <div className="pt-4 flex flex-col items-center justify-center gap-3">
          {timerSeconds !== null ? (
            <div className="bg-[#17120F] border border-[#201B17] rounded-loro-lg p-5 flex flex-col sm:flex-row items-center gap-5 shadow-loro">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{timerRunning ? "⏱️" : "⏳"}</span>
                <span className="font-typewriter text-4xl sm:text-5xl font-bold tracking-widest text-[#F2382F]">
                  {formatTime(timerSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning((r) => !r)}
                  className={`px-5 py-2.5 rounded-lg text-xs font-typewriter font-bold uppercase tracking-wider text-white transition-all ${
                    timerRunning
                      ? "bg-[#6D5545] hover:bg-[#513E32]"
                      : "bg-[#F2382F] hover:bg-[#CF2A23] shadow-loro-coral"
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
                  className="px-3 py-2.5 rounded-lg text-xs font-typewriter font-bold bg-[#201B17] hover:bg-[#5E4A3D] text-[#F5E6CC]"
                >
                  +1m
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(180);
                  }}
                  className="px-3 py-2.5 rounded-lg text-xs font-typewriter font-bold bg-[#201B17] hover:bg-[#5E4A3D] text-[#F5E6CC]"
                >
                  +3m
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="px-3 py-2.5 rounded-lg text-xs font-typewriter font-bold bg-[#201B17] hover:bg-[#5E4A3D] text-[#9C806D]"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setTimerSeconds(180)}
              className="text-xs font-typewriter text-[#F3C694] hover:text-white underline underline-offset-4"
            >
              + Add 3-Minute Kitchen Timer for this step
            </button>
          )}
        </div>
      </div>

      {/* Bottom Large Nav Controls */}
      <div className="border-t border-[#201B17] bg-[#17120F] px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className={`px-6 sm:px-10 py-4 rounded-loro text-sm sm:text-base font-bold font-typewriter uppercase tracking-wider transition-all flex items-center gap-2 ${
              currentStepIndex === 0
                ? "bg-[#201B17]/30 text-[#9C806D] cursor-not-allowed"
                : "bg-[#201B17] text-[#F5E6CC] hover:bg-[#5E4A3D] active:scale-95"
            }`}
          >
            <span>← Previous</span>
          </button>

          <span className="text-xs font-typewriter text-[#9C806D] hidden sm:inline">
            Tip: Press Space to toggle timer, Arrow keys to navigate
          </span>

          {currentStepIndex < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-8 sm:px-12 py-4 rounded-loro text-sm sm:text-base font-bold uppercase tracking-wider text-white bg-[#F2382F] hover:bg-[#CF2A23] shadow-loro-coral btn-shimmer transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Next Step →</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (sessionId) { try { updateCookingSession(sessionId, { phase: "complete", timer: { remainingSeconds: 0, deadline: null } }, owner); } catch { /* Meal confirmation still works when local progress storage is full. */ } }
                playChimeSound();
                onComplete?.();
                onClose();
              }}
              className="px-8 sm:px-12 py-4 rounded-loro text-sm sm:text-base font-bold uppercase tracking-wider text-white bg-[#6D5545] hover:bg-[#513E32] shadow-loro transition-all active:scale-95 flex items-center gap-2"
            >
              <span>I cooked this meal ✓</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
