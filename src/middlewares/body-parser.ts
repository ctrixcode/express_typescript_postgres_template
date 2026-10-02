import bodyParser from 'body-parser';

export const bodyParserMiddleware = [
  bodyParser.json({ limit: '1mb' }),
  bodyParser.urlencoded({ extended: true, limit: '1mb' }),
];
