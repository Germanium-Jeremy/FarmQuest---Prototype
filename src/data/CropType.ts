export enum CropType {
  MAIZE = 'maize',
  CASSAVA = 'cassava',
  COFFEE = 'coffee',
}

export const CROP_LABEL: Record<CropType, string> = {
  [CropType.MAIZE]: 'Maize',
  [CropType.CASSAVA]: 'Cassava',
  [CropType.COFFEE]: 'Coffee',
};

export const CROP_ICON: Record<CropType, string> = {
  [CropType.MAIZE]: 'Corn',
  [CropType.CASSAVA]: 'Root',
  [CropType.COFFEE]: 'Bean',
};

export const CROP_COLOR: Record<CropType, number> = {
  [CropType.MAIZE]: 0xffd23f,
  [CropType.CASSAVA]: 0xb98242,
  [CropType.COFFEE]: 0x8f342f,
};
