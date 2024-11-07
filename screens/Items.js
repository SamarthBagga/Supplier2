import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    RefreshControl,
    Alert,
    ScrollView,
} from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Icon from 'react-native-feather'
import { themeColors } from '../theme'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../i18nConfig'
import itemsTranslations from '../items-translations.json'
import { loadSavedLanguage } from '../i18nConfig';

const getTranslatedItemName = async (itemName) => {
    const currentLanguage = await AsyncStorage.getItem('lang');

    if (currentLanguage === 'en') return itemName;

    // Check if translation exists
    const translations = itemsTranslations[currentLanguage];
    return translations[itemName] || itemName; // Fallback to English if no translation found
};


const ItemCard = ({ item, onRemove, onEditPriceSlabs }) => {
    const [translatedName, setTranslatedName] = useState(item.itemName);

    useEffect(() => {
        const loadTranslation = async () => {
            try {
                const translated = await getTranslatedItemName(item.itemName);
                setTranslatedName(translated);
            } catch (error) {
                console.error('Error translating item name:', error);
                setTranslatedName(item.itemName); // Fallback to original name
            }
        };

        loadTranslation();
    }, [item.itemName]);

    return (
        <View
            style={{
                padding: 10,
                marginVertical: 5,
                backgroundColor: 'white',
                borderRadius: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1.5,
                elevation: 2,
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {translatedName}
                </Text>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                        onPress={() => onEditPriceSlabs(item)}
                        style={{ marginRight: 10 }}
                    >
                        <Icon.Edit
                            strokeWidth={2}
                            height={20}
                            width={20}
                            stroke={themeColors.bgColor(1)}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onRemove(item._id)}>
                        <Icon.Trash
                            strokeWidth={2}
                            height={20}
                            width={20}
                            stroke={themeColors.bgColor(1)}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={{ fontSize: 16, color: 'gray' }}>
                {i18n.t('quality')}: {item.quality}
            </Text>
            <Text style={{ fontSize: 16, color: 'gray' }}>
                {i18n.t('priceSlabs')}:
            </Text>
            {item.priceSlabs.map((slab, index) => (
                <Text
                    key={index}
                    style={{ fontSize: 14, color: 'gray', marginLeft: 10 }}
                >
                    {slab.minQuantity}+ kg: ₹{slab.price}/kg
                </Text>
            ))}
            {item.itemImage && (
                <Image
                    source={{ uri: item.itemImage }}
                    style={{
                        width: '100%',
                        height: 150,
                        borderRadius: 10,
                        marginTop: 10,
                    }}
                />
            )}
        </View>
    )
}

export default function Items({ navigation }) {
    const [items, setItems] = useState([])
    const [errorMsg, setErrorMsg] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [isLanguageLoaded, setIsLanguageLoaded] = useState(false)

    useEffect(() => {
        const setupComponent = async () => {
            await loadSavedLanguage()
            setIsLanguageLoaded(true)
            await checkLoginStatus()
        }
        setupComponent()
    }, [])

    const checkLoginStatus = async () => {
        try {
            const loginVal = await AsyncStorage.getItem('login')
            if (loginVal !== 'true') {
                navigation.replace('Login')
            } else {
                fetchItems()
            }
        } catch (error) {
            console.error('Error checking login status:', error)
            navigation.replace('Login')
        }
    }

    // Function to fetch items from the API
    const fetchItems = async () => {
        try {
            const phoneNumber = await AsyncStorage.getItem('phone')
            if (!phoneNumber) {
                throw new Error(i18n.t('phoneNotFound'))
            }
            const response = await axios.post(
                'https://mandie.co.in/api/supplier/get-items',
                { phoneNumber }
            )
            setItems(response.data.items)
            setRefreshing(false)
        } catch (error) {
            console.error(i18n.t('errorFetchingItems'), error)
            setErrorMsg(
                error.response?.data?.message || i18n.t('fetchItemsFailed')
            )
            setRefreshing(false)
        }
    }

    // Updated function to remove an item using item ID
    const removeItem = async (itemId) => {
        try {
            const phoneNumber = await AsyncStorage.getItem('phone')
            if (!phoneNumber) {
                throw new Error(i18n.t('phoneNotFound'))
            }
            await axios.post('https://mandie.co.in/api/supplier/remove-item', {
                phoneNumber,
                itemId,
            })
            // After successful removal, refresh the items list
            fetchItems()
        } catch (error) {
            console.error(i18n.t('errorRemovingItem'), error)
            Alert.alert(
                i18n.t('error'),
                error.response?.data?.message || i18n.t('removeItemFailed')
            )
        }
    }

    // Updated handle remove item with confirmation
    const handleRemoveItem = (itemId) => {
        const item = items.find((item) => item._id === itemId)
        Alert.alert(
            i18n.t('removeItem'),
            `${i18n.t('confirmRemoveItem')} ${item.itemName}?`,
            [
                { text: i18n.t('cancel'), style: 'cancel' },
                { text: i18n.t('remove'), onPress: () => removeItem(itemId) },
            ]
        )
    }

    const handleEditPriceSlabs = (item) => {
        navigation.navigate('Update', {
            itemId: item._id,
            initialPriceSlabs: item.priceSlabs,
        })
    }

    // Handle pull-to-refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true)
        fetchItems()
    }, [])

    // Fetch items on component mount
    useEffect(() => {
        fetchItems()
    }, [])

    // Handle logout
    // const logout = async () => {
    //     try {
    //         await AsyncStorage.clear();
    //         navigation.navigate('Login')
    //     } catch (e) {
    //         console.log(e)
    //     }
    // }

    return (
        <SafeAreaView style={{ flex: 1, padding: 10 }}>
            <View className="flex-row items-center space-x-2 px-4 pb-2 pt-2">
                <TouchableOpacity
                    style={{ backgroundColor: themeColors.bgColor(1) }}
                    className="p-3 rounded-full"
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Icon.User
                        height="20"
                        width="20"
                        strokeWidth={2.5}
                        stroke="white"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddItems')}
                    style={{ backgroundColor: themeColors.bgColor(1) }}
                    className="p-3 rounded-full"
                >
                    <Icon.Plus
                        strokeWidth={2.5}
                        height={20}
                        width={20}
                        stroke="white"
                    />
                </TouchableOpacity>
            </View>
            <Text
                style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}
            >
                {i18n.t('items')}
            </Text>
            {errorMsg && (
                <Text style={{ color: 'red', marginBottom: 10 }}>
                    {errorMsg}
                </Text>
            )}
            {items.length === 0 ? (
                <ScrollView
                    contentContainerStyle={{
                        flex: 1,
                        justifyContent: 'center',
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                >
                    <Text style={{ textAlign: 'center', fontSize: 18 }}>
                        {i18n.t('noItems')}
                    </Text>
                </ScrollView>
            ) : (
                <FlatList
                    data={items}
                    renderItem={({ item }) => (
                        <ItemCard
                            item={item}
                            onRemove={handleRemoveItem}
                            onEditPriceSlabs={handleEditPriceSlabs}
                        />
                    )}
                    keyExtractor={(item) => item._id.toString()}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                />
            )}
        </SafeAreaView>
    )
}
