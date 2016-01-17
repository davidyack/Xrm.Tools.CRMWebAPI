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