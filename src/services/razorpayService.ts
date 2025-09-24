import { Alert } from 'react-native';

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
  notes?: {
    [key: string]: string;
  };
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
}

export class RazorpayService {
  private static readonly RAZORPAY_KEY_ID = 'rzp_test_1234567890'; // Replace with your actual Razorpay key
  private static readonly CURRENCY = 'INR';

  /**
   * Initialize Razorpay payment
   */
  static async initializePayment(
    amount: number,
    planName: string,
    userId: string,
    userEmail?: string,
    userName?: string
  ): Promise<PaymentResult> {
    try {
      // For now, we'll simulate the payment process
      // In a real implementation, you would:
      // 1. Create an order on your backend
      // 2. Initialize Razorpay with the order details
      // 3. Handle the payment response

      console.log('💳 Initializing Razorpay payment:', {
        amount,
        planName,
        userId,
        userEmail,
        userName
      });

      // Simulate payment success for demo purposes
      // In production, integrate with actual Razorpay SDK
      return new Promise((resolve) => {
        Alert.alert(
          'Payment Required',
          `Pay ₹${amount} for ${planName}?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve({
                success: false,
                error: 'Payment cancelled by user'
              })
            },
            {
              text: 'Pay Now',
              onPress: () => {
                // Simulate successful payment
                const paymentId = `pay_${Date.now()}`;
                const orderId = `order_${Date.now()}`;
                
                resolve({
                  success: true,
                  paymentId,
                  orderId
                });
              }
            }
          ]
        );
      });

    } catch (error) {
      console.error('Error initializing Razorpay payment:', error);
      return {
        success: false,
        error: 'Failed to initialize payment'
      };
    }
  }

  /**
   * Verify payment on backend
   */
  static async verifyPayment(
    paymentId: string,
    orderId: string,
    signature: string
  ): Promise<boolean> {
    try {
      // In production, this would call your backend to verify the payment
      // using Razorpay's webhook or API
      console.log('🔍 Verifying payment:', { paymentId, orderId, signature });
      
      // For demo purposes, always return true
      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  /**
   * Get Razorpay configuration
   */
  static getRazorpayConfig(): Partial<RazorpayOptions> {
    return {
      key: this.RAZORPAY_KEY_ID,
      currency: this.CURRENCY,
      theme: {
        color: '#007AFF'
      }
    };
  }

  /**
   * Format amount for Razorpay (in paise)
   */
  static formatAmount(amountInRupees: number): number {
    return Math.round(amountInRupees * 100);
  }

  /**
   * Get payment description for plan
   */
  static getPaymentDescription(planType: string): string {
    const descriptions = {
      student: 'CreatorCircle Student Plan - Monthly Subscription',
      basic: 'CreatorCircle Basic Premium - Monthly Subscription',
      premium: 'CreatorCircle Premium Pro - Monthly Subscription'
    };
    
    return descriptions[planType as keyof typeof descriptions] || 'CreatorCircle Subscription';
  }
}
