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

  return yaml.load(readFileSync(configPath, 'utf8')) as Record<string, any>;
};
