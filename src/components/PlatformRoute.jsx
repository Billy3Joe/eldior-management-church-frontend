import {
    Navigate,
  } from "react-router-dom";
  
  import {
    getCurrentAdmin,
  } from "../utils/auth";
  
  export default function PlatformRoute({
    children,
  }) {
    const token =
      localStorage.getItem(
        "token"
      );
  
    const user =
      getCurrentAdmin();
  
    if (!token || !user) {
      return (
        <Navigate
          to="/login"
          replace
        />
      );
    }
  
    if (
      user.platformRole !==
      "superadmin"
    ) {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }
  
    return children;
  }