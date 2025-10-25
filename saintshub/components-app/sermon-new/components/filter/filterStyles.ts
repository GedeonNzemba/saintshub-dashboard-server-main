import { StyleSheet } from 'react-native';

export const filterStyles = StyleSheet.create({
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  filterModalBody: {
    padding: 16,
  },
  filterSearchContainer: {
    marginBottom: 16,
  },
  filterSearchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  filterModalCancelButton: {
    padding: 8,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  clearSearchButtonLarge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterModalList: {
    paddingBottom: 16,
  },
  filterModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  filterModalItemText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  filterModalItemIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterItemSeparator: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
});
