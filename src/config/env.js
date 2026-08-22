import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const cleanString = z.string().transform((val) => val.replace(/^["']|["']$/g, '').trim());
const optionalCleanString = z
  .string()
  .transform((val) => val.replace(/^["']|["']$/g, '').trim())
  .optional();

const envSchema = z.object({
  PORT: cleanString.default('5050'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_URL: cleanString.default('http://localhost:3000'),
  DATABASE_URL: cleanString,
  JWT_ACCESS_SECRET: cleanString.default('super-secret-access-token-key-12345'),
  JWT_ACCESS_EXPIRES_IN: cleanString.default('15m'),
  JWT_REFRESH_SECRET: cleanString.default('super-secret-refresh-token-key-67890'),
  JWT_REFRESH_EXPIRES_IN: cleanString.default('7d'),
  CLOUDINARY_CLOUD_NAME: optionalCleanString,
  CLOUDINARY_API_KEY: optionalCleanString,
  CLOUDINARY_API_SECRET: optionalCleanString,
  PAYSTACK_SECRET_KEY: optionalCleanString,
  PAYSTACK_PUBLIC_KEY: optionalCleanString,
  ESCROW_FEE_PERCENT: cleanString.default('5.00'),

  // Monad Blockchain Configuration
  MONAD_RPC_URL: cleanString.default('https://testnet-rpc.monad.xyz'),
  MONAD_CHAIN_ID: cleanString.default('10143'),
  DEPLOYER_PRIVATE_KEY: optionalCleanString,
  ESCROW_CONTRACT_ADDRESS: optionalCleanString,
  ESCROW_ARBITER_ADDRESS: optionalCleanString,
  ESCROW_FEE_RECIPIENT: optionalCleanString,
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
