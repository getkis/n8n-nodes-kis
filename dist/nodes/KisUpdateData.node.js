"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KisUpdateData = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
class KisUpdateData {
    constructor() {
        this.description = {
            displayName: 'KIS Update Data',
            name: 'kisUpdateData',
            icon: 'file:kis.svg',
            group: ['output'],
            version: 1,
            description: 'Action: update a document in a collection',
            defaults: { name: 'KIS Update Data' },
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
                },
                {
                    displayName: 'Document ID',
                    name: 'id',
                    type: 'options',
                    required: true,
                    typeOptions: {
                        loadOptionsMethod: 'getDocumentIds',
                        loadOptionsDependsOn: ['collection'],
                    },
                    default: '',
                },
                {
                    displayName: 'Apply To All Input Items',
                    name: 'applyToAllItems',
                    type: 'boolean',
                    default: false,
                    description: 'If false, runs once only (safe default). If true, runs once per incoming item.',
                },
                {
                    displayName: 'JSON Parameters',
                    name: 'jsonParameters',
                    type: 'boolean',
                    default: false,
                },
                {
                    displayName: 'Fields (JSON)',
                    name: 'fieldsJson',
                    type: 'json',
                    default: '{}',
                    displayOptions: {
                        show: { jsonParameters: [true] },
                    },
                },
                {
                    displayName: 'Fields',
                    name: 'fieldsUi',
                    type: 'fixedCollection',
                    typeOptions: { multipleValues: true },
                    default: {},
                    displayOptions: {
                        show: { jsonParameters: [false] },
                    },
                    options: [
                        {
                            displayName: 'Field',
                            name: 'field',
                            values: [
                                {
                                    displayName: 'Name',
                                    name: 'name',
                                    type: 'options',
                                    typeOptions: {
                                        loadOptionsMethod: 'getCollectionFields',
                                        loadOptionsDependsOn: ['collection'],
                                    },
                                    default: '',
                                    required: true,
                                },
                                {
                                    displayName: 'Value',
                                    name: 'value',
                                    type: 'string',
                                    default: '',
                                },
                            ],
                        },
                    ],
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
                async getCollectionFields() {
                    return GenericFunctions_1.loadCollectionFields.call(this);
                },
            },
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const creds = (await this.getCredentials('kisApi'));
        const auth = await GenericFunctions_1.kisGetAuthorization.call(this);
        const applyToAllItems = this.getNodeParameter('applyToAllItems', 0);
        const runCount = applyToAllItems ? items.length : Math.min(items.length, 1);
        for (let i = 0; i < runCount; i++) {
            try {
                const collection = this.getNodeParameter('collection', i);
                const id = this.getNodeParameter('id', i);
                const jsonParameters = this.getNodeParameter('jsonParameters', i);
                const document = GenericFunctions_1.getFieldsFromParameters.call(this, i, jsonParameters);
                const response = await this.helpers.httpRequest({
                    method: 'PUT',
                    url: `${creds.baseUrl}/api_token_access/data_handlers/${id}`,
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: auth,
                    },
                    body: {
                        data_handler: {
                            collection_name: collection,
                            documents: [{ ...document }],
                        },
                    },
                    json: true,
                });
                returnData.push({ json: response });
            }
            catch (error) {
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.KisUpdateData = KisUpdateData;
