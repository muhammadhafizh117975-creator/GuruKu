import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { INITIAL_PROFILES, getSupabaseClient, getNeonSql } from '../services/supabase';
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
      const cleanInputNoAt = cleanInput.replace(/^@/, '');
      const cleanPass = _password.trim();

      // 1. Supabase authentication check
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          console.log('[Supabase DB Auth] Verifying login for user:', cleanInput);
          const { data, error } = await supabase
            .from('profiles')
            .select('*');

          if (data && !error && data.length > 0) {
            const matched = data.find((d: any) => {
              const emailMatch = d.email && d.email.toLowerCase() === cleanInput;
              const unameMatch = d.username && (
                d.username.toLowerCase() === cleanInput ||
                d.username.toLowerCase() === cleanInputNoAt
              );
              return emailMatch || unameMatch;
            });

            if (matched) {
              if (matched.password && matched.password !== _password && matched.password !== cleanPass) {
                showErrorToast('Kata sandi (password) yang Anda masukkan tidak sesuai.');
                setLoading(false);
                return false;
              }

              const profile: Profile = {
                id: matched.id,
                email: matched.email,
                username: matched.username || cleanInputNoAt,
                fullName: matched.full_name,
                role: matched.role,
                nipNuptk: matched.nip_nuptk,
                phone: matched.phone,
                password: matched.password || _password,
                avatarUrl: matched.avatar_url,
                avatarDriveId: matched.avatar_drive_id,
                createdAt: matched.created_at,
                updatedAt: matched.updated_at
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
        } catch (supabaseErr) {
          console.warn('[Supabase DB Auth Error] Login query error:', supabaseErr);
        }
      }

      // Check default initial profile as emergency fallback if Supabase not configured
      const matched = INITIAL_PROFILES.find((p) => {
        const emailMatch = p.email.toLowerCase() === cleanInput;
        const unameMatch = p.username && (
          p.username.toLowerCase() === cleanInput ||
          p.username.toLowerCase() === cleanInputNoAt
        );
        return emailMatch || unameMatch;
      });

      if (matched) {
        if (matched.password && matched.password !== _password && matched.password !== cleanPass) {
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

      showErrorToast('Username / Email atau kata sandi tidak ditemukan di database.');
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
    localStorage.removeItem('guruku_active_tab');
    sessionStorage.removeItem('guruku_active_tab');
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
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

    const sql = getNeonSql();
    if (sql) {
      try {
        await sql`
          INSERT INTO public.profiles (id, email, username, password, full_name, role, nip_nuptk, phone, avatar_url, created_at, updated_at)
          VALUES (${newGuru.id}, ${newGuru.email}, ${newGuru.username}, ${newGuru.password}, ${newGuru.fullName}, 'guru', ${newGuru.nipNuptk}, ${newGuru.phone}, ${newGuru.avatarUrl}, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            username = EXCLUDED.username,
            password = EXCLUDED.password,
            full_name = EXCLUDED.full_name,
            nip_nuptk = EXCLUDED.nip_nuptk,
            phone = EXCLUDED.phone,
            updated_at = NOW()
        `;
      } catch (err) {
        console.warn('Gagal menyimpan profil ke Neon DB:', err);
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('profiles').upsert([{
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

    const sql = getNeonSql();
    if (sql) {
      try {
        await sql`
          UPDATE public.profiles
          SET email = ${updatedProfile.email},
              full_name = ${updatedProfile.fullName},
              nip_nuptk = ${updatedProfile.nipNuptk},
              phone = ${updatedProfile.phone},
              avatar_url = ${updatedProfile.avatarUrl},
              updated_at = NOW()
          WHERE id = ${user.id}
        `;
      } catch (err) {
        console.warn('Gagal memperbarui profil di Neon DB:', err);
      }
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

    const sql = getNeonSql();
    if (sql) {
      try {
        await sql`
          UPDATE public.profiles
          SET password = ${newPass},
              updated_at = NOW()
          WHERE id = ${guruId}
        `;
      } catch (err) {
        console.warn('Gagal reset password di Neon DB:', err);
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
