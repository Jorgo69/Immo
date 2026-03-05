/**
 * Configuration Loader - Standard 41DEVS
 * Charge la configuration depuis le fichier YAML
 */
import { readFileSync, existsSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

export default () => {
  const configFileName = 'default.yml';

  // Differents chemins possibles
  const possiblePaths = [
    join(__dirname, configFileName),                    
    join(process.cwd(), 'src', 'config', configFileName), 
    join(process.cwd(), 'dist', 'config', configFileName), 
  ];

  let yamlConfig: any = {};

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      try {
        yamlConfig = yaml.load(readFileSync(path, 'utf8')) as Record<string, any>;
        console.log(`📁 Loaded defaults from: ${path}`);
        break;
      } catch (e) {
        console.error(`❌ Error loading YAML from ${path}:`, e);
      }
    }
  }

  // Mapping Laravel-style (priorité au .env, fallback au YAML)
  return {
    app: {
      name: process.env.APP_NAME ?? yamlConfig.app?.name ?? 'Immo Benin',
      env: process.env.APP_ENV ?? 'local',
      debug: process.env.APP_DEBUG === 'true',
      url: process.env.APP_URL ?? yamlConfig.app?.url ?? 'http://localhost:3000',
      frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      version: yamlConfig.app?.version ?? '1.0.0',
      semanticUrl: process.env.SEMANTIC_URL ?? yamlConfig.app?.semanticUrl,
    },
    server: {
      port: parseInt(process.env.PORT || process.env.SERVER_PORT || yamlConfig.server?.port || '3000', 10),
    },
    database: {
      type: process.env.DB_CONNECTION || yamlConfig.database?.type || 'postgres',
      host: process.env.DB_HOST ?? yamlConfig.database?.host ?? 'localhost',
      port: parseInt(process.env.DB_PORT || yamlConfig.database?.port || '5432', 10),
      username: process.env.DB_USERNAME ?? yamlConfig.database?.username,
      password: process.env.DB_PASSWORD ?? yamlConfig.database?.password,
      database: process.env.DB_DATABASE ?? process.env.DATABASE_NAME ?? yamlConfig.database?.database,
      synchronize: process.env.DB_SYNCHRONIZE !== undefined ? process.env.DB_SYNCHRONIZE === 'true' : (yamlConfig.database?.synchronize ?? false),
      logging: process.env.DB_LOGGING !== undefined ? process.env.DB_LOGGING === 'true' : (yamlConfig.database?.logging ?? false),
    },
    jwt: {
      secret: process.env.JWT_SECRET ?? yamlConfig.jwt?.secret,
      expireIn: process.env.JWT_EXPIRE_IN ?? yamlConfig.jwt?.expireIn ?? '7d',
    },
    encryption: {
      key: process.env.ENCRYPTION_KEY ?? yamlConfig.encryption?.key,
    },
    auth: {
      channels: process.env.AUTH_CHANNELS ?? yamlConfig.auth?.channels ?? 'email,whatsapp',
      otpTtlMinutes: parseInt(process.env.OTP_TTL_MINUTES || yamlConfig.auth?.otpTtlMinutes || '10', 10),
    },
    smtp: {
      host: (process.env.MAIL_HOST || process.env.SMTP_HOST) ?? yamlConfig.smtp?.host,
      port: parseInt((process.env.MAIL_PORT || process.env.SMTP_PORT || yamlConfig.smtp?.port) || '587', 10),
      user: (process.env.MAIL_USERNAME || process.env.SMTP_USER) ?? yamlConfig.smtp?.user,
      password: (process.env.MAIL_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD) ?? yamlConfig.smtp?.password,
      from: (process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM) ?? yamlConfig.smtp?.from,
      fromName: process.env.MAIL_FROM_NAME ?? 'Immo Benin',
      secure: process.env.MAIL_ENCRYPTION === 'ssl' || process.env.SMTP_SECURE === 'true' || (yamlConfig.smtp?.secure ?? false),
    },
    notifications: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? yamlConfig.notifications?.vapidPublicKey,
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? yamlConfig.notifications?.vapidPrivateKey,
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    },
    fedapay: {
      secretKey: process.env.FEDAPAY_SECRET_KEY,
      publicKey: process.env.FEDAPAY_PUBLIC_KEY,
      mode: process.env.FEDAPAY_MODE ?? 'sandbox',
    },
    kkiapya: {
      publicKey: process.env.KKIAPAY_PUBLIC_KEY,
      privateKey: process.env.KKIAPAY_PRIVATE_KEY,
      secretKey: process.env.KKIAPAY_SECRET_KEY,
      mode: process.env.KKIAPAY_MODE ?? 'sandbox',
    }
  };
};
