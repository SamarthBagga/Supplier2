import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Icon from 'react-native-feather';
import { themeColors } from '../theme';
import axios from 'axios';
import i18n from '../i18nConfig';

export default function UpdatePriceSlabs({ route, navigation }) {
  const { itemId, initialPriceSlabs } = route.params;
  const [priceSlabs, setPriceSlabs] = useState(initialPriceSlabs);

  const addPriceSlab = () => {
    setPriceSlabs([...priceSlabs, { minQuantity: '', price: '' }]);
  };

  const updatePriceSlab = (index, field, value) => {
    const updatedSlabs = [...priceSlabs];
    updatedSlabs[index][field] = value;
    setPriceSlabs(updatedSlabs);
  };

  const removePriceSlab = (index) => {
    const updatedSlabs = priceSlabs.filter((_, i) => i !== index);
    setPriceSlabs(updatedSlabs);
  };

  const handleSubmit = async () => {
    if (priceSlabs.some(slab => !slab.minQuantity || !slab.price)) {
      Alert.alert(i18n.t('error'), i18n.t('allFieldsRequired'));
      return;
    }

    try {
      const response = await axios.put(
        'https://mandie.co.in/api/supplier/update',
        {
          itemId,
          priceSlabs,
        }
      );

      if (response.status === 200) {
        Alert.alert(i18n.t('success'));
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error updating price slabs:', error.response?.data || error.message);
      Alert.alert(i18n.t('error'), error.response?.data?.message || i18n.t('failedToUpdatePriceSlabs'));
    }
  };

  return (
    <SafeAreaView className="flex-1 p-4">
      <ScrollView>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="z-10 rounded-full p-1 shadow w-8 ml-1"
          style={{ backgroundColor: themeColors.bgColor(1) }}
        >
          <Icon.ArrowLeft strokeWidth={3} stroke="white" />
        </TouchableOpacity>

        <View className="mt-8">
          <Text className="text-lg mb-2" style={{ color: themeColors.text }}>
            {i18n.t('updatePriceSlabs')}
          </Text>

          {priceSlabs.map((slab, index) => (
            <View key={index} className="flex-row mb-2 items-center">
              <TextInput
                value={slab.minQuantity.toString()}
                onChangeText={(value) => updatePriceSlab(index, 'minQuantity', value)}
                placeholder={i18n.t('minQuantity')}
                keyboardType="numeric"
                className="border rounded-lg p-2 flex-1 mr-2"
                style={{
                  borderColor: themeColors.bgColor(1),
                  color: themeColors.text,
                }}
              />
              <TextInput
                value={slab.price.toString()}
                onChangeText={(value) => updatePriceSlab(index, 'price', value)}
                placeholder={i18n.t('pricePerKg')}
                keyboardType="numeric"
                className="border rounded-lg p-2 flex-1 mr-2"
                style={{
                  borderColor: themeColors.bgColor(1),
                  color: themeColors.text,
                }}
              />
              <TouchableOpacity onPress={() => removePriceSlab(index)}>
                <Icon.Trash stroke={themeColors.bgColor(1)} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            onPress={addPriceSlab}
            className="py-2 rounded-lg mb-4"
            style={{ backgroundColor: themeColors.bgColor(0.8) }}
          >
            <Text className="text-center text-white">
              {i18n.t('addPriceSlabs')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            className="py-3 rounded-lg"
            style={{ backgroundColor: themeColors.bgColor(1) }}
          >
            <Text className="text-center text-white text-lg">
              {i18n.t('updatePriceSlabs')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}