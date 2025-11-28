import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/theme';
import { CustomHeader } from '../../components/CustomHeader';
import apiService from '../../services/api.service';
import { NewsArticle } from '../../types/api.types';

export const NewsScreen = () => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchNews = async (refresh: boolean = false) => {
    try {
      const newOffset = refresh ? 0 : offset;
      const response = await apiService.getNews(limit, newOffset);

      if (refresh) {
        setArticles(response.articles);
        setOffset(limit);
      } else {
        setArticles((prev) => [...prev, ...response.articles]);
        setOffset((prev) => prev + limit);
      }

      setHasMore(newOffset + response.articles.length < response.total);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews(true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchNews(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Oggi';
    } else if (days === 1) {
      return 'Ieri';
    } else if (days < 7) {
      return `${days} giorni fa`;
    } else {
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const handleArticlePress = async (article: NewsArticle) => {
    try {
      const supported = await Linking.canOpenURL(article.sourceUrl);
      if (supported) {
        await Linking.openURL(article.sourceUrl);
      } else {
        Alert.alert('Errore', 'Impossibile aprire il link');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Errore', 'Errore nell\'apertura dell\'articolo');
    }
  };

  const renderNewsCard = ({ item }: { item: NewsArticle }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => handleArticlePress(item)}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDarker]}
          style={styles.imagePlaceholder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.placeholderText}>📰</Text>
        </LinearGradient>
      )}

      {item.sponsored && (
        <View style={styles.sponsoredBadge}>
          <Text style={styles.sponsoredText}>Sponsorizzato</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {item.summary && (
          <Text style={styles.summary} numberOfLines={3}>
            {item.summary}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.source}>{item.source}</Text>
          <Text style={styles.readMore}>· Leggi articolo</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Nessun articolo disponibile</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || articles.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="News" />

      {loading && articles.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={articles}
          renderItem={renderNewsCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  sponsoredBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sponsoredText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  summary: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  source: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  readMore: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
});
