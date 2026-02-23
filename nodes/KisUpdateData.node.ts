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
	loadDocumentIds,
	loadCollectionFields,
	getFieldsFromParameters,
	KisCreds,
} from './GenericFunctions';

export class KisUpdateData implements INodeType {
	description: INodeTypeDescription = {
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
				description:
					'If false, runs once only (safe default). If true, runs once per incoming item.',
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

	methods = {
		loadOptions: {
			async getCollections(this: ILoadOptionsFunctions) {
				return loadCollections.call(this);
			},
			async getDocumentIds(this: ILoadOptionsFunctions) {
				return loadDocumentIds.call(this);
			},
			async getCollectionFields(this: ILoadOptionsFunctions) {
				return loadCollectionFields.call(this);
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const creds = (await this.getCredentials('kisApi')) as unknown as KisCreds;
		const auth = await kisGetAuthorization.call(this);

		const applyToAllItems = this.getNodeParameter('applyToAllItems', 0) as boolean;
		const runCount = applyToAllItems ? items.length : Math.min(items.length, 1);

		for (let i = 0; i < runCount; i++) {
			try {
				const collection = this.getNodeParameter('collection', i) as string;
				const id = this.getNodeParameter('id', i) as string;
				const jsonParameters = this.getNodeParameter('jsonParameters', i) as boolean;

				const document = getFieldsFromParameters.call(this, i, jsonParameters);



				console.log('--- UPDATE REQUEST DEBUG ---');
				console.log('Collection:', collection);
				console.log('Document ID:', id);
				console.log('Request Body:', JSON.stringify({
					data_handler: {
						collection_name: collection,
						documents: [{ ...document }],
					},
				}, null, 2));
				console.log('Authorization:', auth);
				console.log('----------------------------');






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
			} catch (error) {
				throw new NodeApiError(this.getNode(), error as any, { itemIndex: i });
			}
		}

		return [returnData];
	}
}