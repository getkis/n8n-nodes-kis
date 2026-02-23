import type { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class KisCreateData implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getCollections(this: ILoadOptionsFunctions): Promise<import("n8n-workflow").INodePropertyOptions[]>;
            getCollectionFields(this: ILoadOptionsFunctions): Promise<{
                name: any;
                value: any;
            }[]>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
