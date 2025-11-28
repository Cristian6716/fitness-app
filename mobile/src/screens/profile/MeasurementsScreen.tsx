import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import api from '../../services/api.service';

// Mock data for charts (will be real later)
const MEASUREMENT_TYPES = [
    { id: 'weight', label: 'Peso', unit: 'kg' },
    { id: 'bodyFat', label: 'Massa Grassa', unit: '%' },
    { id: 'chest', label: 'Petto', unit: 'cm' },
    { id: 'waist', label: 'Vita', unit: 'cm' },
    { id: 'hips', label: 'Fianchi', unit: 'cm' },
    { id: 'biceps', label: 'Bicipiti', unit: 'cm' },
    { id: 'thighs', label: 'Cosce', unit: 'cm' },
];

type MeasurementsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Measurements'>;

interface Props {
    navigation: MeasurementsScreenNavigationProp;
}

export const MeasurementsScreen: React.FC<Props> = ({ navigation }) => {
    const { theme } = useTheme();
    const styles = React.useMemo(() => getStyles(theme), [theme]);
    const [measurements, setMeasurements] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedType, setSelectedType] = useState(MEASUREMENT_TYPES[0]);
    const [newValue, setNewValue] = useState('');

    useEffect(() => {
        loadMeasurements();
    }, []);

    const loadMeasurements = async () => {
        try {
            // TODO: Implement API call
            // const data = await api.getMeasurements();
            // setMeasurements(data);
        } catch (error) {
            console.error('Error loading measurements:', error);
        }
    };

    const handleAddMeasurement = async () => {
        if (!newValue) return;

        try {
            // TODO: Implement API call
            // await api.addMeasurement({ [selectedType.id]: parseFloat(newValue) });
            setModalVisible(false);
            setNewValue('');
            loadMeasurements();
            Alert.alert('Successo', 'Misurazione aggiunta!');
        } catch (error) {
            Alert.alert('Errore', 'Impossibile aggiungere la misurazione');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Chart Placeholder */}
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Andamento {selectedType.label}</Text>
                    <View style={styles.placeholderChart}>
                        <Text style={styles.placeholderText}>Grafico in arrivo...</Text>
                    </View>
                </View>

                {/* Measurement Types Grid */}
                <Text style={styles.sectionTitle}>Nuova Misurazione</Text>
                <View style={styles.grid}>
                    {MEASUREMENT_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.gridItem,
                                selectedType.id === type.id && styles.gridItemSelected
                            ]}
                            onPress={() => {
                                setSelectedType(type);
                                setModalVisible(true);
                            }}
                        >
                            <Text style={[
                                styles.gridLabel,
                                selectedType.id === type.id && styles.gridLabelSelected
                            ]}>
                                {type.label}
                            </Text>
                            <Text style={[
                                styles.gridUnit,
                                selectedType.id === type.id && styles.gridUnitSelected
                            ]}>
                                {type.unit}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* History List */}
                <Text style={styles.sectionTitle}>Storico</Text>
                {measurements.length === 0 ? (
                    <Text style={styles.emptyText}>Nessuna misurazione registrata</Text>
                ) : (
                    measurements.map((m: any) => (
                        <View key={m.id} style={styles.historyItem}>
                            <Text style={styles.historyDate}>
                                {new Date(m.date).toLocaleDateString()}
                            </Text>
                            <Text style={styles.historyValue}>
                                {m[selectedType.id]} {selectedType.unit}
                            </Text>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add Measurement Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Aggiungi {selectedType.label}</Text>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="0.0"
                                keyboardType="numeric"
                                value={newValue}
                                onChangeText={setNewValue}
                                autoFocus
                            />
                            <Text style={styles.inputUnit}>{selectedType.unit}</Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Annulla</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleAddMeasurement}
                            >
                                <Text style={styles.saveButtonText}>Salva</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const getStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.lg,
    },
    chartContainer: {
        backgroundColor: theme.colors.cardBackground,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        elevation: 2,
    },
    chartTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    placeholderChart: {
        height: 200,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: theme.colors.textSecondary,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    gridItem: {
        width: '47%',
        backgroundColor: theme.colors.cardBackground,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        alignItems: 'center',
    },
    gridItemSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: `${theme.colors.primary}15`,
    },
    gridLabel: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: theme.colors.text,
    },
    gridLabelSelected: {
        color: theme.colors.primary,
    },
    gridUnit: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    gridUnitSelected: {
        color: theme.colors.primary,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.lg,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    historyDate: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
    },
    historyValue: {
        fontSize: theme.fontSize.md,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    modalContent: {
        backgroundColor: theme.colors.cardBackground,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
    },
    modalTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.xl,
    },
    input: {
        fontSize: 40,
        fontWeight: 'bold',
        color: theme.colors.primary,
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.sm,
        minWidth: 100,
        textAlign: 'center',
    },
    inputUnit: {
        fontSize: theme.fontSize.xl,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.sm,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    button: {
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: theme.colors.backgroundSecondary,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
    cancelButtonText: {
        color: theme.colors.text,
        fontWeight: '600',
    },
    saveButtonText: {
        color: theme.colors.white,
        fontWeight: '600',
    },
});
