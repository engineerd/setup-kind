import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';

const UTF8_ENCODING = 'utf8';

export function write(dir: string, fileName: string, content: unknown) {
  const file = path.join(dir, fileName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(file, yaml.dump(content), UTF8_ENCODING);
  return file;
}

export function read(path: string) {
  return yaml.load(fs.readFileSync(path, UTF8_ENCODING));
}
