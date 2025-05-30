import fs from "node:fs";

import {
  FetchingJSONSchemaStore,
  InputData,
  JSONSchemaInput,
  PythonTargetLanguage,
  quicktype,
  SerializedRenderResult,
  TargetLanguage,
  TypeScriptTargetLanguage,
} from "quicktype-core";

async function quicktypeJSONSchema(
  targetLanguage: TargetLanguage
): Promise<SerializedRenderResult> {
  const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());
  await Promise.all(
    fs
      .readdirSync("./schemas", { recursive: true, withFileTypes: true })
      .map(async (dirent): Promise<void> => {
        if (dirent.isFile() && dirent.name.endsWith(".json")) {
          await schemaInput.addSource({
            name: dirent.name,
            uris: [`${dirent.path}/${dirent.name}`],
          });
        }
      })
  );
  const inputData = new InputData();
  inputData.addInput(schemaInput);
  return await quicktype({
    inputData,
    lang: targetLanguage,
    rendererOptions: {
      "python-version": "3.7", // even though we're on 3.9, 3.7 is the latest that can be specified here
      "pydantic-base-model": true,
      "just-types": false,
      "no-nice-property-names": true, // prevent renaming camelCase to snake_case
    },
  });
}

async function main() {
  const python = new PythonTargetLanguage("Python", ["python"], ".py");
  const pythonPreamble = `# mypy: ignore-errors
# ruff: noqa
"""
Generated by quicktype. Do not manually modify this file.
"""

`;
  const typescript = new TypeScriptTargetLanguage();
  const typescriptPreamble =
    "// Generated by quicktype. Do not manually modify this file.\n\n";
  const callback = (err: Error) => {
    if (err) {
      console.log(err);
    }
  };
  console.log("Quicktyping to MPCAutofill...");
  const { lines: backendLines } = await quicktypeJSONSchema(python);
  // do a little bit of work here to make these types play nice with mypy
  const modifiedBackendLines = backendLines.map((line) =>
    line.replace("(Enum)", "(str, Enum)")
  );
  fs.writeFile(
    "../MPCAutofill/cardpicker/schema_types.py",
    pythonPreamble + modifiedBackendLines.join("\n"),
    callback
  );
  console.log("and done!");

  console.log("Quicktyping to frontend...");
  const { lines: frontendLines } = await quicktypeJSONSchema(typescript);
  fs.writeFile(
    "../frontend/src/common/schema_types.ts",
    typescriptPreamble + frontendLines.join("\n"),
    callback
  );
  console.log("and done!");
}

main();
