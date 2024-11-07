import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View, Alert } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Items from './screens/Items'
import ActiveOrders from './screens/ActiveOrders'
import PastOrders from './screens/PastOrders'
import AddItems from './screens/AddItems'
import Login from './screens/Login'
import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useState, useEffect } from 'react'
import SignUp from './screens/SignUp'
import { LanguageProvider } from './components/LanguageProvider'
import LanguageSelection from './screens/LanguageSelection'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import i18n from './i18nConfig'
import ProfileScreen from './screens/ProfileScreen'
import UpdatePriceSlabs from './screens/Update'
import BalanceHistoryScreen from './screens/BalanceHistory'

// Create tab and stack navigators
const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Home component (Bottom Tabs Navigation)
function Home() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen
                name="Items"
                options={{
                    tabBarLabel: i18n.t('items'), // Use i18n for translation
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="home"
                            color={color}
                            size={size}
                        />
                    ),
                }}
                component={Items}
            />
            <Tab.Screen
                name="ActiveOrders"
                options={{
                    tabBarLabel: i18n.t('activeOrders'), // Use i18n for translation
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="cart-arrow-down"
                            color={color}
                            size={size}
                        />
                    ),
                }}
                component={ActiveOrders}
            />
            <Tab.Screen
                name="PastOrders"
                options={{
                    tabBarLabel: i18n.t('pastOrders'), // Use i18n for translation
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="cart-check"
                            color={color}
                            size={size}
                        />
                    ),
                }}
                component={PastOrders}
            />
        </Tab.Navigator>
    )
}

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(null)

    // Check if the user is logged in
    useEffect(() => {
        const checkLoginStatus = async () => {
            const loginStatus = await AsyncStorage.getItem('login')
            setIsLoggedIn(!!loginStatus) // Convert to boolean
        }
        checkLoginStatus()
    }, [])

    if (isLoggedIn === null) {
        // You can add a loading screen here if needed
        return (
            <View>
                <Text>Loading...</Text>
            </View>
        )
    }

    return (
        <LanguageProvider>
            <NavigationContainer>
                <Stack.Navigator>
                    {/* Login Screen: Only show if not logged in */}
                    {!isLoggedIn && (
                        <Stack.Screen
                            name="Language"
                            component={LanguageSelection}
                            options={{ headerShown: false }}
                        />
                    )}
                    {!isLoggedIn && (
                        <Stack.Screen
                            name="Login"
                            component={Login}
                            options={{ headerShown: false }}
                        />
                    )}

                    {/* Home screen (with bottom tabs) is always rendered */}
                    <Stack.Screen
                        name="Home"
                        component={Home}
                        options={{ headerShown: false }}
                    />

                    {/* Additional Screens */}
                    <Stack.Screen
                        name="AddItems"
                        component={AddItems}
                        options={{ headerShown: false }}
                    />

                    {isLoggedIn && (
                        <Stack.Screen
                            name="Login"
                            component={Login}
                            options={{ headerShown: false }}
                        />
                    )}

                    <Stack.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{ headerShown: false }}
                    />

                    <Stack.Screen
                        name="Update"
                        component={UpdatePriceSlabs}
                        options={{ headerShown: false }}
                    />

                    <Stack.Screen
                        name="SignUp"
                        component={SignUp}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="BalanceHistory"
                        component={BalanceHistoryScreen}
                        options={{ headerShown: false }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </LanguageProvider>
    )
}
