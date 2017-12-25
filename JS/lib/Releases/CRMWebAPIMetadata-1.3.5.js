CRMWebAPI.prototype.GetOptionSetByName = function (optionSetName) {
		var self = this;
		return new Promise(function (resolve, reject) {
			
           self.GetList('GlobalOptionSetDefinitions', 
                    {Select:['Name']}).then(
            function (r)
            {
                r.List.forEach(function(set)
                { 
                    if (set.Name == optionSetName)
                    {
                        self.Get('GlobalOptionSetDefinitions',set.MetadataId).then(
                            function(res){
                                resolve(res);
                            },function(err){console.log(err)}
                        )
                    }
                }
                )
            },
            function(e){
                console.log(e)
                reject(e)
                })                                       
          });
	};
    
CRMWebAPI.prototype.GetOptionSetUserLabels = function (optionSetName) {
		var self = this;
		return new Promise(function (resolve, reject) {
		
		self.GetOptionSetByName(optionSetName).then(
            function (result) 
            {
                var displayList = new Array();
                result.Options.forEach(function (option)
                {
                    var displayOption = new Object;
                    displayOption.Value = option.Value;
                    displayOption.Label = option.Label.UserLocalizedLabel.Label;
                    displayList.push(displayOption);
                });
                resolve(displayList);                
            }
            ,
            function (err)
            {
                console.log(err)
                reject(err);
            }
        );
        });
       
}

