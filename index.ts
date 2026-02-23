import { KisApi } from './credentials/KisApi.credentials';

import { KisGetDataTrigger } from './nodes/KisGetDataTrigger.node';

import { KisGetAllCollections } from './nodes/KisGetAllCollections.node';
import { KisSearchData } from './nodes/KisSearchData.node';
import { KisCreateData } from './nodes/KisCreateData.node';
import { KisUpdateData } from './nodes/KisUpdateData.node';
import { KisDeleteData } from './nodes/KisDeleteData.node';

export const nodes = [
	KisGetDataTrigger,
	KisGetAllCollections,
	KisSearchData,
	KisCreateData,
	KisUpdateData,
	KisDeleteData,
];

export const credentials = [KisApi];
