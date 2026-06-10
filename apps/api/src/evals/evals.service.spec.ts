import { mkdirSync, mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import {
  parseBaselineEvalCases,
  resolveBaselineEvalDatasetPath,
} from './evals.service';

describe('eval dataset utilities', () => {
  describe('resolveBaselineEvalDatasetPath', () => {
    it('finds the repo-root baseline dataset from a nested dist directory', () => {
      const repoRoot = mkdtempSync(path.join(tmpdir(), 'eval-runner-'));
      const datasetDir = path.join(repoRoot, 'datasets', 'evals');
      const baseDir = path.join(repoRoot, 'apps', 'api', 'dist', 'evals');
      const cwd = path.join(repoRoot, 'apps', 'api');
      const datasetPath = path.join(datasetDir, 'baseline.json');

      mkdirSync(datasetDir, { recursive: true });
      mkdirSync(baseDir, { recursive: true });
      mkdirSync(cwd, { recursive: true });
      writeFileSync(datasetPath, '[]');

      expect(resolveBaselineEvalDatasetPath(baseDir, cwd)).toBe(datasetPath);
    });

    it('falls back to the cwd-relative dataset path when no candidate exists', () => {
      const repoRoot = mkdtempSync(path.join(tmpdir(), 'eval-runner-'));
      const cwd = path.join(repoRoot, 'apps', 'api');

      mkdirSync(cwd, { recursive: true });

      expect(resolveBaselineEvalDatasetPath('/missing/base', cwd)).toBe(
        path.join(cwd, 'datasets', 'evals', 'baseline.json'),
      );
    });
  });

  describe('parseBaselineEvalCases', () => {
    it('normalizes valid cases by trimming string fields and sources', () => {
      expect(
        parseBaselineEvalCases([
          {
            id: ' eval_001 ',
            question: ' How do I reset my password? ',
            expectedAnswer: ' Reset passwords in account security settings. ',
            expectedSources: [' account-management '],
            type: 'supported',
          },
        ]),
      ).toEqual([
        {
          id: 'eval_001',
          question: 'How do I reset my password?',
          expectedAnswer: 'Reset passwords in account security settings.',
          expectedSources: ['account-management'],
          type: 'supported',
        },
      ]);
    });

    it('rejects a non-array dataset', () => {
      expect(() => parseBaselineEvalCases({})).toThrow(
        'Dataset must be an array.',
      );
    });

    it('rejects duplicate ids', () => {
      expect(() =>
        parseBaselineEvalCases([
          validCase({ id: 'eval_001' }),
          validCase({ id: 'eval_001' }),
        ]),
      ).toThrow('duplicate id "eval_001"');
    });

    it('rejects supported cases without expected sources', () => {
      expect(() =>
        parseBaselineEvalCases([validCase({ expectedSources: [] })]),
      ).toThrow('must include at least one expected source');
    });

    it('rejects unsupported cases with expected sources', () => {
      expect(() =>
        parseBaselineEvalCases([
          validCase({
            expectedSources: ['billing'],
            type: 'unsupported',
          }),
        ]),
      ).toThrow('must not include expected sources');
    });

    it('rejects malformed source entries with a clear field path', () => {
      expect(() =>
        parseBaselineEvalCases([
          validCase({
            expectedSources: ['billing', ''],
          }),
        ]),
      ).toThrow('expectedSources[1] must be a non-empty string');
    });
  });
});

function validCase(overrides: Record<string, unknown> = {}) {
  return {
    id: 'eval_001',
    question: 'Can I export billing history?',
    expectedAnswer: 'Users can export billing history.',
    expectedSources: ['billing'],
    type: 'supported',
    ...overrides,
  };
}
