import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface PaymentRequest {
  id: string;
  userId: string;
  planType: string;
  amount: number;
  upiId: string;
  paymentMethod: string;
  timestamp: Date;
  status: 'pending' | 'verified' | 'rejected';
}

interface PaymentVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentVerified: (paymentId: string) => void;
}

const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({
  visible,
  onClose,
  onPaymentVerified,
}) => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPaymentRequests();
    }
  }, [visible]);

  const loadPaymentRequests = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from Firestore
      // For demo purposes, we'll show sample data
      const sampleRequests: PaymentRequest[] = [
        {
          id: '1',
          userId: 'user123',
          planType: 'student',
          amount: 49,
          upiId: 'your-upi-id@paytm',
          paymentMethod: 'UPI',
          timestamp: new Date(),
          status: 'pending'
        },
        {
          id: '2',
          userId: 'user456',
          planType: 'student',
          amount: 49,
          upiId: 'your-upi-id@paytm',
          paymentMethod: 'GOOGLE_PAY',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          status: 'pending'
        }
      ];
      setPaymentRequests(sampleRequests);
    } catch (error) {
      console.error('Error loading payment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    Alert.alert(
      'Verify Payment',
      'Are you sure this payment has been received?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            try {
              // In a real implementation, this would update Firestore
              console.log('Verifying payment:', paymentId);
              
              // Update local state
              setPaymentRequests(prev => 
                prev.map(req => 
                  req.id === paymentId 
                    ? { ...req, status: 'verified' as const }
                    : req
                )
              );

              // Activate subscription
              onPaymentVerified(paymentId);
              
              Alert.alert('Success', 'Payment verified and subscription activated!');
            } catch (error) {
              console.error('Error verifying payment:', error);
              Alert.alert('Error', 'Failed to verify payment');
            }
          }
        }
      ]
    );
  };

  const handleRejectPayment = async (paymentId: string) => {
    Alert.alert(
      'Reject Payment',
      'Are you sure you want to reject this payment request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real implementation, this would update Firestore
              console.log('Rejecting payment:', paymentId);
              
              // Update local state
              setPaymentRequests(prev => 
                prev.map(req => 
                  req.id === paymentId 
                    ? { ...req, status: 'rejected' as const }
                    : req
                )
              );
              
              Alert.alert('Payment Rejected', 'Payment request has been rejected');
            } catch (error) {
              console.error('Error rejecting payment:', error);
              Alert.alert('Error', 'Failed to reject payment');
            }
          }
        }
      ]
    );
  };

  const renderPaymentRequest = (request: PaymentRequest) => (
    <View key={request.id} style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentId}>Payment ID: {request.id}</Text>
          <Text style={styles.paymentAmount}>₹{request.amount}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          request.status === 'verified' ? styles.verifiedBadge :
          request.status === 'rejected' ? styles.rejectedBadge :
          styles.pendingBadge
        ]}>
          <Text style={styles.statusText}>
            {request.status === 'verified' ? '✓ Verified' :
             request.status === 'rejected' ? '✗ Rejected' :
             '⏳ Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <Text style={styles.detailText}>User ID: {request.userId}</Text>
        <Text style={styles.detailText}>Plan: {request.planType}</Text>
        <Text style={styles.detailText}>UPI ID: {request.upiId}</Text>
        <Text style={styles.detailText}>Method: {request.paymentMethod}</Text>
        <Text style={styles.detailText}>
          Time: {request.timestamp.toLocaleString()}
        </Text>
      </View>

      {request.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.verifyButton]}
            onPress={() => handleVerifyPayment(request.id)}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.actionButtonText}>Verify</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectPayment(request.id)}
          >
            <Ionicons name="close" size={16} color="white" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>💳 Payment Verification</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loadingText}>Loading payment requests...</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Payment Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Pending:</Text>
                  <Text style={styles.summaryValue}>
                    {paymentRequests.filter(r => r.status === 'pending').length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount:</Text>
                  <Text style={styles.summaryValue}>
                    ₹{paymentRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0)}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Payment Requests</Text>
              {paymentRequests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="receipt-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No payment requests found</Text>
                </View>
              ) : (
                paymentRequests.map(renderPaymentRequest)
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pendingBadge: {
    backgroundColor: '#ffa726',
  },
  verifiedBadge: {
    backgroundColor: '#4caf50',
  },
  rejectedBadge: {
    backgroundColor: '#f44336',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentDetails: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  verifyButton: {
    backgroundColor: '#4caf50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

export default PaymentVerificationModal;
