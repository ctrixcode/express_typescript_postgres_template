import { Request, Response } from 'express';
import * as exampleService from './example.service';
import { toExampleDto } from './example.mapper';
import {
  CreateExampleInput,
  UpdateExampleInput,
  GetExamplesQueryInput,
} from './example.schema';
import { asyncHandler, sendSuccessResponse } from '@/helpers';
import { HTTP_STATUS, success as successMessages } from '@/constants';

/**
 * Create a new example item handler
 */
export const createExampleHandler = asyncHandler(
  async (
    req: Request<object, object, CreateExampleInput>,
    res: Response
  ): Promise<void> => {
    const example = await exampleService.createExample(req.body);
    const exampleDto = toExampleDto(example);

    sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      successMessages.CREATED('Example'),
      exampleDto
    );
  }
);

/**
 * Get all example items with pagination and filtering handler
 */
export const getExamplesHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit, category, isDeleted } =
      req.query as unknown as GetExamplesQueryInput;

    const result = await exampleService.getExamples(
      page,
      limit,
      category,
      isDeleted
    );

    const examplesDto = result.examples.map(toExampleDto);

    sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      successMessages.FETCHED('Examples'),
      examplesDto,
      {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      }
    );
  }
);

/**
 * Get example item by ID handler
 */
export const getExampleByIdHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    const example = await exampleService.getExampleById(id);
    const exampleDto = toExampleDto(example);

    sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      successMessages.FETCHED('Example'),
      exampleDto
    );
  }
);

/**
 * Update example item handler
 */
export const updateExampleHandler = asyncHandler(
  async (
    req: Request<{ id: string }, object, UpdateExampleInput>,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const example = await exampleService.updateExample(id, req.body);
    const exampleDto = toExampleDto(example);

    sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      successMessages.UPDATED('Example'),
      exampleDto
    );
  }
);

/**
 * Delete example item (soft delete) handler
 */
export const deleteExampleHandler = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    await exampleService.deleteExample(id);
    res.status(HTTP_STATUS.NO_CONTENT).send(); // No content, so no success response handler needed
  }
);

/**
 * Get examples by category handler
 */
export const getExamplesByCategoryHandler = asyncHandler(
  async (req: Request<{ category: string }>, res: Response): Promise<void> => {
    const { category } = req.params;
    const examples = await exampleService.getExamplesByCategory(category);
    const examplesDto = examples.map(toExampleDto);

    sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      successMessages.FETCHED('Examples'),
      examplesDto
    );
  }
);

/**
 * Search examples by name or description handler
 */
export const searchExamplesHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { q } = req.query;
    const examples = await exampleService.searchExamples(q as string);
    const examplesDto = examples.map(toExampleDto);

    sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      successMessages.FETCHED('Examples'),
      examplesDto
    );
  }
);

// Aliases for backwards compatibility
export const createExample = createExampleHandler;
export const getExamples = getExamplesHandler;
export const getExampleById = getExampleByIdHandler;
export const updateExample = updateExampleHandler;
export const deleteExample = deleteExampleHandler;
export const getExamplesByCategory = getExamplesByCategoryHandler;
export const searchExamples = searchExamplesHandler;
