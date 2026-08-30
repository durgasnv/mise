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
    ctx.fillStyle = "#FBF0DF";
    ctx.fillRect(0, 0, 800, 1000);

    // Inner decorative border
    ctx.strokeStyle = "#334D66";
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 740, 940);

    ctx.strokeStyle = "#E56960";
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, 728, 928);

    // Top Header Banner
    ctx.fillStyle = "#334D66";
    ctx.fillRect(36, 36, 728, 70);

    ctx.fillStyle = "#FBF0DF";
    ctx.font = "bold 16px Courier, monospace";
    ctx.textAlign = "center";
    ctx.fillText("MISE KITCHEN • ARTISANAL AI PANTRY RECIPE", 400, 78);

    // Dish Title
    ctx.fillStyle = "#334D66";
    ctx.font = "bold 32px Georgia, serif";
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
    ctx.fillStyle = "#E56960";
    ctx.font = "bold 14px Courier, monospace";
    ctx.fillText(`⏱️ PREP: ${recipe.prepTime || "15m"}  •  👥 ${recipe.servings || "2 PORTIONS"}  •  🔥 FRESH HEARTH`, 400, y);

    // Divider Line
    y += 25;
    ctx.strokeStyle = "#EDE3D3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(740, y);
    ctx.stroke();

    // Ingredients Section
    y += 40;
    ctx.fillStyle = "#334D66";
    ctx.font = "bold 18px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("PANTRY INGREDIENTS:", 60, y);

    y += 25;
    ctx.fillStyle = "#494E3B";
    ctx.font = "15px Courier, monospace";
    (recipe.ingredients || []).slice(0, 5).forEach((ing) => {
      ctx.fillText(`• ${ing.length > 55 ? ing.substring(0, 52) + "..." : ing}`, 60, y);
      y += 24;
    });

    // Method Summary
    y += 25;
    ctx.fillStyle = "#334D66";
    ctx.font = "bold 18px Georgia, serif";
    ctx.fillText("METHOD & COOKING:", 60, y);

    y += 25;
    ctx.fillStyle = "#334D66";
    ctx.font = "14px Georgia, serif";
    (recipe.instructions || []).slice(0, 4).forEach((step, idx) => {
      const stepText = `${idx + 1}. ${step.length > 70 ? step.substring(0, 68) + "..." : step}`;
      ctx.fillText(stepText, 60, y);
      y += 28;
    });

    // Beverage Pairing Quote
    y += 25;
    ctx.fillStyle = "#FFF3EE";
    ctx.fillRect(60, y, 680, 80);
    ctx.strokeStyle = "#E56960";
    ctx.lineWidth = 1;
    ctx.strokeRect(60, y, 680, 80);

    ctx.fillStyle = "#E56960";
    ctx.font = "bold 12px Courier, monospace";
    ctx.fillText("✨ CHEF PAIRING & TASTING NOTE", 80, y + 25);

    ctx.fillStyle = "#334D66";
    ctx.font = "italic 13px Georgia, serif";
    const noteText = recipe.pairing ? `Drink: ${recipe.pairing}` : recipe.chefNote || "Serve hot with flaky salt.";
    ctx.fillText(noteText.length > 75 ? noteText.substring(0, 72) + "..." : noteText, 80, y + 52);

    // Footer
    ctx.fillStyle = "#636951";
    ctx.font = "11px Courier, monospace";
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-loro-lg border border-[#EDE3D3] shadow-loro-lg max-w-lg w-full p-6 space-y-6 my-8 animate-toast-enter">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EDE3D3] pb-4">
          <div>
            <span className="text-xs font-typewriter font-bold uppercase tracking-wider text-[#E56960]">
              📸 Export Vintage Menu Card
            </span>
            <h3 className="font-display text-2xl text-[#334D66] mt-0.5">
              Share Your Feast
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-[#334D66] text-base p-1">
            ✕
          </button>
        </div>

        {/* Canvas Visual Preview */}
        <div className="flex justify-center border border-[#EDE3D3] rounded-loro overflow-hidden shadow-inner bg-[#FBF0DF]">
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
              className="py-3 px-4 rounded-loro text-xs font-bold font-typewriter uppercase tracking-wider text-center text-white bg-[#E56960] hover:bg-[#C94F46] shadow-loro-coral btn-shimmer transition-all"
            >
              📥 Download PNG
            </a>

            <button
              onClick={handleNativeShare}
              className="py-3 px-4 rounded-loro text-xs font-bold font-typewriter uppercase tracking-wider text-center text-[#334D66] bg-[#EDE3D3] hover:bg-[#e0d4c0] transition-all"
            >
              🚀 Share Card
            </button>
          </div>

          <p className="text-center text-[11px] font-typewriter text-[#636951]">
            Ready to post to Instagram stories, WhatsApp, or iMessage!
          </p>
        </div>
      </div>
    </div>
  );
}
