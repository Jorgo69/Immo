import { IQueryHandler, QueryHandler, QueryBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { SearchSemanticPropertiesQuery } from '../../impl/search-semantic-properties.query/search-semantic-properties.query';
import { PropertyEntity } from '../../../entities/property.entity';
import { SemanticSearchService } from '../../../services/semantic-search.service';
import { SearchPropertiesQuery } from '../../impl/search-properties.query/search-properties.query';
import { buildPaginatedResult, PaginatedResultDto } from '../../../../common/dto/pagination.dto';

@QueryHandler(SearchSemanticPropertiesQuery)
export class SearchSemanticPropertiesHandler implements IQueryHandler<SearchSemanticPropertiesQuery> {
  private readonly logger = new Logger(SearchSemanticPropertiesHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly semantic: SemanticSearchService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: SearchSemanticPropertiesQuery): Promise<PaginatedResultDto<PropertyEntity>> {
    // Tant qu’aucun provider d’embeddings n’est branché, on retombe sur la recherche texte.
    if (!this.semantic.isReady()) {
      this.logger.log('Semantic search non configurée — fallback sur SearchPropertiesQuery.');
      const fallback = new SearchPropertiesQuery();
      fallback.q = query.q;
      fallback.city = query.city;
      fallback.status = query.status;
      fallback.min_price = query.min_price;
      fallback.max_price = query.max_price;
      fallback.page = query.page;
      fallback.limit = query.limit;
      return this.queryBus.execute(fallback);
    }

    // Exemple de structure à activer quand un provider sera prêt :
    // const embedding = await this.semantic.embedText(query.q);
    // const result = await this.dataSource.query(
    //   `
    //   SELECT *
    //   FROM properties
    //   WHERE description_vector IS NOT NULL
    //   ORDER BY description_vector <=> $1
    //   LIMIT 50
    // `,
    //   [embedding],
    // );
    // return result as PropertyEntity[];

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, query.limit ?? 20);
    return buildPaginatedResult([], 0, page, limit);
  }
}

