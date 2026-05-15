export function getAdminToken(req) {
    return req.get('x-admin-token') || req.body?.adminToken;
}

export function getPlayerToken(req) {
    return req.get('x-player-token') || req.body?.playerToken;
}

export function getPlayerId(req) {
    return req.get('x-player-id') || req.body?.playerId || req.params?.playerId || req.query?.playerId;
}

export function ok(data = {}) {
    return { status: 200, data };
}

export function created(data = {}) {
    return { status: 201, data };
}

export function fail(status, message) {
    return { status, data: { message } };
}

export function handleServiceError(error) {
    return fail(error.status || 500, error.status ? error.message : 'Internal server error');
}