CRMWebAPI.prototype.GetEntityDisplayNameList = function (LCID) {
		var self = this;
		return new Promise(function (resolve, reject) {
		
                	
           self.GetList('EntityDefinitions', 
                    {Filter:'IsPrivate eq false',Select:['MetadataId','EntitySetName','DisplayName',
                        'DisplayCollectionName','LogicalName','LogicalCollectionName','PrimaryIdAttribute']}).then(
            function (r)
            {
                var list = new Array();
                r.List.forEach(function(entity)
                { 
                    var edm = new Object();
                    edm.MetadataId = entity.MetadataId;
                    edm.EntitySetName = entity.EntitySetName;
                    edm.LogicalName = entity.LogicalName;
                    edm.LogicalCollectionName = entity.LogicalCollectionName;
                    edm.PrimaryIdAttribute = entity.PrimaryIdAttribute;
                    if ((entity.DisplayName.LocalizedLabels != null) && (entity.DisplayName.LocalizedLabels.length > 0))
                    {
                        edm.DisplayName = entity.DisplayName.LocalizedLabels[0].Label;
                        if (LCID != null)
                                entity.DisplayName.LocalizedLabels.forEach(function (label) { if (label.LanguageCode == LCID) edm.DisplayName = label.Label});
                    }
                    else
                        edm.DisplayName = edm.LogicalName;
                    if ((entity.DisplayCollectionName.LocalizedLabels != null) && (entity.DisplayCollectionName.LocalizedLabels.length > 0))
                    {
                        edm.DisplayCollectionName = entity.DisplayCollectionName.LocalizedLabels[0].Label;
                        if (LCID != null)
                                entity.DisplayCollectionName.LocalizedLabels.forEach(function (label) { if (label.LanguageCode == LCID) edm.DisplayCollectionName = label.Label});
                    }
                    else
                       edm.DisplayCollectionName = entity.LogicalCollectionName;
                    edm.LogicalDisplayName = edm.DisplayName +'(' + edm.LogicalName + ')'
                    edm.LogicalDisplayCollectionName = edm.DisplayCollectionName +'(' + edm.LogicalCollectionName + ')'
                    list.push(edm);
                }
                )
                resolve(list);
            },
            function(e){
                console.log(e)
                reject(e)
                })                                       
          });
	};
        
        
 CRMWebAPI.prototype.GetAttributeDisplayNameList = function (entityID,LCID) {
		var self = this;
		return new Promise(function (resolve, reject) {
		
                	
           self.GetList('EntityDefinitions('+ entityID.toString() + ')/Attributes', 
                    {Filter:'((IsValidForRead eq true) and (AttributeOf eq null))',Select:['MetadataId','DisplayName','LogicalName','SchemaName','AttributeType','IsPrimaryId']}).then(
            function (r)
            {
                var list = new Array();
                r.List.forEach(function(attrib)
                { 
                    var edm = new Object();
                    edm.MetadataId = attrib.MetadataId;                    
                    edm.LogicalName = attrib.LogicalName;   
                    edm.SchemaName = attrib.SchemaName;                 
                    edm.IsPrimaryId = attrib.IsPrimaryId;
                    edm.AttributeType = attrib.AttributeType;
                    if (attrib.AttributeType === "Lookup" || attrib.AttributeType === "Customer" || attrib.AttributeType === "Owner")                    
        		edm.ODataLogicalName = "_" + attrib.LogicalName + "_value";   
                    else
                        edm.ODataLogicalName = attrib.LogicalName;                 

                    if ((attrib.DisplayName.LocalizedLabels != null) && (attrib.DisplayName.LocalizedLabels.length > 0))
                    {
                        edm.DisplayName = attrib.DisplayName.LocalizedLabels[0].Label;
                        if (LCID != null)
                                attrib.DisplayName.LocalizedLabels.forEach(function (label) { if (label.LanguageCode == LCID) edm.DisplayName = label.Label});
                    }
                    else
                        edm.DisplayName = edm.LogicalName;                   
                    edm.LogicalDisplayName = edm.DisplayName +'(' + edm.LogicalName + ')'                    
                    list.push(edm);
                }
                )
                resolve(list);
            },
            function(e){
                console.log(e)
                reject(e)
                })                                       
          });
	};
        
         CRMWebAPI.prototype.CopyEntityAttribute = function (fromEntityID,toEntityID,fromAttributeID,attributeType,toNames) {
		var self = this;
		return new Promise(function (resolve, reject) {

            var ec ='EntityDefinitions('+ fromEntityID.toString() + ')/Attributes('+fromAttributeID+')';
            if (attributeType == "Boolean")
                ec += '/Microsoft.Dynamics.CRM.BooleanAttributeMetadata?$expand=OptionSet'; 
                if (attributeType == "Picklist")
                ec += '/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$expand=OptionSet,GlobalOptionSet'; 		
                	
           self.Get(ec,null,{}).then(
            function (r)
            {
                    console.log(JSON.stringify(r));
                delete r.MetadataId;  
                delete r.EntityLogicalName;              
                if (attributeType == "Boolean" )
                {
                    r['@odata.type'] = 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata';
                    delete r['OptionSet@odata.context'];
                    if (r.OptionSet != null)
                    {
                       delete r.OptionSet.Name;
                       delete r.OptionSet.MetadataId;
                       r.OptionSet.IsCustomOptionSet=true;
                    }                   
                }
                if (attributeType == "Picklist" )
                {
                    delete r.EntityLogicalName;                        
                    r['@odata.type'] = 'Microsoft.Dynamics.CRM.PicklistAttributeMetadata';
                    
                    if (r.OptionSet != null)
                    {
                       delete r['OptionSet@odata.context'];
                       delete r.OptionSet.Name;
                       delete r.OptionSet.MetadataId;
                       r.OptionSet.IsCustomOptionSet=true;
                    } 
                    else
                     {                             
                        delete r.OptionSet;
                        r['GlobalOptionSet@odata.bind'] = self.config.APIUrl +'GlobalOptionSetDefinitions('+r.GlobalOptionSet.MetadataId+')';
                        delete r['OptionSet@odata.context'];      
                        delete r.GlobalOptionSet;         
                                               
                    }                  
                }
                r.LogicalName = toNames.LogicalName;
                r.SchemaName  = toNames.SchemaName;
                console.log(JSON.stringify(r));
                
                self.Create('EntityDefinitions('+ toEntityID.toString() + ')/Attributes',r).then(
                  function (createR)
                  {
                      resolve(createR); 
                  },
                  function(errorR)
                  {
                     console.log(errorR)
                     reject(errorR)     
                  }                        
                );                
            },
            function(e){
                console.log(e)
                reject(e)
                })                                       
          });
	};