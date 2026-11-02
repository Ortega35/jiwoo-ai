import { useState } from "react";
import {
  Calendar,
  MapPin,
  LogOut,
  ShieldCheck,
  Edit3,
  Check,
  Mail,
} from "lucide-react";
import jiwooMascot from "../assets/jiwoo.svg";
import BottomNavbar from "../components/BottomNavbar";
import {
  getCurrentUser,
  logoutUser,
  updateUserProfile,
} from "../services/authService";

export default function ProfileScreen({ setScreen }) {
  const [userProfile, setUserProfile] = useState(getCurrentUser());
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(userProfile.name);
  const [birthDate, setBirthDate] = useState(userProfile.birthDate);
  const [location, setLocation] = useState(userProfile.location);

  const handleSaveProfile = async () => {
    try {
      const updated = await updateUserProfile({ name, birthDate, location });
      if (updated) setUserProfile(updated);
    } catch {
      // Abaikan jika gagal
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setScreen(4);
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-between md:justify-center h-full w-full max-w-3xl mx-auto pt-6 pb-5 px-6 text-center animate-pop-1">
      {/* Kartu Profil Utama */}
      <div className="w-full bg-white/80 border-2 border-[#4A3525] rounded-3xl p-6 md:p-10 shadow-xl flex flex-col md:flex-row items-center gap-6 md:gap-10">
        {/* Kolom Foto Profil */}
        <div className="flex flex-col items-center shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#EAE6DF] border-2 border-[#4A3525] flex items-center justify-center overflow-hidden shadow-md">
            {userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                referrerPolicy="no-referrer"
                draggable={false}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={jiwooMascot}
                alt="Profile Avatar"
                draggable={false}
                className="w-20 h-20 object-contain mt-2"
              />
            )}
          </div>

          <span className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-700/30">
            <ShieldCheck size={12} /> {userProfile.authMethod}
          </span>
        </div>

        {/* Kolom Detail Biodata */}
        <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-base md:text-2xl font-bold text-[#4A3525]">
            {userProfile.name}
          </h2>
          <p className="text-xs text-[#4A3525]/70 flex items-center gap-1.5 mt-0.5">
            <Mail size={13} /> {userProfile.email}
          </p>

          {!isEditing ? (
            <div className="mt-5 w-full grid grid-cols-1 md:grid-cols-2 gap-3 text-[#4A3525]">
              <div className="bg-[#FDF3E7] border border-[#4A3525]/25 rounded-2xl p-3 flex items-center gap-3">
                <Calendar size={18} className="shrink-0 text-[#F4A950]" />
                <div className="text-left">
                  <p className="text-[10px] text-[#4A3525]/60 font-bold">
                    Tanggal Lahir
                  </p>
                  <p className="text-xs font-bold">{userProfile.birthDate}</p>
                </div>
              </div>

              <div className="bg-[#FDF3E7] border border-[#4A3525]/25 rounded-2xl p-3 flex items-center gap-3">
                <MapPin size={18} className="shrink-0 text-[#F4A950]" />
                <div className="text-left">
                  <p className="text-[10px] text-[#4A3525]/60 font-bold">
                    Lokasi / Domisili
                  </p>
                  <p className="text-xs font-bold">{userProfile.location}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 w-full flex flex-col gap-2 text-left">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full bg-[#FDF3E7] border border-[#4A3525]/40 rounded-full px-4 py-2 text-xs text-[#4A3525]"
              />
              <input
                type="text"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="Tanggal Lahir (07 April 2005)"
                className="w-full bg-[#FDF3E7] border border-[#4A3525]/40 rounded-full px-4 py-2 text-xs text-[#4A3525]"
              />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Domisili (Ponorogo / Bogor)"
                className="w-full bg-[#FDF3E7] border border-[#4A3525]/40 rounded-full px-4 py-2 text-xs text-[#4A3525]"
              />
            </div>
          )}

          <div className="mt-5 flex gap-2.5">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#F4A950] hover:bg-[#e5983e] text-[#4A3525] border border-[#4A3525] text-xs font-bold cursor-pointer transition-all"
              >
                <Edit3 size={13} /> Edit Profil
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-green-600 text-white text-xs font-bold cursor-pointer transition-all"
              >
                <Check size={13} /> Simpan Profil
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-red-100 hover:bg-red-200 text-red-800 border border-red-800/30 text-xs font-bold cursor-pointer transition-all"
            >
              <LogOut size={13} /> Keluar
            </button>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center">
        <BottomNavbar
          activeScreen={6}
          setScreen={setScreen}
          onCenterClick={() => setScreen(5)}
        />
      </div>
    </div>
  );
}
