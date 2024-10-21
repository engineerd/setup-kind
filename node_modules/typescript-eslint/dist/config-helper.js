"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = config;
/**
 * Utility function to make it easy to strictly type your "Flat" config file
 * @example
 * ```js
 * // @ts-check
 *
 * import eslint from '@eslint/js';
 * import tseslint from 'typescript-eslint';
 *
 * export default tseslint.config(
 *   eslint.configs.recommended,
 *   ...tseslint.configs.recommended,
 *   {
 *     rules: {
 *       '@typescript-eslint/array-type': 'error',
 *     },
 *   },
 * );
 * ```
 */
function config(...configs) {
    return configs.flatMap(configWithExtends => {
        const { extends: extendsArr, ...config } = configWithExtends;
        if (extendsArr == null || extendsArr.length === 0) {
            return config;
        }
        return [
            ...extendsArr.map(extension => {
                const name = [config.name, extension.name].filter(Boolean).join('__');
                return {
                    ...extension,
                    ...(config.files && { files: config.files }),
                    ...(config.ignores && { ignores: config.ignores }),
                    ...(name && { name }),
                };
            }),
            config,
        ];
    });
}
//# sourceMappingURL=config-helper.js.map