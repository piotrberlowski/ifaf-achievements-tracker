import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON prisma/seed.ts",
  },
});
