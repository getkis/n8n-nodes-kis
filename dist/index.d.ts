import { KisApi } from './credentials/KisApi.credentials';
import { KisGetDataTrigger } from './nodes/KisGetDataTrigger.node';
import { KisSearchData } from './nodes/KisSearchData.node';
export declare const nodes: (typeof KisGetDataTrigger | typeof KisSearchData)[];
export declare const credentials: (typeof KisApi)[];
