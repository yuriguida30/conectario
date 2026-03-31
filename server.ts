import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";

dotenv.config();

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = getFirestore();

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
const PAGBANK_BASE_URL = process.env.PAGBANK_ENV === 'production' 
  ? 'https://api.pagseguro.com' 
  : 'https://sandbox.api.pagseguro.com';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  
  // Webhook endpoint for PagBank
  app.post('/api/webhook', express.json(), async (request, response) => {
    const payload = request.body;
    
    // PagBank sends notifications for various events
    // For simplicity, we'll look for payment success
    // Note: In production, you should verify the authenticity of the webhook
    
    console.log('PagBank Webhook received:', JSON.stringify(payload));

    const { reference, status } = payload;
    
    // Status 3 means 'Paid' in PagBank
    if (status === 3 || status === 'PAID' || (payload.charges && payload.charges[0]?.status === 'PAID')) {
      // Reference usually contains our internal IDs
      // We'll assume reference is "userId:businessId:planId:planName"
      if (reference) {
        const [userId, businessId, planId, planName] = reference.split(':');
        
        try {
          // Update User
          if (userId) {
            await db.collection('users').doc(userId).update({
              paymentSubscriptionStatus: 'active',
              plan: planName,
              role: 'COMPANY'
            });
          }

          // Update Business
          if (businessId) {
            await db.collection('businesses').doc(businessId).update({
              paymentSubscriptionStatus: 'active',
              plan: planName,
              planId: planId
            });
          }
          console.log(`Successfully updated plan for ${businessId} via PagBank`);
        } catch (error) {
          console.error('Error updating Firestore from PagBank webhook:', error);
        }
      }
    }

    response.send({ received: true });
  });

  // Regular API routes need JSON body parser
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { planId, planName, price, period, businessId, userId, userEmail, userName } = req.body;

      if (!PAGBANK_TOKEN) {
        return res.status(500).json({ error: "PagBank is not configured" });
      }

      // Create a PagBank Checkout
      // Reference: https://developer.pagbank.com.br/reference/criar-checkout
      const reference = `${userId}:${businessId}:${planId}:${planName}`;
      
      const payload = {
        reference: reference,
        customer: {
          name: userName || "Cliente Conecta Rio",
          email: userEmail,
        },
        items: [
          {
            reference: planId,
            name: `Plano ${planName} - ${period === 'monthly' ? 'Mensal' : 'Anual'}`,
            quantity: 1,
            unit_amount: Math.round(price * 100), // PagBank expects amounts in cents
          }
        ],
        payment_methods: [
          { type: "CREDIT_CARD" },
          { type: "BOLETO" },
          { type: "PIX" }
        ],
        redirect_url: `${req.headers.origin}/admin-dashboard?plan_id=${planId}&status=success`,
        notification_urls: [`${req.headers.origin}/api/webhook`]
      };

      const response = await fetch(`${PAGBANK_BASE_URL}/checkouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAGBANK_TOKEN}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("PagBank API Error:", data);
        throw new Error(data.error_messages?.[0]?.description || "Erro ao criar checkout no PagBank");
      }

      // PagBank returns a link to the checkout page
      const checkoutUrl = data.links.find((l: any) => l.rel === 'PAY')?.href;

      res.json({ id: data.id, url: checkoutUrl });
    } catch (error: any) {
      console.error("PagBank Checkout Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
