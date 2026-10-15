export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  body?: object;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  token?: string;
  pathParams?: Record<string, string>;
}

export function buildEvent(opts: RequestOptions) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    ...opts.headers,
  };

  // API Gateway v1 proxy event format that CEF's buildCommonEvent parses
  return {
    httpMethod: opts.method,
    path: opts.path,
    headers,
    multiValueHeaders: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, [v]])),
    body: opts.body ? JSON.stringify(opts.body) : null,
    queryStringParameters: opts.query ?? null,
    multiValueQueryStringParameters: null,
    pathParameters: opts.pathParams ?? null,
    isBase64Encoded: false,
    requestContext: {
      resourceId: 'test',
      resourcePath: opts.path,
      httpMethod: opts.method,
      requestId: 'test-request-id',
      apiId: 'test',
      stage: 'test',
      identity: { sourceIp: '127.0.0.1' },
    },
    resource: opts.path,
    stageVariables: null,
  };
}

export function parseResponse(result: unknown): { statusCode: number; body: unknown } {
  const res = result as { statusCode?: number; body?: string; [key: string]: unknown };
  if (res?.statusCode) {
    const body = typeof res.body === 'string' ? JSON.parse(res.body) : (res.body ?? res);
    return { statusCode: res.statusCode, body };
  }
  // CEF returns plain objects for 200 responses
  return { statusCode: 200, body: res };
}
