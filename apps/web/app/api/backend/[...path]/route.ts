import { getServerApiBaseUrl } from "@/lib/api-client";

interface RouteContext {
  params: Promise<{
    path?: string[];
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

async function proxyRequest(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  const upstreamUrl = new URL(`/${path.join("/")}`, getServerApiBaseUrl());
  const requestUrl = new URL(request.url);

  upstreamUrl.search = requestUrl.search;

  let response: Response;

  try {
    response = await fetch(upstreamUrl, {
      method: request.method,
      headers: buildHeaders(request),
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store",
    });
  } catch {
    return Response.json(
      {
        message:
          "The dashboard could not reach the API. Check that it is running locally.",
      },
      { status: 502 },
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: buildResponseHeaders(response),
  });
}

function buildHeaders(request: Request) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const serverToken = process.env.API_AUTH_TOKEN?.trim();
  const incomingAuthorization = request.headers.get("authorization");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (serverToken) {
    headers.set("authorization", `Bearer ${serverToken}`);
  } else if (incomingAuthorization) {
    headers.set("authorization", incomingAuthorization);
  }

  return headers;
}

function buildResponseHeaders(response: Response) {
  const headers = new Headers();
  const contentType = response.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return headers;
}
