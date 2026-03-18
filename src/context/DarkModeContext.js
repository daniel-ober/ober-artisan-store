import React, { createContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export const DarkModeContext = createContext();

export const DarkModeProvider = ({ children }) => {
  const location = useLocation();

  const forcedDarkRoutes = [
    "/artisan-shop/soundlegend",
    "/artisan-portal/signin",
  ];

  const isForcedDarkRoute = forcedDarkRoutes.includes(location.pathname);

  const storedMode = localStorage.getItem("darkMode");
  const initialMode = storedMode !== null ? storedMode === "true" : false;

  const [isDarkMode, setIsDarkMode] = useState(initialMode);

  const effectiveDarkMode = isForcedDarkRoute ? true : isDarkMode;

  useEffect(() => {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(effectiveDarkMode ? "dark" : "light");
  }, [effectiveDarkMode]);

  return (
    <DarkModeContext.Provider
      value={{
        isDarkMode: effectiveDarkMode,
        setIsDarkMode,
        isForcedDarkRoute,
      }}
    >
      {children}
    </DarkModeContext.Provider>
  );
};