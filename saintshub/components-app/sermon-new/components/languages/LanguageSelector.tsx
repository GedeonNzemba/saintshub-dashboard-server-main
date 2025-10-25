// PATH:  saintshub\app\(app)\components\sermon-new\components\languages\LanguageSelector.tsx
import { View as RNView, Text, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Animated } from 'react-native';
import React, { useEffect, useState, useRef } from 'react'
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { DAILY_SCRIPTURE_AND_QUOTE_URI } from '@/utilities/tools';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView, View } from 'moti';
// import { safeApiCall } from '../../utils/errorHandling';
import { fetchSermonsByLanguageWithCache } from '../../utils/cacheUtils';
import { languageStyles as styles } from './styles';
import { Language } from '../../types';

interface Sermon {
    title: string;
    code: string;
    speaker: string;
    date: string;
    location: string;
    duration: string;
    audioUrl: string;
    pdfUrl: string;
    streamUrl: string;
    language?: string;
    year?: string;
    length?: 'SHORT' | 'MEDIUM' | 'LONG';
    series?: string;
}

type FilterType = 'language' | 'year' | 'length' | 'series' | 'search';
const FAVORITES_STORAGE_KEY = '@SermonLibrary:favorites'; // Storage key for favorites

// Define constant for height
const SLIDER_PLACEHOLDER_HEIGHT = 8;

