import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { kisGetAuthorization, loadCollections, loadDocumentIds, getFieldsFromParameters, KisCreds } from './GenericFunctions';

export class KisGetAllCollections implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KIS Get All Collections',
		name: 'kisGetAllCollections',
		icon: 'file:kis.svg',
		group: ['output'],
		version: 1,
		description: 'Action: get all collections of your workspace',
		defaults: { name: 'KIS Get All Collections' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'kisApi', required: true }],
		properties: [

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
				const resp = await this.helpers.httpRequest({
					method: 'GET',
					url: `${creds.baseUrl}/api_token_access/collections?page=1&per_page=1000`,
					headers: { Authorization: auth },
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
