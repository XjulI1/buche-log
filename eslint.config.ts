// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import pluginOxlint from 'eslint-plugin-oxlint'

export default withNuxt(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/.output/**', '**/.nuxt/**'],
  },
  ...pluginOxlint.configs['flat/recommended'],
)
