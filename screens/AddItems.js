import {
    View,
    Text,
    TextInput,
    Alert,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Icon from 'react-native-feather'
import { themeColors } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import * as ImagePicker from 'expo-image-picker'
import s3Client from '../config/s3client'  // Import s3Client from s3Client.js
import { PutObjectCommand } from '@aws-sdk/client-s3'
import 'react-native-get-random-values'
import { ReadableStream } from 'web-streams-polyfill'
globalThis.ReadableStream = ReadableStream

import { v4 as uuidv4 } from 'uuid'
import { spaces } from '../config/digitalOcean'
import 'react-native-url-polyfill/auto'
import i18n from '../i18nConfig'

export default function AddItems({ navigation }) {
    const [itemName, setItemName] = useState('')
    const [quality, setQuality] = useState('')
    const [priceSlabs, setPriceSlabs] = useState([
        { minQuantity: '', price: '' },
    ])
    const [itemImage, setItemImage] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [uploading, setUploading] = useState(false)
    const [ifVerified, setVerify] = useState(false)

    useEffect(() => {
        const loadPhoneNumber = async () => {
            try {
                const storedPhoneNumber = await AsyncStorage.getItem('phone')
                if (storedPhoneNumber) {
                    setPhoneNumber(storedPhoneNumber)
                } else {
                    Alert.alert('Error', 'Phone number not found')
                }
            } catch (error) {
                console.error(
                    'Error loading phone number from AsyncStorage:',
                    error
                )
            }
        }

        loadPhoneNumber()
        checkVerify()
    }, [])

    const checkVerify = async () => {
        let storedPhoneNumber = await AsyncStorage.getItem('phone')
        if (!storedPhoneNumber) {
            Alert.alert('Error', 'Phone number not found')
            return
        }

        if ((await AsyncStorage.getItem('verify')) === 'true') {
            return
        }

        try {
            const response = await axios.post(
                'https://mandie.co.in/api/supplier/verified',
                { phoneNumber: storedPhoneNumber }
            )
            if (response.data.verified) {
                setVerify(true)
                await AsyncStorage.setItem('verify', 'true')
            } else {
                Alert.alert(i18n.t('notVerified'))
                navigation.navigate('Items')
            }
        } catch (err) {
            if (err.response && err.response.status === 404) {
                Alert.alert(i18n.t('notVerified'))
                navigation.navigate('Items')
            } else {
                console.log(err)
                Alert.alert(i18n.t('error'), i18n.t('authError'))
            }
        }
    }

    const pickImageAsync = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 1,
        })

        if (!result.canceled) {
            uploadImage(result.assets[0])
        } else {
            alert(i18n.t('noImageSelected'))
        }
    }

    const getImageBlob = async (uri) => {
        const response = await fetch(uri)
        const blob = await response.blob()
        return blob
    }

    const uploadImage = async (imageAsset) => {
        setUploading(true)
        const fileName = `${uuidv4()}.jpg`

        try {
            const blob = await getImageBlob(imageAsset.uri)
            console.log('blob is this')
            console.log(blob)

            const params = {
                Bucket: 'image-handler-2003',
                Key: fileName,
                Body: blob,
                ACL: 'public-read',
                ContentType: 'image/jpeg',
                Metadata: {
                    'Cache-Control': 'max-age=3600',
                },
            }

            const command = new PutObjectCommand(params)
            console.log('command ran')
            const data = await s3Client.send(command) // Use imported s3Client here

            console.log('no error till data')

            const imageUrl = `${'https://image-handler-2003.blr1.digitaloceanspaces.com'}/${fileName}`
            setItemImage(imageUrl)
            Alert.alert(i18n.t('success'), i18n.t('imageUploadSuccess'))
        } catch (error) {
            console.error('Error uploading image:', error)
            Alert.alert(
                i18n.t('error'),
                `${i18n.t('imageUploadError')}${error.message}`
            )
        }
        setUploading(false)
    }

    const addPriceSlab = () => {
        setPriceSlabs([...priceSlabs, { minQuantity: '', price: '' }])
    }

    const updatePriceSlab = (index, field, value) => {
        const updatedSlabs = [...priceSlabs]
        updatedSlabs[index][field] = value
        setPriceSlabs(updatedSlabs)
    }

    const handleSubmit = async () => {
        if (
            !itemName ||
            priceSlabs.some((slab) => !slab.minQuantity || !slab.price)
        ) {
            Alert.alert(i18n.t('error'), i18n.t('allFieldsRequired'))
            return
        }

        try {
            const formData = {
                phoneNumber,
                itemName,
                quality,
                priceSlabs,
                itemImage,
            }

            const response = await axios.post(
                'https://mandie.co.in/api/supplier/add-item',
                formData
            )

            if (response.status === 200) {
                Alert.alert(i18n.t('success'), i18n.t('itemAddedSuccessfully'))
                navigation.goBack()
            }
        } catch (error) {
            console.error(
                'Error adding item:',
                error.response?.data || error.message
            )
            Alert.alert(
                i18n.t('error'),
                error.response?.data?.message || i18n.t('failedToAddItem')
            )
        }
    }

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
                    <Text
                        className="text-lg mb-2"
                        style={{ color: themeColors.text }}
                    >
                        {i18n.t('produceName')}
                    </Text>
                    <TextInput
                        value={itemName}
                        onChangeText={setItemName}
                        placeholder={i18n.t('enterProduceName')}
                        className="border rounded-lg p-2 mb-4"
                        style={{
                            borderColor: themeColors.bgColor(1),
                            color: themeColors.text,
                        }}
                    />

                    <Text
                        className="text-lg mb-2"
                        style={{ color: themeColors.text }}
                    >
                        {i18n.t('quality')}
                    </Text>
                    <TextInput
                        value={quality}
                        onChangeText={setQuality}
                        placeholder={i18n.t('enterQuality')}
                        className="border rounded-lg p-2 mb-4"
                        style={{
                            borderColor: themeColors.bgColor(1),
                            color: themeColors.text,
                        }}
                    />

                    <Text
                        className="text-lg mb-2"
                        style={{ color: themeColors.text }}
                    >
                        {i18n.t('priceSlabs')}
                    </Text>
                    {priceSlabs.map((slab, index) => (
                        <View key={index} className="flex-row mb-2">
                            <TextInput
                                value={slab.minQuantity}
                                onChangeText={(value) =>
                                    updatePriceSlab(index, 'minQuantity', value)
                                }
                                placeholder={i18n.t('minQuantity')}
                                keyboardType="numeric"
                                className="border rounded-lg p-2 flex-1 mr-2"
                                style={{
                                    borderColor: themeColors.bgColor(1),
                                    color: themeColors.text,
                                }}
                            />
                            <TextInput
                                value={slab.price}
                                onChangeText={(value) =>
                                    updatePriceSlab(index, 'price', value)
                                }
                                placeholder={i18n.t('pricePerKg')}
                                keyboardType="numeric"
                                className="border rounded-lg p-2 flex-1"
                                style={{
                                    borderColor: themeColors.bgColor(1),
                                    color: themeColors.text,
                                }}
                            />
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
                        onPress={pickImageAsync}
                        className="py-3 rounded-lg mb-4"
                        style={{ backgroundColor: themeColors.bgColor(1) }}
                        disabled={uploading}
                    >
                        <Text className="text-center text-white text-lg">
                            {uploading
                                ? i18n.t('uploading')
                                : i18n.t('pickUploadImage')}
                        </Text>
                    </TouchableOpacity>

                    {itemImage ? (
                        <Image
                            source={{ uri: itemImage }}
                            style={{
                                width: 200,
                                height: 200,
                                alignSelf: 'center',
                                marginBottom: 20,
                            }}
                        />
                    ) : null}

                    <TouchableOpacity
                        onPress={handleSubmit}
                        className="py-3 rounded-lg"
                        style={{ backgroundColor: themeColors.bgColor(1) }}
                    >
                        <Text className="text-center text-white text-lg">
                            {i18n.t('submit')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}
