import { View, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadSavedLanguage } from '../i18nConfig';
import LanguageSelector from '../components/LanguageSelector';
import { TouchableOpacity } from 'react-native';
import * as Icon from "react-native-feather";
import { themeColors } from '../theme';

export default function LanguageSelection({ navigation }) {
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      await loadSavedLanguage();
      setIsLanguageLoaded(true);
    };
    loadLanguage();
  }, []);

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-gray-100 p-4">
      {/* Language Selector */}
      <View className="w-full mb-6">
        <LanguageSelector />
      </View>

      {/* Button for Navigation */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={{backgroundColor: themeColors.bgColor(1)}}
        className="z-10 rounded-full p-1 shadow top-5 left-2"
      >
    <Icon.ArrowRight strokeWidth={3} stroke="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
