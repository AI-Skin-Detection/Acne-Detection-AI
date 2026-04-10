import React, { useState, useEffect } from "react";
import { Menu, X, Dna } from "lucide-react";

const Navbar: React.FC = () => {

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {

    const user = localStorage.getItem("user_id");

    if (user) {
      setLoggedIn(true);
    }

    const onScroll = () => setScrolled(window.scrollY > 40);

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);

  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const logout = () => {
    localStorage.removeItem("user_id");
    window.location.reload();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${scrolled ? "bg-black/80 backdrop-blur-md border-b border-green-500/20" : "bg-transparent"}`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Logo */}

        <button
          onClick={() => window.location.href = "/"}
          className="flex items-center gap-2"
        >
          <Dna className="w-5 h-5 text-green-400" />

          <span className="font-bold text-lg">
            <span className="text-white">DERM</span>
            <span className="text-green-400">AI</span>
          </span>

        </button>

        {/* Desktop Menu */}

        <div className="hidden md:flex items-center gap-8">

          <button
            onClick={() => scrollTo("how-it-works")}
            className="text-gray-300 hover:text-green-400"
          >
            Detector
          </button>

          <button
            onClick={() => scrollTo("acne-types-detail")}
            className="text-gray-300 hover:text-green-400"
          >
            Acne Types
          </button>

          <button
            onClick={() => scrollTo("about")}
            className="text-gray-300 hover:text-green-400"
          >
            About
          </button>

          {!loggedIn && (
            <>
              <button
                onClick={() => window.location.href = "/login"}
                className="text-gray-300 hover:text-green-400"
              >
                Login
              </button>

              <button
                onClick={() => window.location.href = "/signup"}
                className="text-gray-300 hover:text-green-400"
              >
                Signup
              </button>
            </>
          )}

          {loggedIn && (
            <>
              <span className="text-green-400 text-sm">
                Logged In
              </span>

              <button
                onClick={() => window.location.href = "/history"}
                className="text-gray-300 hover:text-green-400"
              >
                History
              </button>

              <button
                onClick={logout}
                className="text-red-400"
              >
                Logout
              </button>
            </>
          )}

          <button
            onClick={() => scrollTo("detector")}
            className="px-5 py-2 bg-green-500 text-black font-semibold rounded hover:bg-green-600"
          >
            Try Now
          </button>

        </div>

        {/* Mobile Button */}

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>

      </div>

      {/* Mobile Menu */}

      {mobileOpen && (

        <div className="md:hidden bg-black border-b border-green-500/20">

          <div className="px-6 py-4 space-y-3">

            <button
              onClick={() => scrollTo("how-it-works")}
              className="block w-full text-left text-gray-300"
            >
              Detector
            </button>

            <button
              onClick={() => scrollTo("acne-types-detail")}
              className="block w-full text-left text-gray-300"
            >
              Acne Types
            </button>

            <button
              onClick={() => scrollTo("about")}
              className="block w-full text-left text-gray-300"
            >
              About
            </button>

            {!loggedIn && (
              <>
                <button
                  onClick={() => window.location.href = "/login"}
                  className="block w-full text-left text-gray-300"
                >
                  Login
                </button>

                <button
                  onClick={() => window.location.href = "/signup"}
                  className="block w-full text-left text-gray-300"
                >
                  Signup
                </button>
              </>
            )}

            {loggedIn && (
              <>
                <button
                  onClick={() => window.location.href = "/history"}
                  className="block w-full text-left text-gray-300"
                >
                  History
                </button>

                <button
                  onClick={logout}
                  className="block w-full text-left text-red-400"
                >
                  Logout
                </button>
              </>
            )}

          </div>

        </div>

      )}

    </nav>
  );
};

export default Navbar;