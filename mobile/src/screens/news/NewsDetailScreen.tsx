import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import apiService from '../../services/api.service';
import { NewsArticle } from '../../types/api.types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NewsDetailRouteProp = RouteProp<RootStackParamList, 'NewsDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'NewsDetail'>;

export const NewsDetailScreen = () => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<NewsDetailRouteProp>();
  const { articleId } = route.params;

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await apiService.getNewsById(articleId);
      setArticle(data);
    } catch (err) {
      console.error('Error fetching article:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleOpenOriginal = async () => {
    if (article?.sourceUrl) {
      try {
        const supported = await Linking.canOpenURL(article.sourceUrl);
        if (supported) {
          await Linking.openURL(article.sourceUrl);
        }
      } catch (err) {
        console.error('Error opening URL:', err);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.errorText}>Impossibile caricare l'articolo</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchArticle}>
            <Text style={styles.retryButtonText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {article.imageUrl ? (
          <View style={styles.heroImageContainer}>
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButtonOverlay}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDarker]}
              style={styles.heroPlaceholder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.heroPlaceholderText}>📰</Text>
            </LinearGradient>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.metaContainer}>
            <Text style={styles.source}>{article.source}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.date}>{formatDate(article.publishedAt)}</Text>
          </View>

          <Text style={styles.articleContent}>{article.content}</Text>

          {article.sourceUrl && (
            <TouchableOpacity style={styles.originalButton} onPress={handleOpenOriginal}>
              <Ionicons name="open-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.originalButtonText}>Leggi articolo originale</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroImageContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholder: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderText: {
    fontSize: 80,
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    lineHeight: 32,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  source: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  separator: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.sm,
  },
  date: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  articleContent: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  originalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardBackground,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  originalButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
