import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import invoicesRouter from './invoices.js';
import receiptsRouter from './receipts.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const finance = new Hono<HonoEnv>();
finance.route('/invoices', invoicesRouter);
finance.route('/receipts', receiptsRouter);
export default finance;
