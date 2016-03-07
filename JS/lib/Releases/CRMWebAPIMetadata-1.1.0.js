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
                    {Select:['DisplayName','DisplayCollectionName','LogicalName','LogicalCollectionName']}).then(
            function (r)
            {
                var list = new Array();
                r.List.forEach(function(entity)
                { 
                    var edm = new Object();
                    edm.LogicalName = entity.LogicalName;
                    edm.LogicalCollectionName = entity.LogicalCollectionName;
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