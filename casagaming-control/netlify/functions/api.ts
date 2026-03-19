import serverlessHttp from 'serverless-http';
import { app } from '../../src/api/app.js';

export const handler = serverlessHttp(app);
