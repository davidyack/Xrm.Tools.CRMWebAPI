

var rcApp = angular.module('recordCountApp', []);

rcApp.controller('recordCountController', ['$scope', function ($scope) {
    
    $scope.showResultsTable = false;    
    $scope.loading = false;
    $scope.recordCounts = new Array();
    
    
    $scope.getcount = function () {
        $scope.loading = true;
                                  
        var recordCount = new Object();
        recordCount.EntityName = entityName.value;
        recordCount.RecordCount = 0;
        recordCount.Status = "In Progress";
        $scope.recordCounts.push(recordCount);
        $scope.showResultsTable = true;              

        //Setup query options to retrieve only statecode which all entities have, also setup a PageAction function that will be called with each page of records
        //increment the count each time and show the user progress
                                
         var queryOptions = {Select:["statecode"], PageAction:function(page){recordCount.RecordCount += page.length;$scope.$apply();}};
          // you might be wondering why we are't using the oData $count...with CRM it only works to 5,000 records  
          crmAPI.GetList(entityName.value,queryOptions).then(function (queryResult){
                recordCount.Status = "Done";                                                                                                                 
                $scope.$apply();
                $scope.loading = false;
            },
            function(error)
                {
                    if (error.status == 404)
                        recordCount.Status = "Entity Not Found";
                    else if (error.status == 401)
                        recordCount.Status = "Not Authorized";
                    else
                        recordCount.Status = "Error";
                    $scope.$apply();
                    console.log('error on get count query' + JSON.stringify(error))
                });

    };
    
    
}]);

//Use the following line if you are running this standalone and get a access token manually
//var apiconfig = { APIUrl: 'https://orgname.crm.dynamics.com/api/data/v8.0/', AccessToken: '' };

//use the following line if you are running this as a web resource in CRM
var apiconfig = { APIUrl: Xrm.Page.context.getClientUrl() + '/api/data/v8.0/'};


var crmAPI = new CRMWebAPI(apiconfig);
