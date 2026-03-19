import serverless from 'serverless-http';
import { app, dbReady } from '../src/api/app.js';

const handler = serverless(app);

export default async function (req: any, res: any) {
  await dbReady;
  return handler(req, res);
}
