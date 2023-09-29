module.exports = {
  extends: 'erb',
  plugins: ['@typescript-eslint'],
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-import-module-exports': 'off',
    'prettier/prettier': 'off',
    'no-unused-vars': 'off',
    'no-plusplus': 'off',
    'lines-between-class-members': 'off',
    'react/function-component-definition': 'off',
	'react/jsx-no-useless-fragment': 'off',
	'jsx-a11y/click-events-have-key-events': 'off',
	'jsx-a11y/no-static-element-interactions': 'off',
	'react-hooks/exhaustive-deps': 'off',
	'import/no-named-as-default': 'off',
	'jsx-a11y/mouse-events-have-key-events': "off",
	'import/no-cycle': 'off',
	'react/self-closing-comp': 'off',
	'react/require-default-props': 'off',
	'import/prefer-default-export': 'off',
	'class-methods-use-this': 'off',
	'no-console': 'off',
	'no-cond-assign': 'off',
	'no-empty': 'off',
	'no-promise-executor-return': 'off',
	'no-await-in-loop': 'off',
	'prefer-destructuring': 'off',
	'no-restricted-syntax': 'off',
	'react/jsx-boolean-value'
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./.erb/configs/webpack.config.eslint.ts'),
      },
      typescript: {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
