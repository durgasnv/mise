import { useEffect, useRef, useState } from "react";
import { getSavedRecipes } from "../lib/savedRecipes";
import { getCurrentUser, signOutChef } from "../lib/auth";
import { AuthModal } from "./AuthModal";
import { TasteProfileModal } from "./TasteProfileModal";

export function Navbar({ currentView, onNavigate, onOpenMysteryWheel, onOpenDemoCookingMode }) {
  const [savedCount, setSavedCount] = useState(0);
  const [user, setUser] = useState(getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTasteModal, setShowTasteModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function updateCount() {
      try { setSavedCount(getSavedRecipes().length); } catch { setSavedCount(0); }
    }
    function updateAuth(event) {
      setUser(event.detail?.user || getCurrentUser());
      updateCount();
    }
    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("mise-auth-change", updateAuth);
    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("mise-auth-change", updateAuth);
    };
  }, [currentView]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function navigate(view) {
    setMobileOpen(false);
    onNavigate(view);
  }

  async function handleLogout() {
    await signOutChef();
    setUser(null);
    setProfileOpen(false);
    setMobileOpen(false);
  }

  const navigation = [
    { view: 'landing', label: 'About' },
    { view: 'ask', label: 'Kitchen' },
    { view: 'pantry', label: 'Pantry' },
    { view: 'plan', label: 'Plan' },
    { view: 'saved', label: 'Cookbook' },
  ];
  const activeView = currentView === 'saved-recipe' ? 'saved' : currentView;

  return (
    <>
      <header className="mise-navbar">
        <div className="mise-nav-inner">
          <button className="mise-wordmark" type="button" onClick={() => navigate("landing")} aria-label="Mise home">
            MISE<span>kitchen</span>
          </button>

          <nav className="mise-desktop-nav" aria-label="Primary navigation">
            {navigation.map(item => (
              <button key={item.view} type="button" className={activeView === item.view ? 'active' : ''} aria-current={activeView === item.view ? 'page' : undefined} onClick={() => navigate(item.view)}>
                {item.label}{item.view === 'saved' && savedCount > 0 && <sup> {savedCount}</sup>}
              </button>
            ))}
          </nav>

          <div className="mise-nav-actions">
            {user ? (
              <div className="mise-profile" ref={menuRef}>
                <button type="button" className="profile-trigger" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}>
                  <span>{user.avatar || "M"}</span>
                  <em>{user.name.split(" ")[0]}</em>
                </button>
                {profileOpen && (
                  <div className="mise-profile-menu">
                    <div className="profile-menu-head">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <button type="button" onClick={() => { setShowTasteModal(true); setProfileOpen(false); }}>Taste profile</button>
                    <button type="button" onClick={() => navigate("saved")}>Saved recipes ({savedCount})</button>
                    <button type="button" className="signout" onClick={handleLogout}>Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" className="sign-in-link" onClick={() => setShowAuthModal(true)}>Sign in</button>
            )}
            <button type="button" className="nav-cta" onClick={() => navigate("ask")}>Start cooking <span>↗</span></button>
            <button type="button" className="menu-toggle" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
              <span /><span />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="mise-mobile-nav" aria-label="Mobile navigation">
            {navigation.map((item, index) => (
              <button key={item.view} type="button" className={activeView === item.view ? 'active' : ''} aria-current={activeView === item.view ? 'page' : undefined} onClick={() => navigate(item.view)}>
                <span>{String(index + 1).padStart(2, '0')}</span>{item.label}{item.view === 'saved' && savedCount > 0 && ` (${savedCount})`}
              </button>
            ))}
            <button type="button" onClick={() => { setMobileOpen(false); onOpenMysteryWheel(); }}><span>06</span>Mystery wheel</button>
            <button type="button" onClick={() => { setMobileOpen(false); onOpenDemoCookingMode(); }}><span>07</span>Cooking mode</button>
            {!user && <button type="button" onClick={() => { setMobileOpen(false); setShowAuthModal(true); }}><span>08</span>Sign in</button>}
          </nav>
        )}
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={(nextUser) => setUser(nextUser)} />
      <TasteProfileModal isOpen={showTasteModal} onClose={() => setShowTasteModal(false)} onSave={(nextUser) => setUser(nextUser)} />
    </>
  );
}
