/**
 * Activities module router — mounts under /portal/activities
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import tasksRouter    from './tasks.js';
import meetingsRouter from './meetings.js';
import callsRouter    from './calls.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const activities = new Hono<HonoEnv>();

activities.route('/tasks',    tasksRouter);
activities.route('/meetings', meetingsRouter);
activities.route('/calls',    callsRouter);

// Redirect /portal/activities → /portal/activities/tasks
activities.get('/', (c) => c.redirect('/portal/activities/tasks'));

export default activities;
