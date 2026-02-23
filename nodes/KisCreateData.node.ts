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
	loadCollectionFields,
	getFieldsFromParameters,
	KisCreds,
} from './GenericFunctions';

export class KisCreateData implements INodeType {
	description: INodeTypeDescription = {
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

	methods = {
		loadOptions: {
			async getCollections(this: ILoadOptionsFunctions) {
				return loadCollections.call(this);
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

		for (let i = 0; i < items.length; i++) {
			try {
				const collection = this.getNodeParameter('collection', i) as string;
				const jsonParameters = this.getNodeParameter('jsonParameters', i) as boolean;
				const document = getFieldsFromParameters.call(this, i, jsonParameters);

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
			} catch (error) {
				throw new NodeApiError(this.getNode(), error as any, { itemIndex: i });
			}
		}

		return [returnData];
	}
}