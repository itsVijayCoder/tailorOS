module.exports = {
  forbidden: [
    {
      name: "no-deployable-to-deployable-imports",
      severity: "error",
      from: { path: "^apps/[^/]+/src" },
      to: { path: "^apps/[^/]+/src", pathNot: "^apps/([^/]+)/src" },
    },
    {
      name: "no-app-imports-from-packages",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
  ],
  options: {
    exclude: { path: "(^|/)(node_modules|[.]next|dist|[.]turbo)(/|$)" },
    doNotFollow: { path: "(^|/)(node_modules|[.]next|dist|[.]turbo)(/|$)" },
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "types", "default"],
    },
  },
};
