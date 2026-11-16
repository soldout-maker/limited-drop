import nextVitals from 'eslint-config-next/core-web-vitals';
import { baseConfig } from '@limited-drop/config/eslint/base';

const config = [...nextVitals, ...baseConfig];

export default config;
