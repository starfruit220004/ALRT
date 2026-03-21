import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["home", "services", "about", "contact"];

  return (
    <>
      <style>{`
        .nav-link {
          position: relative;
          color: rgb(226 232 240);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: capitalize;
          transition: color 0.2s;
          padding-bottom: 2px;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 9999px;
          opacity: 0;
          transition: opacity 0s;
        }
        .nav-link:hover {
          color: #fff;
        }
        .nav-link:hover::after,
        .nav-link.active::after {
          opacity: 1;
        }
        .nav-link.active {
          color: #fff;
        }
      `}</style>

      <nav className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 md:px-12 transition-all duration-300 ${scrolled ? "bg-[#060f1e]/90 backdrop-blur-md border-b border-white/6" : "bg-transparent border-b border-transparent"}`}>
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 no-underline">
            <img src="/logo.jpg" alt="ALRT" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />
            <span className="text-white font-extrabold text-sm tracking-[0.14em] uppercase">ALRT</span>
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <a
                key={link}
                href={`#${link}`}
                onClick={() => setActive(link)}
                className={`nav-link${active === link ? " active" : ""}`}
              >
                {link}
              </a>
            ))}
            <a
              href="/login"
              className="relative overflow-hidden bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg tracking-wide no-underline transition-all duration-200 hover:bg-blue-600 hover:shadow-[0_0_18px_rgba(59,130,246,0.45)] hover:-translate-y-px active:translate-y-0"
            >
              Sign In
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-[#060f1e]/95 backdrop-blur-md border-b border-white/6 flex flex-col px-6 py-4 gap-3 md:hidden">
          {links.map(link => (
            <a
              key={link}
              href={`#${link}`}
              onClick={() => { setMenuOpen(false); setActive(link); }}
              className="text-slate-200 hover:text-white text-sm font-medium tracking-wide transition-colors no-underline capitalize py-2 border-b border-white/6"
            >
              {link}
            </a>
          ))}
          <a
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg tracking-wide transition-colors no-underline text-center mt-1"
          >
            Sign In
          </a>
        </div>
      )}
    </>
  );
}