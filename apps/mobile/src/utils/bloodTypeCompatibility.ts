export const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const COMPATIBILITY_MAP: Record<string, string[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

export const RECIPIENT_COMPATIBILITY_MAP: Record<string, string[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['A-', 'O-'],
  'A+': ['A-', 'A+', 'O-', 'O+'],
  'B-': ['B-', 'O-'],
  'B+': ['B-', 'B+', 'O-', 'O+'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB-', 'AB+', 'A-', 'A+', 'B-', 'B+', 'O-', 'O+'],
};

export const getCompatibleBloodTypes = (donorBloodType: string): string[] => {
  return COMPATIBILITY_MAP[donorBloodType] || [];
};

export const isDonorCompatibleWithRequest = (donorBloodType: string, requestBloodType: string): boolean => {
  const compatibleTypes = getCompatibleBloodTypes(donorBloodType);
  return compatibleTypes.includes(requestBloodType);
};

export const getIncompatibleBloodTypes = (donorBloodType: string): string[] => {
  const compatibleTypes = getCompatibleBloodTypes(donorBloodType);
  return BLOOD_TYPES.filter(type => !compatibleTypes.includes(type));
};

export const getBloodTypeLabel = (bloodType: string): string => {
  const labels: Record<string, string> = {
    'O-': 'O Negative',
    'O+': 'O Positive',
    'A-': 'A Negative',
    'A+': 'A Positive',
    'B-': 'B Negative',
    'B+': 'B Positive',
    'AB-': 'AB Negative',
    'AB+': 'AB Positive',
  };
  return labels[bloodType] || bloodType;
};

export const getRhStatus = (bloodType: string): 'positive' | 'negative' | 'unknown' => {
  if (bloodType.includes('+')) return 'positive';
  if (bloodType.includes('-')) return 'negative';
  return 'unknown';
};

export const isUniversalDonor = (bloodType: string): boolean => bloodType === 'O-';
export const isUniversalRecipient = (bloodType: string): boolean => bloodType === 'AB+';