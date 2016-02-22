(function () {

    // The HTML for this View
    var viewHTML;
    // Instantiate the ADAL AuthenticationContext
    var authContext = new AuthenticationContext(config);

    function refreshViewData() {

      
        // Empty Old View Contents
        var $dataContainer = $(".data-container");
        $dataContainer.empty();
        var $loading = $(".view-loading");

            
        // Acquire Token for Backend
        authContext.acquireToken(config.endpoints.orgUri, function (error, token) {

            // Handle ADAL Error
            if (error || !token) {
                alert('ADAL Error Occurred: ' + error);
                return;
            }
            
            apiconfig.AccessToken = token;                        
              
            var crmAPI = new CRMWebAPI(apiconfig);
            
            //crmAPI.ExecuteFunction("WhoAmI").then(function(response){ alert(response.userid)});
            
           //var timeZone = { LocalizedStandardName: 'Pacfic Standard Time', LocaleId:1033 };
            //crmAPI.ExecuteFunction("GetTimeZoneCodeByLocalizedName",timeZone).then(function(response){ alert(response.timezone)});
            var data = new Object()
            data.name = "test " + new Date().toString();            
            var createdID = null;
            crmAPI.Create("accounts", data).then(function(result)
            {
                createdID = result;
                console.log('id created is ' + createdID);
                 crmAPI.Get("accounts", createdID).then(function(result){
                    
                    console.log('account get: ' + JSON.stringify(result));
                     
                 },function(error){console.log('error on get' + JSON.stringify(error))})
                data.name = "new Account name";
                crmAPI.Update("accounts",createdID, data).then(function(result)
                {
                    
                    console.log('update results' + JSON.stringify(result));
                    
                    crmAPI.Delete("accounts", createdID).then(function(result){
                    
                    console.log('account delete:');
                     
                 },function(error){console.log('error on delete' + JSON.stringify(error))})
                    
                },function(error) {console.log('error updating record' + JSON.stringify(error))});
            },function(error) {console.log('error creating record' + JSON.stringify(error))});
            
             
             crmAPI.GetCount("accounts").then(function(result){
                    
                    console.log('account getcount: ' + result);
                     
                 },function(error){console.log('error on get count' + JSON.stringify(error))})
                        
            var queryOptions = { Top:10 , FormattedValues:true};
            
            crmAPI.GetList("accounts",queryOptions).then (
                function (response){
                   
                    PopulateOutput(response);

                 }, 
                 function(error){});
            
        });
      
    };
    function PopulateOutput(response)
    {
        var $html = $(viewHTML);
        var $template = $html.find(".data-container");

        // For Each Todo Item Returned, Append a Table Row
        var output = response.List.reduce(function (rows, todoItem, index, todos) {
            var $entry = $template;
            var $description = $entry.find(".view-data-description").html(todoItem.name);
            $entry.find(".data-template").attr('data-todo-id', todoItem.accountid);
            return rows + $entry.html();
        }, '');

        // Update the UI
        var $loading = $(".view-loading");
        $loading.hide();
        var $dataContainer = $(".data-container");
        $dataContainer.html(output);
    }

    // Module
    window.accountListController = {
        requireADLogin: true,
        preProcess: function (html) {

        },
        postProcess: function (html) {
            viewHTML = html;
            refreshViewData();
        },
    };
}());