import { useState, useEffect } from "react";

const WHEEL_1 = [
  "Chicken Thighs",
  "Firm Tofu",
  "Ramen Noodles",
  "Eggs",
  "Salmon Fillet",
  "Pork Chops",
  "Jasmine Rice",
  "Pasta Ribbons",
  "Black Beans",
  "Flank Steak",
];

const WHEEL_2 = [
  "Sweet Corn",
  "Shiitake Mushrooms",
  "Shallots",
  "Cherry Tomatoes",
  "Charred Lime",
  "Bok Choy",
  "Zucchini",
  "Scallions",
  "Baby Spinach",
  "Avocado",
];

const WHEEL_3 = [
  "Gochujang",
  "Cultured Butter",
  "Chili Crisp",
  "Miso Paste",
  "Soy Sauce",
  "Fresh Rosemary",
  "Garlic Confit",
  "Smoked Paprika",
  "Honey Mustard",
  "Toasted Sesame",
];

export function PantryWheelModal({ onSelectCombo, onClose }) {
  const [slot1, setSlot1] = useState(WHEEL_1[0]);
  const [slot2, setSlot2] = useState(WHEEL_2[0]);
  const [slot3, setSlot3] = useState(WHEEL_3[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  function spinWheel() {
    setIsSpinning(true);
    let counter = 0;
    const maxSpins = 20;

    const interval = setInterval(() => {
      setSlot1(WHEEL_1[Math.floor(Math.random() * WHEEL_1.length)]);
      setSlot2(WHEEL_2[Math.floor(Math.random() * WHEEL_2.length)]);
      setSlot3(WHEEL_3[Math.floor(Math.random() * WHEEL_3.length)]);
      counter++;

      if (counter >= maxSpins) {
        clearInterval(interval);
        setIsSpinning(false);
        setSpinCount((c) => c + 1);
      }
    }, 80);
  }

  useEffect(() => {
    // Initial random roll
    spinWheel();
  }, []);

  function handleCookNow() {
    onSelectCombo([slot1, slot2, slot3]);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FFFDF9] rounded-loro-lg border border-[#EDE3D3] shadow-loro-lg max-w-lg w-full p-6 sm:p-8 space-y-6 animate-toast-enter text-center">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EDE3D3] pb-4">
          <div className="text-left">
            <span className="text-xs font-typewriter font-bold uppercase tracking-wider text-[#E56960] flex items-center gap-1">
              <span>🎰</span> Culinary Mystery Roulette
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-[#334D66]">
              Mystery Pantry Wheel
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-[#334D66] text-base p-1">
            ✕
          </button>
        </div>

        {/* 3 Slot Reels */}
        <div className="grid grid-cols-3 gap-3 py-4">
          {/* Reel 1 */}
          <div className="bg-[#FBF0DF] border-2 border-[#334D66] rounded-loro p-4 h-32 flex flex-col justify-center items-center shadow-inner overflow-hidden">
            <span className="text-[10px] font-typewriter font-bold text-[#636951] uppercase mb-1">
              Base / Protein
            </span>
            <span className={`font-display text-base sm:text-lg text-[#334D66] leading-tight transition-transform ${isSpinning ? "blur-[1px] scale-110" : ""}`}>
              {slot1}
            </span>
          </div>

          {/* Reel 2 */}
          <div className="bg-[#FBF0DF] border-2 border-[#334D66] rounded-loro p-4 h-32 flex flex-col justify-center items-center shadow-inner overflow-hidden">
            <span className="text-[10px] font-typewriter font-bold text-[#636951] uppercase mb-1">
              Produce / Veg
            </span>
            <span className={`font-display text-base sm:text-lg text-[#334D66] leading-tight transition-transform ${isSpinning ? "blur-[1px] scale-110" : ""}`}>
              {slot2}
            </span>
          </div>

          {/* Reel 3 */}
          <div className="bg-[#FBF0DF] border-2 border-[#334D66] rounded-loro p-4 h-32 flex flex-col justify-center items-center shadow-inner overflow-hidden">
            <span className="text-[10px] font-typewriter font-bold text-[#636951] uppercase mb-1">
              Flavor Accent
            </span>
            <span className={`font-display text-base sm:text-lg text-[#334D66] leading-tight transition-transform ${isSpinning ? "blur-[1px] scale-110" : ""}`}>
              {slot3}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={spinWheel}
              disabled={isSpinning}
              className={`py-3.5 px-4 rounded-loro text-xs font-bold font-typewriter uppercase tracking-wider text-[#334D66] bg-[#EDE3D3] hover:bg-[#e2d5c2] border border-[#EDE3D3] transition-all flex items-center justify-center gap-2 ${
                isSpinning ? "opacity-50 cursor-not-allowed" : "active:scale-95"
              }`}
            >
              <span>🎲 {isSpinning ? "Rolling..." : "Spin Again"}</span>
            </button>

            <button
              type="button"
              onClick={handleCookNow}
              disabled={isSpinning}
              className="py-3.5 px-4 rounded-loro text-xs font-bold uppercase tracking-wider text-white bg-[#E56960] hover:bg-[#C94F46] shadow-loro-coral btn-shimmer transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🔥 Cook This Feast →</span>
            </button>
          </div>

          <p className="text-[11px] font-typewriter text-[#636951]">
            Can our AI pitmaster turn this random combo into a 5-star meal? You bet!
          </p>
        </div>
      </div>
    </div>
  );
}
