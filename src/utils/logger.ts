/**
 * Environment-aware logger utility.
 * Silences logs in production to prevent console pollution.
 */

const isProd = import.meta.env.VITE_ENV === 'production';

export const logger = {
  log: (...args: any[]) => {
    if (!isProd) {
      console.log('DEBUG:', ...args);
    }
  },
  debug: (...args: any[]) => {
    if (!isProd) {
      console.debug('🔍 DEBUG:', ...args);
    }
  },
  info: (...args: any[]) => {
    if (!isProd) {
      console.info('ℹ️ INFO:', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (!isProd) {
      console.warn('⚠️ WARN:', ...args);
    }
  },
  error: (...args: any[]) => {
    // We always log errors, even in production, but we could hook into Sentry here later
    console.error('🔴 ERROR:', ...args);
  },
  success: (...args: any[]) => {
    if (!isProd) {
      console.log('✅ SUCCESS:', ...args);
    }
  }
};
