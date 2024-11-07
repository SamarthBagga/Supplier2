import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import i18n from '../i18nConfig';
import { useLanguage } from './LanguageProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageSelector = () => {
  const { updateLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(AsyncStorage.getItem('lang'));

  useEffect(() => {
    AsyncStorage.getItem('lang').then(lang => {
      if (lang) setSelectedLanguage(lang);
    });
  }, []);

  const changeLang = (lang) => {
    setSelectedLanguage(lang);
    updateLanguage(lang);
    AsyncStorage.setItem('lang', lang);
  };

  return (
    <View className="p-4 bg-white rounded-lg shadow-md">
      <Text className="text-lg font-bold mb-2 text-gray-800">{i18n.t('selectLanguage')}</Text>
      <View className="border border-gray-300 rounded-md">
        <Picker
          selectedValue={selectedLanguage}
          onValueChange={(itemValue) => changeLang(itemValue)}
          className="text-base text-gray-700"
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="हिंदी" value="hi" />
        </Picker>
      </View>
    </View>
  );
};

export default LanguageSelector;