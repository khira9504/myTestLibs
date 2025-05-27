import createMiddleware from 'next-intl/middleware';
import {routingConfig} from './i18n/routing';

export default createMiddleware(routingConfig);

export const config = {
  matcher: ['/((?!_next|favicon.ico|images|fonts).*)']
};
