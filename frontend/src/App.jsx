import { useState } from "react";
import { motion, MotionConfig, AnimatePresence } from "framer-motion";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./pages/LandingPage";
import { HomePage } from "./pages/HomePage";
import { SavedPage } from "./pages/SavedPage";
import { SavedRecipePage } from "./pages/SavedRecipePage";
import { PantryWheelModal } from "./components/PantryWheelModal";
import { CookingModeModal } from "./components/CookingModeModal";
import { getSavedRecipes } from "./lib/savedRecipes";

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" } },
};

export default function App() {
  const [view, setView] = useState("landing");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showGlobalWheel, setShowGlobalWheel] = useState(false);
  const [showDemoCooking, setShowDemoCooking] = useState(false);
  const [prefilledIngredients, setPrefilledIngredients] = useState(null);

  function handleNavigate(targetView, options = {}) {
    if (options.quickItems) {
      setPrefilledIngredients(options.quickItems);
    }
    setView(targetView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openSavedRecipe(recipe) {
    setSelectedRecipe(recipe);
    setView("saved-recipe");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          onOpenMysteryWheel={() => setShowGlobalWheel(true)}
          onOpenDemoCookingMode={() => setShowDemoCooking(true)}
        />

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {view === "landing" && (
              <motion.div key="landing" variants={pageVariants} initial="hidden" animate="show" exit="exit">
                <LandingPage
                  onEnter={(opts) => handleNavigate("ask", opts || {})}
                  onViewSaved={() => handleNavigate("saved")}
                  onOpenMysteryWheel={() => setShowGlobalWheel(true)}
                  onOpenDemoCookingMode={() => setShowDemoCooking(true)}
                />
              </motion.div>
            )}
            {view === "ask" && (
              <motion.div key="ask" variants={pageVariants} initial="hidden" animate="show" exit="exit">
                <HomePage
                  onBack={() => handleNavigate("landing")}
                  onViewSaved={() => handleNavigate("saved")}
                  initialIngredients={prefilledIngredients}
                />
              </motion.div>
            )}
            {view === "saved" && (
              <motion.div key="saved" variants={pageVariants} initial="hidden" animate="show" exit="exit">
                <SavedPage
                  onBack={() => handleNavigate("ask")}
                  onOpenRecipe={openSavedRecipe}
                />
              </motion.div>
            )}
            {view === "saved-recipe" && (
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
      </div>
    </MotionConfig>
  );
}
