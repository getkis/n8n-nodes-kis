import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { NodeApiError } from 'n8n-workflow';

import {
	kisGetAuthorization,
	loadCollections,
	KisCreds,
} from './GenericFunctions';

export class KisSearchData implements INodeType {
	description: INodeTypeDescription = {
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

	methods = {
		loadOptions: {
			async getCollections(this: ILoadOptionsFunctions) {
				return loadCollections.call(this);
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const creds = (await this.getCredentials('kisApi')) as unknown as KisCreds;
		const auth = await kisGetAuthorization.call(this);

		for (let i = 0; i < items.length; i++) {
			try {
				const collection = this.getNodeParameter('collection', i) as string;
				const limit = this.getNodeParameter('limit', i) as number;

				let filters: Array<{
					filter_column: string;
					filter_operator: string;
					filter_value: string;
				}> = [];

				try {
					const filtersParam = this.getNodeParameter('filters', i) as {
						filter?: Array<{
							filter_column: string;
							filter_operator: string;
							filter_value: string;
						}>;
					};

					filters = (filtersParam?.filter ?? [])
						.filter((f) => f.filter_column && f.filter_operator)
						.map((f) => ({
							filter_column: f.filter_column,
							filter_operator: f.filter_operator,
							filter_value: f.filter_value ?? '',
						}));
				} catch {
					filters = [];
				}

				const body: {
					data_handler: {
						collection_name: string;
						limit: number;
						filters?: Array<{
							filter_column: string;
							filter_operator: string;
							filter_value: string;
						}>;
					};
				} = {
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

				const docs = resp?.queries?.[0]?.documents ?? [];

				for (const doc of docs) {
					const id = doc?._id?.$oid ?? doc?._id;

					returnData.push({
						json: {
							...doc,
							id,
						},
					});
				}
			} catch (error) {
				throw new NodeApiError(this.getNode(), error as any, { itemIndex: i });
			}
		}

		return [returnData];
	}
}