
Install via NuGet

Install-Package Xrm.Tools.CRMWebAPI 
Here is how to get an instance of CRMWebAPI passing an AccessToken
````
        public CRMWebAPI GetAPI()
        {

            CRMWebAPI api = new CRMWebAPI("https://orgname.api.crm.dynamics.com/api/data/v8.0/",
                    "<token>");
            return api;

        }
````
Here is how to get an instance of CRMWebAPI passing an ADAL with a user and password
````
  public CRMWebAPI GetAPI()
  {
      string authority = "https://login.microsoftonline.com/common";
      string clientId = "<clientid>";
      string crmBaseUrl = "https://xx.crm.dynamics.com";

      var authContext = new AuthenticationContext(authority);
      UserCredential userCreds = new UserCredential("userEmail", "userPassword");
      var result = authContext.AcquireToken(crmBaseUrl, clientId, userCreds);
      CRMWebAPI api = new CRMWebAPI(crmBaseUrl + "/api/data/v8.0/", result.AccessToken);
      
      return api;
  }
````

Here are a few simple examples 
````
                var api = GetAPI();

                dynamic data = new ExpandoObject();
                data.name = "test " + DateTime.Now.ToString();

                Guid createdID = await api.Create("accounts", data);                

                var retrievedObject = await api.Get("accounts", createdID, new CRMGetListOptions() { FormattedValues = true });

                var retrievedObjectEx = await api.Get<ExpandoObject>("accounts", createdID);

                dynamic updateObject = new ExpandoObject();
                updateObject.name = "updated name " + DateTime.Now.ToString();

                var updateResult = await api.Update("accounts", createdID, updateObject);
                //update with an upsert
                var upsertResult = await api.Update("accounts", Guid.NewGuid(), updateObject, Upsert: true);

                await api.Delete("accounts", upsertResult.EntityID);

                var results = await api.GetList("accounts", new Requests.CRMGetListOptions() { Top = 5, FormattedValues=true });

                string fetchXml = "<fetch mapping='logical'><entity name='account'><attribute name='accountid'/><attribute name='name'/></entity></fetch>";

                var fetchResults = await api.GetList("accounts", QueryOptions: new CRMGetListOptions() { FetchXml = fetchXml });

                var count = await api.GetCount("accounts");
