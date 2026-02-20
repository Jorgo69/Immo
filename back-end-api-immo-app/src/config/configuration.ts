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
    join(__dirname, configFileName),                    // Dev: src/config/
    join(process.cwd(), 'src', 'config', configFileName), // Depuis racine
    join(process.cwd(), 'dist', 'config', configFileName), // Production
  ];

  let configPath: string | null = null;

  // Trouver le premier chemin qui existe
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      configPath = path;
      break;
    }
  }

  if (!configPath) {
    throw new Error(
      `Configuration file not found. Searched in: ${possiblePaths.join(', ')}`,
    );
  }

  console.log(`📁 Loading configuration from: ${configPath}`);

  const yamlConfig = yaml.load(readFileSync(configPath, 'utf8')) as Record<string, any>;
  if (!yamlConfig) return {};

  // Fusion avec les variables d'environnement (priorité absolue aux variables système)
  return {
    ...yamlConfig,
    database: {
      ...yamlConfig.database,
      host: process.env.DATABASE_HOST ?? yamlConfig.database?.host,
      port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : yamlConfig.database?.port,
      username: process.env.DATABASE_USERNAME ?? yamlConfig.database?.username,
      password: process.env.DATABASE_PASSWORD ?? yamlConfig.database?.password,
      database: process.env.DATABASE_NAME ?? process.env.DATABASE_DATABASE ?? yamlConfig.database?.database,
      synchronize: process.env.DATABASE_SYNCHRONIZE !== undefined ? process.env.DATABASE_SYNCHRONIZE === 'true' : yamlConfig.database?.synchronize,
      logging: process.env.DATABASE_LOGGING !== undefined ? process.env.DATABASE_LOGGING === 'true' : yamlConfig.database?.logging,
    },
    jwt: {
      ...yamlConfig.jwt,
      secret: process.env.JWT_SECRET ?? yamlConfig.jwt?.secret,
      expireIn: process.env.JWT_EXPIRE_IN ?? yamlConfig.jwt?.expireIn,
    },
    encryption: {
      ...yamlConfig.encryption,
      key: process.env.ENCRYPTION_KEY ?? yamlConfig.encryption?.key,
    },
    smtp: {
      ...yamlConfig.smtp,
      host: process.env.SMTP_HOST ?? yamlConfig.smtp?.host,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : yamlConfig.smtp?.port,
      user: process.env.SMTP_USER ?? yamlConfig.smtp?.user,
      password: process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? yamlConfig.smtp?.password,
      from: process.env.SMTP_FROM ?? yamlConfig.smtp?.from,
      secure: process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : yamlConfig.smtp?.secure,
    },
  };
};
