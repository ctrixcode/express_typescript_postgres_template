import { Request, Response } from 'express';
import * as authService from './auth.service';
import { RegisterInput, LoginInput, RefreshTokenInput } from './auth.schema';
import { asyncHandler, sendSuccessResponse } from '@/helpers';
import { HTTP_STATUS } from '@/constants';

export const registerHandler = asyncHandler(
  async (
    req: Request<object, object, RegisterInput>,
    res: Response
  ): Promise<void> => {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const result = await authService.register(req.body, userAgent);

    sendSuccessResponse(
      res,
      HTTP_STATUS.CREATED,
      'User registered successfully.',
      result
    );
  }
);

export const loginHandler = asyncHandler(
  async (
    req: Request<object, object, LoginInput>,
    res: Response
  ): Promise<void> => {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const result = await authService.login(req.body, userAgent);

    sendSuccessResponse(res, HTTP_STATUS.OK, 'Login successful.', result);
  }
);

export const refreshHandler = asyncHandler(
  async (
    req: Request<object, object, RefreshTokenInput>,
    res: Response
  ): Promise<void> => {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const result = await authService.refresh(req.body.refreshToken, userAgent);

    sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      'Tokens refreshed successfully.',
      result
    );
  }
);

export const logoutHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const refreshToken =
      req.body?.refreshToken || req.headers['x-refresh-token'];
    await authService.logout(refreshToken as string | undefined);

    sendSuccessResponse(res, HTTP_STATUS.OK, 'Logged out successfully.');
  }
);

export const getMeHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    sendSuccessResponse(
      res,
      HTTP_STATUS.OK,
      'User profile fetched successfully.',
      req.dbUser
    );
  }
);
