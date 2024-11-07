import React, { useState, useEffect, useCallback } from 'react'
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    StyleSheet,
    ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../i18nConfig'
import itemsTranslations from '../items-translations.json'

const getTranslatedItemName = async (itemName) => {
    if (!itemName) return '';
    const currentLanguage = await AsyncStorage.getItem('lang') || 'en';
    if (currentLanguage === 'en') return itemName;

    const translations = itemsTranslations[currentLanguage] || {};
    return translations[itemName] || itemName;
}

const OrderItem = ({ item }) => {
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
        <View style={styles.itemContainer}>
            <Text>
                {translatedName} - {i18n.t('quantity')}: {item.quantity},{' '}
                {i18n.t('price')}: ₹{item.price}
            </Text>
        </View>
    );
};

const OrderCard = ({ order }) => (
    <View style={styles.card}>
        <Text style={styles.cardTitle}>
            {i18n.t('orderId')}: {order._id}
        </Text>
        <Text style={styles.cardSubtitle}>
            {i18n.t('created')}: {new Date(order.createdAt).toLocaleString()}
        </Text>
        <Text style={styles.cardSubtitle}>
            {i18n.t('completed')}:{' '}
            {new Date(order.completedAt).toLocaleString()}
        </Text>
        <Text style={styles.itemsTitle}>{i18n.t('items')}:</Text>
        {order.items.map((item, index) => (
            <OrderItem key={index} item={item} />
        ))}
        <Text style={styles.totalPrice}>
            {i18n.t('total')}: ₹
            {order.items.reduce(
                (sum, item) => sum + item.quantity * item.price,
                0
            )}
        </Text>
    </View>
);

export default function PastOrders() {
    const [pastOrders, setPastOrders] = useState([])
    const [refreshing, setRefreshing] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchPastOrders = useCallback(async () => {
        try {
            const phoneNumber = await AsyncStorage.getItem('phone')
            const response = await axios.post(
                'https://mandie.co.in/api/supplier/past-orders',
                { phoneNumber }
            )
            setPastOrders(response.data.pastOrders || [])
            console.log('Past orders:', response.data.pastOrders)
        } catch (error) {
            console.error(i18n.t('errorFetchingOrders'), error)
            setPastOrders([]) // Set empty array on error
        } finally {
            setRefreshing(false)
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPastOrders()
    }, [fetchPastOrders])

    const onRefresh = useCallback(() => {
        setRefreshing(true)
        fetchPastOrders()
    }, [fetchPastOrders])

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{i18n.t('pastOrders')}</Text>
                {pastOrders.length > 0 ? (
                    <FlatList
                        data={pastOrders}
                        renderItem={({ item }) => <OrderCard order={item} />}
                        keyExtractor={(item) => item._id}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#0000ff']}
                                tintColor="#0000ff"
                            />
                        }
                        contentContainerStyle={styles.listContainer}
                    />
                ) : (
                    <Text style={styles.noOrdersText}>
                        {i18n.t('noPastOrders')}
                    </Text>
                )}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    listContainer: {
        flexGrow: 1,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    itemsTitle: {
        fontWeight: '600',
        marginTop: 8,
    },
    itemContainer: {
        marginLeft: 16,
        marginTop: 4,
    },
    totalPrice: {
        fontWeight: 'bold',
        marginTop: 8,
        textAlign: 'right',
    },
    noOrdersText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
})