import { Request, Response, NextFunction } from 'express';
<<<<<<< HEAD
import { getVendorByToken } from '../storage/database.js';

export interface VendorRequest extends Request {
  vendor?: { id: string; username: string; locationName: string };
=======
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
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
}

export function vendorAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
<<<<<<< HEAD
    res.status(401).json({ message: 'Vendor token required.' });
=======
    res.status(401).json({ message: 'Missing vendor token.' });
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    return;
  }

  const token = authHeader.slice(7);
<<<<<<< HEAD
  const vendor = getVendorByToken(token);

  if (!vendor) {
=======
  const vendorInfo = authService.validateVendorToken(token);

  if (!vendorInfo) {
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
    res.status(401).json({ message: 'Invalid or expired vendor token.' });
    return;
  }

<<<<<<< HEAD
  (req as VendorRequest).vendor = {
    id: vendor.id,
    username: vendor.username,
    locationName: vendor.location_name,
  };

=======
  req.vendor = vendorInfo;
>>>>>>> 0e30527751ef7c317d43f66e0604962f1629d2e7
  next();
}
