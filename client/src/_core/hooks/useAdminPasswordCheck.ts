import { useEffect, useState } from 'react';

interface AdminLoginResponse {
  success: boolean;
  sessionToken: string;
  adminType: string;
  fullName: string;
  email: string;
  requiresPasswordChange?: boolean;
}

/**
 * Hook pour vérifier si l'admin doit changer son mot de passe
 * Redirige vers la page de changement de mot de passe si nécessaire
 */
export function useAdminPasswordCheck() {
  const [adminData, setAdminData] = useState<AdminLoginResponse | null>(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  const checkPasswordRequirement = (data: AdminLoginResponse) => {
    if (data.requiresPasswordChange) {
      setRequiresPasswordChange(true);
      setAdminData(data);
      return true;
    }
    return false;
  };

  const clearPasswordRequirement = () => {
    setRequiresPasswordChange(false);
    setAdminData(null);
  };

  return {
    adminData,
    requiresPasswordChange,
    checkPasswordRequirement,
    clearPasswordRequirement,
  };
}
