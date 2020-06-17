using Microsoft.IdentityModel.Clients.ActiveDirectory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Test
{
    public class UnitTestBaseClass
    {
        public async Task<CRMWebAPI> GetAPI()
        {
            string authority = "https://login.microsoftonline.com/";
            string clientId = "<clientid>";
            string crmBaseUrl = "https://xx.crm.dynamics.com";
            string clientSecret = "<clientSecret>";
            string tenantID = "<tenantId>";

            var clientcred = new ClientCredential(clientId, clientSecret);
            var authContext = new AuthenticationContext(authority + tenantID);
            var authenticationResult = await authContext.AcquireTokenAsync(crmBaseUrl, clientcred);

            return new CRMWebAPI(crmBaseUrl + "/api/data/v9.1/", authenticationResult.AccessToken);

        }
    }
}
