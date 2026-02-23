"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KisGetDataTrigger = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
class KisGetDataTrigger {
    constructor() {
        this.description = {
            displayName: 'KIS Get Data',
            name: 'kisGetDataTrigger',
            icon: 'file:kis.svg',
            group: ['trigger'],
            version: 1,
            description: 'Trigger: get data of a collection (documents)',
            defaults: { name: 'KIS Get Data' },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [{ name: 'kisApi', required: true }],
            properties: [
                {
                    displayName: 'Collection Name',
                    name: 'collection',
                    type: 'options',
                    required: true,
                    typeOptions: { loadOptionsMethod: 'getCollections' },
                    default: '',
                    description: 'The collection (datatable) name',
                },
            ],
        };
        this.methods = {
            loadOptions: {
                async getCollections() {
                    return GenericFunctions_1.loadCollections.call(this);
                },
                async getDocumentIds() {
                    return GenericFunctions_1.loadDocumentIds.call(this);
                },
            },
        };
    }
    async execute() {
        var _a, _b, _c, _d, _e;
        const items = this.getInputData();
        const returnData = [];
        const creds = (await this.getCredentials('kisApi'));
        const auth = await GenericFunctions_1.kisGetAuthorization.call(this);
        for (let i = 0; i < items.length; i++) {
            try {
                const collection = this.getNodeParameter('collection', i);
                const resp = await this.helpers.httpRequest({
                    method: 'POST',
                    url: `${creds.baseUrl}/api_token_access/data_handlers/index`,
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: auth,
                    },
                    body: { data_handler: { collection_name: collection } },
                    json: true,
                });
                const docs = (_c = (_b = (_a = resp === null || resp === void 0 ? void 0 : resp.queries) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.documents) !== null && _c !== void 0 ? _c : [];
                for (const d of docs)
                    returnData.push({ json: { ...d, id: (_e = (_d = d === null || d === void 0 ? void 0 : d._id) === null || _d === void 0 ? void 0 : _d.$oid) !== null && _e !== void 0 ? _e : d === null || d === void 0 ? void 0 : d.id } });
            }
            catch (error) {
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.KisGetDataTrigger = KisGetDataTrigger;
