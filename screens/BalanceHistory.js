import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';
import * as Icon from 'react-native-feather';
import { themeColors } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import i18n from '../i18nConfig';

const EmptyState = ({ icon, title, message }) => (
    <View className="py-8 items-center">
        {icon}
        <Text className="text-lg font-semibold mt-4 text-gray-700">{i18n.t(title)}</Text>
        <Text className="text-gray-500 text-center mt-2 mx-4">{i18n.t(message)}</Text>
    </View>
);

export default function BalanceHistoryScreen({ navigation }) {
    const [currentBalance, setCurrentBalance] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBalanceAndHistory();
    }, []);

    const fetchBalanceAndHistory = async () => {
        setLoading(true);
        setError(null);
        let phoneNumber;

        try {
            phoneNumber = await AsyncStorage.getItem('phone');
            if (!phoneNumber) {
                throw new Error(i18n.t('phoneNotFound'));
            }

            const balanceResponse = await axios.post(
                'https://mandie.co.in/api/supplier/supplier-balance',
                { phoneNumber }
            );
            setCurrentBalance(balanceResponse.data.amountOwed);

            const historyResponse = await axios.post(
                'https://mandie.co.in/api/supplier/supplier-history',
                { phoneNumber }
            );
            setPaymentHistory(historyResponse.data.paymentHistory || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.response?.data?.message || error.message || i18n.t('errorOccurred'));
        } finally {
            setLoading(false);
        }
    };

    const renderBalanceCard = () => (
        <View className="mx-4 bg-white rounded-2xl p-6 shadow-sm mb-6">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-500 font-medium">{i18n.t('currentBalance')}</Text>
                <Icon.DollarSign 
                    stroke={themeColors.bgColor(1)} 
                    width={24} 
                    height={24} 
                />
            </View>
            {currentBalance !== null ? (
                <>
                    <Text className="text-3xl font-bold">
                        ₹{currentBalance.toLocaleString()}
                    </Text>
                    <Text className="text-gray-500 mt-2">
                        {i18n.t('lastUpdated')}: {format(new Date(), 'MMM d, yyyy')}
                    </Text>
                </>
            ) : (
                <EmptyState
                    icon={<Icon.AlertCircle stroke="#9CA3AF" width={40} height={40} />}
                    title="balanceUnavailable"
                    message="balanceUnavailableMessage"
                />
            )}
        </View>
    );

    const renderPaymentHistory = () => (
        <View className="mx-4 bg-white rounded-2xl p-6 shadow-sm mb-6">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-500 font-medium">{i18n.t('paymentHistory')}</Text>
                <Icon.Clock 
                    stroke={themeColors.bgColor(1)} 
                    width={24} 
                    height={24} 
                />
            </View>
            {paymentHistory.length > 0 ? (
                paymentHistory.map((payment, index) => (
                    <View 
                        key={index} 
                        className="flex-row justify-between items-center py-3 border-b border-gray-100"
                    >
                        <View>
                            <Text className="font-medium">
                                {format(new Date(payment.date), 'MMM d, yyyy')}
                            </Text>
                            <Text className="text-gray-500 text-sm">
                                {payment.description || i18n.t('paymentReceived')}
                            </Text>
                        </View>
                        <Text className={`font-bold text-green-500`}>
                            {payment.type === '+'}+₹{payment.amount.toLocaleString()}
                        </Text>
                    </View>
                ))
            ) : (
                <EmptyState
                    icon={<Icon.Calendar stroke="#9CA3AF" width={40} height={40} />}
                    title="noPaymentHistory"
                    message="noPaymentHistoryMessage"
                />
            )}
        </View>
    );

    const renderTrendChart = () => (
        <View className="mx-4 bg-white rounded-2xl p-6 shadow-sm mb-6">
            <Text className="text-gray-500 font-medium mb-4">{i18n.t('monthlyTrend')}</Text>
            {paymentHistory.length >= 2 ? (
                <LineChart
                    data={{
                        labels: paymentHistory
                            .slice(-6)
                            .map(p => format(new Date(p.date), 'MMM')),
                        datasets: [{
                            data: paymentHistory
                                .slice(-6)
                                .map(p => p.amount)
                        }]
                    }}
                    width={300}
                    height={200}
                    chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                        style: {
                            borderRadius: 16
                        }
                    }}
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                />
            ) : (
                <EmptyState
                    icon={<Icon.TrendingUp stroke="#9CA3AF" width={40} height={40} />}
                    title="insufficientData"
                    message="insufficientDataMessage"
                />
            )}
        </View>
    );

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="p-4 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="p-2"
                    >
                        <Icon.ArrowLeft stroke="black" width={24} height={24} />
                    </TouchableOpacity>
                </View>
                <View className="flex-1 justify-center items-center p-4">
                    <Icon.XCircle stroke="red" width={48} height={48} />
                    <Text className="text-xl font-bold mt-4 text-center">{i18n.t('oops')}</Text>
                    <Text className="text-gray-500 text-center mt-2">{error}</Text>
                    <TouchableOpacity
                        onPress={fetchBalanceAndHistory}
                        className="mt-6 bg-blue-500 px-6 py-3 rounded-full flex-row items-center"
                    >
                        <Icon.RefreshCw stroke="white" width={20} height={20} />
                        <Text className="text-white font-medium ml-2">{i18n.t('tryAgain')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="p-4 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="p-2"
                    >
                        <Icon.ArrowLeft stroke="black" width={24} height={24} />
                    </TouchableOpacity>
                </View>
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={themeColors.bgColor(1)} />
                    <Text className="text-gray-500 mt-4">{i18n.t('loadingData')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView>
                <View className="p-4 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="p-2"
                    >
                        <Icon.ArrowLeft stroke="black" width={24} height={24} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold ml-4">{i18n.t('balanceAndHistory')}</Text>
                </View>

                {renderBalanceCard()}
                {renderPaymentHistory()}
                {renderTrendChart()}
            </ScrollView>
        </SafeAreaView>
    );
}
