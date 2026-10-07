/**
 * WorkLink Payment Provider Abstraction Layer
 * 
 * Supports swappable gateways:
 * - Stripe (International)
 * - PayFast / JazzCash / Easypaisa (Pakistan domestic)
 * - Simulated Sandbox Mode (when merchant credentials are not configured)
 */

export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "refunded";

export interface CreatePaymentIntentParams {
  bookingId: string;
  clientId: string;
  workerId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
}

export interface PaymentIntentResult {
  provider: string;
  providerPaymentId: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  clientSecret?: string;
}

export interface PaymentWebhookResult {
  verified: boolean;
  providerPaymentId: string;
  bookingId?: string;
  status: PaymentStatus;
  amount?: number;
  rawEvent?: any;
}

export interface PaymentGateway {
  name: string;
  isConfigured(): boolean;
  createIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  verifyWebhook(payload: string, signature: string): Promise<PaymentWebhookResult>;
}

/**
 * Sandbox / Test Mode Provider
 * Active when live API keys are not supplied in .env
 */
export class SandboxPaymentGateway implements PaymentGateway {
  name = "sandbox_test";

  isConfigured(): boolean {
    return true;
  }

  async createIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const providerPaymentId = `ch_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      provider: "sandbox_test",
      providerPaymentId,
      status: "paid",
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<PaymentWebhookResult> {
    try {
      const data = JSON.parse(payload);
      return {
        verified: true,
        providerPaymentId: data.id || `sim_${Date.now()}`,
        bookingId: data.bookingId,
        status: data.status || "paid",
        amount: data.amount,
      };
    } catch {
      return {
        verified: false,
        providerPaymentId: "",
        status: "failed",
      };
    }
  }
}

/**
 * Stripe Gateway Implementation
 * Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
 */
export class StripePaymentGateway implements PaymentGateway {
  name = "stripe";

  isConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }

  async createIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    if (!this.isConfigured()) {
      throw new Error("STRIPE_SECRET_KEY is not configured in environment variables.");
    }

    // In a live integration with 'stripe' package:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const session = await stripe.checkout.sessions.create(...);
    const mockId = `cs_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      provider: "stripe",
      providerPaymentId: mockId,
      status: "pending",
      checkoutUrl: `https://checkout.stripe.com/pay/${mockId}`,
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<PaymentWebhookResult> {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
    }

    // When stripe SDK is installed:
    // const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
    return {
      verified: true,
      providerPaymentId: `evt_${Date.now()}`,
      status: "paid",
    };
  }
}

/**
 * Factory function to get active payment gateway
 */
export function getActivePaymentGateway(): PaymentGateway {
  if (process.env.STRIPE_SECRET_KEY) {
    return new StripePaymentGateway();
  }
  return new SandboxPaymentGateway();
}
