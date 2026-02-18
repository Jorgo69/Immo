#!/usr/bin/env bash
# ============================================================
# Génère un module NestJS CQRS selon les standards du projet
# Usage: ./generate-module.sh <nom_module>
# Exemple: ./generate-module.sh wallet
# ============================================================

set -e

MODULE_RAW="${1:-}"
if [ -z "$MODULE_RAW" ]; then
  echo "Usage: ./generate-module.sh <nom_module>"
  echo "Exemple: ./generate-module.sh wallet"
  exit 1
fi

# kebab-case pour dossiers/fichiers (ex: wallet, my-feature)
MODULE_KEBAB=$(echo "$MODULE_RAW" | sed 's/.*/\L&/' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
# PascalCase pour classes (ex: Wallet, MyFeature)
MODULE_PASCAL=$(echo "$MODULE_KEBAB" | sed 's/-\([a-z]\)/\U\1/g' | sed 's/^\([a-z]\)/\U\1/')

SRC="src"
BASE="${SRC}/${MODULE_KEBAB}"
COMMANDS_IMPL="${BASE}/commands/impl"
COMMANDS_HANDLERS="${BASE}/commands/handlers"
QUERIES_IMPL="${BASE}/queries/impl"
QUERIES_HANDLERS="${BASE}/queries/handlers"

# Création des dossiers
mkdir -p "${COMMANDS_IMPL}/create-${MODULE_KEBAB}.command"
mkdir -p "${COMMANDS_HANDLERS}/create-${MODULE_KEBAB}.command.handler"
mkdir -p "${QUERIES_IMPL}/get-all-${MODULE_KEBAB}.query"
mkdir -p "${QUERIES_HANDLERS}/get-all-${MODULE_KEBAB}.handler"

# Module
cat > "${BASE}/${MODULE_KEBAB}.module.ts" << EOF
/**
 * Module ${MODULE_PASCAL} - CQRS
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ${MODULE_PASCAL}Controller } from './${MODULE_KEBAB}.controller';
import { Create${MODULE_PASCAL}CommandHandler } from './commands/handlers/create-${MODULE_KEBAB}.command.handler/create-${MODULE_KEBAB}.command.handler';
import { GetAll${MODULE_PASCAL}Handler } from './queries/handlers/get-all-${MODULE_KEBAB}.handler/get-all-${MODULE_KEBAB}.handler';

@Module({
  imports: [CqrsModule],
  controllers: [${MODULE_PASCAL}Controller],
  providers: [Create${MODULE_PASCAL}CommandHandler, GetAll${MODULE_PASCAL}Handler],
})
export class ${MODULE_PASCAL}Module {}
EOF

# Controller
cat > "${BASE}/${MODULE_KEBAB}.controller.ts" << EOF
/**
 * Controller ${MODULE_PASCAL}
 */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Create${MODULE_PASCAL}Command } from './commands/impl/create-${MODULE_KEBAB}.command/create-${MODULE_KEBAB}.command';
import { GetAll${MODULE_PASCAL}Query } from './queries/impl/get-all-${MODULE_KEBAB}.query/get-all-${MODULE_KEBAB}.query';

@ApiTags('${MODULE_PASCAL}')
@Controller('${MODULE_KEBAB}')
export class ${MODULE_PASCAL}Controller {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un ${MODULE_KEBAB}' })
  async create(@Body() command: Create${MODULE_PASCAL}Command) {
    return this.commandBus.execute(command);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des ${MODULE_KEBAB}s' })
  async getAll() {
    return this.queryBus.execute(new GetAll${MODULE_PASCAL}Query());
  }
}
EOF

# Command
cat > "${COMMANDS_IMPL}/create-${MODULE_KEBAB}.command/create-${MODULE_KEBAB}.command.ts" << EOF
/**
 * Commande : créer un ${MODULE_KEBAB}
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class Create${MODULE_PASCAL}Command {
  @ApiProperty()
  @IsNotEmpty()
  name: string;
}
EOF

# Command Handler
cat > "${COMMANDS_HANDLERS}/create-${MODULE_KEBAB}.command.handler/create-${MODULE_KEBAB}.command.handler.ts" << EOF
/**
 * Handler : création ${MODULE_KEBAB}
 */
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Create${MODULE_PASCAL}Command } from '../../impl/create-${MODULE_KEBAB}.command/create-${MODULE_KEBAB}.command';
import { Logger } from '@nestjs/common';

@CommandHandler(Create${MODULE_PASCAL}Command)
export class Create${MODULE_PASCAL}CommandHandler implements ICommandHandler<Create${MODULE_PASCAL}Command> {
  private readonly logger = new Logger(Create${MODULE_PASCAL}CommandHandler.name);

  async execute(command: Create${MODULE_PASCAL}Command): Promise<unknown> {
    try {
      this.logger.log(\`Création ${MODULE_KEBAB}: \${command.name}\`);
      // TODO: logique métier + persistence
      return { id: 'todo', name: command.name };
    } catch (error) {
      this.logger.error(\`Erreur: \${error instanceof Error ? error.message : error}\`);
      throw error;
    }
  }
}
EOF

# Query
cat > "${QUERIES_IMPL}/get-all-${MODULE_KEBAB}.query/get-all-${MODULE_KEBAB}.query.ts" << EOF
/**
 * Query : liste des ${MODULE_KEBAB}s
 */
export class GetAll${MODULE_PASCAL}Query {}
EOF

# Query Handler
cat > "${QUERIES_HANDLERS}/get-all-${MODULE_KEBAB}.handler/get-all-${MODULE_KEBAB}.handler.ts" << EOF
/**
 * Handler : récupérer tous les ${MODULE_KEBAB}s
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAll${MODULE_PASCAL}Query } from '../../impl/get-all-${MODULE_KEBAB}.query/get-all-${MODULE_KEBAB}.query';

@QueryHandler(GetAll${MODULE_PASCAL}Query)
export class GetAll${MODULE_PASCAL}Handler implements IQueryHandler<GetAll${MODULE_PASCAL}Query> {
  async execute(_query: GetAll${MODULE_PASCAL}Query): Promise<unknown[]> {
    // TODO: repository / données
    return [];
  }
}
EOF

echo "✅ Module '${MODULE_KEBAB}' généré dans ${BASE}/"
echo "   Pense à importer ${MODULE_PASCAL}Module dans app.module.ts"
