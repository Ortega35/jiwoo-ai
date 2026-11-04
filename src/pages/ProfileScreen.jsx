import { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  LogOut,
  ShieldCheck,
  Edit3,
  Check,
  X,
  Mail,
} from "lucide-react";
import jiwooMascot from "../assets/jiwoo.svg";
import BottomNavbar from "../components/BottomNavbar";
import {
  supabase,
  syncSupabaseUser,
  getCurrentUser,
  logoutUser,
  updateUserProfile,
} from "../services/authService";

export default function ProfileScreen({ setScreen }) {
  const [userProfile, setUserProfile] = useState(getCurrentUser());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(userProfile.name || "");
  const [birthDate, setBirthDate] = useState(userProfile.birthDate || "");
  const [location, setLocation] = useState(userProfile.location || "");

  // Pastikan data profil selalu sinkron dengan sesi Supabase terbaru
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const synced = syncSupabaseUser(data.user);
        setUserProfile(synced);
        setName(synced.name || "");
        setBirthDate(synced.birthDate || "");
        setLocation(synced.location || "");
      }
    });
  }, []);

  const handleStartEdit = () => {
    setName(userProfile.name || "");
    setBirthDate(userProfile.birthDate || "");
    setLocation(userProfile.location || "");
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await updateUserProfile({ name, birthDate, location });
      if (updated) {
        setUserProfile(updated);
      }
    } catch {
      // Abaikan jika gagal
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setScreen(4);
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-between md:justify-center min-h-full w-full max-w-3xl mx-auto pt-5 pb-24 md:py-8 px-4 sm:px-6 text-center animate-pop-1">
      {/* Kartu Profil Utama */}
      <div className="w-full my-auto bg-white/85 backdrop-blur-sm border-2 border-[#4A3525] rounded-3xl p-5 sm:p-6 md:p-10 shadow-xl flex flex-col md:flex-row items-center gap-5 md:gap-10">
        {/* Kolom Foto Profil */}
        <div className="flex flex-col items-center shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-[#EAE6DF] border-2 border-[#4A3525] flex items-center justify-center overflow-hidden shadow-md">
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
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain mt-2"
              />
            )}
          </div>

          <span className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-700/30">
            <ShieldCheck size={12} /> {userProfile.authMethod}
          </span>
        </div>

        {/* Kolom Detail Biodata */}
        <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-base sm:text-lg md:text-2xl font-bold text-[#4A3525] wrap-break-words">
            {userProfile.name}
          </h2>
          <p className="text-[11px] sm:text-xs text-[#4A3525]/70 flex items-center gap-1.5 mt-0.5 break-all">
            <Mail size={13} className="shrink-0" /> {userProfile.email}
          </p>

          {!isEditing ? (
            <div className="mt-4 sm:mt-5 w-full grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 text-[#4A3525]">
              <div className="bg-[#FDF3E7] border border-[#4A3525]/25 rounded-2xl p-3 flex items-center gap-3">
                <Calendar size={18} className="shrink-0 text-[#F4A950]" />
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] text-[#4A3525]/60 font-bold">
                    Tanggal Lahir
                  </p>
                  {userProfile.birthDate ? (
                    <p className="text-xs font-bold truncate">
                      {userProfile.birthDate}
                    </p>
                  ) : (
                    <p className="text-[11px] italic text-[#4A3525]/45">
                      Belum diisi
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-[#FDF3E7] border border-[#4A3525]/25 rounded-2xl p-3 flex items-center gap-3">
                <MapPin size={18} className="shrink-0 text-[#F4A950]" />
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] text-[#4A3525]/60 font-bold">
                    Lokasi / Domisili
                  </p>
                  {userProfile.location ? (
                    <p className="text-xs font-bold truncate">
                      {userProfile.location}
                    </p>
                  ) : (
                    <p className="text-[11px] italic text-[#4A3525]/45">
                      Belum diisi
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 w-full flex flex-col gap-2.5 text-left">
              <div>
                <label className="text-[10px] font-bold text-[#4A3525]/70 ml-3">
                  Nama Tampilan
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkapmu"
                  className="w-full mt-0.5 bg-[#FDF3E7] border border-[#4A3525]/40 rounded-full px-4 py-2 text-xs text-[#4A3525] focus:outline-none focus:border-[#4A3525]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#4A3525]/70 ml-3">
                  Tanggal Lahir
                </label>
                <input
                  type="text"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="Contoh: 07 April 2005"
                  className="w-full mt-0.5 bg-[#FDF3E7] border border-[#4A3525]/40 rounded-full px-4 py-2 text-xs text-[#4A3525] focus:outline-none focus:border-[#4A3525]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#4A3525]/70 ml-3">
                  Lokasi / Domisili
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Ponorogo, Jawa Timur"
                  className="w-full mt-0.5 bg-[#FDF3E7] border border-[#4A3525]/40 rounded-full px-4 py-2 text-xs text-[#4A3525] focus:outline-none focus:border-[#4A3525]"
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#F4A950] hover:bg-[#e5983e] text-[#4A3525] border border-[#4A3525] text-xs font-bold cursor-pointer transition-all"
              >
                <Edit3 size={13} /> Edit Profil
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveProfile}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-60"
                >
                  <Check size={13} />{" "}
                  {isSaving ? "Menyimpan..." : "Simpan Profil"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-[#4A3525] text-xs font-bold cursor-pointer transition-all"
                >
                  <X size={13} /> Batal
                </button>
              </>
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

      {/* Bottom Navbar Khusus Mobile */}
      <div className="fixed bottom-3 left-0 right-0 z-40 px-4 flex justify-center md:hidden pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto">
          <BottomNavbar
            activeScreen={6}
            setScreen={setScreen}
            onCenterClick={() => setScreen(5)}
          />
        </div>
      </div>
    </div>
  );
}
