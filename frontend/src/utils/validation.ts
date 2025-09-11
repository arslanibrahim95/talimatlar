import { VALIDATION_CONSTANTS, ERROR_MESSAGES } from '../constants';
import { ValidationError } from './errorHandler';

/**
 * Validation utilities for form inputs and data
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation
 */
export const validateEmail = (email: string): FieldValidationResult => {
  if (!email) {
    return { isValid: false, error: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD };
  }

  if (email.length > VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `E-posta en fazla ${VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH} karakter olabilir.` 
    };
  }

  if (!VALIDATION_CONSTANTS.EMAIL.PATTERN.test(email)) {
    return { isValid: false, error: ERROR_MESSAGES.VALIDATION.INVALID_EMAIL };
  }

  return { isValid: true };
};

/**
 * Password validation
 */
export const validatePassword = (password: string): FieldValidationResult => {
  if (!password) {
    return { isValid: false, error: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD };
  }

  if (password.length < VALIDATION_CONSTANTS.PASSWORD.MIN_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.VALIDATION.PASSWORD_TOO_SHORT };
  }

  if (password.length > VALIDATION_CONSTANTS.PASSWORD.MAX_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.VALIDATION.PASSWORD_TOO_LONG };
  }

  const errors: string[] = [];

  if (VALIDATION_CONSTANTS.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('En az bir büyük harf içermelidir.');
  }

  if (VALIDATION_CONSTANTS.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('En az bir küçük harf içermelidir.');
  }

  if (VALIDATION_CONSTANTS.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('En az bir rakam içermelidir.');
  }

  if (VALIDATION_CONSTANTS.PASSWORD.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('En az bir özel karakter içermelidir.');
  }

  if (errors.length > 0) {
    return { isValid: false, error: errors.join(' ') };
  }

  return { isValid: true };
};

/**
 * Phone number validation
 */
export const validatePhone = (phone: string): FieldValidationResult => {
  if (!phone) {
    return { isValid: false, error: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD };
  }

  const cleanPhone = phone.replace(/\s/g, '');
  
  if (cleanPhone.length > VALIDATION_CONSTANTS.PHONE.MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `Telefon numarası en fazla ${VALIDATION_CONSTANTS.PHONE.MAX_LENGTH} karakter olabilir.` 
    };
  }

  if (!VALIDATION_CONSTANTS.PHONE.PATTERN.test(cleanPhone)) {
    return { isValid: false, error: ERROR_MESSAGES.VALIDATION.INVALID_PHONE };
  }

  return { isValid: true };
};

/**
 * Name validation
 */
export const validateName = (name: string, fieldName: string = 'İsim'): FieldValidationResult => {
  if (!name) {
    return { isValid: false, error: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD };
  }

  if (name.length < VALIDATION_CONSTANTS.NAME.MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `${fieldName} en az ${VALIDATION_CONSTANTS.NAME.MIN_LENGTH} karakter olmalıdır.` 
    };
  }

  if (name.length > VALIDATION_CONSTANTS.NAME.MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `${fieldName} en fazla ${VALIDATION_CONSTANTS.NAME.MAX_LENGTH} karakter olabilir.` 
    };
  }

  if (!VALIDATION_CONSTANTS.NAME.PATTERN.test(name)) {
    return { 
      isValid: false, 
      error: `${fieldName} sadece harf ve boşluk içerebilir.` 
    };
  }

  return { isValid: true };
};

/**
 * Title validation
 */
export const validateTitle = (title: string, fieldName: string = 'Başlık'): FieldValidationResult => {
  if (!title) {
    return { isValid: false, error: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD };
  }

  if (title.length < VALIDATION_CONSTANTS.TITLE.MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `${fieldName} en az ${VALIDATION_CONSTANTS.TITLE.MIN_LENGTH} karakter olmalıdır.` 
    };
  }

  if (title.length > VALIDATION_CONSTANTS.TITLE.MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `${fieldName} en fazla ${VALIDATION_CONSTANTS.TITLE.MAX_LENGTH} karakter olabilir.` 
    };
  }

  return { isValid: true };
};

/**
 * Description validation
 */
export const validateDescription = (description: string, fieldName: string = 'Açıklama'): FieldValidationResult => {
  if (description && description.length > VALIDATION_CONSTANTS.DESCRIPTION.MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `${fieldName} en fazla ${VALIDATION_CONSTANTS.DESCRIPTION.MAX_LENGTH} karakter olabilir.` 
    };
  }

  return { isValid: true };
};

/**
 * Required field validation
 */
