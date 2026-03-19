import serverless from 'serverless-http';
import { app } from '../src/api/app.js';

export default serverless(app);
