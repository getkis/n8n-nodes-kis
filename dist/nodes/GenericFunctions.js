"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kisGetAuthorization = kisGetAuthorization;
exports.loadCollections = loadCollections;
exports.loadDocumentIds = loadDocumentIds;
exports.getFieldsFromParameters = getFieldsFromParameters;
exports.loadCollectionFields = loadCollectionFields;
const n8n_workflow_1 = require("n8n-workflow");
async function kisGetAuthorization() {
    var _a, _b, _c;
    const creds = (await this.getCredentials('kisApi'));
    const baseUrl = (creds.baseUrl || '').replace(/\/+$/, '');
    if (!baseUrl) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), { message: 'Missing Base URL in KIS credentials.' });
    }
    const fullResp = await this.helpers.httpRequest({
        method: 'POST',
        url: `${baseUrl}/api_access_auth/sign_in`,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: {
            app_token: creds.appToken,
            secret: creds.secret,
        },
        json: true,
        returnFullResponse: true,
    });
    const headers = (_a = fullResp === null || fullResp === void 0 ? void 0 : fullResp.headers) !== null && _a !== void 0 ? _a : {};
    // n8n usually normalizes to lowercase
    const auth = headers.authorization ||
        headers.Authorization ||
        ((_b = fullResp === null || fullResp === void 0 ? void 0 : fullResp.body) === null || _b === void 0 ? void 0 : _b.authorization) ||
        ((_c = fullResp === null || fullResp === void 0 ? void 0 : fullResp.body) === null || _c === void 0 ? void 0 : _c.Authorization);
    if (!auth || typeof auth !== 'string') {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), fullResp, { message: 'Authorization missing from KIS sign_in response.' });
    }
    return auth;
}
async function loadCollections() {
    var _a;
    const creds = (await this.getCredentials('kisApi'));
    const baseUrl = (creds.baseUrl || '').replace(/\/+$/, '');
    const auth = await kisGetAuthorization.call(this);
    const res = await this.helpers.httpRequest({
        method: 'GET',
        url: `${baseUrl}/api_token_access/collections`,
        qs: { page: 1, per_page: 1000 },
        headers: {
            Accept: 'application/json',
            Authorization: auth,
        },
        json: true,
    });
    const data = (_a = res === null || res === void 0 ? void 0 : res.data) !== null && _a !== void 0 ? _a : [];
    return (Array.isArray(data) ? data : []).map((c) => {
        var _a, _b, _c, _d, _e, _f;
        return ({
            name: (_c = (_b = (_a = c === null || c === void 0 ? void 0 : c.attributes) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : c === null || c === void 0 ? void 0 : c.id) !== null && _c !== void 0 ? _c : 'Unknown',
            value: (_f = (_e = (_d = c === null || c === void 0 ? void 0 : c.attributes) === null || _d === void 0 ? void 0 : _d.name) !== null && _e !== void 0 ? _e : c === null || c === void 0 ? void 0 : c.id) !== null && _f !== void 0 ? _f : '',
        });
    });
}
async function loadDocumentIds() {
    var _a, _b, _c;
    const { baseUrl } = (await this.getCredentials('kisApi'));
    const collection = this.getCurrentNodeParameter('collection');
    if (!collection)
        return [];
    const auth = await kisGetAuthorization.call(this);
    const resp = await this.helpers.httpRequest({
        method: 'POST',
        url: `${baseUrl}/api_token_access/data_handlers/index`,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: auth,
        },
        body: {
            data_handler: { collection_name: collection },
        },
        json: true,
    });
    const docs = (_c = (_b = (_a = resp === null || resp === void 0 ? void 0 : resp.queries) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.documents) !== null && _c !== void 0 ? _c : [];
    return docs
        .map((d) => {
        var _a, _b;
        const id = (_a = d === null || d === void 0 ? void 0 : d._id) === null || _a === void 0 ? void 0 : _a.$oid;
        const label = (_b = d === null || d === void 0 ? void 0 : d.nom) !== null && _b !== void 0 ? _b : id;
        return { name: label, value: id };
    })
        .filter((o) => o.value);
}
function getFieldsFromParameters(itemIndex, jsonParameters) {
    var _a, _b;
    if (jsonParameters) {
        const raw = this.getNodeParameter('fieldsJson', itemIndex);
        if (raw && typeof raw === 'object')
            return raw;
        if (!raw)
            return {};
        try {
            const parsed = JSON.parse(String(raw));
            return (parsed && typeof parsed === 'object') ? parsed : {};
        }
        catch (e) {
            throw new n8n_workflow_1.NodeApiError(this.getNode(), e, {
                itemIndex,
                message: 'Fields (JSON) must be valid JSON.',
            });
        }
    }
    const fieldsUi = this.getNodeParameter('fieldsUi', itemIndex, {});
    const rows = (_a = fieldsUi === null || fieldsUi === void 0 ? void 0 : fieldsUi.field) !== null && _a !== void 0 ? _a : [];
    const out = {};
    for (const row of rows) {
        const key = ((_b = row === null || row === void 0 ? void 0 : row.name) !== null && _b !== void 0 ? _b : '').trim();
        if (!key)
            continue;
        const val = row === null || row === void 0 ? void 0 : row.value;
        if (typeof val === 'string') {
            const s = val.trim();
            if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
                try {
                    out[key] = JSON.parse(s);
                    continue;
                }
                catch {
                    // fall through
                }
            }
            if (/^(true|false)$/i.test(s)) {
                out[key] = s.toLowerCase() === 'true';
                continue;
            }
            if (/^-?\d+(\.\d+)?$/.test(s)) {
                // keep as number if it looks numeric
                out[key] = Number(s);
                continue;
            }
            out[key] = val;
        }
        else {
            out[key] = val;
        }
    }
    return out;
}
async function loadCollectionFields() {
    var _a, _b, _c, _d, _e, _f;
    const creds = (await this.getCredentials('kisApi'));
    const auth = await kisGetAuthorization.call(this);
    const collectionName = this.getCurrentNodeParameter('collection');
    if (!collectionName)
        return [];
    const listRes = await this.helpers.httpRequest({
        method: 'GET',
        url: `${creds.baseUrl}/api_token_access/collections`,
        qs: { page: 1, per_page: 1000 },
        headers: { Accept: 'application/json', Authorization: auth },
        json: true,
    });
    const collection = (_a = listRes === null || listRes === void 0 ? void 0 : listRes.data) === null || _a === void 0 ? void 0 : _a.find((e) => { var _a; return ((_a = e === null || e === void 0 ? void 0 : e.attributes) === null || _a === void 0 ? void 0 : _a.name) === collectionName; });
    if (!collection)
        return [];
    let included = (_b = listRes === null || listRes === void 0 ? void 0 : listRes.included) !== null && _b !== void 0 ? _b : [];
    if (!Array.isArray(included) || included.length === 0) {
        try {
            const detailRes = await this.helpers.httpRequest({
                method: 'GET',
                url: `${creds.baseUrl}/api_token_access/collections/${collection.id}`,
                qs: { include: 'fields' },
                headers: { Accept: 'application/json', Authorization: auth },
                json: true,
            });
            included = (_c = detailRes === null || detailRes === void 0 ? void 0 : detailRes.included) !== null && _c !== void 0 ? _c : [];
        }
        catch {
            included = [];
        }
    }
    const reserved = new Set(['_id', 'u_at', 'c_at']);
    const idsSet = new Set(((_f = (_e = (_d = collection === null || collection === void 0 ? void 0 : collection.relationships) === null || _d === void 0 ? void 0 : _d.fields) === null || _e === void 0 ? void 0 : _e.data) !== null && _f !== void 0 ? _f : []).map((it) => it === null || it === void 0 ? void 0 : it.id).filter(Boolean));
    const matchedFields = (included !== null && included !== void 0 ? included : [])
        .filter((field) => idsSet.has(field === null || field === void 0 ? void 0 : field.id))
        .filter((field) => { var _a; return !reserved.has((_a = field === null || field === void 0 ? void 0 : field.attributes) === null || _a === void 0 ? void 0 : _a.field_name); })
        .map((field) => {
        var _a, _b;
        return ({
            name: (_a = field === null || field === void 0 ? void 0 : field.attributes) === null || _a === void 0 ? void 0 : _a.field_name,
            value: (_b = field === null || field === void 0 ? void 0 : field.attributes) === null || _b === void 0 ? void 0 : _b.field_name,
        });
    });
    // de-dupe + stable sort
    const seen = new Set();
    const out = matchedFields
        .filter((f) => typeof (f === null || f === void 0 ? void 0 : f.value) === 'string' && f.value.length > 0)
        .filter((f) => (seen.has(f.value) ? false : (seen.add(f.value), true)))
        .sort((a, b) => a.name.localeCompare(b.name));
    return out;
}
