// src/ScrollToTop.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // wait until next render tick
    requestAnimationFrame(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const app = document.querySelector('.app-container');
      if (app) app.scrollTop = 0;

      const routeContainer = document.querySelector('.soundlegend-product-detail');
      if (routeContainer) routeContainer.scrollTop = 0;
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;