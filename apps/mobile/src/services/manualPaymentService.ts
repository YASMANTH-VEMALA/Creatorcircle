import { Alert } from 'react-native';

export interface PaymentDetails {
  upiId: string;
  amount: number;
  description: string;
  paymentId: string;
}

export interface PaymentRequest {
  userId: string;
  planType: string;
  amount: number;
  upiId: string;
  paymentScreenshot?: string;
  paymentMethod: 'UPI' | 'GOOGLE_PAY' | 'PHONEPE' | 'PAYTM';
  timestamp: Date;
  paymentId: string;
}

export class ManualPaymentService {
  // Your UPI ID for receiving payments
  private static readonly UPI_ID = 'your-upi-id@paytm'; // Replace with your actual UPI ID
  private static readonly MERCHANT_NAME = 'CreatorCircle';

  /**
   * Generate payment details for manual verification
   */
  static generatePaymentDetails(planType: string, amount: number): PaymentDetails {
    const paymentId = `CC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      upiId: this.UPI_ID,
      amount: amount,
      description: `CreatorCircle Premium - ${planType} - ${paymentId}`,
      paymentId: paymentId
    };
  }

  /**
   * Show payment options to user
   */
  static async showPaymentOptions(planType: string, amount: number): Promise<PaymentRequest | null> {
    const paymentDetails = this.generatePaymentDetails(planType, amount);
    
    return new Promise((resolve) => {
      Alert.alert(
        '💳 Choose Payment Method',
        `Pay ₹${amount} for CreatorCircle Premium\n\nPayment ID: ${paymentDetails.paymentId}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null)
          },
          {
            text: '📱 UPI Apps',
            onPress: () => this.showUPIApps(paymentDetails, planType, amount, resolve)
          },
          {
            text: '📸 Send Screenshot',
            onPress: () => this.showScreenshotOption(paymentDetails, planType, amount, resolve)
          }
        ]
      );
    });
  }

  /**
   * Show UPI apps for payment
   */
  private static showUPIApps(
    paymentDetails: PaymentDetails, 
    planType: string, 
    amount: number, 
    resolve: (value: PaymentRequest | null) => void
  ) {
    Alert.alert(
      '📱 Select UPI App',
      `UPI ID: ${paymentDetails.upiId}\nAmount: ₹${amount}\nDescription: ${paymentDetails.description}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        { text: 'Google Pay', onPress: () => this.openUPIApp('googlepay', paymentDetails, planType, amount, resolve) },
        { text: 'PhonePe', onPress: () => this.openUPIApp('phonepe', paymentDetails, planType, amount, resolve) },
        { text: 'Paytm', onPress: () => this.openUPIApp('paytm', paymentDetails, planType, amount, resolve) },
        { text: 'Any UPI App', onPress: () => this.openUPIApp('upi', paymentDetails, planType, amount, resolve) }
      ]
    );
  }

  /**
   * Open UPI app with payment details
   */
  private static openUPIApp(
    app: string, 
    paymentDetails: PaymentDetails, 
    planType: string, 
    amount: number, 
    resolve: (value: PaymentRequest | null) => void
  ) {
    // For now, we'll show the payment details
    // In a real implementation, you would use deep links to open UPI apps
    Alert.alert(
      '💳 Payment Details',
      `UPI ID: ${paymentDetails.upiId}\nAmount: ₹${amount}\nDescription: ${paymentDetails.description}\n\nPlease make the payment and then tap "I've Paid"`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        { 
          text: "I've Paid", 
          onPress: () => {
            const paymentRequest: PaymentRequest = {
              userId: 'current_user', // This would be the actual user ID
              planType: planType,
              amount: amount,
              upiId: paymentDetails.upiId,
              paymentMethod: app === 'googlepay' ? 'GOOGLE_PAY' : 
                           app === 'phonepe' ? 'PHONEPE' : 
                           app === 'paytm' ? 'PAYTM' : 'UPI',
              timestamp: new Date(),
              paymentId: paymentDetails.paymentId,
            };
            resolve(paymentRequest);
          }
        }
      ]
    );
  }

  /**
   * Show screenshot option
   */
  private static showScreenshotOption(
    paymentDetails: PaymentDetails, 
    planType: string, 
    amount: number, 
    resolve: (value: PaymentRequest | null) => void
  ) {
    Alert.alert(
      '📸 Payment Screenshot',
      `Please send payment screenshot to:\n\nWhatsApp: +91-XXXXXXXXXX\nEmail: support@creatorcircle.com\n\nPayment Details:\nUPI ID: ${paymentDetails.upiId}\nAmount: ₹${amount}\nDescription: ${paymentDetails.description}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        { 
          text: 'I\'ll Send Screenshot', 
          onPress: () => {
            const paymentRequest: PaymentRequest = {
              userId: 'current_user',
              planType: planType,
              amount: amount,
              upiId: paymentDetails.upiId,
              paymentMethod: 'UPI',
              timestamp: new Date(),
              paymentId: paymentDetails.paymentId,
            };
            resolve(paymentRequest);
          }
        }
      ]
    );
  }

  /**
   * Create payment request
   */
  static async createPaymentRequest(paymentRequest: PaymentRequest): Promise<{ success: boolean; message: string }> {
    try {
      // In a real implementation, this would save to Firestore
      console.log('💳 Payment request created:', paymentRequest);
      
      return {
        success: true,
        message: 'Payment recorded! Activating your premium now...'
      };
    } catch (error) {
      console.error('Error creating payment request:', error);
      return {
        success: false,
        message: 'Failed to record payment. Please try again.'
      };
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(paymentId: string): Promise<'pending' | 'verified' | 'failed'> {
    // In a real implementation, this would check Firestore
    return 'pending';
  }

  /**
   * Format UPI payment string
   */
  static formatUPIPaymentString(upiId: string, amount: number, description: string): string {
    return `upi://pay?pa=${upiId}&am=${amount}&cu=INR&tn=${encodeURIComponent(description)}`;
  }
}
