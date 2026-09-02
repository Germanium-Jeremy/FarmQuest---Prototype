import { Request, Response, NextFunction } from 'express';
import { getVendorByToken } from '../storage/database.js';

export interface VendorRequest extends Request {
  vendor?: { id: string; username: string; locationName: string };
}

export function vendorAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Vendor token required.' });
    return;
  }

  const token = authHeader.slice(7);
  const vendor = getVendorByToken(token);

  if (!vendor) {
    res.status(401).json({ message: 'Invalid or expired vendor token.' });
    return;
  }

  (req as VendorRequest).vendor = {
    id: vendor.id,
    username: vendor.username,
    locationName: vendor.location_name,
  };

  next();
}
