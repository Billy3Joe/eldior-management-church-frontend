export const getCurrentAdmin = () => {
  try {
    return JSON.parse(localStorage.getItem("admin") || "{}");
  } catch {
    return {};
  }
};

export const hasRole = (...roles) => {
  const admin = getCurrentAdmin();
  return roles.includes(admin?.role);
};

export const isAdmin = () => {
  return hasRole("admin");
};

export const isManager = () => {
  return hasRole("manager");
};