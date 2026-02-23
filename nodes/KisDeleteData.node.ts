import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { kisGetAuthorization, loadCollections, loadDocumentIds, KisCreds } from './GenericFunctions';

export class KisDeleteData implements INodeType {
	description: INodeTypeDescription = {
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
				description:
					'If false, deletes only once (safe default). If true, runs once per incoming item (useful when ID is set via expression).',
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
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const creds = (await this.getCredentials('kisApi')) as unknown as KisCreds;
		const auth = await kisGetAuthorization.call(this);

		// ✅ SAFE DEFAULT: run only once unless explicitly enabled
		const applyToAllItems = this.getNodeParameter('applyToAllItems', 0) as boolean;
		const runCount = applyToAllItems ? items.length : Math.min(items.length, 1);

		for (let i = 0; i < runCount; i++) {
			try {
				const collection = this.getNodeParameter('collection', i) as string;
				const id = this.getNodeParameter('id', i) as string;

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

				const status = (fullResp as any)?.statusCode ?? (fullResp as any)?.status;
				const body = (fullResp as any)?.body;

				if (status === 204 || status === '204') {
					returnData.push({ json: { msg: 'Deleted', id, collection, status } });
				} else {
					returnData.push({ json: { msg: 'Failed to Delete.', id, collection, status, body } });
				}
			} catch (error) {
				throw new NodeApiError(this.getNode(), error as any, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
