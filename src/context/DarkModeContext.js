import React, { createContext, useState, useEffect } from "react";

export const DarkModeContext = createContext();

export const DarkModeProvider = ({ children }) => {
  // ✅ Check localStorage; Default to "false" (light mode)
  const storedMode = localStorage.getItem("darkMode");
  const initialMode = storedMode === "true" ? true : false;

  const [isDarkMode, setIsDarkMode] = useState(initialMode);

  useEffect(() => {
    // ✅ Set body class on first load
    document.body.classList.remove("dark", "light"); // Reset first
    document.body.classList.add(isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};