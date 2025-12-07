import { Button } from '@react-navigation/elements';
import { router } from 'expo-router';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';

type Props = {
  item: any | null;
  onClose: () => void;
};



export default function MarkerModal({ item, onClose }: Props) {
  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false}>
            {item?.img && (
              <Image source={{ uri: item.img }} style={styles.modalImage} resizeMode="cover" />
            )}
            <Text style={styles.modalTitle}>{item?.name}</Text>
            <Text style={styles.modalType}>{item?.type}</Text>
            <Text style={styles.modalDescription}>{item?.description}</Text>
          </ScrollView>
          <Button onPress={() => {router.navigate('/chat'); onClose();}} variant='tinted'>Czatuj</Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 20,
    paddingBottom: 30,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingRight: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#333',
    fontWeight: 'bold',
  },
  modalImage: {
    width: '100%',
    height: 250,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  modalType: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 15,
    textTransform: 'capitalize',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
});
