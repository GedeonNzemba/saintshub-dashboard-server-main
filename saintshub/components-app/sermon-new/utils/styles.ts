import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 0,
  },
  safeAreaHeader: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerIconContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  selectedLanguageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLanguageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
  },
  changeButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  searchButton: {
    backgroundColor: '#6a11cb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyContainerBase: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTextBase: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#6a11cb',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
