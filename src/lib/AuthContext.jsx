import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const loadUserProfile = async (authUser) => {
    try {
      // created_by é o email do usuário — funciona para o próprio usuário sem permissão de admin
      const users = await base44.entities.User.filter({ created_by: authUser.email });
      return users?.[0] || null;
    } catch {
      return null;
    }
  };

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: { 'X-App-Id': appParams.appId },
        token: appParams.token,
        interceptResponses: true
      });

      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);

        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          setAuthError({ type: reason, message: appError.message });
        } else {
          setAuthError({ type: 'unknown', message: appError.message || 'Falha ao carregar o app' });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      setAuthError({ type: 'unknown', message: error.message || 'Erro inesperado' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const isSystemAdmin = currentUser?.role === 'admin';

      // Admins do sistema nunca precisam de perfil para acessar
      if (isSystemAdmin) {
        // Tenta carregar perfil mas não bloqueia se não existir
        const profile = await loadUserProfile(currentUser);
        if (!profile) {
          const newProfile = await base44.entities.User.create({
            email: currentUser.email,
            full_name: currentUser.full_name || currentUser.email,
            status_acesso: 'Ativo',
            role: 'Administrador',
            provider: currentUser?.provider || 'email',
            foto_google: currentUser?.picture || '',
          });
          setUserProfile(newProfile);
        } else {
          setUserProfile(profile);
        }
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }

      // Usuário normal: carrega ou cria perfil
      let profile = await loadUserProfile(currentUser);

      if (!profile) {
        profile = await base44.entities.User.create({
          email: currentUser.email,
          full_name: currentUser.full_name || currentUser.email,
          status_acesso: 'Bloqueado',
          role: 'Comercial',
          provider: currentUser?.provider || 'email',
          foto_google: currentUser?.picture || '',
        });
      }

      setUserProfile(profile);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Autenticação necessária' });
      }
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;
    const profile = await loadUserProfile(user);
    setUserProfile(profile);
  };

  const isAdmin = () =>
    userProfile?.role === 'Administrador' || user?.role === 'admin';
  const isAtivo = () => userProfile?.status_acesso === 'Ativo';

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      refreshUserProfile,
      isAdmin,
      isAtivo,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};