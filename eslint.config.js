import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginVue from 'eslint-plugin-vue';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
    {
        ignores: ['node_modules', 'dist', 'public']
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...eslintPluginVue.configs['flat/recommended'],
    {
        files: ['**/*.{js,mjs,cjs,vue}'],
        rules: {
            'no-console': 'warn'
        }
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                wx: true
            }
        }
    },
    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
                ecmaVersion: 'latest',
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        rules: {
            'vue/no-mutating-props': [
                'error',
                {
                    shallowOnly: true
                }
            ]
        }
    },
    {
        files: ['**/*.{ts,tsx,vue}'],
        rules: {
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true
                }
            ],
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            'no-console': 'warn',
            'vue/multi-word-component-names': 'off'
        }
    },
    eslintPluginPrettierRecommended
);
