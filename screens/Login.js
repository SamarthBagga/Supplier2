import React, { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { themeColors } from '../theme'
import auth from '@react-native-firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import i18n from '../i18nConfig'

export default function Login({ navigation }) {
    const [phoneNumber, setPhoneNumber] = useState('')
    const [confirm, setConfirm] = useState(null)
    const [verificationCode, setVerificationCode] = useState('')

    const handleGetOtp = useCallback(async () => {
        try {
            // const confirmation = await auth().signInWithPhoneNumber(
            //     '+91' + phoneNumber
            // )
            // console.log('Confirmation received:', confirmation)
            // setConfirm(confirmation)
            // Alert.alert(i18n.t('otpSent'))
            await AsyncStorage.setItem('login', 'true')
            await AsyncStorage.setItem('phone', phoneNumber)
            let userType = 'supplier'
            const response = await axios.post(
                'https://mandie.co.in/api/auth/isUser',
                { phoneNumber, userType }
            )
            Alert.alert(i18n.t('authSuccess'))
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            })
        } catch (err) {
            // console.error('Error in handleGetOtp:', err)
            // Alert.alert(i18n.t('error'), i18n.t('otpSendError'))
            if (err.response && err.response.status === 404) {
                Alert.alert(i18n.t('userNotRegistered'))
                navigation.navigate('SignUp')
            } else {
                console.log(err)
                Alert.alert(i18n.t('error'), i18n.t('authError'))
            }
        }
    }, [phoneNumber])

    const handleSubmitOtp = useCallback(async () => {
        try {
            await confirm.confirm(verificationCode)
            await AsyncStorage.setItem('login', 'true')
            await AsyncStorage.setItem('phone', phoneNumber)
            let userType = 'supplier'
            const response = await axios.post(
                'https://mandie.co.in/api/auth/isUser',
                { phoneNumber, userType }
            )
            Alert.alert(i18n.t('authSuccess'))
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            })
        } catch (err) {
            if (err.response && err.response.status === 404) {
                Alert.alert(i18n.t('userNotRegistered'))
                navigation.navigate('SignUp')
            } else {
                console.log(err)
                Alert.alert(i18n.t('error'), i18n.t('authError'))
            }
        }
    }, [confirm, verificationCode, phoneNumber, navigation])

    return (
        <SafeAreaView className="flex-1 justify-center items-center p-4">
            <Text
                className="text-2xl font-bold mb-8"
                style={{ color: themeColors.text }}
            >
                {i18n.t('login')}
            </Text>

            <View className="w-full mb-4">
                <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder={i18n.t('enterPhoneNumber')}
                    keyboardType="phone-pad"
                    className="border rounded-lg p-3"
                    style={{
                        borderColor: themeColors.bgColor(1),
                        color: themeColors.text,
                    }}
                    accessibilityLabel={i18n.t('phoneInputLabel')}
                />
            </View>

            {confirm && (
                <View className="w-full mb-4">
                    <TextInput
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        placeholder={i18n.t('enterOtp')}
                        keyboardType="numeric"
                        className="border rounded-lg p-3"
                        style={{
                            borderColor: themeColors.bgColor(1),
                            color: themeColors.text,
                        }}
                        accessibilityLabel={i18n.t('otpInputLabel')}
                    />
                </View>
            )}

            <TouchableOpacity
                onPress={confirm ? handleSubmitOtp : handleGetOtp}
                className="py-3 px-6 rounded-lg"
                style={{ backgroundColor: themeColors.bgColor(1) }}
                accessibilityLabel={
                    confirm ? i18n.t('submitOtpLabel') : i18n.t('getOtpLabel')
                }
            >
                <Text className="text-white text-lg">
                    {confirm ? i18n.t('submitOtp') : i18n.t('login')}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}
