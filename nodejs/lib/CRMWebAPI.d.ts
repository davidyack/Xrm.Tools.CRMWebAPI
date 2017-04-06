// Type definitions for CRMWebAPI
// Project: CRMWebAPI
// Definitions by: Daryl LaBar <https://github.com/daryllabar>

/*~ This is the module template file for class modules.
 *~ You should rename it to index.d.ts and place it in a folder with the same name as the module.
 *~ For example, if you were writing a file for "super-greeter", this
 *~ file should be 'super-greeter/index.d.ts'
 */

/*~ Note that ES6 modules cannot directly export class objects.
 *~ This file should be imported using the CommonJS-style:
 *~   import x = require('someLibrary');
 *~
 *~ Refer to the documentation to understand common
 *~ workarounds for this limitation of ES6 modules.
 */

/*~ If this module is a UMD module that exposes a global variable 'CRMWebAPI' when
 *~ loaded outside a module loader environment, declare that global here.
 *~ Otherwise, delete this declaration.
 */
export as namespace CRMWebAPI;

/*~ This declaration specifies that the class constructor function
 *~ is the exported object from the file
 */
export = CRMWebAPI;

/*~ Write your module's methods and properties in this class */
declare class CRMWebAPI {
    constructor(config: CRMWebAPI.Config);
    
    GetList<T>(uri: string, queryOptions: CRMWebAPI.QueryOptions): Promise<CRMWebAPI.GetListResponse<T>>;
    Get<T>(entityCollection: string, entityId: string, queryOptions: CRMWebAPI.QueryOptions): Promise<T>;
    GetCount(uri: string, queryOptions: CRMWebAPI.QueryOptions): Promise<any>;
    Create(entityCollection: string, data: any): Promise<any>;
    Update(entityCollection: string, key: string, data: any, upsert?: boolean): Promise<any>;
    Delete(entityCollection: string, entityID: string): Promise<any>;
    Associate(fromEntitycollection: string, fromEntityId: string, navProperty: string, toEntityCollection: string, toEntityId: string): Promise<any>;
    Disassociate(fromEntitycollection: string, fromEntityId: string, navProperty: string, toEntityCollection: string, toEntityId: string): Promise<any>;
    ExecuteFunction(functionName: string, parameters: any, entityCollection: string, entityId: string): Promise<any>;
    ExecuteAction(actionName: string, data: any, entityCollection: string, entityId: string): Promise<any>;
}

/*~ If you want to expose types from your module as well, you can
 *~ place them in this block.
 */
declare namespace CRMWebAPI {
    export interface Config{
        APIUrl: string;
        AccessToken?: string;
        callerId?: string;
    }

    export interface GetListResponse<T> {
        List: T[];
    }

    export interface UpdateResponse {
        EntityID: string;
    }

    export interface QueryOptionBase{
        FormattedValues?:boolean;
        Select?: string[];
        Filter?: string;
        OrderBy?: string[];
        Top?: number;
    }

    export interface ExpandQueryOptions extends QueryOptionBase {
        Property: string;
    }

    export interface QueryOptions extends QueryOptionBase{
        Expand?: ExpandQueryOptions[];
        FetchXml?: string;
        IncludeCount?: boolean;
        Skip?: number;
        SystemQuery?: string;
        UserQuery?: string;

        RecordAction?(record:any);
        PageAction?(list:any[]);
    }
}