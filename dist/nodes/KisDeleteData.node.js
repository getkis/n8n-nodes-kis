"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KisDeleteData = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
class KisDeleteData {
    constructor() {
        this.description = {
            displayName: 'KIS Delete Data',
            name: 'kisDeleteData',
            icon: 'file:kis.svg',
            group: ['output'],
            version: 1,
            description: 'Action: delete a document in a collection',
            defaults: { name: 'KIS Delete Data' },
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
                {
                    displayName: 'Document ID',
                    name: 'id',
                    type: 'options',
                    required: true,
                    typeOptions: { loadOptionsMethod: 'getDocumentIds', loadOptionsDependsOn: ['collection'] },
                    default: '',
                    description: 'The document ID in the selected collection',
                },
                {
                    displayName: 'Apply To All Input Items',
                    name: 'applyToAllItems',
                    type: 'boolean',
                    default: false,
                    description: 'If false, deletes only once (safe default). If true, runs once per incoming item (useful when ID is set via expression).',
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
        var _a;
        const items = this.getInputData();
        const returnData = [];
        const creds = (await this.getCredentials('kisApi'));
        const auth = await GenericFunctions_1.kisGetAuthorization.call(this);
        // ✅ SAFE DEFAULT: run only once unless explicitly enabled
        const applyToAllItems = this.getNodeParameter('applyToAllItems', 0);
        const runCount = applyToAllItems ? items.length : Math.min(items.length, 1);
        for (let i = 0; i < runCount; i++) {
            try {
                const collection = this.getNodeParameter('collection', i);
                const id = this.getNodeParameter('id', i);
                const fullResp = await this.helpers.httpRequest({
                    method: 'DELETE',
                    url: `${creds.baseUrl}/api_token_access/data_handlers/${id}`,
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: auth,
                    },
                    body: { data_handler: { collection_name: collection, document_id: id } },
                    json: true,
                    returnFullResponse: true,
                    ignoreHttpStatusErrors: true,
                });
                const status = (_a = fullResp === null || fullResp === void 0 ? void 0 : fullResp.statusCode) !== null && _a !== void 0 ? _a : fullResp === null || fullResp === void 0 ? void 0 : fullResp.status;
                const body = fullResp === null || fullResp === void 0 ? void 0 : fullResp.body;
                if (status === 204 || status === '204') {
                    returnData.push({ json: { msg: 'Deleted', id, collection, status } });
                }
                else {
                    returnData.push({ json: { msg: 'Failed to Delete.', id, collection, status, body } });
                }
            }
            catch (error) {
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.KisDeleteData = KisDeleteData;
