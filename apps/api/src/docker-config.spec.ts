import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const apiRoot = process.cwd();
const repoRoot = resolve(apiRoot, '..', '..');
const dockerfilePath = resolve(apiRoot, 'Dockerfile');
const dockerIgnorePath = resolve(apiRoot, '.dockerignore');
const composePath = resolve(repoRoot, 'docker-compose.yml');

function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

function serviceBlock(compose: string, serviceName: string): string {
  const lines = compose.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `  ${serviceName}:`);

  if (start === -1) {
    return '';
  }

  const end = lines.findIndex(
    (line, index) => index > start && /^ {2}[\w-]+:\s*$/.test(line),
  );

  return lines.slice(start, end === -1 ? undefined : end).join('\n');
}

describe('Docker configuration', () => {
  it('keeps the API Docker runtime files present', () => {
    expect(existsSync(dockerfilePath)).toBe(true);
    expect(existsSync(dockerIgnorePath)).toBe(true);

    const dockerfile = readText(dockerfilePath);

    expect(dockerfile).toContain('FROM base AS runtime');
    expect(dockerfile).toContain('RUN npm ci');
    expect(dockerfile).toContain('npx prisma generate');
    expect(dockerfile).toContain('RUN npm run build');
    expect(dockerfile).toContain('EXPOSE 3001');
    expect(dockerfile).toContain('CMD ["node", "dist/main.js"]');
  });

  it('defines an API service with deterministic, service-host defaults', () => {
    const compose = readText(composePath);
    const api = serviceBlock(compose, 'api');

    expect(api).toContain('context: ./apps/api');
    expect(api).toContain('target: runtime');
    expect(api).toContain(
      'DATABASE_URL: postgresql://support_rag_user:support_rag_password@postgres:5432/support_rag_dev?schema=public',
    );
    expect(api).not.toContain('@localhost:');
    expect(api).toContain('NODE_ENV: production');
    expect(api).toContain('PORT: 3001');
    expect(api).toContain('LLM_PROVIDER: deterministic');
    expect(api).toContain('- "3001:3001"');
  });

  it('keeps Postgres on host port 5433 while using container port 5432', () => {
    const compose = readText(composePath);
    const postgres = serviceBlock(compose, 'postgres');

    expect(postgres).toContain('image: pgvector/pgvector:pg16');
    expect(postgres).toContain('- "5433:5432"');
    expect(postgres).toContain(
      'support_rag_postgres_data:/var/lib/postgresql/data',
    );
  });

  it('keeps migrations explicit through the tools profile', () => {
    const compose = readText(composePath);
    const migrate = serviceBlock(compose, 'api-migrate');

    expect(migrate).toContain('target: migrate');
    expect(migrate).toContain('- tools');
    expect(migrate).toContain('command: npm run prisma:migrate:deploy');
    expect(migrate).toContain('@postgres:5432');
    expect(migrate).not.toContain('@localhost:');
  });
});
