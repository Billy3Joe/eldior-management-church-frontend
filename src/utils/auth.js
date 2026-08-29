export const getToken = () => {
  return localStorage.getItem(
    "token"
  );
};

export const getCurrentAdmin = () => {
  try {
    const storedUser =
      localStorage.getItem(
        "admin"
      );

    if (!storedUser) {
      return null;
    }

    return JSON.parse(
      storedUser
    );
  } catch (error) {
    console.error(
      "Erreur récupération utilisateur :",
      error
    );

    return null;
  }
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const isSuperAdmin = () => {
  const user =
    getCurrentAdmin();

  return (
    user?.platformRole ===
    "superadmin"
  );
};

export const isChurchAdmin = () => {
  const user =
    getCurrentAdmin();

  return (
    user?.role === "admin"
  );
};

export const isAdmin = () => {
  const user =
    getCurrentAdmin();

  return (
    user?.platformRole ===
      "superadmin" ||
    user?.role === "admin"
  );
};

export const isManager = () => {
  const user =
    getCurrentAdmin();

  return (
    user?.role === "manager"
  );
};

export const isMember = () => {
  const user =
    getCurrentAdmin();

  return (
    user?.role === "member"
  );
};

export const logout = () => {
  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "admin"
  );
};