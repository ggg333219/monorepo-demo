const path = require('path');
const fs = require('fs');

class TypescriptAliasPlugin {
  constructor(options = {}) {
    this.targetPackage = options.targetPackage || 'sdk';
  }

  apply(compiler) {
    // 在初始化阶段拦截并注入全局 Alias 规则
    compiler.hooks.environment.tap('TypescriptAliasPlugin', () => {
      const appRoot = compiler.context;
      // 找到本地 node_modules 下软链接的 SDK 路径
      const sdkPath = path.resolve(appRoot, 'node_modules', this.targetPackage);
      const tsconfigPath = path.resolve(sdkPath, 'tsconfig.json');

      if (fs.existsSync(tsconfigPath)) {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
        const paths = tsconfig.compilerOptions?.paths || {};

        compiler.options.resolve = compiler.options.resolve || {};
        compiler.options.resolve.alias = compiler.options.resolve.alias || {};

        // 提取 TS 别名并转为绝对路径
        Object.keys(paths).forEach((aliasKey) => {
          const cleanKey = aliasKey.replace(/\/\*$/, '');
          const targetRelative = paths[aliasKey][0].replace(/\/\*$/, '');
          const absoluteTargetPath = path.resolve(sdkPath, targetRelative);

          // 注入 Webpack 配置
          compiler.options.resolve.alias[cleanKey] = absoluteTargetPath;
          console.log(`\n\x1b[32m[Plugin Success]\x1b[0m 成功注入别名: ${cleanKey} -> ${absoluteTargetPath}\n`);
        });
      }
    });
  }
}

module.exports = TypescriptAliasPlugin;