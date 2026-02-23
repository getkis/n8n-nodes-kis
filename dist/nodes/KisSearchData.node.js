"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KisSearchData = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
class KisSearchData {
    constructor() {
        this.description = {
            displayName: 'KIS Search Data',
            name: 'kisSearchData',
            icon: 'file:kis.svg',
            group: ['output'],
            version: 1,
            description: 'Action: get list of data from a specific datatable',
            defaults: { name: 'KIS Search Data' },
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
                returnData.push({ json: resp });
            }
            catch (error) {
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.KisSearchData = KisSearchData;
