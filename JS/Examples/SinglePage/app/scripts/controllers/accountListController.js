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
        authContext.acquireToken(authContext.config.clientId, function (error, token) {

            // Handle ADAL Error
            if (error || !token) {
                printErrorMessage('ADAL Error Occurred: ' + error);
                return;
            }
            
             var apiconfig = {
                    APIUrl: 'https://tr22a.api.crm.dynamics.com/api/data/v8.0/',
                    AccessToken: token        
              };
              
            var crmAPI = new CRMWebAPI(apiconfig);
            
            crmAPI.GetList("contacts").then (
                function (response){
                    var $html = $(viewHTML);
                    var $template = $html.find(".data-container");
    
                    // For Each Todo Item Returned, Append a Table Row
                    var output = response.List.reduce(function (rows, todoItem, index, todos) {
                        var $entry = $template;
                        var $description = $entry.find(".view-data-description").html(todoItem.fullname);
                        $entry.find(".data-template").attr('data-todo-id', todoItem.accountid);
                        return rows + $entry.html();
                    }, '');
    
                    // Update the UI
                    $loading.hide();
                    $dataContainer.html(output);

                 }, 
                 function(error){});
            
        });
      
    };

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