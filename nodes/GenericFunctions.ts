import type { IExecuteFunctions, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export type KisCreds = {
	baseUrl: string;
	appToken: string;
	secret: string;
};

export async function kisGetAuthorization(this: IExecuteFunctions | ILoadOptionsFunctions): Promise<string> {
	const creds = (await this.getCredentials('kisApi')) as unknown as KisCreds;

	const baseUrl = (creds.baseUrl || '').replace(/\/+$/, '');
	if (!baseUrl) {
		throw new NodeApiError(this.getNode(), { message: 'Missing Base URL in KIS credentials.' } as any);
	}

	const fullResp = await this.helpers.httpRequest({
		method: 'POST',
		url: `${baseUrl}/api_access_auth/sign_in`,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: {
			app_token: creds.appToken,
			secret: creds.secret,
		},
		json: true,
		returnFullResponse: true,
	});

	const headers = (fullResp as any)?.headers ?? {};
	// n8n usually normalizes to lowercase
	const auth =
		headers.authorization ||
		headers.Authorization ||
		(fullResp as any)?.body?.authorization ||
		(fullResp as any)?.body?.Authorization;

	if (!auth || typeof auth !== 'string') {
		throw new NodeApiError(
			this.getNode(),
			fullResp as any,
			{ message: 'Authorization missing from KIS sign_in response.' },
		);
	}

	return auth;
}

export async function loadCollections(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const creds = (await this.getCredentials('kisApi')) as unknown as KisCreds;
	const baseUrl = (creds.baseUrl || '').replace(/\/+$/, '');
	const auth = await kisGetAuthorization.call(this);

	const res = await this.helpers.httpRequest({
		method: 'GET',
		url: `${baseUrl}/api_token_access/collections`,
		qs: { page: 1, per_page: 1000 },
		headers: {
			Accept: 'application/json',
			Authorization: auth,
		},
		json: true,
	});

	const data = (res as any)?.data ?? [];
	return (Array.isArray(data) ? data : []).map((c: any) => ({
		name: c?.attributes?.name ?? c?.id ?? 'Unknown',
		value: c?.attributes?.name ?? c?.id ?? '',
	}));
}

export async function loadDocumentIds(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const { baseUrl } = (await this.getCredentials('kisApi')) as unknown as KisCreds;
	const collection = this.getCurrentNodeParameter('collection') as string;
	if (!collection) return [];

	const auth = await kisGetAuthorization.call(this);
	const resp = await this.helpers.httpRequest({
		method: 'POST',
		url: `${baseUrl}/api_token_access/data_handlers/index`,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Authorization: auth,
		},
		body: {
			data_handler: { collection_name: collection },
		},
		json: true,
	});

	const docs = resp?.queries?.[0]?.documents ?? [];
	return docs
		.map((d: any) => {
			const id = d?._id?.$oid;
			const label = d?.nom ?? id;
			return { name: label, value: id };
		})
		.filter((o: any) => o.value);
}

export function getFieldsFromParameters(this: IExecuteFunctions, itemIndex: number, jsonParameters: boolean): Record<string, any> {
	if (jsonParameters) {
		const raw = this.getNodeParameter('fieldsJson', itemIndex) as unknown as string | object;
		if (raw && typeof raw === 'object') return raw as Record<string, any>;
		if (!raw) return {};

		try {
			const parsed = JSON.parse(String(raw));
			return (parsed && typeof parsed === 'object') ? (parsed as Record<string, any>) : {};
		} catch (e) {
			throw new NodeApiError(this.getNode(), e as any, {
				itemIndex,
				message: 'Fields (JSON) must be valid JSON.',
			});
		}
	}

	const fieldsUi = this.getNodeParameter('fieldsUi', itemIndex, {}) as any;
	const rows: Array<{ name: string; value: any }> = fieldsUi?.field ?? [];

	const out: Record<string, any> = {};
	for (const row of rows) {
		const key = (row?.name ?? '').trim();
		if (!key) continue;

		const val = row?.value;

			if (typeof val === 'string') {
			const s = val.trim();

			if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
				try {
					out[key] = JSON.parse(s);
					continue;
				} catch {
					// fall through
				}
			}

			if (/^(true|false)$/i.test(s)) {
				out[key] = s.toLowerCase() === 'true';
				continue;
			}

			if (/^-?\d+(\.\d+)?$/.test(s)) {
				// keep as number if it looks numeric
				out[key] = Number(s);
				continue;
			}

			out[key] = val;
		} else {
			out[key] = val;
		}
	}

	return out;
}
export async function loadCollectionFields(this: ILoadOptionsFunctions) {
	const creds = (await this.getCredentials('kisApi')) as unknown as KisCreds;
	const auth = await kisGetAuthorization.call(this);

	const collectionName = this.getCurrentNodeParameter('collection') as string;
	if (!collectionName) return [];

	const listRes = await this.helpers.httpRequest({
		method: 'GET',
		url: `${creds.baseUrl}/api_token_access/collections`,
		qs: { page: 1, per_page: 1000 },
		headers: { Accept: 'application/json', Authorization: auth },
		json: true,
	});

	const collection = (listRes as any)?.data?.find((e: any) => e?.attributes?.name === collectionName);
	if (!collection) return [];

	let included: any[] = (listRes as any)?.included ?? [];

	if (!Array.isArray(included) || included.length === 0) {
		try {
			const detailRes = await this.helpers.httpRequest({
				method: 'GET',
				url: `${creds.baseUrl}/api_token_access/collections/${collection.id}`,
				qs: { include: 'fields' },
				headers: { Accept: 'application/json', Authorization: auth },
				json: true,
			});
			included = (detailRes as any)?.included ?? [];
		} catch {
			included = [];
		}
	}

	const reserved = new Set(['_id', 'u_at', 'c_at']);
	const idsSet = new Set((collection?.relationships?.fields?.data ?? []).map((it: any) => it?.id).filter(Boolean));

	const matchedFields = (included ?? [])
		.filter((field: any) => idsSet.has(field?.id))
		.filter((field: any) => !reserved.has(field?.attributes?.field_name))
		.map((field: any) => ({
			name: field?.attributes?.field_name,
			value: field?.attributes?.field_name,
		}));

	// de-dupe + stable sort
	const seen = new Set<string>();
	const out = matchedFields
		.filter((f: any) => typeof f?.value === 'string' && f.value.length > 0)
		.filter((f: any) => (seen.has(f.value) ? false : (seen.add(f.value), true)))
		.sort((a: any, b: any) => a.name.localeCompare(b.name));

	return out;
}

