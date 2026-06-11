import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { timingSafeEqual } from 'crypto';
import { IS_PUBLIC_ROUTE } from './public.decorator';

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || !this.isAuthEnabled()) {
      return true;
    }

    const expectedToken = this.configService
      .get<string>('API_AUTH_TOKEN')
      ?.trim();

    if (!expectedToken) {
      throw new UnauthorizedException(
        'API authentication is enabled but API_AUTH_TOKEN is not configured.',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedToken = this.extractToken(request);

    if (!providedToken || !tokensMatch(providedToken, expectedToken)) {
      throw new UnauthorizedException(
        'Authentication token is missing or invalid.',
      );
    }

    return true;
  }

  private isAuthEnabled(): boolean {
    return (
      this.configService.get<string>('AUTH_ENABLED')?.trim().toLowerCase() ===
      'true'
    );
  }

  private extractToken(request: Request): string | undefined {
    const bearerToken = extractBearerToken(request.headers.authorization);
    const apiKey = firstHeaderValue(request.headers['x-api-key']);

    return bearerToken ?? apiKey;
  }
}

function extractBearerToken(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const [scheme, ...rest] = value.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || rest.length !== 1) {
    return undefined;
  }

  return rest[0];
}

function firstHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function tokensMatch(providedToken: string, expectedToken: string): boolean {
  const provided = Buffer.from(providedToken);
  const expected = Buffer.from(expectedToken);

  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}
