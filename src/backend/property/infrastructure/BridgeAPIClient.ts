import { BridgeAPIClientOptions, BridgePropertyPayload } from './dto/BridgeDTOs';

export class BridgeAPIClient {
  private readonly baseUrl = 'https://api.bridgedataoutput.com/api/v2/OData';
  private readonly dataset: string;
  private readonly serverToken: string;

  constructor() {
    this.dataset = process.env.BRIDGE_DATASET || 'test';
    this.serverToken = process.env.BRIDGE_SERVER_TOKEN || '';
    if (!this.serverToken) {
      console.warn('BRIDGE_SERVER_TOKEN is not set. Bridge API calls will likely fail.');
    }
  }

  /**
   * Fetches properties from Bridge Data Output using RESO Web API OData format.
   * @param options OData query options (top, skip, filter, expand, select)
   */
  async fetchProperties(options: BridgeAPIClientOptions = {}): Promise<BridgePropertyPayload[]> {
    const url = new URL(`${this.baseUrl}/${this.dataset}/Property`);
    
    // Auth
    url.searchParams.append('access_token', this.serverToken);
    
    // OData Params
    if (options.top) url.searchParams.append('$top', options.top.toString());
    if (options.skip) url.searchParams.append('$skip', options.skip.toString());
    if (options.filter) url.searchParams.append('$filter', options.filter);
    if (options.expand) url.searchParams.append('$expand', options.expand);
    if (options.select) url.searchParams.append('$select', options.select);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
        let errorMessage = response.statusText;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorMessage;
        } catch(e) { /* fallback to status text */ }
        throw new Error(`Bridge API Error ${response.status}: ${errorMessage}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Fetches the total count of properties matching a filter without downloading the records.
   * This is extremely lightweight and prevents API quota exhaustion during Live Fallbacks.
   * @param options OData query options (only filter is relevant)
   */
  async countProperties(options: BridgeAPIClientOptions = {}): Promise<number> {
    const url = new URL(`${this.baseUrl}/${this.dataset}/Property`);
    
    // Auth
    url.searchParams.append('access_token', this.serverToken);
    
    // OData Params for Count Only
    url.searchParams.append('$top', '0'); // Do not return any actual records
    // Bridge data uses $count=true to return the total size in the response envelope
    url.searchParams.append('$count', 'true');
    
    if (options.filter) url.searchParams.append('$filter', options.filter);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
        return 0; // Silently fail to 0 for fallback logic
    }

    const data = await response.json();
    return data['@odata.count'] || 0;
  }
}
