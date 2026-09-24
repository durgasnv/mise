import { useState } from "react";
import { motion } from "framer-motion";

const FEATURES = [
  {
    number: "01",
    title: "See what is already there",
    desc: "Type a few ingredients, dictate them, or let the fridge scanner identify what is ready to use.",
    action: "Scan the fridge",
    kind: "scan",
  },
  {
    number: "02",
    title: "Get three real directions",
    desc: "Mise creates three distinct recipes—not minor variations—balanced around your time and taste.",
    action: "Enter the kitchen",
    kind: "spark",
  },
  {
    number: "03",
    title: "Cook without the clutter",
    desc: "Large-format steps, spoken guidance, smart timers, and instant portion scaling stay beside you.",
    action: "Try cooking mode",
    kind: "timer",
  },
];

const FEATURED_DISHES = [
  {
    number: "01",
    title: "Gochujang glazed shiitake noodles",
    meta: "18 min · bold & spicy",
    ingredients: "Noodles / Shiitake / Gochujang",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=88",
  },
  {
    number: "02",
    title: "Charred corn with scallion butter",
    meta: "15 min · smoky cast-iron",
    ingredients: "Sweet corn / Butter / Scallion",
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=88",
  },
  {
    number: "03",
    title: "Crisp chicken with rosemary jus",
    meta: "25 min · slow comfort",
    ingredients: "Chicken / Rosemary / Shallot",
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=88",
  },
];

const MARQUEE_ITEMS = ["NAME IT", "MAKE IT", "TASTE IT", "SAVE IT"];

function LineIcon({ kind }) {
  if (kind === "scan") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M12 23V12h11M41 12h11v11M52 41v11H41M23 52H12V41" />
        <path d="M20 37c6-13 18-13 24 0M24 29c3-4 5-6 8-6s6 2 8 6" />
      </svg>
    );
  }
  if (kind === "timer") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="35" r="18" /><path d="M32 17V9M25 9h14M32 35l9-7M48 20l4-4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 8c2 14 9 21 23 23-14 2-21 9-23 23-2-14-9-21-23-23 14-2 21-9 23-23Z" />
      <path d="M50 7c.7 4 3 6.3 7 7-4 .7-6.3 3-7 7-.7-4-3-6.3-7-7 4-.7 6.3-3 7-7Z" />
    </svg>
  );
}