interface LanguageSelectorProps {
    languages: Language[];
    isLoading: boolean;
    error: Error | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSelect: (language: Language) => void;
    selectedLanguage: Language | null;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    languages,
    isLoading,
    error,
    searchQuery,
    onSearchChange,
    onSelect,
    selectedLanguage
}) => {
    // IMPORTANT: All hooks must be called unconditionally at the top level
    // to avoid the "Rendered more hooks than during the previous render" error
    
    // Animation ref for search bar - always create this ref regardless of rendering path
    const searchBarAnimation = useRef(new Animated.Value(0)).current;
    
    // We'll keep some internal state for items that aren't passed as props
    const [isLoadingSermons, setIsLoadingSermons] = useState(false);
    const [sermons, setSermons] = useState<Sermon[]>([]);
    const [sermonsError, setSermonsError] = useState<Error | null>(null);
    const [favorites, setFavorites] = useState<Sermon[]>([]);
    
    // Load favorites on mount - this could be moved to the parent component in the future
    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
                if (storedFavorites !== null) {
                    setFavorites(JSON.parse(storedFavorites));
                }
            } catch (e) {
                console.error('Failed to load favorites.', e);
            }
        };

        loadFavorites();
    }, []);
    
    // Use the props instead of internal state for these values

    // Use the onSelect prop instead of handling internally
    const handleLanguageSelect = (language: Language) => {
        console.log('Language selected:', language);
        onSelect(language);
    };

    // Fetch sermons by language
    const fetchSermonsByLanguage = async (languageCode: string) => {
        setIsLoadingSermons(true);
        setSermonsError(null);

        try {
            // Log for debugging
            console.log(`Fetching sermons for language: ${languageCode}`);

            const response = await axios.get(`${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/sermons?languageCode=${languageCode}`);
            console.log('Sermons response:', response.data);

            if (response.data && Array.isArray(response.data.d)) {
                setSermons(response.data.d);
                console.log(`Successfully loaded ${response.data.d.length} sermons`);
            } else {
                console.warn('Unexpected sermon data format:', response.data);
                setSermons([]);
            }
        } catch (error) {
            console.error('Failed to fetch sermons:', error);
            setSermonsError(error as Error);
            setSermons([]);
        } finally {
            setIsLoadingSermons(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={['#6a11cb', '#8e44ad']}
                    style={styles.loadingIndicator}
                >
                    <ActivityIndicator size="large" color="#ffffff" />
                </LinearGradient>
                <Text style={styles.loadingText}>
                    Loading languages...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <LinearGradient
                    colors={['#f87171', '#ef4444']}
                    style={styles.errorIndicator}
                >
                    <Ionicons name="alert-circle" size={36} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.errorText}>
                    Failed to load languages
                </Text>
                <Text style={styles.errorSubText}>
                    {error.message}
                </Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                        // Alert the parent that the user wants to retry
                        alert('Retry functionality should be handled by the parent component');
                    }}
                >
                    <LinearGradient
                        colors={['#6a11cb', '#8e44ad']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }

    if (languages.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <LinearGradient
                    colors={['#64748b', '#475569']}
                    style={styles.emptyIconBackground}
                >
                    <MaterialCommunityIcons name="translate" size={36} color="#ffffff" />
                </LinearGradient>
                <Text style={styles.emptyText}>
                    No languages available
                </Text>
            </View>
        );
    }

    // Helper function to get flag emoji for a language
    const getLanguageFlag = (langCode: string) => {
        // This is a simplified mapping - in a real app, you would have a more complete mapping
        const flagMap: { [key: string]: string } = {
            'eng': '🇺🇸', // English
            'spa': '🇪🇸', // Spanish
            'fre': '🇫🇷', // French
            'ger': '🇩🇪', // German
            'ita': '🇮🇹', // Italian
            'por': '🇵🇹', // Portuguese
            'rus': '🇷🇺', // Russian
            'jpn': '🇯🇵', // Japanese
            'zho': '🇨🇳', // Chinese
            'kor': '🇰🇷', // Korean
            'ara': '🇸🇦', // Arabic
            'hin': '🇮🇳', // Hindi
            'ben': '🇧🇩', // Bengali
            'afr': '🇿🇦', // Afrikaans
            'swa': '🇰🇪', // Swahili
            'hau': '🇳🇬', // Hausa
            'orm': '🇪🇹', // Oromo
            'alb': '🇦🇱', // Albanian
            'ast': '🇬🇭', // Asante Twi
            'bul': '🇧🇬', // Bulgarian
            'bur': '🇲🇲', // Burmese
            'ceb': '🇵🇭', // Cebuano
            'czh': '🇨🇿', // Czech
            'cha': '🇲🇼', // Chichewa
            'ind': '🇮🇩', // Indonesian
        };

        // Return the flag or a default globe if not found
        return flagMap[langCode.toLowerCase()] || '🌐';
    };

    // Filter languages based on search term
    const filteredLanguages = searchQuery.trim()
        ? languages.filter(lang =>
            lang.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : languages;

    // Group languages by first letter for better organization
    const groupedLanguages: { [key: string]: Language[] } = {};
    filteredLanguages.forEach(lang => {
        const firstLetter = lang.name.charAt(0).toUpperCase();
        if (!groupedLanguages[firstLetter]) {
            groupedLanguages[firstLetter] = [];
        }
        groupedLanguages[firstLetter].push(lang);
    });

    const sortedLetters = Object.keys(groupedLanguages).sort();

    // useEffect for loading favorites has been moved to the top of the component
    
    // Animate search bar on mount - only if we're actually showing the search bar
    useEffect(() => {
        if (!isLoading && !error && languages.length > 0) {
            Animated.timing(searchBarAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isLoading, error, languages.length, searchBarAnimation]);

    return (
        <View style={styles.container}>
            {/* Modern search input with shadow */}
            <Animated.View 
                style={[styles.searchBarContainer, {
                    opacity: searchBarAnimation,
                    transform: [{
                        translateY: searchBarAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0]
                        })
                    }]
                }]}
            >
                <View style={styles.searchInputWrapper}>
                    <Ionicons
                        name="search"
                        size={20}
                        color="#94a3b8"
                        style={styles.searchIcon as any}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search languages..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={onSearchChange}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearSearchButton}
                            onPress={() => onSearchChange('')}
                        >
                            <Ionicons name="close-circle" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            {filteredLanguages.length === 0 ? (
                <MotiView 
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 300 }}
                    style={styles.noResultsContainer}
                >
                    <Ionicons
                        name="search-outline"
                        size={50}
                        color="#cbd5e1"
                        style={styles.noResultsIcon as any}
                    />
                    <Text style={styles.noResultsText}>
                        No languages found matching "{searchQuery}"
                    </Text>
                    <TouchableOpacity
                        style={styles.clearSearchButtonLarge as any}
                        onPress={() => onSearchChange('')}
                    >
                        <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                    </TouchableOpacity>
                </MotiView>
            ) : (
                <FlatList
                    data={sortedLetters}
                    keyExtractor={(letter) => `letter-${letter}`}
                    renderItem={({ item: letter, index }) => (
                        <MotiView 
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ 
                                type: 'timing', 
                                delay: index * 50,
                                duration: 300 
                            }}
                            style={styles.letterSection}
                        >
                            <View style={styles.letterHeader}>
                                <View style={styles.letterBadge}>
                                    <Text style={styles.letterText}>{letter}</Text>
                                </View>
                            </View>
                            {groupedLanguages[letter].map((language, langIndex) => {
                                const isSelected = selectedLanguage?.code === language.code;
                                const flagEmoji = getLanguageFlag(language.code);

                                return (
                                    <MotiView
                                        key={language.code}
                                        from={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ 
                                            type: 'timing', 
                                            delay: (index * 50) + (langIndex * 30),
                                            duration: 300 
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={[
                                                styles.languageCard,
                                                isSelected && styles.languageCardSelected
                                            ]}
                                            onPress={() => {
                                                handleLanguageSelect(language);
                                                fetchSermonsByLanguageWithCache(language.code);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.languageCardContent}>
                                                <View style={styles.flagContainer}>
                                                    <Text style={styles.flagEmoji}>{flagEmoji}</Text>
                                                </View>
                                                <Text style={[
                                                    styles.languageCardText,
                                                    isSelected && styles.languageCardTextSelected
                                                ]}>
                                                    {language.name}
                                                </Text>
                                            </View>
                                            {isSelected && (
                                                <View style={styles.checkmarkContainer}>
                                                    <Ionicons name="checkmark" size={18} color="#ffffff" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </MotiView>
                                );
                            })}
                        </MotiView>
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

export default LanguageSelector

