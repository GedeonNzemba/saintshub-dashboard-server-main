// PATH: saintshub\app\(app)\components\sermon-new\components\filter\FilterModal.tsx
import { View, Text, TouchableOpacity, FlatList, TextInput, Modal } from 'react-native';
import React, { useState, useMemo, useRef, useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DAILY_SCRIPTURE_AND_QUOTE_URI } from '@/utilities/tools';
import axios from 'axios';
import { filterStyles } from './filterStyles';

interface Language {
    code: string;
    name: string;
}

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

const YEARS = [
    { year: 1947, code: "47-" },
    { year: 1948, code: "48-" },
    { year: 1949, code: "49-" },
    { year: 1950, code: "50-" },
    { year: 1951, code: "51-" },
    { year: 1952, code: "52-" },
    { year: 1953, code: "53-" },
    { year: 1954, code: "54-" },
    { year: 1955, code: "55-" },
    { year: 1956, code: "56-" },
    { year: 1957, code: "57-" },
    { year: 1958, code: "58-" },
    { year: 1959, code: "59-" },
    { year: 1960, code: "60-" },
    { year: 1961, code: "61-" },
    { year: 1962, code: "62-" },
    { year: 1963, code: "63-" },
    { year: 1964, code: "64-" },
    { year: 1965, code: "65-" }
];

const LENGTHS = [
    { length: '0 - 30', code: "30" },
    { length: '31 - 60', code: "60" },
    { length: '61 - 90', code: "90" },
    { length: '91 - 120', code: "120" },
    { length: '121 - 150+', code: "150" }
];

const SERIES = [
    { title: 'My Life Story', value: 'mylifestory' },
    { title: 'How The Angel Came To Me', value: 'angel' },
    { title: 'The Revelation Of The Seven Seals', value: 'seals' },
    { title: 'The Revelation Of Jesus Christ', value: 'revelation' },
    { title: 'Conduct, Order, And Doctrine Of The Church', value: 'cod' },
    { title: 'The Book Of Hebrews', value: 'hebrews' },
    { title: 'The Holy Ghost', value: 'holy' },
    { title: 'Adoption', value: 'adoption' },
    { title: 'The Seventy Weeks Of Daniel', value: 'seventy' },
    { title: 'The Church', value: 'church' },
    { title: 'Demonology', value: 'demonology' },
    { title: 'Israel And The Church', value: 'israel' },
    { title: 'The Church Age book (audio)', value: 'cab' }
];

const FilterModal = () => {
    const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
    const [activeFilterType, setActiveFilterType] = useState<FilterType>('language');
    const [activeFilterModal, setActiveFilterModal] = useState<FilterType | null>(null);
    const [sermons, setSermons] = useState<Sermon[]>([]);
    const [isLoadingSermons, setIsLoadingSermons] = useState(false);
    const [sermonsError, setSermonsError] = useState<Error | null>(null);
    const [modalSearchTerm, setModalSearchTerm] = useState('');

    if (!activeFilterModal) return null;

    let filterItems: { label: string; value: string; }[] = [];
    let title = '';
    let iconName = '';
    let iconColor = '';

    switch (activeFilterModal) {
        case 'year':
            title = 'Filter by Year';
            iconName = 'calendar';
            iconColor = '#0284c7';
            filterItems = YEARS.map(item => ({ label: item.year.toString(), value: item.code }));
            break;
        case 'length':
            title = 'Filter by Length';
            iconName = 'time';
            iconColor = '#ca8a04';
            filterItems = LENGTHS.map(item => ({ label: item.length, value: item.code }));
            break;
        case 'series':
            title = 'Filter by Series';
            iconName = 'book';
            iconColor = '#8b5cf6';
            filterItems = SERIES.map(item => ({ label: item.title, value: item.value }));
            break;
        default:
            return null;
    }

    // Handle filter selection (year, length, series)
    const handleFilterSelect = async (type: FilterType, value: string) => {
        if (!selectedLanguage) return;

        setActiveFilterType(type);
        setIsLoadingSermons(true);
        setSermonsError(null);

        try {
            let endpoint = '';

            switch (type) {
                case 'year':
                    endpoint = `${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/sermonsByYear?languageCode=${selectedLanguage.code}&yearCode=${value}`;
                    break;
                case 'length':
                    endpoint = `${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/sermonsByLength?languageCode=${selectedLanguage.code}&lengthCode=${value}`;
                    break;
                case 'series':
                    endpoint = `${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/sermonsBySeries?languageCode=${selectedLanguage.code}&seriesCode=${value}`;
                    break;
                default:
                    return;
            }

            const response = await axios.get(endpoint);
            console.log(`${type} filter response:`, response.data);
            setSermons(response.data.d || []);
        } catch (error) {
            console.error(`Failed to fetch sermons by ${type}:`, error);
            setSermonsError(error as Error);
            setSermons([]);
        } finally {
            setIsLoadingSermons(false);
        }
    };

    // Filter items based on search term
    const filteredItems = filterItems.filter(item =>
        item.label.toLowerCase().includes(modalSearchTerm.toLowerCase())
    );

    return (
        <View style={filterStyles.filterModalOverlay}>
            <View style={filterStyles.filterModalContent}>
                <View style={filterStyles.filterModalHeader}>
                    <Text style={filterStyles.filterModalTitle}>
                        {title}
                    </Text>
                    <TouchableOpacity onPress={() => {
                        setActiveFilterModal(null);
                        setModalSearchTerm('');
                    }}>
                        <Ionicons name="close" size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>

                <View style={filterStyles.filterModalBody}>
                    <View style={filterStyles.filterSearchContainer}>
                        <Ionicons name="search" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                        <TextInput
                            style={filterStyles.filterSearchInput}
                            placeholder={`Search ${activeFilterModal}...`}
                            placeholderTextColor="#94a3b8"
                            value={modalSearchTerm}
                            onChangeText={setModalSearchTerm}
                            autoFocus={true}
                        />
                        {modalSearchTerm.length > 0 && (
                            <TouchableOpacity
                                style={filterStyles.filterModalCancelButton}
                                onPress={() => setModalSearchTerm('')}
                            >
                                <Ionicons name="close-circle" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {filteredItems.length === 0 ? (
                        <View style={filterStyles.noResultsContainer}>
                            <Ionicons
                                name="search-outline"
                                size={50}
                                color="#cbd5e1"
                            />
                            <Text style={filterStyles.noResultsText}>
                                No {activeFilterModal} found matching "{modalSearchTerm}"
                            </Text>
                            <TouchableOpacity
                                style={filterStyles.clearSearchButtonLarge}
                                onPress={() => setModalSearchTerm('')}
                            >
                                <Text style={filterStyles.clearSearchButtonText}>Clear Search</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredItems}
                            keyExtractor={(item, index) => `filter-${index}`}
                            contentContainerStyle={filterStyles.filterModalList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={filterStyles.filterModalItem}
                                    onPress={() => {
                                        handleFilterSelect(activeFilterModal, item.value);
                                        setActiveFilterModal(null);
                                        setModalSearchTerm('');
                                    }}
                                >
                                    <Text
                                        style={filterStyles.filterModalItemText}
                                        numberOfLines={1}
                                    >
                                        {item.label}
                                    </Text>
                                    <View style={filterStyles.filterModalItemIconContainer}>
                                        <Ionicons name="chevron-forward" size={20} color="#64748b" />
                                    </View>
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={filterStyles.filterItemSeparator} />}
                        />
                    )}
                </View>
            </View>
        </View>
    );
};

export default FilterModal;
