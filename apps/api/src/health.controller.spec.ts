import { EmbeddingsService } from './embeddings/embeddings.service';
import { HealthController, resolveRagMode } from './health.controller';
import { LlmService } from './llm/llm.service';
import { PrismaService } from './prisma/prisma.service';

describe('HealthController', () => {
  it.each([
    ['groq', 'gemini', 'genai'],
    ['groq', 'openai', 'genai'],
    ['deterministic', 'gemini', 'hybrid'],
    ['groq', 'deterministic', 'hybrid'],
    ['deterministic', 'deterministic', 'deterministic'],
  ])(
    'resolves llmProvider=%s and embeddingProvider=%s to ragMode=%s',
    (llmProvider, embeddingProvider, ragMode) => {
      expect(resolveRagMode(llmProvider, embeddingProvider)).toBe(ragMode);
    },
  );

  it('checks the database and returns a simple health response', async () => {
    const queryRaw = jest
      .fn<Promise<Array<Record<string, number>>>, [TemplateStringsArray]>()
      .mockResolvedValue([{ '?column?': 1 }]);
    const prisma = {
      $queryRaw: queryRaw,
    } as unknown as PrismaService;
    const getLlmProviderName = jest.fn().mockReturnValue('groq');
    const getEmbeddingProviderName = jest.fn().mockReturnValue('gemini');
    const getEmbeddingModelName = jest
      .fn()
      .mockReturnValue('gemini-embedding-2');
    const getEmbeddingDimensions = jest.fn().mockReturnValue(1536);
    const llmService = {
      getProviderName: getLlmProviderName,
    } as unknown as LlmService;
    const embeddingsService = {
      getProviderName: getEmbeddingProviderName,
      getModelName: getEmbeddingModelName,
      getDimensions: getEmbeddingDimensions,
    } as unknown as EmbeddingsService;
    const controller = new HealthController(
      prisma,
      llmService,
      embeddingsService,
    );

    const result: Awaited<ReturnType<HealthController['getHealth']>> =
      await controller.getHealth();

    expect(queryRaw).toHaveBeenCalledWith(expect.arrayContaining(['SELECT 1']));
    expect(getLlmProviderName).toHaveBeenCalled();
    expect(getEmbeddingProviderName).toHaveBeenCalled();
    expect(result).toEqual({
      status: 'ok',
      service: 'support-rag-api',
      database: 'ok',
      llmProvider: 'groq',
      embeddingProvider: 'gemini',
      embeddingModel: 'gemini-embedding-2',
      embeddingDimensions: 1536,
      ragMode: 'genai',
      timestamp: result.timestamp,
    });
    expect(typeof result.timestamp).toBe('string');
  });
});
