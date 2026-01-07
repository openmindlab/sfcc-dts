import type * as ts from "typescript/lib/tsserverlibrary";

function init(modules: {
  typescript: typeof import("typescript/lib/tsserverlibrary");
}) {
  const tsModule = modules.typescript;

  function create(info: ts.server.PluginCreateInfo): ts.LanguageService {
    const log = (text: string) => {
      info.project.projectService.logger.info(`[sfccstar]: ${text}`);
    };
    log("starting plugin");

    const origResolveModuleNames =
      info.languageServiceHost.resolveModuleNames?.bind(
        info.languageServiceHost
      );

    info.languageServiceHost.resolveModuleNames = (
      moduleNames: string[],
      containingFile: string,
      reusedNames?: string[],
      redirectedReference?: ts.ResolvedProjectReference
    ): (ts.ResolvedModule | undefined)[] => {
      const remapped = moduleNames.map((moduleName: string) => {
        if (moduleName.startsWith("*/")) {
          const newName = `~/${moduleName.substring(2)}`;
          log(`sfccstar transform "${moduleName}" to "${newName}"`);
          return newName;
        }
        return moduleName;
      });

      // Use the remapped module names to call the original method if available
      if (origResolveModuleNames) {
        return origResolveModuleNames(
          remapped,
          containingFile,
          reusedNames,
          redirectedReference
        );
      }

      // Fallback: resolve via TypeScript API when host doesn't implement it
      const compilerOptions = info.project.getCompilerOptions();
      const host = info.languageServiceHost as ts.ModuleResolutionHost;
      return remapped.map((name) => {
        const result = tsModule.resolveModuleName(
          name,
          containingFile,
          compilerOptions,
          host
        );
        return result.resolvedModule as unknown as
          | ts.ResolvedModule
          | undefined;
      });
    };

    // We aren't actually proxying the language service, so we just return the original
    return info.languageService;
  }

  return { create };
}

export = init;
