import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService.js';

export interface VendorAuthInfo {
  vendorId: string;
  username: string;
  locationName: string;
}

declare global {
  namespace Express {
    interface Request {
      vendor?: VendorAuthInfo;
    }
  }
}

export function vendorAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing vendor token.' });
    return;
  }

  const token = authHeader.slice(7);
  const vendorInfo = authService.validateVendorToken(token);

  if (!vendorInfo) {
    res.status(401).json({ message: 'Invalid or expired vendor token.' });
    return;
  }

  req.vendor = vendorInfo;
  next();
}
