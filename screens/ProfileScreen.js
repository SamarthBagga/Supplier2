import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Icon from 'react-native-feather'
import { themeColors } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../i18nConfig'

export default function ProfileScreen({ navigation }) {
    const logout = async () => {
        try {
            await AsyncStorage.clear()
            navigation.navigate('Login')
        } catch (e) {
            console.log(e)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 p-4">
                <TouchableOpacity
                    className="mb-5"
                    onPress={() => navigation.goBack()}
                >
                    <Icon.ArrowLeft height="24" width="24" stroke="black" />
                </TouchableOpacity>

                {/* Balance Navigation */}
                <TouchableOpacity
                    className="flex-row items-center p-4 bg-gray-100 rounded-lg mb-4"
                    onPress={() => navigation.navigate('BalanceHistory')}
                >
                    <Icon.Gift
                        height="24"
                        width="24"
                        stroke={themeColors.bgColor(1)}
                    />
                    <Text className="ml-4 text-lg">{i18n.t('balance')}</Text>
                    <Icon.ChevronRight
                        height="24"
                        width="24"
                        stroke="gray"
                        className="ml-auto"
                    />
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity
                    className="flex-row items-center p-4 bg-gray-100 rounded-lg"
                    onPress={logout}
                >
                    <Icon.LogOut
                        height="24"
                        width="24"
                        stroke={themeColors.bgColor(1)}
                    />
                    <Text className="ml-4 text-lg">{i18n.t('logout')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}
