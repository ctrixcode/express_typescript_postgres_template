import { TokenPayload } from '../utils/jwt.util';
import { SafeUser } from '../database/models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      dbUser?: SafeUser;
    }
  }
}
