# Razorpay Integration Guide for CreatorCircle

## Overview

This guide explains how to complete the Razorpay payment gateway integration for CreatorCircle's subscription system.

## Current Implementation Status

✅ **Completed:**
- Updated subscription plans with new pricing (₹49 student, ₹199 basic, ₹499 premium)
- Added student plan with 75% discount (no email verification required)
- Created Razorpay service with payment initialization
- Updated UI components to show new pricing and student plan
- Integrated payment flow in PremiumSubscriptionModal

## Next Steps for Production

### 1. Razorpay Account Setup

1. **Create Razorpay Account:**
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Sign up for a business account
   - Complete KYC verification

2. **Get API Keys:**
   - Navigate to Settings → API Keys
   - Copy your `Key ID` and `Key Secret`
   - Update `RAZORPAY_KEY_ID` in `src/services/razorpayService.ts`

### 2. Install Razorpay React Native SDK

```bash
npm install react-native-razorpay
```

For iOS, add to `ios/Podfile`:
```ruby
pod 'razorpay-pod', '~> 1.0.0'
```

### 3. Update RazorpayService

Replace the current implementation in `src/services/razorpayService.ts`:

```typescript
import RazorpayCheckout from 'react-native-razorpay';

export class RazorpayService {
  private static readonly RAZORPAY_KEY_ID = 'rzp_live_YOUR_ACTUAL_KEY_ID'; // Your actual key
  private static readonly CURRENCY = 'INR';

  static async initializePayment(
    amount: number,
    planName: string,
    userId: string,
    userEmail?: string,
    userName?: string
  ): Promise<PaymentResult> {
    try {
      const options = {
        description: this.getPaymentDescription(planName),
        image: 'https://your-app-logo-url.com/logo.png',
        currency: this.CURRENCY,
        key: this.RAZORPAY_KEY_ID,
        amount: this.formatAmount(amount),
        name: 'CreatorCircle',
        prefill: {
          email: userEmail,
          name: userName,
        },
        theme: { color: '#007AFF' }
      };

      const data = await RazorpayCheckout.open(options);
      
      return {
        success: true,
        paymentId: data.razorpay_payment_id,
        orderId: data.razorpay_order_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.description || 'Payment failed'
      };
    }
  }
}
```

### 4. Backend Integration (Required)

Create a backend API to handle:

1. **Order Creation:**
   ```javascript
   // Create order endpoint
   app.post('/api/create-order', async (req, res) => {
     const { amount, currency, planType } = req.body;
     
     const order = await razorpay.orders.create({
       amount: amount * 100, // Amount in paise
       currency: currency,
       receipt: `order_${Date.now()}`,
       notes: {
         planType: planType,
         userId: req.body.userId
       }
     });
     
     res.json({ orderId: order.id });
   });
   ```

2. **Payment Verification:**
   ```javascript
   // Verify payment endpoint
   app.post('/api/verify-payment', async (req, res) => {
     const { paymentId, orderId, signature } = req.body;
     
     const crypto = require('crypto');
     const expectedSignature = crypto
       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
       .update(`${orderId}|${paymentId}`)
       .digest('hex');
     
     if (expectedSignature === signature) {
       // Payment verified - activate subscription
       res.json({ verified: true });
     } else {
       res.json({ verified: false });
     }
   });
   ```

### 5. Environment Variables

Create `.env` file:
```env
RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=your_key_secret
```

### 6. Update App Configuration

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-razorpay",
        {
          "android": {
            "keyId": "rzp_live_YOUR_KEY_ID"
          }
        }
      ]
    ]
  }
}
```

## Testing

### Test Mode
- Use Razorpay test keys for development
- Test with Razorpay test cards:
  - Success: `4111 1111 1111 1111`
  - Failure: `4000 0000 0000 0002`

### Production Mode
- Switch to live keys
- Test with real payment methods
- Monitor transactions in Razorpay dashboard

## Security Considerations

1. **Never expose Key Secret in frontend code**
2. **Always verify payments on backend**
3. **Use HTTPS in production**
4. **Implement proper error handling**
5. **Log all payment attempts**

## Current Subscription Plans

| Plan | Price | Features | Payment Method |
|------|-------|----------|----------------|
| Student | ₹49/month | Silver badge, enhanced visibility, priority support | Razorpay |
| Basic | ₹199/month | Silver badge, enhanced visibility, priority support | Free with coupon |
| Premium | ₹499/month | Gold badge, all features, exclusive content | Free with coupon |

## Support

For Razorpay integration issues:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [React Native Integration](https://razorpay.com/docs/payment-gateway/react-native-integration/)
- [Razorpay Support](https://razorpay.com/support/)

## Notes

- Student plan requires no email verification as requested
- Basic and Premium plans currently use free coupon codes
- All plans provide 30-day subscription period
- Payment verification should be implemented on backend for security
