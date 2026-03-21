import type {
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';

import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';

import {
	kisGetAuthorization,
	loadCollections,
	KisCreds,
} from './GenericFunctions';

export class KisGetDataTrigger implements INodeType {

	description: INodeTypeDescription = {
		displayName: 'KIS New Document',
		name: 'kisGetDataTrigger',
		icon: 'file:kis.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers when new documents are created in a KIS collection',
		defaults: {
			name: 'KIS New Document',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'kisApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Collection Name',
				name: 'collection',
				type: 'options',
				required: true,
				typeOptions: {
					loadOptionsMethod: 'getCollections',
				},
				default: '',
				description: 'Collection to monitor',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 25,
				description: 'Maximum documents fetched per poll',
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

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {

		const webhookData = this.getWorkflowStaticData('node');

		const creds = (await this.getCredentials('kisApi')) as unknown as KisCreds;

		const auth = await kisGetAuthorization.call(this as any);

		const collection = this.getNodeParameter('collection') as string;

		const limit = this.getNodeParameter('limit') as number;

		const now = new Date().toISOString();

		const startDate = (webhookData.lastTimeChecked as string) || now;

		const filters = [
			{
				filter_column: 'c_at',
				filter_operator: 'gt',
				filter_value: startDate,
			},
		];

		try {

			const response = await this.helpers.httpRequest({

				method: 'POST',

				url: `${creds.baseUrl}/api_token_access/data_handlers/index`,

				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: auth,
				},

				body: {
					data_handler: {
						collection_name: collection,
						limit,
						filters,
					},
				},

				json: true,

			});

			const docs = response?.queries?.[0]?.documents ?? [];

			if (!Array.isArray(docs) || docs.length === 0) {

				webhookData.lastTimeChecked = now;

				return null;

			}

			const items = docs.map((doc: any) => {

				const id = doc?._id?.$oid ?? doc?._id;

				return {
					...doc,
					id,
				};

			});

			// Determine newest timestamp from response
			let newestTimestamp = startDate;

			for (const doc of items) {

				if (!doc.c_at) continue;

				if (new Date(doc.c_at).getTime() > new Date(newestTimestamp).getTime()) {

					newestTimestamp = doc.c_at;

				}

			}

			// Update cursor
			webhookData.lastTimeChecked = newestTimestamp;

			return [this.helpers.returnJsonArray(items)];

		} catch (error) {

			throw new NodeApiError(this.getNode(), error as any);

		}
	}
}