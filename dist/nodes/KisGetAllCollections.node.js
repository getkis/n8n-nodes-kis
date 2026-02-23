"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KisGetAllCollections = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
class KisGetAllCollections {
    constructor() {
        this.description = {
            displayName: 'KIS Get All Collections',
            name: 'kisGetAllCollections',
            icon: 'file:kis.svg',
            group: ['output'],
            version: 1,
            description: 'Action: get all collections of your workspace',
            defaults: { name: 'KIS Get All Collections' },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [{ name: 'kisApi', required: true }],
            properties: [],
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
        const items = this.getInputData();
        const returnData = [];
        const creds = (await this.getCredentials('kisApi'));
        const auth = await GenericFunctions_1.kisGetAuthorization.call(this);
        for (let i = 0; i < items.length; i++) {
            try {
                const resp = await this.helpers.httpRequest({
                    method: 'GET',
                    url: `${creds.baseUrl}/api_token_access/collections?page=1&per_page=1000`,
                    headers: { Authorization: auth },
                    json: true,
                });
                returnData.push({ json: resp });
            }
            catch (error) {
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.KisGetAllCollections = KisGetAllCollections;
