import { useRef, useEffect, useState } from "react";

export function SocialShareModal({ recipe, onClose }) {
  const canvasRef = useRef(null);
  const [downloadUrl, setDownloadUrl] = useState("");

  useEffect(() => {
    if (!recipe || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Width & Height (postcard aspect ratio: 800 x 1000)
    canvas.width = 800;
    canvas.height = 1000;

    // Background Canvas
    ctx.fillStyle = "#F5E6CC";
    ctx.fillRect(0, 0, 800, 1000);

    // Inner decorative border
    ctx.strokeStyle = "#201B17";
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 740, 940);

    ctx.strokeStyle = "#F2382F";
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, 728, 928);

    // Top Header Banner
    ctx.fillStyle = "#201B17";
    ctx.fillRect(36, 36, 728, 70);

    ctx.fillStyle = "#F5E6CC";
    ctx.font = "bold 16px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("MISE KITCHEN • ARTISANAL AI PANTRY RECIPE", 400, 78);

    // Dish Title
    ctx.fillStyle = "#201B17";
    ctx.font = "bold 32px Bodoni Moda, serif";
    ctx.textAlign = "center";

    // Wrap title if long
    const words = (recipe.title || "Custom Dish").split(" ");
    let line = "";
    let y = 160;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 680 && n > 0) {
        ctx.fillText(line, 400, y);
        line = words[n] + " ";
        y += 40;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 400, y);

    // Meta Badge Line
    y += 35;
    ctx.fillStyle = "#F2382F";
    ctx.font = "bold 14px IBM Plex Mono, monospace";
    ctx.fillText(`⏱️ PREP: ${recipe.prepTime || "15m"}  •  👥 ${recipe.servings || "2 PORTIONS"}  •  🔥 FRESH HEARTH`, 400, y);

    // Divider Line
    y += 25;
    ctx.strokeStyle = "#E3CFB1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(740, y);
    ctx.stroke();

    // Ingredients Section
    y += 40;
    ctx.fillStyle = "#201B17";
    ctx.font = "bold 18px Bodoni Moda, serif";
    ctx.textAlign = "left";
    ctx.fillText("PANTRY INGREDIENTS:", 60, y);

    y += 25;
    ctx.fillStyle = "#513E32";
    ctx.font = "15px IBM Plex Mono, monospace";
    (recipe.ingredients || []).slice(0, 5).forEach((ing) => {
      ctx.fillText(`• ${ing.length > 55 ? ing.substring(0, 52) + "..." : ing}`, 60, y);
      y += 24;
    });

    // Method Summary
    y += 25;
    ctx.fillStyle = "#201B17";
    ctx.font = "bold 18px Bodoni Moda, serif";
    ctx.fillText("METHOD & COOKING:", 60, y);

    y += 25;
    ctx.fillStyle = "#201B17";
    ctx.font = "14px Bodoni Moda, serif";
    (recipe.instructions || []).slice(0, 4).forEach((step, idx) => {
      const stepText = `${idx + 1}. ${step.length > 70 ? step.substring(0, 68) + "..." : step}`;
      ctx.fillText(stepText, 60, y);
      y += 28;
    });

    // Beverage Pairing Quote
    y += 25;
    ctx.fillStyle = "#FFF0E4";
    ctx.fillRect(60, y, 680, 80);
    ctx.strokeStyle = "#F2382F";
    ctx.lineWidth = 1;
    ctx.strokeRect(60, y, 680, 80);

    ctx.fillStyle = "#F2382F";
    ctx.font = "bold 12px IBM Plex Mono, monospace";
    ctx.fillText("✨ CHEF PAIRING & TASTING NOTE", 80, y + 25);

    ctx.fillStyle = "#201B17";
    ctx.font = "italic 13px Bodoni Moda, serif";
    const noteText = recipe.pairing ? `Drink: ${recipe.pairing}` : recipe.chefNote || "Serve hot with flaky salt.";
    ctx.fillText(noteText.length > 75 ? noteText.substring(0, 72) + "..." : noteText, 80, y + 52);

    // Footer
    ctx.fillStyle = "#6D5545";
    ctx.font = "11px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Crafted with Fridge2Feast • Turn 3 Ingredients into a Feast", 400, 940);

    // Generate URL
    try {
      const dataUrl = canvas.toDataURL("image/png");
      setDownloadUrl(dataUrl);
    } catch (e) {
      console.error("Canvas export error:", e);
    }
  }, [recipe]);

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe I crafted on Fridge2Feast: ${recipe.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.warn("Share cancelled or failed:", err);
      }
    } else {
      navigator.clipboard.writeText(`${recipe.title}\n${window.location.href}`);
      alert("Recipe link copied to clipboard!");
    }
  }

  return (
    <div className="editorial-modal-backdrop fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="editorial-modal share-dialog bg-[#FFF8EC] rounded-loro-lg border border-[#E3CFB1] shadow-loro-lg max-w-lg w-full p-6 space-y-6 my-8 animate-toast-enter">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E3CFB1] pb-4">
          <div>
            <span className="text-xs font-typewriter font-bold uppercase tracking-wider text-[#F2382F]">
              📸 Export Vintage Menu Card
            </span>
            <h3 className="font-display text-2xl text-[#201B17] mt-0.5">
              Share Your Feast
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-[#201B17] text-base p-1">
            ✕
          </button>
        </div>

        {/* Canvas Visual Preview */}
        <div className="flex justify-center border border-[#E3CFB1] rounded-loro overflow-hidden shadow-inner bg-[#F5E6CC]">
          <canvas
            ref={canvasRef}
            className="w-full max-w-[360px] h-auto rounded shadow-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <a
              href={downloadUrl}
              download={`${recipe?.title ? recipe.title.replace(/\s+/g, "_").toLowerCase() : "recipe"}_card.png`}
              className="py-3 px-4 rounded-loro text-xs font-bold font-typewriter uppercase tracking-wider text-center text-white bg-[#F2382F] hover:bg-[#CF2A23] shadow-loro-coral btn-shimmer transition-all"
            >
              📥 Download PNG
            </a>

            <button
              onClick={handleNativeShare}
              className="py-3 px-4 rounded-loro text-xs font-bold font-typewriter uppercase tracking-wider text-center text-[#201B17] bg-[#E3CFB1] hover:bg-[#e0d4c0] transition-all"
            >
              🚀 Share Card
            </button>
          </div>

          <p className="text-center text-[11px] font-typewriter text-[#6D5545]">
            Ready to post to Instagram stories, WhatsApp, or iMessage!
          </p>
        </div>
      </div>
    </div>
  );
}
