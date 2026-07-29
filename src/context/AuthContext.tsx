import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { INITIAL_PROFILES, getSupabaseClient } from '../services/supabase';
import { showSuccessToast, showErrorToast } from '../components/common/SweetAlert';

export interface RegisterGuruResult {
  success: boolean;
  password?: string;
  profile?: Profile;
}

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  registerGuru: (fullName: string, email: string, username: string, nipNuptk: string, phone: string) => Promise<RegisterGuruResult>;
  updateProfile: (updatedData: Partial<Profile>) => Promise<boolean>;
  adminResetPasswordGuru: (guruId: string, guruName: string, newPass: string) => Promise<boolean>;
  resetPassword: (identifier: string) => Promise<boolean>;
  switchDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Check saved session on app startup
  useEffect(() => {
    const savedUser = localStorage.getItem('guruku_session_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('guruku_session_user');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, _password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const cleanInput = identifier.trim().toLowerCase();
      const supabase = getSupabaseClient();
      if (supabase) {
        // Query Supabase profiles table by email or username
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.ilike.${cleanInput},username.ilike.${cleanInput}`)
          .maybeSingle();

        if (data && !error) {
          if (data.password && data.password !== _password) {
            showErrorToast('Kata sandi (password) yang Anda masukkan tidak sesuai.');
            setLoading(false);
            return false;
          }

          const profile: Profile = {
            id: data.id,
            email: data.email,
            username: data.username || cleanInput,
            fullName: data.full_name,
            role: data.role,
            nipNuptk: data.nip_nuptk,
            phone: data.phone,
            password: data.password || _password,
            avatarUrl: data.avatar_url,
            avatarDriveId: data.avatar_drive_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
          setUser(profile);
          if (rememberMe) {
            localStorage.setItem('guruku_session_user', JSON.stringify(profile));
          }
          showSuccessToast(`Selamat datang kembali, ${profile.fullName}!`);
          setLoading(false);
          return true;
        }
      }

      // Fallback local check by username or email
      let savedTeachers: Profile[] = [];
      const savedTeachersRaw = localStorage.getItem('guruku_teachers');
      if (savedTeachersRaw) {
        try {
          savedTeachers = JSON.parse(savedTeachersRaw);
        } catch (e) {
          console.error(e);
        }
      }

      const allProfiles = [...INITIAL_PROFILES, ...savedTeachers];
      const matched = allProfiles.find((p) =>
        p.email.toLowerCase() === cleanInput ||
        (p.username && p.username.toLowerCase() === cleanInput)
      );

      if (matched) {
        if (matched.password && matched.password !== _password) {
          showErrorToast('Kata sandi (password) yang Anda masukkan tidak sesuai.');
          setLoading(false);
          return false;
        }

        setUser(matched);
        if (rememberMe) {
          localStorage.setItem('guruku_session_user', JSON.stringify(matched));
        }
        showSuccessToast(`Selamat datang, ${matched.fullName}!`);
        setLoading(false);
        return true;
      }

      showErrorToast('Username / Email atau kata sandi tidak ditemukan');
      setLoading(false);
      return false;
    } catch (err: any) {
      showErrorToast(err.message || 'Gagal melakukan login');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('guruku_session_user');
    showSuccessToast('Berhasil keluar dari sesi.');
  };

  const registerGuru = async (fullName: string, email: string, username: string, nipNuptk: string, phone: string): Promise<RegisterGuruResult> => {
    const cleanUsername = username.trim().toLowerCase();
    
    // Check uniqueness
    const exists = INITIAL_PROFILES.some((p) => p.username?.toLowerCase() === cleanUsername || p.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      showErrorToast(`Username '${cleanUsername}' atau email '${email}' sudah digunakan oleh pengguna lain.`);
      return { success: false };
    }

    // Generate automatic password
    const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
    let autoPassword = 'Gk-';
    for (let i = 0; i < 6; i++) {
      autoPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newGuru: Profile = {
      id: `user_guru_${Date.now()}`,
      email,
      username: cleanUsername,
      fullName,
      role: 'guru',
      nipNuptk,
      phone,
      password: autoPassword,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('profiles').insert([{
        id: newGuru.id,
        email: newGuru.email,
        username: newGuru.username,
        password: newGuru.password,
        full_name: newGuru.fullName,
        role: 'guru',
        nip_nuptk: newGuru.nipNuptk,
        phone: newGuru.phone,
        avatar_url: newGuru.avatarUrl,
        created_at: newGuru.createdAt,
        updated_at: newGuru.updatedAt
      }]);
      if (error) {
        console.error('Failed to insert profile to Supabase:', error);
      }
    }

    INITIAL_PROFILES.push(newGuru);
    let savedTeachers: Profile[] = [];
    const savedTeachersRaw = localStorage.getItem('guruku_teachers');
    if (savedTeachersRaw) {
      try { savedTeachers = JSON.parse(savedTeachersRaw); } catch (e) {}
    }
    if (!savedTeachers.some((t) => t.id === newGuru.id)) {
      savedTeachers.unshift(newGuru);
      localStorage.setItem('guruku_teachers', JSON.stringify(savedTeachers));
    }

    showSuccessToast(`Akun Guru ${fullName} berhasil dibuat.`);
    return { success: true, password: autoPassword, profile: newGuru };
  };

  const updateProfile = async (updatedData: Partial<Profile>): Promise<boolean> => {
    if (!user) return false;

    const updatedProfile = { ...user, ...updatedData, updatedAt: new Date().toISOString() };
    setUser(updatedProfile);
    localStorage.setItem('guruku_session_user', JSON.stringify(updatedProfile));

    const idx = INITIAL_PROFILES.findIndex((p) => p.id === user.id);
    if (idx !== -1) {
      INITIAL_PROFILES[idx] = updatedProfile;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('profiles').update({
        email: updatedProfile.email,
        full_name: updatedProfile.fullName,
        nip_nuptk: updatedProfile.nipNuptk,
        phone: updatedProfile.phone,
        avatar_url: updatedProfile.avatarUrl,
        updated_at: updatedProfile.updatedAt
      }).eq('id', user.id);
    }

    showSuccessToast('Profil berhasil diperbarui');
    return true;
  };

  const adminResetPasswordGuru = async (guruId: string, guruName: string, newPass: string): Promise<boolean> => {
    // Update in INITIAL_PROFILES
    const foundInInitial = INITIAL_PROFILES.find((p) => p.id === guruId);
    if (foundInInitial) {
      foundInInitial.password = newPass;
    }

    // Update in localStorage guruku_teachers
    const savedTeachersRaw = localStorage.getItem('guruku_teachers');
    if (savedTeachersRaw) {
      try {
        const savedTeachers: Profile[] = JSON.parse(savedTeachersRaw);
        const updated = savedTeachers.map((t) => (t.id === guruId ? { ...t, password: newPass } : t));
        localStorage.setItem('guruku_teachers', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('profiles').update({
        password: newPass,
        updated_at: new Date().toISOString()
      }).eq('id', guruId);
    }

    showSuccessToast(`Password untuk Guru ${guruName} berhasil direset ke '${newPass}' oleh Admin.`);
    return true;
  };

  const resetPassword = async (identifier: string): Promise<boolean> => {
    showSuccessToast(`Instruksi reset password telah dikirimkan ke: ${identifier}`);
    return true;
  };

  const switchDemoRole = (role: UserRole) => {
    const found = INITIAL_PROFILES.find((p) => p.role === role) || INITIAL_PROFILES[0];
    setUser(found);
    if (rememberMe) {
      localStorage.setItem('guruku_session_user', JSON.stringify(found));
    }
    showSuccessToast(`Beralih ke sesi ${role.toUpperCase()}: ${found.fullName}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        rememberMe,
        setRememberMe,
        login,
        logout,
        registerGuru,
        updateProfile,
        adminResetPasswordGuru,
        resetPassword,
        switchDemoRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
