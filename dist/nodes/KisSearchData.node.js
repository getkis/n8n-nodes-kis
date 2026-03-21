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
            description: 'Action: search data in a specific datatable',
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
                {
                    displayName: 'Limit',
                    name: 'limit',
                    type: 'number',
                    default: 25,
                    typeOptions: {
                        minValue: 1,
                    },
                    description: 'Maximum number of documents to return',
                },
                {
                    displayName: 'Filters',
                    name: 'filters',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {
                        filter: [],
                    },
                    placeholder: 'Add Filter',
                    options: [
                        {
                            name: 'filter',
                            displayName: 'Filter',
                            values: [
                                {
                                    displayName: 'Field',
                                    name: 'filter_column',
                                    type: 'string',
                                    default: '',
                                    description: 'Column name to filter',
                                },
                                {
                                    displayName: 'Operator',
                                    name: 'filter_operator',
                                    type: 'options',
                                    options: [
                                        { name: 'Equals', value: 'eq' },
                                        { name: 'Not Equals', value: 'ne' },
                                        { name: 'Greater Than', value: 'gt' },
                                        { name: 'Greater Or Equal', value: 'gte' },
                                        { name: 'Less Than', value: 'lt' },
                                        { name: 'Less Or Equal', value: 'lte' },
                                        { name: 'Like', value: 'like' },
                                    ],
                                    default: 'eq',
                                },
                                {
                                    displayName: 'Value',
                                    name: 'filter_value',
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
            },
        };
    }
    async execute() {
        var _a, _b, _c, _d, _e, _f;
        const items = this.getInputData();
        const returnData = [];
        const creds = (await this.getCredentials('kisApi'));
        const auth = await GenericFunctions_1.kisGetAuthorization.call(this);
        for (let i = 0; i < items.length; i++) {
            try {
                const collection = this.getNodeParameter('collection', i);
                const limit = this.getNodeParameter('limit', i);
                let filters = [];
                try {
                    const filtersParam = this.getNodeParameter('filters', i);
                    filters = ((_a = filtersParam === null || filtersParam === void 0 ? void 0 : filtersParam.filter) !== null && _a !== void 0 ? _a : [])
                        .filter((f) => f.filter_column && f.filter_operator)
                        .map((f) => {
                        var _a;
                        return ({
                            filter_column: f.filter_column,
                            filter_operator: f.filter_operator,
                            filter_value: (_a = f.filter_value) !== null && _a !== void 0 ? _a : '',
                        });
                    });
                }
                catch {
                    filters = [];
                }
                const body = {
                    data_handler: {
                        collection_name: collection,
                        limit,
                    },
                };
                if (filters.length > 0) {
                    body.data_handler.filters = filters;
                }
                const resp = await this.helpers.httpRequest({
                    method: 'POST',
                    url: `${creds.baseUrl}/api_token_access/data_handlers/index`,
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: auth,
                    },
                    body,
                    json: true,
                });
                const docs = (_d = (_c = (_b = resp === null || resp === void 0 ? void 0 : resp.queries) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.documents) !== null && _d !== void 0 ? _d : [];
                for (const doc of docs) {
                    const id = (_f = (_e = doc === null || doc === void 0 ? void 0 : doc._id) === null || _e === void 0 ? void 0 : _e.$oid) !== null && _f !== void 0 ? _f : doc === null || doc === void 0 ? void 0 : doc._id;
                    returnData.push({
                        json: {
                            ...doc,
                            id,
                        },
                    });
                }
            }
            catch (error) {
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.KisSearchData = KisSearchData;
