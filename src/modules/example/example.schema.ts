import { z } from 'zod';
import { createSuccessResponseSchema } from '@/utils';

/**
 * @swagger
 * components:
 *   schemas:
 *     Example:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - metadata
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the example
 *         name:
 *           type: string
 *           description: The name of the example
 *         description:
 *           type: string
 *           description: The description of the example
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: A list of tags
 *         price:
 *           type: number
 *           format: float
 *           description: The price of the example
 *         metadata:
 *           type: object
 *           properties:
 *             category:
 *               type: string
 *               enum: [electronics, clothing, books, food, other]
 *             priority:
 *               type: string
 *               enum: [low, medium, high]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the example was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the example was last updated
 *       example:
 *         _id: 60d0fe4f5311236168a109ca
 *         name: "Sample Item"
 *         description: "This is a sample item."
 *         tags: ["sample", "testing"]
 *         price: 99.99
 *         metadata:
 *           category: "electronics"
 *           priority: "medium"
 *         createdAt: "2023-01-01T12:00:00.000Z"
 *         updatedAt: "2023-01-01T12:00:00.000Z"
 */

// ==========================================
// 1. Primitive & Shared Sub-Schemas
// ==========================================

export const ExampleCategorySchema = z.enum([
  'electronics',
  'clothing',
  'books',
  'food',
  'other',
]);
export type ExampleCategory = z.infer<typeof ExampleCategorySchema>;

export const ExamplePrioritySchema = z.enum(['low', 'medium', 'high']);
export type ExamplePriority = z.infer<typeof ExamplePrioritySchema>;

export const ExampleMetadataSchema = z.object({
  category: ExampleCategorySchema,
  priority: ExamplePrioritySchema.default('medium'),
  createdAt: z.string().optional(),
});
export type ExampleMetadata = z.infer<typeof ExampleMetadataSchema>;

// ==========================================
// 2. Domain / Entity Schemas (Response DTOs)
// ==========================================

export const ExampleItemSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100),
  description: z.string().min(1).max(500),
  tags: z.array(z.string()).default([]),
  price: z.number().min(0).max(10000),
  metadata: ExampleMetadataSchema,
  createdAt: z.date().or(z.string()).nullable(),
  updatedAt: z.date().or(z.string()).nullable(),
});
export type ExampleItem = z.infer<typeof ExampleItemSchema>;

export const ExampleResponseSchema =
  createSuccessResponseSchema(ExampleItemSchema);
export type ExampleResponse = z.infer<typeof ExampleResponseSchema>;

export const ExampleListResponseSchema = createSuccessResponseSchema(
  z.array(ExampleItemSchema)
);
export type ExampleListResponse = z.infer<typeof ExampleListResponseSchema>;

// ==========================================
// 3. Request Body & Query Schemas
// ==========================================

export const CreateExampleBodySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(1).max(500),
  tags: z.array(z.string()).max(10).optional(),
  price: z.number().min(0).max(10000),
  metadata: z.object({
    category: ExampleCategorySchema,
    priority: ExamplePrioritySchema.optional(),
  }),
});
export type CreateExampleInput = z.infer<typeof CreateExampleBodySchema>;

export const UpdateExampleBodySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
  price: z.number().min(0).max(10000).optional(),
  metadata: z
    .object({
      category: ExampleCategorySchema.optional(),
      priority: ExamplePrioritySchema.optional(),
    })
    .optional(),
});
export type UpdateExampleInput = z.infer<typeof UpdateExampleBodySchema>;

export const GetExamplesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => {
      const parsed = val ? parseInt(val, 10) : 1;
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  limit: z
    .string()
    .optional()
    .transform(val => {
      const parsed = val ? parseInt(val, 10) : 10;
      return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
    }),
  category: z.string().optional(),
  isDeleted: z
    .enum(['true', 'false'])
    .optional()
    .transform(val =>
      val === 'true' ? true : val === 'false' ? false : undefined
    ),
});
export type GetExamplesQueryInput = z.infer<typeof GetExamplesQuerySchema>;

// ==========================================
// 4. Express Route Validation Schemas
// ==========================================

export const ExampleIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Example ID must be a numeric integer'),
  }),
});
export type ExampleIdParam = z.infer<typeof ExampleIdParamSchema>['params'];

export const CreateExampleRouteSchema = z.object({
  body: CreateExampleBodySchema,
});
export type CreateExampleRoute = z.infer<typeof CreateExampleRouteSchema>;

export const GetExamplesRouteSchema = z.object({
  query: GetExamplesQuerySchema,
});
export type GetExamplesRoute = z.infer<typeof GetExamplesRouteSchema>;

export const GetExampleByIdRouteSchema = ExampleIdParamSchema;
export type GetExampleByIdRoute = z.infer<typeof GetExampleByIdRouteSchema>;

export const UpdateExampleRouteSchema = z.object({
  params: ExampleIdParamSchema.shape.params,
  body: UpdateExampleBodySchema,
});
export type UpdateExampleRoute = z.infer<typeof UpdateExampleRouteSchema>;

export const DeleteExampleRouteSchema = ExampleIdParamSchema;
export type DeleteExampleRoute = z.infer<typeof DeleteExampleRouteSchema>;

export const SearchExamplesRouteSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search term q is required'),
  }),
});
export type SearchExamplesRoute = z.infer<typeof SearchExamplesRouteSchema>;

export const GetExamplesByCategoryRouteSchema = z.object({
  params: z.object({
    category: z.string().min(1, 'Category is required'),
  }),
});
export type GetExamplesByCategoryRoute = z.infer<
  typeof GetExamplesByCategoryRouteSchema
>;

// Legacy / Convenience Aliases
export const createExampleSchema = CreateExampleRouteSchema;
export const updateExampleSchema = UpdateExampleRouteSchema;
export const getExamplesSchema = GetExamplesRouteSchema;
export const getExampleByIdSchema = GetExampleByIdRouteSchema;
export const deleteExampleSchema = DeleteExampleRouteSchema;
export const searchExamplesSchema = SearchExamplesRouteSchema;
export const getExamplesByCategorySchema = GetExamplesByCategoryRouteSchema;
