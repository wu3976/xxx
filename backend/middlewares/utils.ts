export function loggerMiddleware(req: any, res: any, next: any) {
    console.log(`${req.method} ${req.originalUrl} ${Date.now()}`);
    next();
}