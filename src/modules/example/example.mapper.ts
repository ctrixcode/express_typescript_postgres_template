import { Example } from '@/database/models/example.model';
import { ExampleItem } from './example.schema';

/**
 * Converts an Example Drizzle database object to a strongly-typed API DTO
 * that complies with ExampleItemSchema.
 *
 * @param example The Drizzle database record.
 * @returns A strongly-typed ExampleItem DTO safe to send to the client.
 */
export const toExampleDto = (example: Example): ExampleItem => {
  return {
    id: example.id.toString(),
    name: example.name,
    description: example.description,
    tags: example.tags ?? [],
    price: example.price,
    metadata: {
      category:
        (example.metadata?.category as ExampleItem['metadata']['category']) ||
        'other',
      priority:
        (example.metadata?.priority as ExampleItem['metadata']['priority']) ||
        'medium',
      createdAt: example.metadata?.createdAt,
    },
    createdAt: example.createdAt,
    updatedAt: example.updatedAt,
  };
};
