import {
  NextRequest,
  NextResponse,
} from "next/server";

const BACKEND_URL =
  process.env.API_SERVER_URL ||
  "http://localhost:4000";

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

async function proxyRequest(
  request: NextRequest,
  context: RouteContext
) {
  const { path } =
    await context.params;

  const targetUrl =
    `${BACKEND_URL}/${path.join("/")}` +
    (request.nextUrl.search ||
      "");

  const headers =
    new Headers();

  /*
   * Forward request headers required
   * by the NestJS API.
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
    headers.set(
      "cookie",
      cookie
    );
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
    headers.set(
      "accept",
      accept
    );
  }

  const method =
    request.method;

  let body:
    | string
    | undefined;

  if (
    method !== "GET" &&
    method !== "HEAD"
  ) {
    body = await request.text();
  }

  let backendResponse: Response;

  try {
    backendResponse =
      await fetch(
        targetUrl,
        {
          method,
          headers,
          body,
          redirect: "manual",
          cache: "no-store",
        }
      );
  } catch (error) {
    console.error(
      "Backend proxy request failed:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to reach backend service.",
      },
      {
        status: 502,
      }
    );
  }

  const responseHeaders =
    new Headers();

  /*
   * Forward the backend response
   * content type.
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
   * Forward every Set-Cookie header
   * separately.
   *
   * The browser should store the cookie
   * for the Vercel origin, so remove any
   * Domain attribute that the backend
   * might send.
   */
  const setCookieHeaders =
    typeof (
      backendResponse.headers as Headers & {
        getSetCookie?: () => string[];
      }
    ).getSetCookie === "function"
      ? (
          backendResponse.headers as Headers & {
            getSetCookie: () => string[];
          }
        ).getSetCookie()
      : [];

  if (
    setCookieHeaders.length > 0
  ) {
    for (const cookieHeader of
      setCookieHeaders) {
      const rewrittenCookie =
        cookieHeader.replace(
          /;\s*Domain=[^;]+/gi,
          ""
        );

      responseHeaders.append(
        "set-cookie",
        rewrittenCookie
      );
    }
  } else {
    /*
     * Fallback for environments where
     * getSetCookie() is unavailable.
     */
    const setCookie =
      backendResponse.headers.get(
        "set-cookie"
      );

    if (setCookie) {
      const rewrittenCookie =
        setCookie.replace(
          /;\s*Domain=[^;]+/gi,
          ""
        );

      responseHeaders.append(
        "set-cookie",
        rewrittenCookie
      );
    }
  }

  /*
   * Read the backend response body
   * and return it through the Vercel
   * origin.
   */
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
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}

export async function HEAD(
  request: NextRequest,
  context: RouteContext
) {
  return proxyRequest(
    request,
    context
  );
}