import type { FastifyPluginCallback, FastifyRequest, FastifyReply } from 'fastify';

export type PageRenderer = (locals: Record<string, unknown>) => { toString(): string };

export type LayoutRenderer = (
  this: FastifyReply,
  locals: Record<string, unknown>,
  pageRenderer: PageRenderer,
) => { toString(): string };

export interface RenderViewOptions extends Record<string, unknown> {
  layout?: LayoutRenderer | null;
}

export type BuildLocals = (
  request: FastifyRequest,
  reply: FastifyReply,
  options: RenderViewOptions,
) => Record<string, unknown>;

export interface KensingtonOptions {
  defaultLayout?: LayoutRenderer | null;
  defaultContext?: Record<string, unknown>;
  htmlValidator?: ((html: string) => void | Promise<void>) | null;
  buildLocals?: BuildLocals;
}

declare module 'fastify' {
  interface FastifyReply {
    locals: Record<string, unknown>;
    renderView(
      pageRenderer: PageRenderer,
      options?: RenderViewOptions,
    ): void;
  }
}

declare const kensingtonFastify: FastifyPluginCallback<KensingtonOptions>;
export default kensingtonFastify;
