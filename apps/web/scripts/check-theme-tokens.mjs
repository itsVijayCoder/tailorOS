import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();

const scanRoots = [
  "app",
  "components",
  "../../Docs/architecture",
  "../../Docs/runbooks",
];

const scannedExtensions = new Set([
  ".css",
  ".js",
  ".jsx",
  ".md",
  ".mdx",
  ".ts",
  ".tsx",
]);

const ignoredFiles = new Set(["app/globals.css"]);

const rawTailwindPalette =
  /(?:^|[\s"'`])(?:bg|text|border|from|to|via|ring|outline|decoration|accent|caret|fill|stroke)-(?:slate|zinc|neutral|stone|gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:[\s"'`:/.-]|$)/;

const arbitraryColor = /\[(?:#|rgb|hsl|oklch|color-mix)/;
const rawCssColor = /(?:#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/;

const rules = [
  {
    name: "raw Tailwind palette utility",
    regex: rawTailwindPalette,
    message:
      "Use shadcn semantic utilities such as bg-background, text-foreground, border-border, text-primary, or bg-warning.",
  },
  {
    name: "arbitrary color utility",
    regex: arbitraryColor,
    message:
      "Move one-off colors into app/globals.css and expose them through @theme inline.",
  },
  {
    name: "raw CSS color",
    regex: rawCssColor,
    message:
      "Raw color values are only allowed in app/globals.css theme variables.",
  },
];

function extensionOf(path) {
  const match = path.match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

function listFiles(path) {
  const fullPath = join(root, path);
  const stat = statSync(fullPath, { throwIfNoEntry: false });

  if (!stat) {
    return [];
  }

  if (stat.isFile()) {
    return scannedExtensions.has(extensionOf(path)) ? [path] : [];
  }

  return readdirSync(fullPath).flatMap((entry) => listFiles(join(path, entry)));
}

const violations = scanRoots
  .flatMap(listFiles)
  .filter((file) => !ignoredFiles.has(file))
  .flatMap((file) => {
    const content = readFileSync(join(root, file), "utf8");
    return content.split("\n").flatMap((line, index) =>
      rules
        .filter((rule) => rule.regex.test(line))
        .map((rule) => ({
          file: relative(root, join(root, file)),
          line: index + 1,
          rule,
          text: line.trim(),
        })),
    );
  });

if (violations.length > 0) {
  console.error(
    "Theme token check failed. Keep color values in app/globals.css.",
  );
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line} ${violation.rule.name}: ${violation.rule.message}`,
    );
    console.error(`  ${violation.text}`);
  }
  process.exit(1);
}

console.log("Theme token check passed.");