export const validateRequired = (value: any, fieldName: string): FieldValidationResult => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} zorunludur.` };
  }

  return { isValid: true };
};

/**
 * File validation
 */
export const validateFile = (
  file: File, 
  allowedTypes: string[], 
  maxSize: number,
  fieldName: string = 'Dosya'
): FieldValidationResult => {
  if (!file) {
    return { isValid: false, error: `${fieldName} seçilmelidir.` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: ERROR_MESSAGES.FILE.INVALID_TYPE };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { 
      isValid: false, 
      error: `${fieldName} boyutu ${maxSizeMB}MB'dan küçük olmalıdır.` 
    };
  }

  return { isValid: true };
};

/**
 * URL validation
 */
export const validateUrl = (url: string, fieldName: string = 'URL'): FieldValidationResult => {
  if (!url) {
    return { isValid: false, error: `${fieldName} zorunludur.` };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Geçerli bir URL girin.' };
  };
};

/**
 * Number validation
 */
export const validateNumber = (
  value: string | number, 
  min?: number, 
  max?: number, 
  fieldName: string = 'Sayı'
): FieldValidationResult => {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} geçerli bir sayı olmalıdır.` };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, error: `${fieldName} en az ${min} olmalıdır.` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `${fieldName} en fazla ${max} olabilir.` };
  }

  return { isValid: true };
};

/**
 * Date validation
 */
export const validateDate = (date: string | Date, fieldName: string = 'Tarih'): FieldValidationResult => {
  if (!date) {
    return { isValid: false, error: `${fieldName} zorunludur.` };
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Geçerli bir tarih girin.' };
  }

  return { isValid: true };
};

/**
 * Form validation helper
 */
export const validateForm = (fields: Record<string, FieldValidationResult>): ValidationResult => {
  const errors: string[] = [];
  let isValid = true;

  Object.entries(fields).forEach(([fieldName, result]) => {
    if (!result.isValid) {
      isValid = false;
      if (result.error) {
        errors.push(result.error);
      }
    }
  });

  return { isValid, errors };
};

/**
 * Async validation helper
 */
export const validateAsync = async (
  validators: Array<() => Promise<FieldValidationResult>>
): Promise<ValidationResult> => {
  const results = await Promise.all(validators.map(validator => validator()));
  return validateForm(
    results.reduce((acc, result, index) => {
      acc[`field_${index}`] = result;
      return acc;
    }, {} as Record<string, FieldValidationResult>)
  );
};

/**
 * Debounced validation
 */
export const createDebouncedValidator = <T>(
  validator: (value: T) => FieldValidationResult,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;

  return (value: T, callback: (result: FieldValidationResult) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, delay);
  };
};

/**
 * Validation schema builder
 */
export class ValidationSchema {
  private validators: Array<() => FieldValidationResult> = [];

  required(value: any, fieldName: string) {
    this.validators.push(() => validateRequired(value, fieldName));
    return this;
  }

  email(email: string) {
    this.validators.push(() => validateEmail(email));
    return this;
  }

  password(password: string) {
    this.validators.push(() => validatePassword(password));
    return this;
  }

  phone(phone: string) {
    this.validators.push(() => validatePhone(phone));
    return this;
  }

  name(name: string, fieldName: string = 'İsim') {
    this.validators.push(() => validateName(name, fieldName));
    return this;
  }

  title(title: string, fieldName: string = 'Başlık') {
    this.validators.push(() => validateTitle(title, fieldName));
    return this;
  }

  description(description: string, fieldName: string = 'Açıklama') {
    this.validators.push(() => validateDescription(description, fieldName));
    return this;
  }

  file(file: File, allowedTypes: string[], maxSize: number, fieldName: string = 'Dosya') {
    this.validators.push(() => validateFile(file, allowedTypes, maxSize, fieldName));
    return this;
  }

  url(url: string, fieldName: string = 'URL') {
    this.validators.push(() => validateUrl(url, fieldName));
    return this;
  }

  number(value: string | number, min?: number, max?: number, fieldName: string = 'Sayı') {
    this.validators.push(() => validateNumber(value, min, max, fieldName));
    return this;
  }

  date(date: string | Date, fieldName: string = 'Tarih') {
    this.validators.push(() => validateDate(date, fieldName));
    return this;
  }

  custom(validator: () => FieldValidationResult) {
    this.validators.push(validator);
    return this;
  }

  validate(): ValidationResult {
    const fields: Record<string, FieldValidationResult> = {};
    
    this.validators.forEach((validator, index) => {
      fields[`field_${index}`] = validator();
    });

    return validateForm(fields);
  }
}

export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validateTitle,
  validateDescription,
  validateRequired,
  validateFile,
  validateUrl,
  validateNumber,
  validateDate,
  validateForm,
  validateAsync,
  createDebouncedValidator,
  ValidationSchema,
};
