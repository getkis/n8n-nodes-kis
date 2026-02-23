import { KisApi } from './credentials/KisApi.credentials';
import { KisGetDataTrigger } from './nodes/KisGetDataTrigger.node';
import { KisCreateData } from './nodes/KisCreateData.node';
export declare const nodes: (typeof KisGetDataTrigger | typeof KisCreateData)[];
export declare const credentials: (typeof KisApi)[];
