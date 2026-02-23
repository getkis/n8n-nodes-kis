"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KisCreateData = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
class KisCreateData {
    constructor() {
        this.description = {
            displayName: 'KIS Create Data',
            name: 'kisCreateData',
            icon: 'file:kis.svg',
            group: ['output'],
            version: 1,
            description: 'Action: create a document in a collection',
            defaults: { name: 'KIS Create Data' },
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
                    displayName: 'JSON Parameters',
                    name: 'jsonParameters',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to send the fields as JSON',
                },
                {
                    displayName: 'Fields (UI)',
                    name: 'fieldsUi',
                    type: 'fixedCollection',
                    typeOptions: { multipleValues: true },
                    default: {},
                    placeholder: 'Add Field',
                    displayOptions: {
                        show: { jsonParameters: [false] },
                    },
                    options: [
                        {
                            name: 'field',
                            displayName: 'Field',
                            values: [
                                {
                                    displayName: 'Field Name',
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
                {
                    displayName: 'Fields (JSON)',
                    name: 'fieldsJson',
                    type: 'json',
                    default: '{}',
                    displayOptions: {
                        show: { jsonParameters: [true] },
                    },
                    description: 'JSON object of fields to create. Example: {"foo":"bar","count":2}',
                },
            ],
        };
        this.methods = {
            loadOptions: {
                async getCollections() {
                    return GenericFunctions_1.loadCollections.call(this);
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
        for (let i = 0; i < items.length; i++) {
            try {
                const collection = this.getNodeParameter('collection', i);
                const jsonParameters = this.getNodeParameter('jsonParameters', i);
                const document = GenericFunctions_1.getFieldsFromParameters.call(this, i, jsonParameters);
                const response = await this.helpers.httpRequest({
                    method: 'POST',
                    url: `${creds.baseUrl}/api_token_access/data_handlers`,
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: auth,
                    },
                    body: {
                        data_handler: {
                            collection_name: collection,
                            documents: [document],
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
exports.KisCreateData = KisCreateData;
