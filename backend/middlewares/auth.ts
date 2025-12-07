export function authorizationMiddleware(req: any, resp: any, next: any) {
    req.userId = req.query.userId // TODO: modify this to a real middleware
    next();
}