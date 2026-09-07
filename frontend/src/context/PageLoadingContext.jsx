import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const PageLoadingContext = createContext({
  isPageLoading: true,
  setPageLoading: () => {},
});

export const PageLoadingProvider = ({ children }) => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // When location changes, mark page as loading until the new page signals completion
    setIsPageLoading(true);

    // Safeguard timer so loading effect doesn't get stuck indefinitely
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const setPageLoading = useCallback((loading) => {
    setIsPageLoading(loading);
  }, []);

  return (
    <PageLoadingContext.Provider value={{ isPageLoading, setPageLoading }}>
      {children}
    </PageLoadingContext.Provider>
  );
};

export const usePageLoading = () => useContext(PageLoadingContext);
