import { z, ZodTypeAny } from 'zod';

/**
 * Reusable helper to wrap response schemas in the standard API success envelope.
 * Matches SuccessResponse<T> from @/types/response.
 *
 * @param dataSchema The Zod schema for the data payload.
 * @returns A Zod object schema representing the full standardized success response.
 */
export function createSuccessResponseSchema<T extends ZodTypeAny>(
  dataSchema: T
) {
  return z.object({
    success: z.literal(true),
    message: z.string().optional(),
    data: dataSchema,
    pagination: z
      .object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        pages: z.number(),
      })
      .optional(),
    timestamp: z.string().optional(),
  });
}

/**
 * Reusable helper to wrap response schemas in the standard API error envelope.
 * Matches ErrorResponse from @/types/response.
 *
 * @returns A Zod object schema representing the full standardized error response.
 */
export function createErrorResponseSchema() {
  return z.object({
    success: z.literal(false),
    message: z.string(),
    code: z.string().optional(),
    details: z.unknown().optional(),
    stack: z.string().optional(),
  });
}
