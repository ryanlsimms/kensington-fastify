import Fastify from 'fastify-v4';
import kensingtonView from '../index.js';
import { runSuite } from './shared/suite.js';

runSuite(Fastify, kensingtonView);
