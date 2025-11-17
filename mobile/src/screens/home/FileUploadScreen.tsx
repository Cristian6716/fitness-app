import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';
import apiService from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

type FileUploadScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FileUpload'>;

type FileUploadScreenProps = {
  navigation: FileUploadScreenNavigationProp;
};

const FileUploadScreen: React.FC<FileUploadScreenProps> = ({ navigation }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const { completeOnboarding } = useAuth();

  const handleUploadPlan = async () => {
    try {
      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // Check file size (10MB max)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('Errore', 'File troppo grande. Massimo 10MB.');
        return;
      }

      setIsUploading(true);
      setUploadProgress('Caricamento file...');

      try {
        const uploadedPlan = await apiService.uploadWorkoutPlan(file);

        setUploadProgress('Piano caricato con successo!');

        // Mark onboarding as completed
        try {
          await completeOnboarding();
        } catch (error) {
          console.error('Error completing onboarding:', error);
          // Don't block the user if this fails
        }

        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress('');

          if (!uploadedPlan || !uploadedPlan.id) {
            Alert.alert(
              'Errore',
              'Il piano è stato caricato ma non è possibile aprirlo. Vai su "Plans" per visualizzarlo.',
            );
            return;
          }

          Alert.alert(
            'Successo!',
            'Il tuo piano di allenamento è stato caricato e analizzato.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('MainTabs'),
              },
              {
                text: 'Visualizza Piano',
                onPress: () => {
                  navigation.navigate('PlanDetails', { planId: uploadedPlan.id });
                },
              },
            ]
          );
        }, 500);
      } catch (error: any) {
        setIsUploading(false);
        setUploadProgress('');

        let errorMessage = 'Si è verificato un errore durante il caricamento.';

        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        Alert.alert('Errore', errorMessage);
      }
    } catch (error: any) {
      console.error('Document picker error:', error);
      Alert.alert('Errore', 'Impossibile aprire il selettore di file.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-upload-outline" size={80} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>Importa Piano Esistente</Text>
        <Text style={styles.description}>
          Carica un file PDF, Excel o Word con il tuo programma di allenamento.
          L'AI analizzerà il contenuto e creerà un piano strutturato.
        </Text>

        <View style={styles.supportedFormats}>
          <Text style={styles.supportedTitle}>Formati supportati:</Text>
          <View style={styles.formatsList}>
            <View style={styles.formatItem}>
              <Ionicons name="document-text" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.formatText}>PDF (.pdf)</Text>
            </View>
            <View style={styles.formatItem}>
              <Ionicons name="grid" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.formatText}>Excel (.xlsx, .xls)</Text>
            </View>
            <View style={styles.formatItem}>
              <Ionicons name="document" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.formatText}>Word (.docx)</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUploadPlan}
          disabled={isUploading}
        >
          <Text style={styles.uploadButtonText}>Seleziona File</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Torna Indietro</Text>
        </TouchableOpacity>
      </View>

      {/* Upload Progress Modal */}
      <Modal visible={isUploading} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModal}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.uploadText}>{uploadProgress}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  supportedFormats: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  supportedTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  formatsList: {
    gap: theme.spacing.sm,
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  formatText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  uploadButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  uploadButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
  backButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.textLight,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModal: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    minWidth: 200,
  },
  uploadText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});

export default FileUploadScreen;
