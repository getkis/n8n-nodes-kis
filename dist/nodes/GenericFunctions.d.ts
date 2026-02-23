import type { IExecuteFunctions, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
export type KisCreds = {
    baseUrl: string;
    appToken: string;
    secret: string;
};
export declare function kisGetAuthorization(this: IExecuteFunctions | ILoadOptionsFunctions): Promise<string>;
export declare function loadCollections(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
export declare function loadDocumentIds(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
export declare function getFieldsFromParameters(this: IExecuteFunctions, itemIndex: number, jsonParameters: boolean): Record<string, any>;
export declare function loadCollectionFields(this: ILoadOptionsFunctions): Promise<{
    name: any;
    value: any;
}[]>;
