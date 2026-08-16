import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.API_SERVER_URL ||
  "http://localhost:4000";

async function proxyRequest(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  const { path } = await context.params;

  const targetUrl =
    `${BACKEND_URL}/${path.join("/")}` +
    (request.nextUrl.search
      ? request.nextUrl.search
      : "");

  const headers = new Headers();

  /*
   * Forward request headers needed by the
   * NestJS API.
   */
  const contentType =
    request.headers.get(
      "content-type"
    );

  if (contentType) {
    headers.set(
      "content-type",
      contentType
    );
  }

  const cookie =
    request.headers.get("cookie");

  if (cookie) {
    headers.set("cookie", cookie);
  }

  const authorization =
    request.headers.get(
      "authorization"
    );

  if (authorization) {
    headers.set(
      "authorization",
      authorization
    );
  }

  const workspaceId =
    request.headers.get(
      "x-workspace-id"
    );

  if (workspaceId) {
    headers.set(
      "x-workspace-id",
      workspaceId
    );
  }

  const accept =
    request.headers.get("accept");

  if (accept) {
    headers.set("accept", accept);
  }

  const method = request.method;

  let body:
    | string
    | undefined;

  if (
    method !== "GET" &&
    method !== "HEAD"
  ) {
    body = await request.text();
  }

  const backendResponse =
    await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });

  const responseHeaders =
    new Headers();

  /*
   * Forward the response content type.
   */
  const responseContentType =
    backendResponse.headers.get(
      "content-type"
    );

  if (responseContentType) {
    responseHeaders.set(
      "content-type",
      responseContentType
    );
  }

  /*
   * Forward Set-Cookie from NestJS.
   *
   * The cookie must belong to the
   * Vercel domain, not the Render domain.
   */
  const setCookie =
    backendResponse.headers.get(
      "set-cookie"
    );

  if (setCookie) {
    responseHeaders.append(
      "set-cookie",
      setCookie
        .replace(
          /;\s*Domain=[^;]+/gi,
          ""
        )
    );
  }

  const responseBody =
    await backendResponse.text();

  return new NextResponse(
    responseBody,
    {
      status:
        backendResponse.status,
      statusText:
        backendResponse.statusText,
      headers:
        responseHeaders,
    }
  );
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return proxyRequest(
    request,
    context
  );
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return proxyRequest(
    request,
    context
  );
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return proxyRequest(
    request,
    context
  );
}

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return proxyRequest(
    request,
    context
  );
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return proxyRequest(
    request,
    context
  );
}

export async function HEAD(
  request: NextRequest,
  context: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return proxyRequest(
    request,
    context
  );
}