import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '@/middlewares/validate';
import { authenticateToken } from '@/middlewares/auth';
import {
  RegisterRouteSchema,
  LoginRouteSchema,
  RefreshTokenRouteSchema,
} from './auth.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and identity management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
router.post(
  '/register',
  validate(RegisterRouteSchema),
  authController.registerHandler
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user credentials and issue tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(LoginRouteSchema), authController.loginHandler);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Exchange refresh token for fresh access & refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully refreshed tokens
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  '/refresh',
  validate(RefreshTokenRouteSchema),
  authController.refreshHandler
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Invalidate user session
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/logout', authController.logoutHandler);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user details
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateToken, authController.getMeHandler);

export default router;
