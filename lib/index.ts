import redis, { RedisClient, ClientOpts } from "redis";

let redisClient: RedisClient;
export default redisClient;

export const createClient = async (params: {host: string, port: number}): Promise<void> => {
    if (redisClient) {
        return;
    }

    redisClient = redis.createClient(getConfig(params.host, params.port));
    redisClient.on("error", (err: Error) => {
        throw new Error(`Redis error: ${err}`);
    });
    return new Promise<void>((resolve) => {
        redisClient.on("connect", () => resolve());
    });
};

export const getClient = (): RedisClient => redisClient;

const getConfig = (host: string, port: number): ClientOpts => {
    return {
        host: host,
        port: port,
        retry_strategy: options => {
            if (options.error && options.error.code === "ECONNREFUSED") {
                return new Error("The server refused the connection");
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
                return new Error("Retry time exhausted");
            }
            if (options.attempt > 20) {
                return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
        }
    };
};
