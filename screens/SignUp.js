import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    Image,
    ScrollView,
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Icon from 'react-native-feather'
import { themeColors } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import s3Client from '../config/s3client'  // Import s3Client from s3Client.js
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'
import 'react-native-url-polyfill/auto'
import { ReadableStream } from 'web-streams-polyfill'
import i18n from '../i18nConfig'
import MapView, { Marker } from 'react-native-maps'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'

globalThis.ReadableStream = ReadableStream

export default function SupplierSignUp({ navigation }) {
    const [name, setName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [shopName, setShopName] = useState('')
    const [address, setAddress] = useState({
        place: '',
        city: '',
        state: '',
        postalCode: '',
        latitude: null,
        longitude: null,
    })
    const [userImage, setUserImage] = useState(null)
    const [idImage, setIdImage] = useState(null)
    const [userImageUrl, setUserImageUrl] = useState('')
    const [idImageUrl, setIdImageUrl] = useState('')
    const [errorMsg, setErrorMsg] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [mapRegion, setMapRegion] = useState(null)

    useEffect(() => {
        const loadPhoneNumber = async () => {
            try {
                const storedPhoneNumber = await AsyncStorage.getItem('phone')
                if (storedPhoneNumber) {
                    setPhoneNumber(storedPhoneNumber)
                } else {
                    Alert.alert(i18n.t('error'), i18n.t('phoneNotFound'))
                }
            } catch (error) {
                console.error(i18n.t('errorLoadingPhone'), error)
            }
        }

        loadPhoneNumber()
    }, [])

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                let { status } =
                    await Location.requestForegroundPermissionsAsync()
                if (status !== 'granted') {
                    setErrorMsg(i18n.t('locationPermissionDenied'))
                    return
                }

                let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeout: 10000,
                })

                const reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                })

                const { name, city, region, postalCode } = reverseGeocode[0]

                setAddress({
                    place: name || '',
                    city: city || '',
                    state: region || '',
                    postalCode: postalCode || '',
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                })
            } catch (error) {
                console.error(i18n.t('errorFetchingLocation'), error)
                setErrorMsg(i18n.t('locationFetchError'))
            }
        }

        fetchLocation()
    }, [])

    const pickImage = async (setImageFunction, folder) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        })

        if (!result.canceled) {
            setImageFunction(result.assets[0].uri)
            uploadImage(result.assets[0], folder)
        }
    }

    const getImageBlob = async (uri) => {
        const response = await fetch(uri)
        const blob = await response.blob()
        return blob
    }

    const uploadImage = async (imageAsset, folder) => {
        setUploading(true)
        const fileName = `${folder}/${uuidv4()}.jpg`

        try {
            const blob = await getImageBlob(imageAsset.uri)

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
            await s3Client.send(command)

            const imageUrl = `${'https://image-handler-2003.blr1.digitaloceanspaces.com'}/${fileName}`

            if (folder === 'person') {
                setUserImageUrl(imageUrl)
            } else if (folder === 'id') {
                setIdImageUrl(imageUrl)
            }

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

    const handleSubmit = async () => {
        if (!name || !shopName || !userImageUrl || !idImageUrl) {
            Alert.alert(i18n.t('error'), i18n.t('allFieldsRequired'))
            return
        }
        let userType = 'supplier'

        try {
            const formData = {
                name,
                phoneNumber,
                userType,
                shopName,
                address,
                userImage: userImageUrl,
                idImage: idImageUrl,
            }

            const response = await axios.post(
                'https://mandie.co.in/api/auth/signup',
                formData
            )

            if (response.status === 201) {
                Alert.alert(
                    i18n.t('success'),
                    // i18n.t('supplierRegisteredSuccess')
                )
                await AsyncStorage.setItem('login', 'true')
                navigation.navigate('Home')
            }
        } catch (error) {
            console.error(
                i18n.t('signupError'),
                error.response?.data || error.message
            )
            Alert.alert(
                i18n.t('error'),
                error.response?.data?.message || i18n.t('signupFailed')
            )
        }
    }

    const detectLocationAgain = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                setErrorMsg(i18n.t('locationPermissionDenied'))
                return
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
                timeout: 10000,
            })

            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            })

            const { name, city, region, postalCode } = reverseGeocode[0]

            setAddress({
                place: name || '',
                city: city || '',
                state: region || '',
                postalCode: postalCode || '',
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            })

            setMapRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            })

            Alert.alert(i18n.t('success'), i18n.t('locationDetectedSuccess'))
        } catch (error) {
            console.error(i18n.t('errorFetchingLocation'), error)
            setErrorMsg(i18n.t('locationFetchError'))
        }
    }

    const handleMapPress = (event) => {
        const { latitude, longitude } = event.nativeEvent.coordinate
        setMapRegion({
            ...mapRegion,
            latitude,
            longitude,
        })
        updateAddressFromCoordinates(latitude, longitude)
    }

    const updateAddressFromCoordinates = async (latitude, longitude) => {
        try {
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            })

            const { name, city, region, postalCode } = reverseGeocode[0]

            setAddress({
                place: name || '',
                city: city || '',
                state: region || '',
                postalCode: postalCode || '',
                latitude,
                longitude,
            })
        } catch (error) {
            console.error(i18n.t('errorUpdatingAddress'), error)
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
                        {i18n.t('name')}
                    </Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder={i18n.t('enterName')}
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
                        {i18n.t('shopName')}
                    </Text>
                    <TextInput
                        value={shopName}
                        onChangeText={setShopName}
                        placeholder={i18n.t('enterShopName')}
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
                        {i18n.t('addressAuto')}
                    </Text>
                    <TextInput
                        value={`${address.place}, ${address.city}, ${address.state}, ${address.postalCode}`}
                        placeholder={i18n.t('addressWillBeAuto')}
                        className="border rounded-lg p-2 mb-4"
                        editable={false}
                        style={{
                            borderColor: themeColors.bgColor(1),
                            color: themeColors.text,
                        }}
                    />

                    {/* <Text className="text-lg mb-2" style={{ color: themeColors.text }}>
                        {i18n.t('addressAuto')}
                    </Text>
                    <TextInput
                        value={`${address.place}, ${address.city}, ${address.state}, ${address.postalCode}`}
                        placeholder={i18n.t('addressWillBeAuto')}
                        className="border rounded-lg p-2 mb-4"
                        editable={false}
                        style={{ borderColor: themeColors.bgColor(1), color: themeColors.text }}
                    /> */}

                    <TouchableOpacity
                        onPress={detectLocationAgain}
                        className="py-3 rounded-lg mb-4"
                        style={{ backgroundColor: themeColors.bgColor(1) }}
                    >
                        <Text className="text-center text-white text-lg">
                            {i18n.t('detectLocationAgain')}
                        </Text>
                    </TouchableOpacity>

                    {/* <Text className="text-lg mb-2" style={{ color: themeColors.text }}>
                        {i18n.t('searchLocation')}
                    </Text> */}
                    {/* <GooglePlacesAutocomplete
                        placeholder={i18n.t('searchPlaceholder')}
                        onPress={(data, details = null) => {
                            const { lat, lng } = details.geometry.location
                            setMapRegion({
                                latitude: lat,
                                longitude: lng,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            })
                            updateAddressFromCoordinates(lat, lng)
                        }}
                        query={{
                            key: '',
                            language: 'en',
                        }}
                        styles={{
                            container: { flex: 0, marginBottom: 16 },
                            textInput: { height: 38, fontSize: 16, borderWidth: 1, borderColor: themeColors.bgColor(1) },
                        }}
                    />

                    {mapRegion && (
                        <MapView
                            style={{ width: '100%', height: 200, marginBottom: 16 }}
                            region={mapRegion}
                            onPress={handleMapPress}
                        >
                            <Marker coordinate={mapRegion} />
                        </MapView>
                    )} */}

                    <TouchableOpacity
                        onPress={() => pickImage(setUserImage, 'person')}
                        className="mb-4"
                        disabled={uploading}
                    >
                        <Text
                            className="text-lg mb-2"
                            style={{ color: themeColors.text }}
                        >
                            {uploading
                                ? i18n.t('uploading')
                                : i18n.t('userImage')}
                        </Text>
                        {userImage ? (
                            <Image
                                source={{ uri: userImage }}
                                style={{ width: 100, height: 100 }}
                            />
                        ) : (
                            <View
                                style={{
                                    width: 100,
                                    height: 100,
                                    backgroundColor: 'lightgray',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Text>{i18n.t('selectImage')}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => pickImage(setIdImage, 'id')}
                        className="mb-8"
                        disabled={uploading}
                    >
                        <Text
                            className="text-lg mb-2"
                            style={{ color: themeColors.text }}
                        >
                            {uploading
                                ? i18n.t('uploading')
                                : i18n.t('idImage')}
                        </Text>
                        {idImage ? (
                            <Image
                                source={{ uri: idImage }}
                                style={{ width: 100, height: 100 }}
                            />
                        ) : (
                            <View
                                style={{
                                    width: 100,
                                    height: 100,
                                    backgroundColor: 'lightgray',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Text>{i18n.t('selectImage')}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        className="py-3 rounded-lg"
                        style={{ backgroundColor: themeColors.bgColor(1) }}
                        disabled={uploading}
                    >
                        <Text className="text-center text-white text-lg">
                            {i18n.t('signUp')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}
