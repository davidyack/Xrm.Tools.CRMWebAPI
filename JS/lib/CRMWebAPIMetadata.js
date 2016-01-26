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
                        crmAPI.Get('GlobalOptionSetDefinitions',set.MetadataId).then(
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