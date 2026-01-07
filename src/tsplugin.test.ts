import assert from "node:assert";
import test from "node:test";

// Import the built plugin (CommonJS default export)
import init from "../dist/tsplugin.js";

function makeInfo({
  withHostResolver = true,
}: { withHostResolver?: boolean } = {}) {
  const logs: string[] = [];
  const projectService = {
    logger: { info: (msg: string) => logs.push(msg) },
  };
  const project = {
    projectService,
    getCompilerOptions: () => ({}) as any,
  } as any;

  const languageServiceHost: any = {};
  if (withHostResolver) {
    languageServiceHost.resolveModuleNames = function (
      moduleNames: string[],
      _containingFile: string,
    ) {
      // Echo back entries with a mock resolved module
      return moduleNames.map((name) => ({ resolvedFileName: name }));
    };
  }

  const info: any = {
    project,
    languageServiceHost,
    languageService: {},
  };

  return { info, logs };
}

test("create() wires resolveModuleNames and remaps */ prefix (host has resolver)", () => {
  const modules = { typescript: {} as any };
  const { info } = makeInfo({ withHostResolver: true });

  const plugin = init(modules as any);
  const ls = plugin.create(info);
  assert.ok(ls === info.languageService, "returns original language service");

  const result = info.languageServiceHost.resolveModuleNames(
    ["*/foo", "bar"],
    "file.ts",
  );
  assert.strictEqual(result.length, 2);
  assert.deepStrictEqual(
    result.map((m: any) => m.resolvedFileName),
    ["~/foo", "bar"],
    "module names are remapped before delegating",
  );
});
