/**
 * Inventory module router — mounts under /portal/inventory
 */

import { Hono } from 'hono';
import type { Env } from '../../../types/env.js';
import type { AuthVariables } from '../../../middleware/auth.js';
import productsRouter       from './products.js';
import priceBooksRouter     from './price-books.js';
import quotesRouter         from './quotes.js';
import salesOrdersRouter    from './sales-orders.js';
import purchaseOrdersRouter from './purchase-orders.js';
import vendorsRouter        from './vendors.js';

type HonoEnv = { Bindings: Env; Variables: AuthVariables };

const inventory = new Hono<HonoEnv>();

inventory.route('/products',        productsRouter);
inventory.route('/price-books',     priceBooksRouter);
inventory.route('/quotes',          quotesRouter);
inventory.route('/sales-orders',    salesOrdersRouter);
inventory.route('/purchase-orders', purchaseOrdersRouter);
inventory.route('/vendors',         vendorsRouter);

// Redirect /portal/inventory → /portal/inventory/products
inventory.get('/', (c) => c.redirect('/portal/inventory/products'));

export default inventory;
