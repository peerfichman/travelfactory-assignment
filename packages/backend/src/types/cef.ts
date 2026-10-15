export type CommonEvent = {
  path: string;
  method: string;
  body: string | null;
  pathParameters: { [name: string]: string | undefined } | undefined;
  queryStringParameters: { [name: string]: string | undefined } | undefined;
  headers: { [name: string]: string | undefined } | undefined;
  cookies?: { [name: string]: string | undefined } | undefined;
  isBase64Encoded?: boolean;
  version: string;
};