export function LandingPage({ user, onEnter, onViewSaved, onOpenMysteryWheel, onOpenDemoCookingMode, onRequestAuth }) {
  const [quick1, setQuick1] = useState("Sweet corn");
  const [quick2, setQuick2] = useState("Garlic");
  const [quick3, setQuick3] = useState("Butter");

  function handleQuickStart(e) {
    e.preventDefault();
    if (!user) {
      onRequestAuth?.("Sign in to turn this pantry trio into dinner.");
      return;
    }
    onEnter({ quickItems: [quick1, quick2, quick3] });
  }

  function handleFeatureAction(kind) {
    if (kind === "timer") {
      onOpenDemoCookingMode();
      return;
    }
    if (!user) {
      onRequestAuth?.("Sign in or use the demo account to open the Mise kitchen.");
      return;
    }
    onEnter();
  }

  return (
    <div className="mise-landing">
      <section className="editorial-hero">
        <div className="hero-grid-lines" aria-hidden="true" />
        <motion.div
          className="editorial-shell hero-layout"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55 }}
        >
          <div className="hero-kicker">
            <span>AI culinary studio</span>
            <span>Est. 2026</span>
          </div>

          <div className="hero-heading-wrap">
            <h1 className="hero-heading">
              <span>Cook with</span>
              <span className="hero-heading-indent">what you <em>have.</em></span>
            </h1>
          </div>

          <div className="hero-visual" aria-label="A fresh noodle dish ready to serve">
            <img
              src="https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=90"
              alt="Colorful Asian-inspired dish with vegetables"
            />
            <span className="ingredient-note ingredient-note-one">Tonight's odds & ends</span>
            <span className="ingredient-note ingredient-note-two">One very good dinner</span>
          </div>

          <div className="hero-copy">
            <p>
              A thoughtful cooking companion that turns the ingredients you already own into clear, beautiful recipes.
            </p>
            <button type="button" className="text-link" onClick={() => onEnter()}>
              Enter the kitchen <span aria-hidden="true">↗</span>
            </button>
          </div>

          <form className="pantry-strip" onSubmit={handleQuickStart}>
            <div className="pantry-strip-title">
              <span className="micro-label">Quick start / 3 ingredients</span>
              <strong>What is in your kitchen?</strong>
            </div>
            {[quick1, quick2, quick3].map((value, index) => (
              <label className="pantry-field" key={index}>
                <span>0{index + 1}</span>
                <input
                  value={value}
                  onChange={(event) => [setQuick1, setQuick2, setQuick3][index](event.target.value)}
                  aria-label={`Ingredient ${index + 1}`}
                />
              </label>
            ))}
            <button className="pantry-submit" type="submit">
              Make dinner <span aria-hidden="true">→</span>
            </button>
          </form>
        </motion.div>
      </section>

      <section className="manifesto-section">
        <div className="editorial-shell manifesto-grid">
          <div className="manifesto-title">
            <span className="micro-label">The Mise method</span>
            <h2>Less waste.<br /><em>More possibility.</em></h2>
          </div>
          <div className="manifesto-lead">
            <p>Good cooking does not begin with a shopping list. It begins by paying attention.</p>
          </div>
          <div className="manifesto-body">
            <p>
              Mise reads the room—your ingredients, your appetite, your time—and builds a way forward. Every suggestion is practical enough for a Tuesday and considered enough to feel special.
            </p>
            <button type="button" className="round-action" onClick={onOpenMysteryWheel}>
              <span>Surprise me</span><span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className="manifesto-stamp" aria-hidden="true">
            <span>MISE</span><small>Everything in its place</small>
          </div>
        </div>
      </section>

      <section className="feature-section" id="how-it-works">
        <div className="editorial-shell">
          <div className="section-heading-row">
            <span className="micro-label">From fridge to feast</span>
            <h2>One calm flow from<br /><em>idea to first bite.</em></h2>
            <p>No tabs to juggle, no recipe essays to decode. Just the useful part, beautifully organized.</p>
          </div>
          <div className="feature-list">
            {FEATURES.map((feature) => (
              <article className="feature-row" key={feature.number}>
                <span className="feature-number">({feature.number})</span>
                <div className="feature-icon"><LineIcon kind={feature.kind} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <button type="button" onClick={() => handleFeatureAction(feature.kind)}>
                  {feature.action} <span aria-hidden="true">↗</span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dish-section">
        <div className="editorial-shell">
          <div className="dish-heading">
            <div>
              <span className="micro-label">Made from almost nothing</span>
              <h2>Small lists.<br /><em>Big dinners.</em></h2>
            </div>
            <button type="button" className="cream-link" onClick={() => onEnter()}>
              Create your own <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="dish-grid">
            {FEATURED_DISHES.map((dish) => (
              <article className="dish-card" key={dish.number}>
                <div className="dish-image-wrap">
                  <img src={dish.image} alt={dish.title} loading="lazy" />
                  <span>{dish.number}</span>
                </div>
                <div className="dish-card-copy">
                  <p>{dish.ingredients}</p>
                  <h3>{dish.title}</h3>
                  <span>{dish.meta}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tools-section">
        <div className="tools-photo">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1600&q=88"
            alt="Cook preparing food in a warm kitchen"
            loading="lazy"
          />
        </div>
        <div className="tools-copy">
          <span className="micro-label">Stay in the moment</span>
          <h2>Your hands are busy.<br /><em>Mise is not.</em></h2>
          <p>
            Keep your screen awake, hear each step aloud, launch timers from the recipe, and scale every quantity without doing the math.
          </p>
          <button type="button" className="outline-button" onClick={onOpenDemoCookingMode}>
            Preview cooking mode <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <section className="marquee-band" aria-label="Mise process">
        <div className="editorial-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
            <span key={`${item}-${index}`}>{item} <i>✦</i></span>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div className="editorial-shell final-cta-grid">
          <span className="micro-label">Your fridge is full of ideas</span>
          <h2>So, what are we<br /><em>making tonight?</em></h2>
          <div className="final-cta-actions">
            <button type="button" className="solid-button" onClick={() => onEnter()}>
              Open the kitchen <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="text-link" onClick={onViewSaved}>
              Browse your cookbook
            </button>
          </div>
        </div>
      </section>

      <footer className="editorial-footer">
        <div className="editorial-shell footer-grid">
          <div className="footer-brand">MISE<em>kitchen</em></div>
          <p>Intelligent recipes for the food you already have.</p>
          <div className="footer-meta">
            <span>Made for curious home cooks</span>
            <span>© 2026 Mise Kitchen</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
