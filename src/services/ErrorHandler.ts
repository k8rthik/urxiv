export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface AppError {
  message: string;
  code?: string;
  context?: ErrorContext;
  originalError?: Error;
  timestamp: Date;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: unknown, context?: ErrorContext): AppError {
    const appError: AppError = {
      message: this.extractMessage(error),
      context,
      originalError: error instanceof Error ? error : undefined,
      timestamp: new Date(),
    };

    // Log the error
    console.error("[ErrorHandler]", appError.message, {
      context: appError.context,
      originalError: appError.originalError,
    });

    // Store for potential reporting
    this.errorQueue.push(appError);
    
    // Keep only last 50 errors to prevent memory leaks
    if (this.errorQueue.length > 50) {
      this.errorQueue.shift();
    }

    return appError;
  }

  private extractMessage(error: unknown): string {
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    return "An unknown error occurred";
  }

  getRecentErrors(): AppError[] {
    return [...this.errorQueue];
  }

  clearErrors(): void {
    this.errorQueue = [];
  }
}

// Convenience function for quick error handling
export const handleError = (error: unknown, context?: ErrorContext): AppError => {
  return ErrorHandler.getInstance().handleError(error, context);
}; 