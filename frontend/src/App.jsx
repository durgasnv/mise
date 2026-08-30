import { useState, useEffect } from "react";
import { motion, MotionConfig, AnimatePresence } from "framer-motion";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./pages/LandingPage";
import { HomePage } from "./pages/HomePage";
import { SavedPage } from "./pages/SavedPage";
import { SavedRecipePage } from "./pages/SavedRecipePage";
import { PantryWheelModal } from "./components/PantryWheelModal";
import { CookingModeModal } from "./components/CookingModeModal";
import { AuthModal } from "./components/AuthModal";
import { getCurrentUser } from "./lib/auth";
import { getSavedRecipes } from "./lib/savedRecipes";

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" } },
};

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [view, setView] = useState(getCurrentUser() ? "ask" : "landing");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showGlobalWheel, setShowGlobalWheel] = useState(false);
  const [showDemoCooking, setShowDemoCooking] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState("");
  const [prefilledIngredients, setPrefilledIngredients] = useState(null);

  useEffect(() => {
    function handleAuthChange(e) {
      const updatedUser = e.detail?.user || getCurrentUser();
      setUser(updatedUser);
      if (updatedUser && view === "landing") {
        setView("ask");
      }
    }
    window.addEventListener("mise-auth-change", handleAuthChange);
    return () => window.removeEventListener("mise-auth-change", handleAuthChange);
  }, [view]);

  function requireAuth(actionCallback, message = "Please sign in or create an account to use this feature.") {
    if (user) {
      actionCallback();
    } else {
      setAuthPromptMessage(message);
      setShowAuthModal(true);
    }
  }

  function handleNavigate(targetView, options = {}) {
    if (targetView === "ask" || targetView === "saved" || targetView === "saved-recipe") {
      requireAuth(() => {
        if (options.quickItems) {
          setPrefilledIngredients(options.quickItems);
        }
        setView(targetView);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, `Please sign in to access ${targetView === "saved" ? "your Cookbook" : "The Kitchen"}.`);
      return;
    }

    if (options.quickItems) {
      setPrefilledIngredients(options.quickItems);
    }
    setView(targetView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openSavedRecipe(recipe) {
    requireAuth(() => {
      setSelectedRecipe(recipe);
      setView("saved-recipe");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, "Please sign in to view saved recipes.");
  }

  function handleMysteryComboSelect(items) {
    setPrefilledIngredients(items);
    setShowGlobalWheel(false);
    setView("ask");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const demoRecipe = selectedRecipe || getSavedRecipes()[0] || {
    title: "Smoked Butter Sweet Corn & Scallion Sauté",
    prepTime: "15 mins",
    servings: "2 portions",
    ingredients: [
      "2 ears Fresh sweet corn",
      "2 tbsp Cultured butter",
      "4 cloves Garlic, slivered",
      "Charred scallions & smoked sea salt",
    ],
    instructions: [
      "Heat a cast-iron skillet over medium-high heat until hot.",
      "Melt 2 tbsp cultured butter and add slivered garlic, toasting for 45 seconds.",
      "Add fresh sweet corn kernels and let sear undisturbed for 3 minutes for deep caramelization.",
      "Toss with charred scallion ribbons, season with smoked flake sea salt, and serve hot.",
    ],
    chefNote: "Pair with a squeeze of charred lime for authentic smokehouse zest.",
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#FBF0DF] text-[#334D66]">
        <Navbar
          currentView={view}
          onNavigate={(v) => handleNavigate(v)}
          onOpenMysteryWheel={() => requireAuth(() => setShowGlobalWheel(true), "Sign in to spin the Mystery Pantry Wheel!")}
          onOpenDemoCookingMode={() => requireAuth(() => setShowDemoCooking(true), "Sign in to launch Hands-Free Cooking Mode!")}
        />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {view === "landing" && (
              <motion.div key="landing" variants={pageVariants} initial="hidden" animate="show" exit="exit">
                <LandingPage
                  user={user}
                  onEnter={(opts) => handleNavigate("ask", opts || {})}
                  onViewSaved={() => handleNavigate("saved")}
                  onOpenMysteryWheel={() => requireAuth(() => setShowGlobalWheel(true), "Sign in to spin the Mystery Pantry Wheel!")}
                  onOpenDemoCookingMode={() => requireAuth(() => setShowDemoCooking(true), "Sign in to launch Hands-Free Cooking Mode!")}
                  onRequestAuth={(msg) => { setAuthPromptMessage(msg); setShowAuthModal(true); }}
                />
              </motion.div>
            )}
            {view === "ask" && user && (
              <motion.div key="ask" variants={pageVariants} initial="hidden" animate="show" exit="exit">
                <HomePage
                  user={user}
                  onBack={() => handleNavigate("landing")}
                  onViewSaved={() => handleNavigate("saved")}
                  initialIngredients={prefilledIngredients}
                  onRequestAuth={(msg) => { setAuthPromptMessage(msg); setShowAuthModal(true); }}
                />
              </motion.div>
            )}
            {view === "saved" && user && (
              <motion.div key="saved" variants={pageVariants} initial="hidden" animate="show" exit="exit">
                <SavedPage
                  onBack={() => handleNavigate("ask")}
                  onOpenRecipe={openSavedRecipe}
                />
              </motion.div>
            )}
            {view === "saved-recipe" && user && (
              <motion.div key="saved-recipe" variants={pageVariants} initial="hidden" animate="show" exit="exit">
                <SavedRecipePage
                  recipe={selectedRecipe}
                  onBack={() => handleNavigate("saved")}
                  onCookNew={() => handleNavigate("ask")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Mystery Roulette Modal */}
        {showGlobalWheel && (
          <PantryWheelModal
            onSelectCombo={handleMysteryComboSelect}
            onClose={() => setShowGlobalWheel(false)}
          />
        )}

        {/* Global Demo Cooking Mode Modal */}
        {showDemoCooking && (
          <CookingModeModal
            recipe={demoRecipe}
            onClose={() => setShowDemoCooking(false)}
          />
        )}

        {/* Auth Gatekeeper Modal */}
        <AuthModal
          isOpen={showAuthModal}
          promptMessage={authPromptMessage}
          onClose={() => { setShowAuthModal(false); setAuthPromptMessage(""); }}
          onAuthSuccess={(u) => {
            setUser(u);
            setShowAuthModal(false);
            setView("ask");
          }}
        />
      </div>
    </MotionConfig>
  );
}
