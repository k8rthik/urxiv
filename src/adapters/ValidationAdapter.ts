export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
  severity?: "error" | "warning" | "info";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
}

export interface ValidationError {
  field?: string;
  message: string;
  severity: "error" | "warning" | "info";
}

export class ValidationAdapter {
  // Common validation rules
  static rules = {
    required: <T>(message = "This field is required"): ValidationRule<T> => ({
      validate: (value: T) => {
        if (value === null || value === undefined) return false;
        if (typeof value === "string") return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
      },
      message,
    }),

    minLength: (min: number, message?: string): ValidationRule<string> => ({
      validate: (value: string) => !value || value.length >= min,
      message: message || `Minimum length is ${min} characters`,
    }),

    maxLength: (max: number, message?: string): ValidationRule<string> => ({
      validate: (value: string) => !value || value.length <= max,
      message: message || `Maximum length is ${max} characters`,
    }),

    email: (message = "Invalid email format"): ValidationRule<string> => ({
      validate: (value: string) => {
        if (!value) return true; // Optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message,
    }),

    url: (message = "Invalid URL format"): ValidationRule<string> => ({
      validate: (value: string) => {
        if (!value) return true; // Optional field
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message,
    }),

    fileExists: (message = "File does not exist"): ValidationRule<string> => ({
      validate: (value: string) => {
        // This would need to be implemented with actual file system check
        // For now, just check if it's a valid path format
        return !value || (value.trim().length > 0 && !value.includes(".."));
      },
      message,
    }),

    positiveNumber: (message = "Must be a positive number"): ValidationRule<number> => ({
      validate: (value: number) => value > 0,
      message,
    }),

    range: (min: number, max: number, message?: string): ValidationRule<number> => ({
      validate: (value: number) => value >= min && value <= max,
      message: message || `Value must be between ${min} and ${max}`,
    }),

    custom: <T>(validator: (value: T) => boolean, message: string): ValidationRule<T> => ({
      validate: validator,
      message,
    }),
  };

  // Validate a single field
  static validateField<T>(value: T, rules: ValidationRule<T>[], field?: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const infos: ValidationError[] = [];

    for (const rule of rules) {
      if (!rule.validate(value)) {
        const error: ValidationError = {
          field,
          message: rule.message,
          severity: rule.severity || "error",
        };

        switch (error.severity) {
          case "error":
            errors.push(error);
            break;
          case "warning":
            warnings.push(error);
            break;
          case "info":
            infos.push(error);
            break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos,
    };
  }

  // Validate multiple fields
  static validateObject<T extends Record<string, any>>(
    data: T,
    schema: Partial<Record<keyof T, ValidationRule<T[keyof T]>[]>>
  ): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];
    const allInfos: ValidationError[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      if (rules && Array.isArray(rules)) {
        const fieldResult = this.validateField(
          data[field as keyof T],
          rules as ValidationRule<any>[],
          field
        );

        allErrors.push(...fieldResult.errors);
        allWarnings.push(...fieldResult.warnings);
        allInfos.push(...fieldResult.infos);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      infos: allInfos,
    };
  }

  // Channel-specific validation
  static validateChannel(data: { title?: string; description?: string }): ValidationResult {
    return this.validateObject(data, {
      title: [
        this.rules.required("Channel title is required"),
        this.rules.minLength(1, "Title cannot be empty"),
        this.rules.maxLength(100, "Title is too long"),
      ] as ValidationRule<string | undefined>[],
      description: [
        this.rules.maxLength(500, "Description is too long"),
      ] as ValidationRule<string | undefined>[],
    });
  }

  // File validation
  static validateFile(data: { filename?: string; path?: string }): ValidationResult {
    return this.validateObject(data, {
      filename: [
        this.rules.required("Filename is required"),
        this.rules.minLength(1, "Filename cannot be empty"),
      ] as ValidationRule<string | undefined>[],
      path: [
        this.rules.required("File path is required"),
        this.rules.fileExists(),
      ] as ValidationRule<string | undefined>[],
    });
  }

  // Search query validation
  static validateSearchQuery(query: string): ValidationResult {
    return this.validateField(query, [
      this.rules.minLength(1, "Search query cannot be empty"),
      this.rules.maxLength(200, "Search query is too long"),
    ]);
  }
}

// Validation hooks for React components
export const useValidation = <T extends Record<string, any>>(
  schema: Partial<Record<keyof T, ValidationRule<T[keyof T]>[]>>
) => {
  const validate = (data: T): ValidationResult => {
    return ValidationAdapter.validateObject(data, schema);
  };

  const validateField = <K extends keyof T>(field: K, value: T[K]): ValidationResult => {
    const rules = schema[field];
    if (!rules) {
      return { isValid: true, errors: [], warnings: [], infos: [] };
    }
    return ValidationAdapter.validateField(value, rules, String(field));
  };

  return { validate, validateField };
}; 