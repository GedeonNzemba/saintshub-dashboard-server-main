import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  languageItemSelected: {
    backgroundColor: '#ede9fe',
  },
  flagText: {
    fontSize: 24,
    marginRight: 12,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  languageCode: {
    fontSize: 13,
    color: '#64748b',
  },
  sermonCount: {
    fontSize: 13,
    color: '#9333ea',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
});
