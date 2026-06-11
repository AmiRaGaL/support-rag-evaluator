import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ApiAuthGuard } from './api-auth.guard';
import { IS_PUBLIC_ROUTE } from './public.decorator';

describe('ApiAuthGuard', () => {
  it('allows requests when auth is disabled', () => {
    const guard = createGuard({
      AUTH_ENABLED: 'false',
      API_AUTH_TOKEN: 'secret',
    });

    expect(guard.canActivate(createHttpContext())).toBe(true);
  });

  it('rejects a missing token when auth is enabled', () => {
    const guard = createGuard({
      AUTH_ENABLED: 'true',
      API_AUTH_TOKEN: 'secret',
    });

    expect(() => guard.canActivate(createHttpContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an invalid bearer token when auth is enabled', () => {
    const guard = createGuard({
      AUTH_ENABLED: 'true',
      API_AUTH_TOKEN: 'secret',
    });

    expect(() =>
      guard.canActivate(
        createHttpContext({
          authorization: 'Bearer wrong',
        }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('accepts a valid bearer token when auth is enabled', () => {
    const guard = createGuard({
      AUTH_ENABLED: 'true',
      API_AUTH_TOKEN: 'secret',
    });

    expect(
      guard.canActivate(
        createHttpContext({
          authorization: 'Bearer secret',
        }),
      ),
    ).toBe(true);
  });

  it('accepts a valid x-api-key token when auth is enabled', () => {
    const guard = createGuard({
      AUTH_ENABLED: 'true',
      API_AUTH_TOKEN: 'secret',
    });

    expect(
      guard.canActivate(
        createHttpContext({
          'x-api-key': 'secret',
        }),
      ),
    ).toBe(true);
  });

  it('keeps public routes accessible when auth is enabled', () => {
    const guard = createGuard(
      {
        AUTH_ENABLED: 'true',
        API_AUTH_TOKEN: 'secret',
      },
      true,
    );

    expect(guard.canActivate(createHttpContext())).toBe(true);
  });
});

function createGuard(
  values: Record<string, string>,
  isPublicRoute = false,
): ApiAuthGuard {
  const configService = {
    get: jest.fn((key: string) => values[key]),
  };
  const reflector = {
    getAllAndOverride: jest.fn((key: string) =>
      key === IS_PUBLIC_ROUTE ? isPublicRoute : undefined,
    ),
  };

  return new ApiAuthGuard(
    configService as unknown as ConfigService,
    reflector as unknown as Reflector,
  );
}

function createHttpContext(
  headers: Record<string, string> = {},
): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({
        headers,
      })),
    })),
  } as unknown as ExecutionContext;
}
