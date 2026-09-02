import { Request, Response, NextFunction } from 'express';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? 'dev-admin-token-change-me';

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Admin token required.' });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== ADMIN_TOKEN) {
    res.status(403).json({ message: 'Invalid admin token.' });
    return;
  }

  next();
}
