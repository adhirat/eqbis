/**
 * CRM module router — mounts under /portal/crm
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import clientsRouter   from './clients.js';
import leadsRouter     from './leads.js';
import contactsRouter  from './contacts.js';
import accountsRouter  from './accounts.js';
import dealsRouter     from './deals.js';
import campaignsRouter from './campaigns.js';
import forecastsRouter from './forecasts.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const crm = new Hono<HonoEnv>();

crm.route('/clients',   clientsRouter);
crm.route('/leads',     leadsRouter);
crm.route('/contacts',  contactsRouter);
crm.route('/accounts',  accountsRouter);
crm.route('/deals',     dealsRouter);
crm.route('/campaigns', campaignsRouter);
crm.route('/forecasts', forecastsRouter);

// Redirect /portal/crm → /portal/crm/leads
crm.get('/', (c) => c.redirect('/portal/crm/leads'));

export default crm;
