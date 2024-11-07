import React, { createContext, useState, useContext, useEffect } from 'react';
import { loadSavedLanguage, changeLanguage } from '../i18nConfig';
import i18n from '../i18nConfig';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(i18n.locale);

  useEffect(() => {
    loadSavedLanguage().then(() => setLanguage(i18n.locale));
  }, []);

  const updateLanguage = async (newLang) => {
    await changeLanguage(newLang);
    setLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);