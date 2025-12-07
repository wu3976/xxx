import { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT, SERVER_PORT, MONGODB_CONNECTION_STRING } from "./constants/environment.ts";

export function checkEnvVars() {
    if (!REDIS_USERNAME) {
        console.log("redis username must be provided.");
        process.exit(1);
    }
    if (!REDIS_PASSWORD) {
        console.log("redis password must be provided.");
        process.exit(1);
    }
    if (!REDIS_HOST) {
        console.log("redis hostname must be provided.");
        process.exit(1);
    }
    if (!REDIS_PORT) {
        console.log("redis port must be provided.");
        process.exit(1);
    }
    if (!SERVER_PORT) {
        console.log("server port must be provided.");
        process.exit(1);
    }
    if (!MONGODB_CONNECTION_STRING) {
        console.log("mongodb connection string must be provided.");
        process.exit(1);
    }
}

export function constructMidLayerError(errorType: string, info: string): { errorType: string, info: string } {
    return { errorType, info };
}


export function constructRouterJsonResp(type: string, data: any): { type: string, data: any } {
    return { type, data };
}