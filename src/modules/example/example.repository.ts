import { eq, and, desc, sql, like, or } from 'drizzle-orm';
import { db, DbExecutor } from '@/database';
import { examples, NewExample } from '@/database/models/example.model';
import { logger } from '@/utils';
import { CreateExampleInput, UpdateExampleInput } from './example.schema';

export interface ExampleFilter {
  'metadata.category'?: string;
  isDeleted?: boolean;
}

export const create = async (
  exampleData: CreateExampleInput,
  executor: DbExecutor = db
): Promise<typeof examples.$inferSelect> => {
  try {
    const newExample: NewExample = {
      name: exampleData.name,
      description: exampleData.description,
      price: exampleData.price,
      tags: exampleData.tags,
      metadata: {
        category: exampleData.metadata.category,
        priority: exampleData.metadata.priority || 'medium', // Default to medium if undefined
        createdAt: new Date().toISOString(),
      },
    };

    const [savedExample] = await executor
      .insert(examples)
      .values(newExample)
      .returning();

    return savedExample;
  } catch (error) {
    logger.error('Error creating example item in repository:', error);
    throw error;
  }
};

export const find = async (
  page: number = 1,
  limit: number = 10,
  category?: string,
  isDeleted?: boolean,
  executor: DbExecutor = db
): Promise<{
  examples: (typeof examples.$inferSelect)[];
  total: number;
}> => {
  try {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (category) {
      // JSONB query for category
      conditions.push(sql`${examples.metadata}->>'category' = ${category}`);
    }
    if (isDeleted !== undefined)
      conditions.push(eq(examples.isDeleted, isDeleted));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [resultExamples, totalResult] = await Promise.all([
      executor
        .select()
        .from(examples)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(examples.createdAt)),
      executor
        .select({ count: sql<number>`count(*)` })
        .from(examples)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return { examples: resultExamples, total };
  } catch (error) {
    logger.error('Error retrieving example items from repository:', error);
    throw error;
  }
};

export const findById = async (
  exampleId: string,
  executor: DbExecutor = db
): Promise<typeof examples.$inferSelect | null> => {
  try {
    const id = parseInt(exampleId, 10);
    if (isNaN(id)) return null;

    const example = await executor.query.examples.findFirst({
      where: eq(examples.id, id),
    });

    return example || null;
  } catch (error) {
    logger.error('Error retrieving example item from repository:', error);
    throw error;
  }
};

export const update = async (
  exampleId: string,
  updateData: UpdateExampleInput,
  executor: DbExecutor = db
): Promise<typeof examples.$inferSelect | null> => {
  try {
    const id = parseInt(exampleId, 10);
    if (isNaN(id)) return null;

    // Construct update object - handling partial updates might need more logic depending on requirements
    // For now, assuming we map fields directly.
    const updateValues: Partial<NewExample> = {};
    if (updateData.name) updateValues.name = updateData.name;
    if (updateData.description)
      updateValues.description = updateData.description;
    if (updateData.price) updateValues.price = updateData.price;
    if (updateData.tags) updateValues.tags = updateData.tags;
    // Metadata update is tricky with partials in JSONB, might need to fetch and merge or use specific JSONB operators.
    // Simulating a merge for metadata if provided
    if (updateData.metadata) {
      updateValues.metadata = {
        category: updateData.metadata.category || 'other', // Default or handle undefined
        priority: updateData.metadata.priority || 'medium',
        createdAt: new Date().toISOString(), // Or keep original?
      };
    }
    updateValues.updatedAt = new Date();

    const [example] = await executor
      .update(examples)
      .set(updateValues)
      .where(eq(examples.id, id))
      .returning();

    if (!example) {
      return null;
    }

    return example;
  } catch (error) {
    logger.error('Error updating example item in repository:', error);
    throw error;
  }
};

export const softDelete = async (
  exampleId: string,
  executor: DbExecutor = db
): Promise<boolean> => {
  try {
    const id = parseInt(exampleId, 10);
    if (isNaN(id)) return false;

    const [example] = await executor
      .update(examples)
      .set({ isDeleted: true })
      .where(eq(examples.id, id))
      .returning();

    if (!example) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error deleting example item in repository:', error);
    throw error;
  }
};

export const findByCategory = async (
  category: string,
  executor: DbExecutor = db
): Promise<(typeof examples.$inferSelect)[]> => {
  try {
    const resultExamples = await executor
      .select()
      .from(examples)
      .where(
        and(
          sql`${examples.metadata}->>'category' = ${category}`,
          eq(examples.isDeleted, false)
        )
      )
      .orderBy(desc(examples.createdAt));

    return resultExamples;
  } catch (error) {
    logger.error(
      'Error retrieving examples by category from repository:',
      error
    );
    throw error;
  }
};

export const search = async (
  searchTerm: string,
  executor: DbExecutor = db
): Promise<(typeof examples.$inferSelect)[]> => {
  try {
    const safeTerm = searchTerm.replace(/[%_\\]/g, '\\$&');
    const resultExamples = await executor
      .select()
      .from(examples)
      .where(
        and(
          or(
            like(examples.name, `%${safeTerm}%`),
            like(examples.description, `%${safeTerm}%`)
          ),
          eq(examples.isDeleted, false)
        )
      )
      .orderBy(desc(examples.createdAt));

    return resultExamples;
  } catch (error) {
    logger.error('Error searching examples in repository:', error);
    throw error;
  }
};
