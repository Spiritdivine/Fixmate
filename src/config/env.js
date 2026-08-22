import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5050'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string({ required_error: 'DATABASE_URL is required' }),
  JWT_ACCESS_SECRET: z.string().default('super-secret-access-token-key-12345'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('super-secret-refresh-token-key-67890'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  ESCROW_FEE_PERCENT: z.string().default('5.00'),

  // Monad Blockchain Configuration
  MONAD_RPC_URL: z.string().default('https://testnet-rpc.monad.xyz'),
  MONAD_CHAIN_ID: z.string().default('10143'),
  DEPLOYER_PRIVATE_KEY: z.string().optional(),
  ESCROW_CONTRACT_ADDRESS: z.string().optional(),
  ESCROW_ARBITER_ADDRESS: z.string().optional(),
  ESCROW_FEE_RECIPIENT: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
