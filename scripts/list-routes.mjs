#!/usr/bin/env node
/**
 * Print every route the site publishes, one per line.
 *
 * The deploy uses this twice: to upload the prerendered, extensionless route
 * files with an explicit HTML content type, and to invalidate them at the edge.
 * Reading the list from the catalogue rather than repeating it in YAML means a
 * new figure is deployed correctly without anyone editing the workflow.
 */
import { routes } from '../src/figures/catalogue.mjs';

console.log(routes().join('\n'));
