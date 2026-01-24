const env = process.env.REACT_APP_ENV || 'prod';

const envFileMap = {
  dev: '.env.dev',
  stg: '.env.stg',
  prod: '.env.prod',
};

export const CURRENT_ENV = env;
export const ENV_FILE = envFileMap[env] || envFileMap.prod;