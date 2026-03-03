import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';

import employeesRouter    from './employees.js';
import timesheetsRouter   from './timesheets.js';
import leavesRouter       from './leaves.js';
import documentsRouter    from './documents.js';
import careersRouter      from './careers.js';
import applicationsRouter from './applications.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };
const hr = new Hono<HonoEnv>();

hr.route('/employees',    employeesRouter);
hr.route('/timesheets',   timesheetsRouter);
hr.route('/leaves',       leavesRouter);
hr.route('/documents',    documentsRouter);
hr.route('/careers',      careersRouter);
hr.route('/applications', applicationsRouter);

export default hr;
