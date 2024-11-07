import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './translations/en.json';
import hi from './translations/hi.json';

// Create a new I18n instance
const i18n = new I18n({
  en,
  hi,
});

// Set the locale once at the beginning of your app
i18n.locale = Localization.getLocales()[0].languageCode ?? 'hi';

// When a value is missing from a language it'll fall back to another language with the key present
i18n.enableFallback = true;

// Function to change the language
export const changeLanguage = async (lang) => {
  i18n.locale = lang;
  try {
    await AsyncStorage.setItem('lang', lang);
  } catch (error) {
    console.error('Failed to save the language to AsyncStorage', error);
  }
};

// Function to load the saved language
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('lang');
    if (savedLanguage) {
      i18n.locale = savedLanguage;
    }
  } catch (error) {
    console.error('Failed to load the language from AsyncStorage', error);
  }
};

export default i18n;