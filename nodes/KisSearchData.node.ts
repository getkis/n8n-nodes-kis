import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { kisGetAuthorization, loadCollections, loadDocumentIds, getFieldsFromParameters, KisCreds } from './GenericFunctions';

export class KisSearchData implements INodeType {
	description: INodeTypeDescription = {
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

		for (let i = 0; i < items.length; i++) {
			try {
				const collection = this.getNodeParameter('collection', i) as string;
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
			} catch (error) {
				throw new NodeApiError(this.getNode(), error as any, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
