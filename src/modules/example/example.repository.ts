import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
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
        priority: exampleData.metadata.priority || 'medium',
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
  isDeleted: boolean = false,
  executor: DbExecutor = db
): Promise<{
  examples: (typeof examples.$inferSelect)[];
  total: number;
}> => {
  try {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (category) {
      conditions.push(sql`${examples.metadata}->>'category' = ${category}`);
    }
    conditions.push(eq(examples.isDeleted, isDeleted));

    const whereClause = and(...conditions);

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
  includeDeleted: boolean = false,
  executor: DbExecutor = db
): Promise<typeof examples.$inferSelect | null> => {
  try {
    const id = parseInt(exampleId, 10);
    if (isNaN(id)) return null;

    const conditions = [eq(examples.id, id)];
    if (!includeDeleted) {
      conditions.push(eq(examples.isDeleted, false));
    }

    const [example] = await executor
      .select()
      .from(examples)
      .where(and(...conditions))
      .limit(1);

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

    const updateValues: Partial<NewExample> = {};
    if (updateData.name !== undefined) updateValues.name = updateData.name;
    if (updateData.description !== undefined)
      updateValues.description = updateData.description;
    if (updateData.price !== undefined) updateValues.price = updateData.price;
    if (updateData.tags !== undefined) updateValues.tags = updateData.tags;
    if (updateData.metadata !== undefined) {
      updateValues.metadata = {
        category: updateData.metadata.category || 'other',
        priority: updateData.metadata.priority || 'medium',
        createdAt: new Date().toISOString(),
      };
    }
    updateValues.updatedAt = new Date();

    const [example] = await executor
      .update(examples)
      .set(updateValues)
      .where(and(eq(examples.id, id), eq(examples.isDeleted, false)))
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
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(examples.id, id), eq(examples.isDeleted, false)))
      .returning();

    return !!example;
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
      .limit(100)
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
  searchTerm: string = '',
  limit: number = 50,
  executor: DbExecutor = db
): Promise<(typeof examples.$inferSelect)[]> => {
  try {
    if (!searchTerm || !searchTerm.trim()) {
      return [];
    }
    const safeTerm = searchTerm.trim().replace(/[%_\\]/g, '\\$&');
    const resultExamples = await executor
      .select()
      .from(examples)
      .where(
        and(
          or(
            ilike(examples.name, `%${safeTerm}%`),
            ilike(examples.description, `%${safeTerm}%`)
          ),
          eq(examples.isDeleted, false)
        )
      )
      .limit(limit)
      .orderBy(desc(examples.createdAt));

    return resultExamples;
  } catch (error) {
    logger.error('Error searching examples in repository:', error);
    throw error;
  }
};
