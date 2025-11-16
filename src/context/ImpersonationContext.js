// src/context/ImpersonationContext.js
import React, { createContext, useContext, useState } from 'react';

const ImpersonationContext = createContext(null);

export const ImpersonationProvider = ({ children }) => {
  // null = not impersonating; otherwise this will be the target artist's UID
  const [impersonatedUserId, setImpersonatedUserId] = useState(null);

  const startImpersonation = (userId) => {
    setImpersonatedUserId(userId);
  };

  const stopImpersonation = () => {
    setImpersonatedUserId(null);
  };

  return (
    <ImpersonationContext.Provider
      value={{ impersonatedUserId, startImpersonation, stopImpersonation }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
};

export const useImpersonation = () => {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return ctx;
};