import { Request, Response, NextFunction } from 'express';

<<<<<<< HEAD
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? 'dev-admin-token-change-me';

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Admin token required.' });
=======
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing authorization token.' });
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    return;
  }

  const token = authHeader.slice(7);
<<<<<<< HEAD
  if (token !== ADMIN_TOKEN) {
=======
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken) {
    res.status(500).json({ message: 'Admin token not configured.' });
    return;
  }

  if (token !== expectedToken) {
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    res.status(403).json({ message: 'Invalid admin token.' });
    return;
  }

  next();
}
