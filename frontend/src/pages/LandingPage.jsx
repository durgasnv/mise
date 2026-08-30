import { useState } from "react";

const FEATURE_CARDS = [
  {
    icon: "⏱️",
    title: "Hands-Free Cooking Mode",
    desc: "Giant text for the stove, auto-detecting kitchen timers with sound chimes, and voice step readers.",
    badge: "Interactive Assistant",
  },
  {
    icon: "📸",
    title: "AI Fridge Photo Scanner",
    desc: "Take a picture of your open fridge or pantry; AI vision identifies your 3 best ingredients instantly.",
    badge: "Groq Vision",
  },
  {
    icon: "🎰",
    title: "Mystery Pantry Wheel",
    desc: "Spin 3 randomized culinary slot reels across proteins, produce, and seasonings for fun cooking challenges.",
    badge: "Roulette Game",
  },
  {
    icon: "⚖️",
    title: "Dynamic Portion Scaler",
    desc: "Scale recipes instantly from 1 serving up to an 8-person feast with automated fraction & gram math.",
    badge: "Auto Measurement",
  },
  {
    icon: "🔄",
    title: "Smart Swap Substitutions",
    desc: "Missing an ingredient? Click any item to view 3 chef-curated replacements and swap them into the recipe.",
    badge: "Pantry Advisor",
  },
  {
    icon: "🍷",
    title: "Smokehouse Drink & Side Pairings",
    desc: "Every dish comes paired with a craft highball, iced tea, or cocktail, plus a 2-ingredient companion side.",
    badge: "Sommelier Engine",
  },
];

const FEATURED_DISHES = [
  {
    title: "Smoked Butter Sweet Corn & Scallion Crisp",
    tag: "Smokehouse Star",
    time: "15 Mins",
    ingredients: ["Sweet Corn", "Cultured Butter", "Charred Scallions"],
    desc: "Plump corn kernels blistered in smoky brown butter, finished with crisp scallion ribbons and flake salt.",
  },
  {
    title: "Cast-Iron Chicken with Rosemary Jus",
    tag: "Comfort Feast",
    time: "25 Mins",
    ingredients: ["Chicken Thighs", "Woody Rosemary", "Shallots"],
    desc: "Golden shatteringly-crisp chicken rendered slowly in cast iron with aromatic rosemary reduction.",
  },
  {
    title: "Gochujang Glazed Shiitake Ramen Sauté",
    tag: "Asian Fusion",
    time: "18 Mins",
    ingredients: ["Ramen Noodles", "Shiitake Mushrooms", "Gochujang"],
    desc: "Springy noodles tossed in caramelized Korean chili glaze with deeply savory seared mushrooms.",
  },
];

const MARQUEE_ITEMS = [
  "SWEET CORN",
  "CAST-IRON SMOKE",
  "GARLIC CONFIT",
  "TOASTED SESAME",
  "CHILI CRISP",
  "CHARRED LIME",
  "ROSEMARY BUTTER",
  "CRISPY TOFU",
  "AGED SOY",
  "SHALLOT CONFIT",
  "FLAKE SEA SALT",
];

