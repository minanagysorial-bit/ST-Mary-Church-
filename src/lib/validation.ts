// Egyptian Governorate Codes according to Civil Registry
const GOVERNORATES: Record<string, string> = {
  '01': 'القاهرة',
  '02': 'الإسكندرية',
  '03': 'بورسعيد',
  '04': 'السويس',
  '11': 'دمياط',
  '12': 'الدقهلية',
  '13': 'الشرقية',
  '14': 'القليوبية',
  '15': 'كفر الشيخ',
  '16': 'الغربية',
  '17': 'المنوفية',
  '18': 'البحيرة',
  '19': 'الإسماعيلية',
  '21': 'الجيزة',
  '22': 'بني سويف',
  '23': 'الفيوم',
  '24': 'المنيا',
  '25': 'أسيوط',
  '26': 'سوهاج',
  '27': 'قنا',
  '28': 'أسوان',
  '29': 'الأقصر',
  '31': 'البحر الأحمر',
  '32': 'الوادي الجديد',
  '33': 'مطروح',
  '34': 'شمال سيناء',
  '35': 'جنوب سيناء',
  '88': 'خارج الجمهورية'
};

export interface NationalIdResult {
  isValid: boolean;
  error?: string;
  birthDate?: string; // YYYY-MM-DD
  governorate?: string;
  gender?: 'ذكر' | 'أنثى';
}

/**
 * Validate Egyptian National ID (14 digits)
 * Format: C YY MM DD GG SSS G D
 * C = Century (2: 1900-1999, 3: 2000-2099)
 */
export function validateEgyptianNationalId(id: string): NationalIdResult {
  const cleaned = id.replace(/[^0-9]/g, '');
  if (cleaned.length !== 14) {
    return { isValid: false, error: 'يجب أن يتكون الرقم القومي من 14 رقماً بالضبط.' };
  }

  const centuryDigit = parseInt(cleaned[0], 10);
  if (centuryDigit !== 2 && centuryDigit !== 3) {
    return { isValid: false, error: 'الرقم القومي غير صحيح (الرقم الأول يجب أن يكون 2 أو 3).' };
  }

  const century = centuryDigit === 2 ? 1900 : 2000;
  const year = century + parseInt(cleaned.substring(1, 3), 10);
  const month = parseInt(cleaned.substring(3, 5), 10);
  const day = parseInt(cleaned.substring(5, 7), 10);

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'الرقم القومي غير صحيح (خانة شهر الميلاد غير صالحة).' };
  }

  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day ||
    dateObj > new Date()
  ) {
    return { isValid: false, error: 'الرقم القومي غير صحيح (تاريخ الميلاد غير صالح).' };
  }

  const govCode = cleaned.substring(7, 9);
  const governorate = GOVERNORATES[govCode] || 'غير محدد';

  const genderDigit = parseInt(cleaned.substring(12, 13), 10);
  const gender = genderDigit % 2 !== 0 ? 'ذكر' : 'أنثى';

  const formattedMonth = month.toString().padStart(2, '0');
  const formattedDay = day.toString().padStart(2, '0');
  const birthDate = `${year}-${formattedMonth}-${formattedDay}`;

  return {
    isValid: true,
    birthDate,
    governorate,
    gender
  };
}

/**
 * Validate Egyptian Mobile Number (010, 011, 012, 015 + 8 digits)
 */
export function validateEgyptianPhone(phone: string): { isValid: boolean; error?: string } {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (!cleaned) {
    return { isValid: false, error: 'رقم الهاتف المحمول إجباري.' };
  }
  const regex = /^01[0125][0-9]{8}$/;
  if (!regex.test(cleaned)) {
    return { isValid: false, error: 'يرجى إدخال رقم محمول مصري صحيح مكون من 11 رقماً يبدأ بـ (010, 011, 012, 015).' };
  }
  return { isValid: true };
}

/**
 * Validate Full Name (At least 3 parts in Arabic)
 */
export function validateFullName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'الاسم بالكامل إجباري.' };
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 3) {
    return { isValid: false, error: 'يرجى إدخال الاسم ثلاثياً أو رباعياً على الأقل كما هو مدون ببطاقة الرقم القومي.' };
  }
  // Check that it contains valid letters
  if (!/^[\u0600-\u06FF\s.a-zA-Z]+$/.test(trimmed)) {
    return { isValid: false, error: 'الاسم يجب أن يحتوي على حروف فقط بدون رموز خاصة أو أرقام.' };
  }
  return { isValid: true };
}

/**
 * Validate Email (if provided)
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) return { isValid: true }; // optional
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(trimmed)) {
    return { isValid: false, error: 'يرجى إدخال بريد إلكتروني صالح (مثال: name@domain.com).' };
  }
  return { isValid: true };
}

/**
 * Validate Address (At least 10 chars)
 */
export function validateAddress(address: string): { isValid: boolean; error?: string } {
  const trimmed = address.trim();
  if (!trimmed) {
    return { isValid: false, error: 'العنوان بالتفصيل إجباري.' };
  }
  if (trimmed.length < 10) {
    return { isValid: false, error: 'يرجى كتابة العنوان بالتفصيل (الشارع، رقم العقار، الدور، الشقة).' };
  }
  return { isValid: true };
}
