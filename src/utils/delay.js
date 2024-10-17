// src/utils/delay.js
export const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };