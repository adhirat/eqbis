/**
 * Support module router — mounts under /portal/support
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import ticketsRouter   from './tickets.js';
import casesRouter     from './cases.js';
import solutionsRouter from './solutions.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const support = new Hono<HonoEnv>();

support.route('/tickets',   ticketsRouter);
support.route('/cases',     casesRouter);
support.route('/solutions', solutionsRouter);

// Redirect /portal/support → /portal/support/tickets
support.get('/', (c) => c.redirect('/portal/support/tickets'));

export default support;
