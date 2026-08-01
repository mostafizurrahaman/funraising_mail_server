#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const moduleName = process.argv[2];

if (!moduleName) {
   console.log("❌ Usage: node script/create-module.js <ModuleName>");
   process.exit(1);
}

function toFileName(name) {
   return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

const lower = toFileName(moduleName);

const moduleDir = path.join(process.cwd(), "src", "app", "modules", moduleName);

if (fs.existsSync(moduleDir)) {
   console.log(`❌ Module "${moduleName}" already exists.`);
   process.exit(1);
}

fs.mkdirSync(moduleDir, { recursive: true });

const files = {
   [`${lower}.constant.ts`]: `export const ${moduleName}Role = {} as const;

export const ${moduleName}Status = {} as const;

export const ${moduleName}RoleValues = Object.values(${moduleName}Role);
export const ${moduleName}StatusValues = Object.values(${moduleName}Status);
`,

   [`${lower}.controller.ts`]: `import httpStatus from "http-status";
import { catchAsync, sendResponse } from "@/app/utils";
import { ${moduleName}Services } from "./${lower}.services";

const create = catchAsync(async (req, res) => {
   const payload = req.body;

   await ${moduleName}Services.createIntoDB(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "${moduleName} created successfully!",
      data: null,
   });
});

export const ${moduleName}Controller = {
   create,
};
`,

   [`${lower}.interface.ts`]: `import type { Document, Model } from "mongoose";

export interface I${moduleName} {}

export interface I${moduleName}Doc extends I${moduleName}, Document {}

export interface I${moduleName}Model extends Model<I${moduleName}Doc> {}
`,

   [`${lower}.model.ts`]: `import { model, Schema } from "mongoose";
import type {
   I${moduleName},
   I${moduleName}Doc,
   I${moduleName}Model,
} from "./${lower}.interface";

const ${lower}Schema = new Schema<I${moduleName}Doc, I${moduleName}Model>(
   {},
   {
      timestamps: true,
      versionKey: false,
   },
);

export const ${moduleName} = model<I${moduleName}Doc, I${moduleName}Model>(
   "${moduleName}",
   ${lower}Schema,
);
`,

   [`${lower}.route.ts`]: `import { Router } from "express";
import { ${moduleName}Controller } from "./${lower}.controller";

const router = Router();

router.post("/", ${moduleName}Controller.create);

export const ${moduleName}Routes = router;
`,

   [`${lower}.services.ts`]: `const createIntoDB = async (payload: any) => {
   return null;
};

export const ${moduleName}Services = {
   createIntoDB,
};
`,

   [`${lower}.validation.ts`]: `import z from "zod";

const createSchema = z.object({
   body: z.object({}),
});

export const ${moduleName}ValidationSchema = {
   createSchema,
};

export type TCreate${moduleName}Payload = z.infer<
   typeof createSchema.shape.body
>;
`,

   ["index.ts"]: `export * from "./${lower}.constant";
export * from "./${lower}.controller";
export * from "./${lower}.interface";
export * from "./${lower}.model";
export * from "./${lower}.route";
export * from "./${lower}.services";
export * from "./${lower}.validation";
`,
};

for (const [fileName, content] of Object.entries(files)) {
   fs.writeFileSync(path.join(moduleDir, fileName), content, "utf8");
}

console.log(`✅ ${moduleName} module created successfully!`);
console.log(`📂 Location: ${moduleDir}`);
