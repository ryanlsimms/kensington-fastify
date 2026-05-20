import Fastify from 'fastify';
import kensingtonView from './index.js';
import { runSuite } from './tests/shared/suite.js';

runSuite(Fastify, kensingtonView);
