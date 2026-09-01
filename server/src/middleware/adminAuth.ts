import { Request, Response, NextFunction } from 'express';

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing authorization token.' });
    return;
  }

  const token = authHeader.slice(7);
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken) {
    res.status(500).json({ message: 'Admin token not configured.' });
    return;
  }

  if (token !== expectedToken) {
    res.status(403).json({ message: 'Invalid admin token.' });
    return;
  }

  next();
}
