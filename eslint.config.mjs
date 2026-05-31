import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  globalIgnores(['.next/**', 'node_modules/**', 'api/**', 'dist/**']),
  {
    rules: {
      // Existing mock UI; tighten during API integration.
      'react-hooks/set-state-in-effect': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'warn',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
    },
  },
]);
