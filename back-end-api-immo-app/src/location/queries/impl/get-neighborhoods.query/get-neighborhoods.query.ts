import { IQuery } from '@nestjs/cqrs';

export class GetNeighborhoodsQuery implements IQuery {
  constructor(public readonly city_id?: string) {}
}
