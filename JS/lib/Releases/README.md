CRMWebAPI.js Releases
1.0.0
    - intial version
1.1.0 
    - Added PageAction and RecordAction options to query options
1.2.0
	- all functions that take entityID remove {} that is added by Xrm.Page getEntityID so you don't have to pre-process it before passing to API
	
CRMWebAPIMetadata
1.0.0 
	- initial version
1.1.3
    - added support for GetEntityDisplayNameList
1.2.0
	- added support for GetAttributeDisplayNameList
1.2.1
 	- added filter to GetAttributeDisplayNamelist for attributeof and no read, added ODataLogicalName to handle Owner,Customer and Lookup