export function LandingPage({ user, onEnter, onViewSaved, onOpenMysteryWheel, onOpenDemoCookingMode, onRequestAuth }) {
  const [quick1, setQuick1] = useState("Sweet Corn");
  const [quick2, setQuick2] = useState("Garlic");
  const [quick3, setQuick3] = useState("Butter");

  function handleQuickStart(e) {
    e.preventDefault();
    if (!user) {
      if (onRequestAuth) onRequestAuth("Sign in to cook with these ingredients!");
      return;
    }
    onEnter({ quickItems: [quick1, quick2, quick3] });
  }

  function handleFeatureClick() {
    if (!user) {
      if (onRequestAuth) onRequestAuth("Sign in or use 1-Click Demo to unlock this feature!");
      return;
    }
    onEnter();
  }

  return (
    <div className="min-h-screen">
      {/* Top Hero Section */}
      <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 overflow-hidden">
        {/* Decorative ambient gradients */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-[#E56960]/6 pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-1/3 w-96 h-96 rounded-full bg-[#636951]/6 pointer-events-none blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#334D66]/10 text-[#334D66] border border-[#334D66]/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#E56960] animate-pulse" />
              <span className="text-xs font-typewriter font-bold uppercase tracking-widest">
                Artisanal AI Culinary Smokehouse
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl text-[#334D66] tracking-tight leading-[1.08]">
              Turn Any <span className="text-[#E56960] italic">3 Pantry Items</span> Into A Chef's Feast.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-[#636951] font-serif leading-relaxed max-w-2xl mx-auto">
              Inspired by the bold flavors, wood smoke, and effortless hospitality of great artisanal kitchens. No grocery run needed—just pick what you have.
            </p>

            {/* Feature Action Buttons Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onEnter()}
                className="px-8 py-4 rounded-loro text-base font-bold uppercase tracking-wider text-white bg-[#E56960] hover:bg-[#C94F46] shadow-loro-coral btn-shimmer transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5"
              >
                <span>🔥 Enter The Kitchen</span>
                <span className="text-xs font-typewriter opacity-90">→</span>
              </button>

              <button
                onClick={onOpenMysteryWheel}
                className="px-6 py-4 rounded-loro text-sm font-bold font-typewriter uppercase tracking-wider text-[#334D66] bg-[#EDE3D3] hover:bg-[#e0d3c0] border border-[#EDE3D3] shadow-loro-sm transition-all flex items-center gap-2"
              >
                <span>🎰 Spin Mystery Wheel</span>
              </button>

              <button
                onClick={onOpenDemoCookingMode}
                className="px-6 py-4 rounded-loro text-sm font-bold font-typewriter uppercase tracking-wider text-[#334D66] bg-[#FFFDF9] hover:bg-[#EDE3D3] border border-[#EDE3D3] shadow-loro-sm transition-all flex items-center gap-2"
              >
                <span>⏱️ Hands-Free Cooking Mode</span>
              </button>
            </div>
          </div>

          {/* Direct Interactive 3-Ingredient Quick Box */}
          <div className="max-w-3xl mx-auto bg-[#FFFDF9] p-6 sm:p-8 rounded-loro-lg border border-[#EDE3D3] shadow-loro-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#EDE3D3]">
              <span className="text-xs font-typewriter font-bold uppercase tracking-wider text-[#E56960] flex items-center gap-1.5">
                <span>⚡</span> Quick Pantry Launcher
              </span>
              <span className="text-xs font-typewriter text-[#636951]">
                Try this trio or edit any slot
              </span>
            </div>

            <form onSubmit={handleQuickStart} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                value={quick1}
                onChange={(e) => setQuick1(e.target.value)}
                placeholder="1. Protein/Base"
                className="bg-[#FBF0DF]/60 border border-[#EDE3D3] focus:border-[#E56960] text-sm text-[#334D66] font-medium rounded-lg px-3.5 py-2.5 outline-none"
              />
              <input
                type="text"
                value={quick2}
                onChange={(e) => setQuick2(e.target.value)}
                placeholder="2. Produce/Veg"
                className="bg-[#FBF0DF]/60 border border-[#EDE3D3] focus:border-[#E56960] text-sm text-[#334D66] font-medium rounded-lg px-3.5 py-2.5 outline-none"
              />
              <input
                type="text"
                value={quick3}
                onChange={(e) => setQuick3(e.target.value)}
                placeholder="3. Accent/Sauce"
                className="bg-[#FBF0DF]/60 border border-[#EDE3D3] focus:border-[#E56960] text-sm text-[#334D66] font-medium rounded-lg px-3.5 py-2.5 outline-none"
              />
              <button
                type="submit"
                className="bg-[#334D66] hover:bg-[#1F3144] text-white font-bold text-xs font-typewriter uppercase tracking-wider rounded-lg px-4 py-2.5 shadow-sm transition-all"
              >
                Cook Now →
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Marquee Ticker Ribbon */}
      <section className="border-y border-[#EDE3D3] bg-[#334D66] py-3 overflow-hidden">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <div key={idx} className="flex items-center gap-8">
              <span className="text-xs font-typewriter font-bold tracking-widest text-[#FBF0DF] uppercase">
                {item}
              </span>
              <span className="text-[#E56960] text-xs">✦</span>
            </div>
          ))}
        </div>
      </section>

      {/* All New Built-In Kitchen Features Showcase Grid */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-typewriter font-bold text-[#E56960] uppercase tracking-widest">
            Complete Kitchen Suite
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-[#334D66] mt-1">
            Built for Real Home Cooks
          </h2>
          <p className="text-sm font-serif text-[#636951] mt-2">
            Every feature is designed to make cooking effortless, interactive, and delicious.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURE_CARDS.map((feat, idx) => (
            <div
              key={idx}
              className="paper-card p-6 rounded-loro border border-[#EDE3D3] hover:border-[#E56960] hover:shadow-loro transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{feat.icon}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-typewriter font-bold uppercase bg-[#EDE3D3] text-[#334D66]">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="font-display text-xl text-[#334D66] mb-2">
                  {feat.title}
                </h3>
                <p className="text-xs text-[#636951] leading-relaxed">
                  {feat.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#EDE3D3]">
                <button
                  onClick={handleFeatureClick}
                  className="text-xs font-typewriter font-bold text-[#E56960] hover:text-[#C94F46] flex items-center gap-1"
                >
                  {user ? "Open in Kitchen →" : "Sign In to Unlock →"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Signature Dishes Showcase */}
      <section className="py-16 sm:py-24 bg-[#FFFDF9]/60 border-t border-[#EDE3D3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[#EDE3D3]">
            <div>
              <span className="text-xs font-typewriter font-bold text-[#636951] uppercase tracking-widest">
                From The Smokehouse Archives
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-[#334D66] mt-1">
                Sample 3-Ingredient Feasts
              </h2>
            </div>

            <button
              onClick={() => onEnter()}
              className="text-xs font-typewriter font-bold text-[#E56960] hover:text-[#C94F46] uppercase tracking-wider self-start sm:self-auto"
            >
              Create Your Own →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_DISHES.map((dish, i) => (
              <div
                key={i}
                className="paper-card p-6 rounded-loro border border-[#EDE3D3] flex flex-col justify-between hover:shadow-loro transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-typewriter font-bold bg-[#E56960]/10 text-[#E56960]">
                      {dish.tag}
                    </span>
                    <span className="text-xs font-typewriter text-[#636951]">
                      ⏱️ {dish.time}
                    </span>
                  </div>

                  <h3 className="font-display text-xl text-[#334D66] mb-2 leading-snug">
                    {dish.title}
                  </h3>

                  <p className="text-xs text-[#636951] leading-relaxed mb-4">
                    {dish.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#EDE3D3]">
                  <div className="text-[11px] font-typewriter text-[#334D66] font-bold uppercase tracking-wider mb-1">
                    Key Ingredients:
                  </div>
                  <div className="text-xs text-[#636951]">
                    {dish.ingredients.join(" • ")}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Big Bottom CTA Banner */}
          <div className="mt-16 bg-[#334D66] rounded-loro-lg p-8 sm:p-12 text-center text-[#FBF0DF] relative overflow-hidden shadow-loro-lg">
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <h3 className="font-display text-3xl sm:text-4xl text-white">
                Ready to see what your kitchen can do?
              </h3>
              <p className="text-sm sm:text-base text-[#FFBDA6] font-serif">
                Open your fridge, name three ingredients, and let the AI pitmaster craft your meal in seconds.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onEnter()}
                  className="px-8 py-3.5 bg-[#E56960] hover:bg-[#C94F46] text-white font-bold text-sm uppercase tracking-wider rounded-loro shadow-loro-coral btn-shimmer transition-all"
                >
                  🔥 Start Cooking Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EDE3D3] bg-[#EDE3D3]/40 py-8 text-center text-xs font-typewriter text-[#636951]">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p>© 2026 Mise Kitchen • Inspired by the craft of Loro Asian Smokehouse & Bar</p>
          <p>Powered by Groq Cloud & MongoDB Atlas • Mise en place for every kitchen</p>
        </div>
      </footer>
    </div>
  );
}
