import { Home, User } from "lucide-react";
import jiwooMascot from "../assets/jiwoo.svg";

export default function BottomNavbar({
  activeScreen,
  setScreen,
  onCenterClick,
}) {
  return (
    <div className="md:hidden relative w-full max-w-[320px] sm:max-w-xs mx-auto">
      <div className="w-full h-12 bg-[#F4A950] border-2 border-[#4A3525] rounded-full flex items-center justify-between px-10 shadow-[0_4px_0_#4A3525]">
        <button
          type="button"
          onClick={() => setScreen(1)}
          aria-label="Home"
          className={`p-1.5 rounded-full transition-transform active:scale-90 cursor-pointer ${
            activeScreen === 5 ? "text-[#4A3525]" : "text-[#4A3525]/70"
          }`}
        >
          <Home size={20} className="stroke-[2.2]" />
        </button>

        <button
          type="button"
          onClick={() => setScreen(6)}
          aria-label="Profile"
          className={`p-1.5 rounded-full transition-transform active:scale-90 cursor-pointer ${
            activeScreen === 6 ? "text-[#4A3525]" : "text-[#4A3525]/70"
          }`}
        >
          <User size={20} className="stroke-[2.2]" />
        </button>
      </div>

      <button
        type="button"
        onClick={onCenterClick}
        aria-label="Jiwoo Action"
        className="absolute left-1/2 -top-4 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-2 border-[#4A3525] flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
      >
        <img
          src={jiwooMascot}
          alt="Jiwoo Icon"
          draggable={false}
          className="w-9 h-9 object-contain"
        />
      </button>
    </div>
  );
}
