export function authorizationMiddleware(req: any, resp: any, next: any) {
    // Check userId from query parameter first (for GET requests)
    req.userId = req.query.userId;
    
    // If not found in query, check cookies
    if (!req.userId && req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').map((c: string) => c.trim());
        for (const cookie of cookies) {
            const [name, value] = cookie.split('=');
            if (name === 'userid') {
                req.userId = decodeURIComponent(value);
                break;
            }
        }
    }
    
    next();
}