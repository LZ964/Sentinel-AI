import fs from 'fs';
import path from 'path';

function replaceInFile(filePath: string, replacements: [RegExp, string][]) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  for (const [regex, replacement] of replacements) {
    newContent = newContent.replace(regex, replacement);
  }
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
  }
}

const translations: Record<string, [RegExp, string][]> = {
  "src/components/ProxyTab.tsx": [
    [/Analyse de l'IA \(Sentinel\)/g, "AI Analysis (Sentinel)"]
  ],
  "src/lib/localAi.ts": [
    [/Analyse la requête réseau interceptée/g, "Analyze the intercepted network request"],
    [/\[IA\] Analyse du contexte matériel:/g, "[AI] Hardware context analysis:"],
    [/Bloquer l'API WebGL si elle n'est pas strictement nécessaire\./g, "Block the WebGL API if it is not strictly necessary."]
  ]
};

for (const [file, replacements] of Object.entries(translations)) {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    replaceInFile(filePath, replacements);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
}
