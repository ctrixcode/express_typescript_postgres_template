import { Router } from 'express';
import * as exampleController from './example.controller';
import { validate } from '@/middlewares/validate';
import { authenticateToken } from '@/middlewares/auth';
import {
  createExampleSchema,
  updateExampleSchema,
  getExamplesSchema,
  getExampleByIdSchema,
  deleteExampleSchema,
  searchExamplesSchema,
  getExamplesByCategorySchema,
} from './example.schema';

const router = Router();

// Protect all /examples endpoints with JWT Bearer authentication
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Examples
 *   description: The example managing API
 */

/**
 * @swagger
 * /examples:
 *   post:
 *     summary: Create a new example
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Example'
 *     responses:
 *       201:
 *         description: The example was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Example'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Some server error
 */
router.post(
  '/',
  validate(createExampleSchema),
  exampleController.createExampleHandler
);

/**
 * @swagger
 * /examples:
 *   get:
 *     summary: Returns the list of all the examples
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of items to return
 *     responses:
 *       200:
 *         description: The list of the examples
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Example'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Some server error
 */
router.get(
  '/',
  validate(getExamplesSchema),
  exampleController.getExamplesHandler
);

/**
 * @swagger
 * /examples/search:
 *   get:
 *     summary: Search examples by name or description
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: The search term
 *     responses:
 *       200:
 *         description: List of matched examples
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/search',
  validate(searchExamplesSchema),
  exampleController.searchExamplesHandler
);

/**
 * @swagger
 * /examples/category/{category}:
 *   get:
 *     summary: Get examples by category
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: Category name
 *     responses:
 *       200:
 *         description: List of examples in category
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/category/:category',
  validate(getExamplesByCategorySchema),
  exampleController.getExamplesByCategoryHandler
);

/**
 * @swagger
 * /examples/{id}:
 *   get:
 *     summary: Get the example by id
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The example id
 *     responses:
 *       200:
 *         description: The example description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Example'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: The example was not found
 *       500:
 *         description: Some server error
 */
router.get(
  '/:id',
  validate(getExampleByIdSchema),
  exampleController.getExampleByIdHandler
);

/**
 * @swagger
 * /examples/{id}:
 *  put:
 *    summary: Update the example by the id
 *    tags: [Examples]
 *    security:
 *       - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The example id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Example'
 *    responses:
 *      200:
 *        description: The example was updated
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Example'
 *      401:
 *        description: Unauthorized
 *      404:
 *        description: The example was not found
 *      400:
 *        description: Bad request
 *      500:
 *        description: Some server error
 */
router.put(
  '/:id',
  validate(updateExampleSchema),
  exampleController.updateExampleHandler
);

/**
 * @swagger
 * /examples/{id}:
 *   delete:
 *     summary: Remove the example by id
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The example id
 *     responses:
 *       204:
 *         description: The example was deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: The example was not found
 *       500:
 *         description: Some server error
 */
router.delete(
  '/:id',
  validate(deleteExampleSchema),
  exampleController.deleteExampleHandler
);

export default router;
